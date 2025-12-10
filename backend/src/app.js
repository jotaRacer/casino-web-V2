const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { engine } = require('express-handlebars');
const { authenticate } = require('./middlewares/auth.middleware');

// Importaciones de lógica JWT y Base de Datos
const { verifyToken } = require('./utils/jwt'); 
const Usuario = require('./models/Usuario');

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
app.use(cookieParser()); // Indispensable para leer el JWT de las cookies
app.use(express.static(path.join(__dirname, '../../public')));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 3. MIDDLEWARE GLOBAL DE SESIÓN (NAVBAR)
// ==========================================
// Este middleware corre en cada petición para que la Navbar sepa si mostrar 
// "Login" o "Perfil" en todas las páginas (incluyendo las públicas).
app.use(async (req, res, next) => {
    const token = req.cookies.token;
    res.locals.user = null; // Por defecto asumimos que no hay usuario

    if (token) {
        try {
            const decoded = verifyToken(token);
            // Buscamos al usuario en la DB para tener datos frescos (como el saldo)
            const user = await Usuario.findById(decoded.userId).lean();
            if (user) {
                res.locals.user = user; // Disponible en todos los archivos .handlebars
                req.user = user;       // Disponible en los controladores (req.user.userId)
            }
        } catch (error) {
            console.log("Token inválido o expirado");
            res.clearCookie('token');
        }
    }
    next();
});

// ==========================================
// 4. MIDDLEWARE DE PROTECCIÓN (RUTAS PRIVADAS)
// ==========================================
const requireAuth = (req, res, next) => {
    if (!res.locals.user) {
        return res.redirect('/login');
    }
    next();
};

// ==========================================
// 5. RUTAS DE API (BACKEND)
// ==========================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use("/api/roulette", require('./routes/roulette.routes'));

// ==========================================
// 6. RUTAS DE VISTAS (FRONTEND)
// ==========================================

// --- Rutas Públicas ---
app.get('/', (req, res) => res.render('home', { title: 'Casino Royale' }));
app.get('/login', (req, res) => res.render('login', { title: 'Iniciar Sesión' }));
app.get('/register', (req, res) => res.render('register', { title: 'Crear Cuenta' }));
app.get('/reglas', (req, res) => res.render('rules', { title: 'Reglas' }));
app.get('/nosotros', (req, res) => res.render('about', { title: 'Nosotros' }));

// --- Rutas Privadas (Protegidas) ---
// No pasamos dummyUser; Handlebars usara automáticamente res.locals.user
app.get('/perfil', requireAuth, (req, res) => {
    res.render('perfil', { title: 'Mi Perfil' });
});

app.get('/deposito', requireAuth, (req, res) => {
    res.render('deposito', { title: 'Banca' });
});

app.get('/ruleta', authenticate, (req, res) => {
    res.render('roulette', { title: 'Mesa de Ruleta' });
});

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

const authController = require('./controllers/auth.controller');
app.post('/login', authController.login);


module.exports = app;