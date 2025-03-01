const express = require('express');
const pool = require('../db');
const router = express.Router();
require('dotenv').config();
const jwt = require('jsonwebtoken');

// stylist endpoint
router.get('/stylist', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const salonId = req.headers.salonid;
        const servicesId = req.headers.servicesid;

        if (!token || !salonId || !servicesId) {
            return res.status(401).json({ message: 'Yetkisiz erişim, token eksik veya salon ID veya servis ID yok' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Geçersiz token' });
            }
            try {
                const stylistServiceQuery = `
                    SELECT stylist_id 
                    FROM stylist_services 
                    WHERE services_id = ?
                `;
                const [stylistServiceRows] = await pool.query(stylistServiceQuery, [servicesId]);

                if (stylistServiceRows.length === 0) {
                    return res.status(404).json({ message: 'Bu hizmete ait stilist bulunamadı' });
                }

                const stylistIds = stylistServiceRows.map(row => row.stylist_id);

                const stylistQuery = `
                    SELECT s.id, s.salon_id, s.name, s.phone, s.email, s.is_top_rated, s.created_at, s.is_deleted,
                           e.file_name AS envoirment_file_name
                    FROM stylist s
                    LEFT JOIN envoirments e ON s.envoirment_id = e.id
                    WHERE s.id IN (?) AND s.salon_id = ?
                `;
                const [stylistRows] = await pool.query(stylistQuery, [stylistIds, salonId]);

                if (stylistRows.length === 0) {
                    return res.status(404).json({ message: 'Belirtilen salon ve hizmet için stilist bulunamadı' });
                }

                res.json(stylistRows);
            } catch (dbError) {
                console.error(dbError);
                res.status(500).json({ message: 'Veritabanı hatası' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// stylist add services endpoint
router.get('/stylist-add-services', async (req, res) => {
    try{
        const token = req.headers.authorization?.split(' ')[1];
        const stylistId = req.headers.stylistid;
        
        if(!token || !stylistId){
            return res.status(401).json({message: 'Token eksik veya stylist id yok.'});
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if(err){
                return res.status(403).json({message: 'Geçersiz token'});
            }

            const userId = decoded.userId;

            try {
                const query = `
                    SELECT add_service_id 
                    FROM services_add_services_stylist 
                    WHERE stylist_id = ? AND is_deleted = FALSE
                `;
                const [serviceRows] = await pool.query(query, [stylistId]);

                if (!serviceRows.length) {
                    return res.status(404).json({ message: 'Bu stilistin ek hizmetleri bulunamadı.' });
                }

                const addServiceIds = serviceRows.map(row => row.add_service_id);

                const serviceDetailsQuery = `
                    SELECT * 
                    FROM add_services 
                    WHERE id IN (?)
                `;
                const [addServices] = await pool.query(serviceDetailsQuery, [addServiceIds]);

                res.json(addServices);
            } catch (dbError) {
                console.error(dbError);
                res.status(500).json({ message: 'Veritabanı hatası' });
            }
        });
    }catch(error){
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
});

module.exports = router;