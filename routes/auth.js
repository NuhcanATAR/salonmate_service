const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();
require('dotenv').config(); 

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

         const [logResult] = await pool.query(
             'INSERT INTO login_logs (user_id, ip_address, login_time) VALUES (?, ?, ?)',
             [user.id, userIp, new Date()]
         );
 
         if (logResult.affectedRows === 0) {
             console.error('Giriş logu kaydedilemedi');
         }

        res.json({ message: 'Giriş başarılı', token });
    } catch (err) {
        console.error('Giriş Hatası:', err);
        res.status(500).json({ error: 'Giriş sırasında hata oluştu', details: err.message });
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
            return res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı' });
        }
       
        const [existingUsername] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsername.length > 0) {
            return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış' });
        }
        
        const [existingPhone] = await pool.query('SELECT id FROM users_detail WHERE phone = ?', [phone]);
        if (existingPhone.length > 0) {
            return res.status(400).json({ error: 'Bu telefon numarası zaten kayıtlı' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await pool.query(
            'INSERT INTO users (email, password, username, status) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, username, 1] 
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ error: 'Kullanıcı kaydedilemedi' });
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
