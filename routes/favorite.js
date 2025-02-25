const express = require('express');
const pool = require('../db');
const router = express.Router();
require('dotenv').config();
const jwt = require('jsonwebtoken');

router.get('/favorites', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Yetkisiz erişim, token eksik' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Geçersiz token' });
            }

            const userId = decoded.userId;

            try {
                const query = `
                    SELECT 
                        s.*, 
                        sd.*, 
                        e.file_name
                    FROM favorite f
                    INNER JOIN salons s ON f.salons_id = s.id
                    INNER JOIN salons_detail sd ON s.id = sd.salon_id
                    LEFT JOIN envoirments e ON s.envoirment_id = e.id
                    WHERE f.user_id = ? AND f.is_deleted = 0 AND s.is_deleted = 0;
                `;

                const [favorites] = await pool.query(query, [userId]);

                res.status(200).json(favorites);
            } catch (dbError) {
                console.error('Veritabanı hatası:', dbError);
                res.status(500).json({ message: 'Veritabanı hatası' });
            }
        });
    } catch (error) {
        console.error('Sunucu hatası:', error);
        res.status(500).json({ message: 'Bir hata oluştu' });
    }
});

module.exports = router;

router.post('/favorite-toggle', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const { salonId } = req.body;

        if (!token || !salonId) {
            return res.status(400).json({ message: 'Eksik bilgiler' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Geçersiz token' });
            }

            const userId = decoded.userId;

            try {
                const checkQuery = 'SELECT * FROM favorite WHERE user_id = ? AND salons_id = ?';
                const [existingFavorite] = await pool.query(checkQuery, [userId, salonId]);

                if (existingFavorite.length > 0) {
                    const isDeleted = existingFavorite[0].is_deleted;
                    if (isDeleted === 0) {
                        const updateQuery = 'UPDATE favorite SET is_deleted = 1 WHERE user_id = ? AND salons_id = ?';
                        await pool.query(updateQuery, [userId, salonId]);
                        return res.status(200).json({ message: 'Salon favorilerden kaldırıldı' });
                    } else {
                        const updateQuery = 'UPDATE favorite SET is_deleted = 0 WHERE user_id = ? AND salons_id = ?';
                        await pool.query(updateQuery, [userId, salonId]);
                        return res.status(201).json({ message: 'Salon favorilere eklendi' });
                    }
                } else {
                    const insertQuery = 'INSERT INTO favorite (user_id, salons_id) VALUES (?, ?)';
                    await pool.query(insertQuery, [userId, salonId]);
                    return res.status(201).json({ message: 'Salon favorilere eklendi' });
                }
            } catch (dbError) {
                console.error('Veritabanı hatası:', dbError);
                res.status(500).json({ message: 'Veritabanı hatası' });
            }
        });
    } catch (error) {
        console.error('Sunucu hatası:', error);
        res.status(500).json({ message: 'Bir hata oluştu' });
    }
});

module.exports = router;