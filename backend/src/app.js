const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares básicos
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({
        message: '🎰 Casino API - Backend funcionando correctamente',
        version: '1.0.0',
        status: 'OK'
    });
});

// Ruta de prueba para verificar conexión a DB
app.get('/api/health', (req, res) => {
    res.json({
        message: 'API funcionando',
        database: 'Conectado a MongoDB'
    });
});

module.exports = app;
