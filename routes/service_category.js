const express = require('express');
const pool = require('../db');
const router = express.Router();
require('dotenv').config();
require('dotenv').config();
const jwt = require('jsonwebtoken');

// category endpoint
router.get("/categorys", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: "Yetkilendirme hatası, token eksik" });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(500).json({ error: "Geçersiz token" });
            }

            const languageCode = req.headers.languagecode || 'tr';

            const [languageResult] = await pool.query(
                `SELECT id FROM languages WHERE short_name = ?`,
                [languageCode]
            );

            if (languageResult.length === 0) {
                return res.status(400).json({ error: "Geçersiz dil kodu" });
            }
            const languageId = languageResult[0].id;

            const [servicesCategories] = await pool.query(
                `SELECT 
                    sc.id AS category_id,
                    lw.value AS category_name,
                    e.file_name AS file_name  -- envoirments tablosundaki file_name
                FROM services_category sc
                LEFT JOIN language_word lw ON sc.ref_key = lw.top_key 
                    AND lw.ref_language = ?
                LEFT JOIN envoirments e ON sc.envoirment_id = e.id  
                WHERE sc.is_deleted = 0`,
                [languageId]
            );

            if (servicesCategories.length === 0) {
                return res.status(404).json({ message: "Hizmet kategorisi bulunamadı" });
            }

            return res.status(200).json({
                message: "Başarılı",
                services_categories: servicesCategories
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// service category endpoint
router.get("/services-categorys", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Yetkilendirme hatası, token eksik' });
        }

        const categoryId = req.headers['categoryid'];
        if (!categoryId) {
            return res.status(400).json({ error: 'Category ID header eksik' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Geçersiz token' });
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
                    s.envoirment_id,
                    e.file_name AS envoirment_file_name,
                    a.id AS add_service_id,
                    a.services_id,
                    a.name AS add_service_name,
                    a.price AS add_service_price,
                    a.is_deleted AS add_service_is_deleted
                FROM services s
                LEFT JOIN add_services a ON s.id = a.services_id
                LEFT JOIN envoirments e ON s.envoirment_id = e.id  
                WHERE s.service_category_id = ? 
                AND s.is_deleted = 0 
                AND (a.is_deleted = 0 OR a.is_deleted IS NULL)`,
                [categoryId]
            );


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

                if (service.add_service_id) {
                    existingService.add_services.push({
                        "id": service.add_service_id,
                        "services_id": service.services_id,
                        "name": service.add_service_name,
                        "price": service.add_service_price,
                        "is_deleted": service.add_service_is_deleted
                    });
                }
            });

            return res.status(200).json(result);
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;