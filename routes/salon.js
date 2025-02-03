const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();
require('dotenv').config();
require('dotenv').config();
const crypto = require('crypto');


router.get("/salons", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Yetkisiz erişim, token eksik" });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (req, res) => {
            if (err) {
                return res.status(403).json({ message: 'Geçersiz token' });

            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.userId;

            const [userDetail] = await pool.query(
                "SELECT city, district FROM users_detail WHERE user_id = ?",
                [userId]
            );

            if (userDetail.length === 0) {
                return res.status(404).json({ message: "Kullanıcı detayları bulunamadı" });
            }

            const { city, district } = userDetail[0];

            const [salons] = await pool.query(
                `SELECT 
                s.*, 
                sd.*, 
                e.file_name
            FROM salons s
            INNER JOIN salons_detail sd ON s.id = sd.salon_id
            LEFT JOIN envoirments e ON s.envoirment_id = e.id
            WHERE sd.city = ? 
                AND sd.district = ? 
                AND s.is_deleted = 0  -- Salon silinmemiş olmalı
                AND sd.is_deleted = 0 -- Salon detayları silinmemiş olmalı
                AND (s.is_deleted IS NULL OR s.is_deleted = 0)`,
                [city, district]
            );


            res.json({ salons });
        });
    } catch (error) {
        console.error("Salonları çekerken hata:", error);
        res.status(500).json({ message: "Sunucu hatası" });
    }
});

router.get('/salons-detail', async (req, res) => {
    try {

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(403).json({ message: 'Token gerekli' });
        }

        const salonId = req.headers['salon-id'];
        if(!salonId){
            return res.status(400).json({ message: 'Salon ID gerekli' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Geçersiz token' });
            }

            const [salonDetail] = await pool.query(
                `SELECT 
                    s.*, 
                    sd.*, 
                    e.file_name
                FROM salons s
                INNER JOIN salons_detail sd ON s.id = sd.salon_id
                LEFT JOIN envoirments e ON s.envoirment_id = e.id
                WHERE s.id = ? 
                AND s.is_deleted = 0 
                AND sd.is_deleted = 0`,
                [salonId]
            );

            if (salonDetail.length === 0) {
                return res.status(404).json({ message: 'Salon bulunamadı' });
            }

            res.status(200).json({ salon: salonDetail });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

router.get("/salon-services", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Yetkisiz erişim, token eksik" });
        }

        const salonId = req.headers['salon-id'];
        const categoryId = req.headers['category-id'];

        if (!salonId || !categoryId) {
            return res.status(400).json({ message: "Salon ID ve Category ID gereklidir" });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if(err){
                return res.status(403).json({ message: "Geçersiz token" });
            }

            const [services] = await pool.query(
                `SELECT 
                    s.id AS service_id,
                    s.salon_id,
                    s.service_category_id,
                    s.name AS service_name,
                    s.description,
                    s.price AS service_price,
                    s.duration,
                    s.is_active,
                    s.created_at,
                    s.is_deleted AS service_is_deleted,
                    s.envoirment_id,  -- doğru yazım burada envoirment_id olmalı
                    e.file_name AS envoirment_file_name,  -- envoirment tablosundaki file_name
                    a.id AS add_service_id,
                    a.services_id,
                    a.name AS add_service_name,
                    a.price AS add_service_price,
                    a.is_deleted AS add_service_is_deleted
                FROM services s
                LEFT JOIN add_services a ON s.id = a.services_id
                LEFT JOIN envoirments e ON s.envoirment_id = e.id  -- envoirments tablosu ile ilişki
                WHERE s.salon_id = ? 
                AND s.service_category_id = ? 
                AND s.is_deleted = 0 
                AND a.is_deleted = 0`,
                [salonId, categoryId]
            );
    
            if (services.length === 0) {
                return res.status(404).json({ message: "Hizmet bulunamadı" });
            }
    
            const result = {
                "message": "Başarılı",
                "services": []
            };
    
            services.forEach(service => {
                let existingService = result.services.find(s => s.id === service.service_id);
    
                if (!existingService) {
                    existingService = {
                        "id": service.service_id,
                        "salon_id": service.salon_id,
                        "service_category_id": service.service_category_id,
                        "name": service.service_name,
                        "description": service.description,
                        "price": service.service_price,
                        "duration": service.duration,
                        "is_active": service.is_active,
                        "created_at": service.created_at,
                        "is_deleted": service.service_is_deleted,
                        "envoirment_id": service.envoirment_id,
                        "envoirment_file_name": service.envoirment_file_name,
                        "add_services": []
                    };
                    result.services.push(existingService);
                }
    
                existingService.add_services.push({
                    "id": service.add_service_id,
                    "services_id": service.services_id,
                    "name": service.add_service_name,
                    "price": service.add_service_price,
                    "is_deleted": service.add_service_is_deleted
                });
            });
    
            return res.status(200).json(result);
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});


module.exports = router;