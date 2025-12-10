const express = require('express');
const cors = require('cors');
const path = require('path');
const { engine } = require('express-handlebars');

const app = express();

// ==========================================
// 1. CONFIGURACIÓN DE VISTAS (HANDLEBARS)
// ==========================================
app.engine('handlebars', engine({
    defaultLayout: 'main',
    helpers: {
        // Helper para valores nulos
        defaultZero: (value) => (value == null ? 0 : value),
        // Helper para formato de moneda chilena
        formatCLP: (amount) => {
            return new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
                maximumFractionDigits: 0
            }).format(amount || 0);
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '../../views'));

// ==========================================
// 2. MIDDLEWARES BÁSICOS Y ESTÁTICOS
// ==========================================
app.use(express.static(path.join(__dirname, '../../public')));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: false // JWT no necesita credentials
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 3. RUTAS DE API (BACKEND)
// ==========================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use("/api/roulette", require('./routes/roulette.routes'));

// ==========================================
// 4. RUTAS DE VISTAS (FRONTEND)
// ==========================================

// --- Rutas Públicas ---
app.get('/', (req, res) => res.render('home', { title: 'Casino Royale' }));
app.get('/login', (req, res) => res.render('login', { title: 'Iniciar Sesión' }));
app.get('/register', (req, res) => res.render('register', { title: 'Crear Cuenta' }));
app.get('/reglas', (req, res) => res.render('rules', { title: 'Reglas' }));
app.get('/nosotros', (req, res) => res.render('about', { title: 'Nosotros' }));

// --- Rutas Privadas (Protegidas) ---
// La autenticación se maneja en el frontend con JavaScript
// Estas rutas solo renderizan las vistas
app.get('/perfil', (req, res) => {
    res.render('perfil', { title: 'Mi Perfil' });
});

app.get('/deposito', (req, res) => {
    res.render('deposito', { title: 'Banca' });
});

app.get('/ruleta', (req, res) => {
    res.render('roulette', { title: 'Mesa de Ruleta' });
});


module.exports = app;

module.exports = app;