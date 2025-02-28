const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();
require('dotenv').config(); 
require('dotenv').config();
const crypto = require('crypto');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const sendResetCodeSMS = async (phone, resetCode) => {
    try {
        if (!phone) {
            throw new Error('Telefon numarası eksik');
        }

        const formattedPhone = `+90${phone}`; 

        const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications
            .create({ to: formattedPhone, channel: 'sms' });

        console.log('Doğrulama kodu gönderildi:', verification.status);
    } catch (error) {
        console.error('SMS gönderim hatası:', error.message, error.details);
        throw error; 
    }
};


// login endpoint
router.post('/login', async (req, res) => {
    const { email, username, password } = req.body;

    try {
        let query = 'SELECT * FROM users WHERE email = ?';
        let queryParams = [email];
        
        if (!email && username) {
        query = 'SELECT * FROM users WHERE username = ?';
        queryParams = [username];
        }

        const [rows] = await pool.query(query, queryParams);

        if (rows.length === 0) {
        return res.status(401).json({ error: 'Geçersiz e-posta, kullanıcı adı veya şifre' });
        }

        const user = rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
        return res.status(401).json({ error: 'Geçersiz e-posta, kullanıcı adı veya şifre' });
        }

        const token = jwt.sign(
        { userId: user.id, email: user.email, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
        );

         const userIp = req.ip || req.connection.remoteAddress;

         const [loginResult] = await pool.query(
             'INSERT INTO login_logs (user_id, ip_address, login_time) VALUES (?, ?, ?)',
             [user.id, userIp, new Date()]
         );
 
         if (loginResult.affectedRows === 0) {
             console.error('Giriş logu kaydedilemedi');
         }

        res.json({ message: 'Giriş başarılı', token });
    } catch (err) {
        console.error('Giriş Hatası:', err);
        res.status(500).json({ error: 'Giriş sırasında hata oluştu', details: err.message });
    }
});

router.post('/register-phone-send-code', async (req, res) => {
    const { phone } = req.body;

    try {        
        const [userRows] = await pool.query('SELECT id FROM users_detail WHERE phone = ?', [phone]);

        if (userRows.length > 0) {
            return res.status(400).json({ error: 'Bu telefon numarası zaten kayıtlı' });
        }

        const generateResetCode = () => {
            return Math.floor(100000 + Math.random() * 900000).toString(); // 6 haneli rastgele kod
        };
        const resetCode = generateResetCode();

        const expiresAt = new Date(Date.now() + 10 * 60000);

        const [result] = await pool.query(
            'INSERT INTO register_phone_request (phone, code, expires_at) VALUES (?, ?, ?)',
            [phone, resetCode, expiresAt] 
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ error: 'Telefon doğrulama isteği kaydedilemedi' });
        }

        await sendResetCodeSMS(phone, resetCode);

        const userIp = req.ip || req.connection.remoteAddress;

        const [sendCodeResult] = await pool.query(
            'INSERT INTO send_code_logs (phone, ip_address, send_time) VALUES (?, ?, ?)',
            [phone, userIp, new Date()]
        );

        if (sendCodeResult.affectedRows === 0) {
            console.error('Kod gönderme logu kaydedilemedi');
        }

        res.status(200).json({ message: 'Doğrulama kodu SMS olarak gönderildi', resetCode });
    } catch (err) {
        console.error('Telefon doğrulama talebi hatası:', err);
        res.status(500).json({ error: 'Telefon doğrulama talebi sırasında hata oluştu', details: err.message });
    }
});

router.post('/register-verify-code', async (req, res) => {
    const { phone, resetCode } = req.body;

    try {
        const formattedPhone = `+90${phone}`;

        const verificationCheck = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks
            .create({ to: formattedPhone, code: resetCode });

        if (verificationCheck.status !== 'approved') {
            return res.status(400).json({ error: 'Kod yanlış veya süresi dolmuş' });
        }

        const userIp = req.ip || req.connection.remoteAddress;

         const [verifyResetResult] = await pool.query(
             'INSERT INTO verify_reset_code_logs (user_id, ip_address, verify_time) VALUES (?, ?, ?)',
             [null, userIp, new Date()]
         );

         if (verifyResetResult.affectedRows === 0) {
             console.error('Kod Doğrulama Logu Kaydedilemedi');
         }

        res.status(200).json({ message: 'Kod doğrulandı' });

    } catch (err) {
        console.error('Kod doğrulama hatası:', err);
        res.status(500).json({ error: 'Kod doğrulama sırasında hata oluştu', details: err.message });
    }
});
  
