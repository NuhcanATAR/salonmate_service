const express = require('express');
const pool = require('../db');
const router = express.Router();
require('dotenv').config();
require('dotenv').config();
const jwt = require('jsonwebtoken');

router.get("/account", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token eksik' });
        }


        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Geçersiz token' });
            }

            const userId = decoded.userId;

            try {
                const [userQuery] = await pool.query(`SELECT 
                    u.username, 
                    u.email, 
                    u.status 
                    FROM users u 
                    WHERE id = ?`, [userId]);

                if (userQuery.length === 0) {
                    return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
                }

                const user = userQuery[0];

                const [userDetailQuery] = await pool.query(`SELECT 
                    ud.full_name,
                    ud.phone,
                    ud.city,
                    ud.district,
                    ud.address
                    FROM users_detail ud 
                    WHERE user_id = ?`, [userId]);
                if (userDetailQuery.length === 0) {
                    return res.status(404).json({ error: 'Kullanıcı detay bilgileri bulunamadı' });
                }
                const userDetail = userDetailQuery[0];

                return res.json({ user, userDetail });

            } catch (error) {
                return res.status(500).json({ error: 'Veritabanı hatası' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Bir hata oluştu' });
    }
});


module.exports = router;