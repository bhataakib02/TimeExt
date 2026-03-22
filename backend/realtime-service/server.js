require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*', // Allows extension and dashboard
        methods: ['GET', 'POST']
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Realtime Service' });
});

// Real-time tracking mechanisms
const activeUsers = new Map();

io.on('connection', (socket) => {
    console.log(`🟢 Client connected: ${socket.id}`);

    // When extension connects and identifies user
    socket.on('authenticate', (data) => {
        const { userId } = data;
        if (userId) {
            activeUsers.set(socket.id, { userId, lastActivity: Date.now(), status: 'active' });
            socket.join(`user_${userId}`);
            console.log(`User ${userId} authenticated on socket ${socket.id}`);
        }
    });

    // Receive live tracking events from extension
    socket.on('tracking_event', (eventData) => {
        const userSession = activeUsers.get(socket.id);
        if (!userSession) return;

        // Log tracking internally or emit to other connected instances (like dashboard)
        // E.g., dashboard listening to user_ID room will get the live score update
        io.to(`user_${userSession.userId}`).emit('live_dashboard_update', {
            type: 'TICK',
            data: eventData
        });

        // Check idle metrics
        if (eventData.idle) {
            io.to(`user_${userSession.userId}`).emit('notification', {
                title: 'Idle Detected',
                message: 'Are you still working?',
                type: 'warning'
            });
        }
    });

    // Suggesting focus mode (Gamification engine trigger)
    socket.on('ai_insight', (insight) => {
        // Broadcast AI insight to UI or extension
        const userSession = activeUsers.get(socket.id);
        if (userSession) {
            io.to(`user_${userSession.userId}`).emit('notification', insight);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔴 Client disconnected: ${socket.id}`);
        activeUsers.delete(socket.id);
    });
});

const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
    console.log(`⚡ Realtime Service (WebSockets) running on port ${PORT}`);
});
