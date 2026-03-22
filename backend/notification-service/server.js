require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Notification Service' });
});

// Mock Email Transporter
const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || "mock_user",
        pass: process.env.SMTP_PASS || "mock_pass",
    },
});

app.post('/api/notifications/email', async (req, res) => {
    const { to, subject, text, html } = req.body;

    if (!to || !subject) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        console.log(`📧 Sending email to ${to}...`);
        // We mock it if no env is set
        if (!process.env.SMTP_USER) {
            console.log(`Email dispatched: ${subject}`);
            return res.json({ success: true, message: "Mock email sent" });
        }

        await transporter.sendMail({
            from: '"NeuroTrack AI" <alerts@neurotrack.ai>',
            to,
            subject,
            text,
            html
        });

        res.json({ success: true, message: "Email sent" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Email dispatch failed" });
    }
});

// Push notification route template
app.post('/api/notifications/push', (req, res) => {
    // In production, integrate with Firebase Cloud Messaging (FCM) or WebPush
    const { userId, title, message } = req.body;
    console.log(`📱 Push dispatch to user ${userId}: ${title} - ${message}`);
    res.json({ success: true, message: "Push notification simulated" });
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log(`📬 Notification Service running on port ${PORT}`);
});
