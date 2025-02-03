const express = require('express');
const pool = require('../db');
const router = express.Router();
require('dotenv').config(); 
require('dotenv').config();
const jwt = require('jsonwebtoken');

router.get("/services-category", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; 
        if (!token) {
            return res.status(401).json({ error: 'Yetkilendirme hatası, token eksik' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if(err){
                return res.status(500).json({ error: 'Geçersiz token'});
            }

            const [servicesCategories] = await pool.query(
                `SELECT 
                    sc.id AS category_id,
                    sc.name AS category_name,
                    e.file_name AS file_name  -- envoirments tablosundaki file_name
                FROM services_category sc
                LEFT JOIN envoirments e ON sc.envoirment_id = e.id  -- envoirments tablosu ile join
                WHERE sc.is_deleted = 0`
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
                    e.file_name AS file_name
                FROM services s
                LEFT JOIN envoirments e ON s.envoirment_id = e.id
                WHERE s.service_category_id = ? 
                AND s.is_deleted = 0`, 
                [categoryId]
            );

            if (services.length === 0) {
                return res.status(404).json({ message: "Hizmet bulunamadı" });
            }

            return res.status(200).json({
                message: "Başarılı",
                services: services
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});



module.exports = router;