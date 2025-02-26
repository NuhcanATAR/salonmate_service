const express = require('express');
const pool = require('../db');
const router = express.Router();
require('dotenv').config();
const jwt = require('jsonwebtoken');

router.post('/evaluation-create', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const { appointmentId, salonId, points, description } = req.body;

        if (!token || !appointmentId || !points || !description || !salonId) {
            return res.status(401).json({ error: 'Bilgiler Eksik.' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Geçersiz token' });
            }
            const userId = decoded.userId; 

            try {               
                const [existingEvaluations] = await pool.query(
                    `SELECT id FROM evaluations WHERE appointments_id = ? AND users_id = ?`,
                    [appointmentId, userId]
                );

                if (existingEvaluations.length > 0) {
                    return res.status(400).json({ error: 'Bu randevu için zaten değerlendirme yaptınız.' });
                }
               
                const [existingAppointments] = await pool.query(
                    `SELECT id FROM appointments WHERE id = ? AND appointments_category_id = 5 AND is_deleted = 1`,
                    [appointmentId]
                );

                if (existingAppointments.length > 0) {
                    return res.status(400).json({ error: 'Bu randevu için değerlendirme yapamazsınız.' });
                }

                const [updateAppointments] = await pool.query(
                    `UPDATE appointments SET appointments_category_id = ? WHERE id = ?`,
                    [7, appointmentId]
                );

                if (updateAppointments.affectedRows === 0) {
                    return res.status(404).json({ error: 'Randevu kategorisi güncellenmedi.' });
                }
              
                const [result] = await pool.query(
                    `INSERT INTO evaluations (appointments_id, salon_id, users_id, points, description) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [appointmentId, salonId, userId, points, description]
                );

                res.status(201).json({ 
                    message: 'Değerlendirme başarıyla eklendi.', 
                    evaluationId: result.insertId 
                });

            } catch (dbError) {
                console.error("DB Error:", dbError);
                res.status(500).json({ error: 'Veritabanı hatası' });
            } 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/evaluation-salon-scores', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const salonId = req.headers.salonid; 

        if (!token || !salonId) {
            return res.status(401).json({ error: 'Eksik bilgiler mevcut.' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Geçersiz token' });
            }
             
            try {
                const [evaluations] = await pool.query(
                    `SELECT SUM(points) AS totalPoints, COUNT(*) AS totalEvaluations
                     FROM evaluations WHERE salon_id = ?`, 
                    [salonId]
                );

                const totalPoints = evaluations[0].totalPoints || 0;
                const totalEvaluations = evaluations[0].totalEvaluations || 1;      
                const averageScore = totalEvaluations > 0 ? (totalPoints / totalEvaluations).toFixed(1) : "0.0";
              
                const [appointments] = await pool.query(
                    `SELECT COUNT(*) AS totalAppointments FROM appointments WHERE salons_id = ?`, 
                    [salonId]
                );

                const totalAppointments = appointments[0].totalAppointments || 0;

                res.status(200).json({
                    average_score: parseFloat(averageScore), 
                    total_appointments: totalAppointments
                });

            } catch (dbError) {
                console.error("DB Error:", dbError);
                res.status(500).json({ error: 'Veritabanı hatası' });
            }  
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;