// register endpoint
router.post('/register', async (req, res) => {
    const { email, password, full_name, phone, city, district, address, username } = req.body;

    try {
        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password ve username zorunlu alanlardır' });
        }

        const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(401).json({ error: 'Bu e-posta adresi zaten kayıtlı' });
        }
       
        const [existingUsername] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsername.length > 0) {
            return res.status(402).json({ error: 'Bu kullanıcı adı zaten alınmış' });
        }
        
        const [existingPhone] = await pool.query('SELECT id FROM users_detail WHERE phone = ?', [phone]);
        if (existingPhone.length > 0) {
            return res.status(403).json({ error: 'Bu telefon numarası zaten kayıtlı' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await pool.query(
            'INSERT INTO users (email, password, username, status) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, username, 1] 
        );

        if (result.affectedRows === 0) {
            return res.status(504).json({ error: 'Kullanıcı kaydedilemedi' });
        }

        const userId = result.insertId;

        const [profileResult] = await pool.query(
            'INSERT INTO users_detail (user_id, full_name, phone, city, district, address) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, full_name, phone, city, district, address]
        );

        if (profileResult.affectedRows === 0) {
            return res.status(500).json({ error: 'Kullanıcı profili kaydedilemedi' });
        }
    
        const token = jwt.sign(
            { userId, email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
     
        const userIp = req.ip || req.connection.remoteAddress;
   
        const [logResult] = await pool.query(
            'INSERT INTO register_logs (user_id, ip_address, register_time) VALUES (?, ?, ?)',
            [userId, userIp, new Date()]
        );

        if (logResult.affectedRows === 0) {
            console.error('Giriş logu kaydedilemedi');
        }

        res.status(201).json({ message: 'Kayıt başarılı', token });
    } catch (err) {
        console.error('Kayıt Hatası:', err);
        res.status(500).json({ error: 'Kayıt sırasında hata oluştu', details: err.message });
    }
});

// reset password send code endpoint
router.post('/request-reset-password', async (req, res) => {
    const { phone } = req.body;

    try {
        const [userRows] = await pool.query('SELECT id FROM users_detail WHERE phone = ?', [phone]);

        if (userRows.length === 0) {
            return res.status(404).json({ error: 'Telefon numarası bulunamadı' });
        }

        const userId = userRows[0].id;
        const generateResetCode = () => {
            return Math.floor(100000 + Math.random() * 900000).toString(); 
        };
        const resetCode = generateResetCode();

        const expiresAt = new Date(Date.now() + 10 * 60000);

        const [result] = await pool.query(
            'INSERT INTO reset_password_requests (user_id, phone, reset_code, expires_at) VALUES (?, ?, ?, ?)',
            [userId, phone, resetCode, expiresAt]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ error: 'Şifre sıfırlama talebi kaydedilemedi' });
        }

        await sendResetCodeSMS(phone, resetCode);

        const userIp = req.ip || req.connection.remoteAddress;

        const [sendCodeResult] = await pool.query(
            'INSERT INTO send_code_logs (user_id, ip_address, send_time, phone) VALUES (?, ?, ?, ?)',
            [userId, userIp, new Date(), phone]
        );
 
         if (sendCodeResult.affectedRows === 0) {
             console.error('Kod Gönderme Logu Kaydedilemedi');
         }

        res.status(200).json({ message: 'Doğrulama kodu SMS olarak gönderildi', resetCode });
    } catch (err) {
        console.error('Şifre sıfırlama talebi hatası:', err);
        res.status(500).json({ error: 'Şifre sıfırlama talebi sırasında hata oluştu', details: err.message });
    }
});

// verify reset code endpoint
router.post('/verify-reset-code', async (req, res) => {
    const { phone, resetCode } = req.body;

    try {
        const formattedPhone = `+90${phone}`;

        const verificationCheck = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks
            .create({ to: formattedPhone, code: resetCode });

        if (verificationCheck.status !== 'approved') {
            return res.status(400).json({ error: 'Kod yanlış veya süresi dolmuş' });
        }

        const [userRows] = await pool.query('SELECT id FROM users_detail WHERE phone = ?', [phone]);

        if (userRows.length === 0) {
            return res.status(404).json({ error: 'Telefon numarası bulunamadı' });
        }

        const userIp = req.ip || req.connection.remoteAddress;

         const [verifyResetResult] = await pool.query(
             'INSERT INTO verify_reset_code_logs (user_id, ip_address, verify_time) VALUES (?, ?, ?)',
             [userRows[0].id, userIp, new Date()]
         );
 
         if (verifyResetResult.affectedRows === 0) {
             console.error('Kod Doğrulama Logu Kaydedilemedi');
         }

        res.status(200).json({ message: 'Kod doğrulandı', userId: userRows[0].id });

    } catch (err) {
        console.error('Kod doğrulama hatası:', err);
        res.status(500).json({ error: 'Kod doğrulama sırasında hata oluştu', details: err.message });
    }
});

// new password endpoint
router.post('/reset-password', async (req, res) => {
    const { userId, newPassword } = req.body;

    try {
        if (!userId || !newPassword) {
            return res.status(400).json({ error: 'Kullanıcı ID ve yeni şifre gereklidir' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const [updateResult] = await pool.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı veya şifre değiştirilemedi' });
        }

        const userIp = req.ip || req.connection.remoteAddress;

         const [resetPasswordResult] = await pool.query(
             'INSERT INTO password_logs (user_id, ip_address, password_time) VALUES (?, ?, ?)',
             [userId, userIp, new Date()]
         );
 
         if (resetPasswordResult.affectedRows === 0) {
             console.error('Şifre logu kaydedilemedi');
         }

        res.status(200).json({ message: 'Şifre başarıyla güncellendi' });
    } catch (err) {
        console.error('Şifre güncelleme hatası:', err);
        res.status(500).json({ error: 'Şifre güncellenirken hata oluştu', details: err.message });
    }
});


router.put('/users-update-playerid', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const { playerId } = req.body;

        if (!token || !playerId) {
            return res.status(401).json({ error: 'Token eksik veya playerId belirtilmedi.' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Token geçersiz.' });
            }
            const userId = decoded.userId;
            try {
                const [updateUserPlayerId] = await pool.query(
                    'UPDATE users SET player_id = ? WHERE id = ?',
                    [playerId, userId] 
                );

                if (updateUserPlayerId.affectedRows === 0) {
                    return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
                }

                res.status(200).json({ message: 'Bildirim ID başarıyla güncellendi' });
            } catch (dbError) {
                console.error('Database Error:', dbError);
                res.status(500).json({ error: 'Veritabanı hatası.' });
            }
        });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});


// JWT Token
router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: `Merhaba, ${req.user.email}. Bu korumalı bir rota!` });
});

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token eksik' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token geçersiz' });
    req.user = user;
    next(); 
  });
}

module.exports = router;
