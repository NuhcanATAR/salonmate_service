const express = require('express');
const pool = require('../db');
const router = express.Router();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios');

router.get('/appointments-date', async (req, res) => {
    try{
        const token = req.headers.authorization?.split(' ')[1];
        const stylistId = req.headers['stylistid'] || req.headers['stylist-id'];
        
        if(!token){
            return res.status(401).json({ error: 'Token eksik ' });
        }
        if (!stylistId) {
            return res.status(401).json({ error: 'Stylist id yok.' });
        }
      
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Geçersiz token' });
            }

            const workHours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
            
            const today = new Date();
            const availableDates = [];

            for (let i = 0; i < 30; i++) {
                let date = new Date();
                date.setDate(today.getDate() + i);

                let dayOfWeek = date.getDay(); // 0: Sunday, 6: Saturday
                if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

                let formattedDate = date.toISOString().split('T')[0]; // Get in YYYYY-MM-DD format
                
                try {
                    // pull full hours from database
                    const [bookedAppointments] = await pool.query(
                        `SELECT TIME_FORMAT(appointments_date, '%H:%i') AS booked_time 
                         FROM appointments 
                         WHERE stylist_id = ? AND DATE(appointments_date) = ?`,
                        [stylistId, formattedDate]
                    );

                    // remove full hours from the list
                    const bookedTimes = bookedAppointments.map(appt => appt.booked_time);
                    const availableTimes = workHours.filter(hour => !bookedTimes.includes(hour));

                    if (availableTimes.length > 0) {
                        availableDates.push({
                            date: formattedDate,
                            available_times: availableTimes
                        });
                    }
                } catch (dbError) {
                    console.error("DB Error:", dbError);
                    return res.status(500).json({ message: 'Veritabanı hatası' });
                }
            }

            return res.json(availableDates);
        });
    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post("/appointment-create", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; 
       
        const { salonsId, servicesId, stylistId, appointmentDate, servicePrice, totalPrice, paymentType, addServices } = req.body;
        
        if (!token) {
            return res.status(401).json({ error: 'Token eksik' });
        }
        if (!salonsId || !servicesId || !stylistId || !appointmentDate || !servicePrice || !totalPrice || !addServices) {
            return res.status(400).json({ error: 'Eksik bilgi' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Geçersiz token' });
            }

            const userId = decoded.userId;
            const userIp = req.ip; 

            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                const [appointmentResult] = await connection.query(
                    `INSERT INTO appointments (user_id, salons_id, services_id, stylist_id, appointments_date, is_deleted, created_at, appointments_category_id) 
                     VALUES (?, ?, ?, ?, ?, 0, NOW(), ?)`,
                    [userId, salonsId, servicesId, stylistId, appointmentDate, 1] 
                );
                
                
                const appointmentId = appointmentResult.insertId;
               
                await connection.query(
                    `INSERT INTO appointments_logs (user_id, ip_address, appointment_time, appointments_id) 
                     VALUES (?, ?, NOW(), ?)`,
                    [userId, userIp, appointmentId]
                );

                await connection.query(
                    `INSERT INTO appointments_detail (appointments_id, service_price, total_price, payment_type, created_at) 
                     VALUES (?, ?, ?, ?, NOW())`,
                    [appointmentId, servicePrice, totalPrice, paymentType ? 1 : 0] 
                );

                if (Array.isArray(addServices) && addServices.length > 0) {
                    for (const service of addServices) {
                        const { name, price } = service;
                        if (!name || !price) continue; 

                        await connection.query(
                            `INSERT INTO appointments_add_services (appointments_id, name, price, created_at) 
                             VALUES (?, ?, ?, NOW())`,
                            [appointmentId, name, price]
                        );
                    }
                }

                await connection.commit();
                res.status(201).json({ message: 'Randevu başarıyla oluşturuldu', appointmentId });
            } catch (dbError) {
                await connection.rollback();
                console.error("DB Error:", dbError);
                res.status(500).json({ error: 'Veritabanı hatası' });
            } finally {
                connection.release();
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/appointment-user', async (req, res) => {
    try{
        const token = req.headers.authorization?.split(' ')[1];
        if(!token ){
            return res.status(401).json({ error: 'Token eksik.' });
        }
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Geçersiz token' });
            }
            const userId = decoded.userId;
            const connection = await pool.getConnection();

            try {
                const [appointments] = await connection.query(
                    `SELECT a.*, 
                            s.name AS salon_name, 
                            sr.name AS service_name, 
                            st.name AS stylist_name,
                            ac.name AS appointment_category
                    FROM appointments a
                    LEFT JOIN salons s ON a.salons_id = s.id
                    LEFT JOIN services sr ON a.services_id = sr.id
                    LEFT JOIN stylist st ON a.stylist_id = st.id
                    LEFT JOIN appointments_status_category ac ON a.appointments_category_id = ac.id
                    WHERE a.user_id = ? AND a.is_deleted = 0
                    ORDER BY a.created_at DESC`,
                    [userId]
                );
                
                if (appointments.length === 0) {
                    return res.status(200).json({ appointments: [] });
                }
               
                for (let appointment of appointments) {
                    const [details] = await connection.query(
                        `SELECT * FROM appointments_detail WHERE appointments_id = ?`,
                        [appointment.id]
                    );

                    const [additionalServices] = await connection.query(
                        `SELECT * FROM appointments_add_services WHERE appointments_id = ?`,
                        [appointment.id]
                    );

                    appointment.details = details.length > 0 ? details[0] : null;
                    appointment.additionalServices = additionalServices;
                }

                res.status(200).json({ appointments });
            } catch (dbError) {
                console.error("DB Error:", dbError);
                res.status(500).json({ error: 'Veritabanı hatası' });
            } finally {
                connection.release();
            }
        });
      
    }catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/appointment-update', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const { appointmentId, status } = req.body;

        if (!token) {
            return res.status(401).json({ error: 'Token eksik.' });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Geçersiz token' });
            }

            const userId = decoded.userId;
            const connection = await pool.getConnection();

            try {
                const [updateResult] = await connection.query(
                    `UPDATE appointments SET appointments_category_id = ? WHERE id = ? AND user_id = ?`,
                    [status, appointmentId, userId]
                );

                if (updateResult.affectedRows === 0) {
                    return res.status(404).json({ error: 'Randevu bulunamadı veya güncellenemedi.' });
                }
  
                const [user] = await connection.query(
                    `SELECT player_id FROM users WHERE id = ?`,
                    [userId]
                );

                if (!user.length || !user[0].player_id) {
                    return res.status(404).json({ error: 'Kullanıcı veya player_id bulunamadı.' });
                }

                const playerId = user[0].player_id;

                let notificationMessages = {
                    en: `Your appointment status has been updated: ${status}`,
                    tr: `Randevunuzun durumu güncellendi: ${status}`
                };
                
                if (status === 4) {
                    notificationMessages = {
                        en: "Your appointment has been canceled!",
                        tr: "Randevunuz İptal Edildi!"
                    };
                } else if (status === 5) {
                    notificationMessages = {
                        en: "Your appointment has been rejected!",
                        tr: "Randevunuz Reddedildi!"
                    };
                } else if (status === 1) {
                    notificationMessages = {
                        en: "Your appointment is pending approval!",
                        tr: "Randevunuz Onayda Bekliyor!"
                    };
                } else if (status === 2) {
                    notificationMessages = {
                        en: "Your appointment has been approved!",
                        tr: "Randevunuz Onaylandı!"
                    };
                } else if (status === 3) {
                    notificationMessages = {
                        en: "Your appointment has been updated!",
                        tr: "Randevunuz Güncellendi!"
                    };
                }

                const oneSignalResponse = await axios.post(
                    'https://onesignal.com/api/v1/notifications',
                    {
                        app_id: process.env.ONESIGNAL_APP_ID,
                        include_player_ids: [playerId],
                        headings: {
                            en: 'Appointment Updated',
                            tr: 'Randevu Güncellendi'
                        },
                        contents: notificationMessages
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
                        }
                    }
                );

                res.status(200).json({
                    message: 'Randevu başarıyla güncellendi ve bildirim gönderildi.',
                    notificationResponse: oneSignalResponse.data
                });
            } catch (dbError) {
                console.error("DB Error:", dbError);
                res.status(500).json({ error: 'Veritabanı hatası' });
            } finally {
                connection.release();
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;