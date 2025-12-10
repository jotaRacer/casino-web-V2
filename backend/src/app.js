const express = require('express');
const cors = require('cors');
const path = require('path');
const { engine } = require('express-handlebars');
const app = express();

// --- 1. IMPORTAR RUTAS DE API (BACKEND) ---
const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transaction.routes');
const rouletteRoutes = require('./routes/roulette.routes');

// --- 2. CONFIGURACIÓN DE VISTAS (HANDLEBARS) ---
app.set('views', path.join(__dirname, '../../views'));

app.engine('handlebars', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, '../../views/layouts'),
    partialsDir: path.join(__dirname, '../../views/partials'),
    helpers: {
        // Helper para que el dinero se vea bonito (ej: $10.000)
        formatCLP: (amount) => {
            return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount || 0);
        }
    }
}));
app.set('view engine', 'handlebars');

// --- 3. ARCHIVOS ESTÁTICOS ---
// Para que carguen las imágenes y estilos de la carpeta 'public'
app.use(express.static(path.join(__dirname, '../../public')));

// --- 4. MIDDLEWARES ---
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 5. CONECTAR RUTAS DE API ---
// Estas son las rutas invisibles que usa el JavaScript para guardar datos
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use("/api/roulette", rouletteRoutes);

// --- 6. RUTAS DE VISTAS (FRONTEND) ---
// Aquí definimos qué archivo .handlebars se muestra en cada URL

// -- Rutas Públicas --
app.get('/', (req, res) => {
    res.render('home', { title: 'Casino Royale - Inicio' });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Iniciar Sesión' });
});

app.get('/register', (req, res) => {
    res.render('register', { title: 'Crear Cuenta' });
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'Sobre Nosotros' });
});

app.get('/rules', (req, res) => {
    res.render('rules', { title: 'Reglas del Juego' });
});

app.get('/test-auth', (req, res) => {
    res.render('test-auth', { title: 'Test de Autenticación' });
});


// -- Rutas Privadas (Simuladas por ahora) --
// Pasamos un usuario falso (dummyUser) para que las páginas no den error
// al intentar mostrar el saldo o el nombre antes de que hagas login real.

const dummyUser = { firstName: 'Invitado', saldo: 0, email: 'demo@casino.com' };

app.get('/perfil', (req, res) => {
    res.render('perfil', { title: 'Mi Perfil', user: dummyUser });
});

app.get('/deposito', (req, res) => {
    res.render('deposito', { title: 'Banca', user: dummyUser });
});

app.get('/roulette', (req, res) => {
    res.render('roulette', { title: 'Mesa de Ruleta', user: dummyUser });
});
module.exports = app;