const express = require('express');
const { engine } = require('express-handlebars');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// --- 1. CONFIGURACIÓN INICIAL ---
const app = express();
const port = 3000;

const path = require('path');
const { title } = require('process');
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares para leer datos del cliente
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configurar Handlebars con layout por defecto
app.engine('handlebars', engine({ 
  defaultLayout: 'main',
  helpers: {
    defaultZero: v => (v == null || isNaN(v) ? 0 : Number(v)),
    formatCLP: v =>
      new Intl.NumberFormat('es-CL', {
        style: 'decimal',
        currency: 'CLP',
        maximumFractionDigits: 0
      }).format(Number(v ?? 0)),
  },

 }));
app.set('view engine', 'handlebars');
app.set('views', './views');

// --- 2. CONEXIÓN A LA BASE DE DATOS (MONGODB) ---
mongoose.connect('mongodb+srv://jokum:290804@joaquin.o9eq1qt.mongodb.net/?retryWrites=true&w=majority&appName=Joaquin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Conexión exitosa a MongoDB Atlas');
})
.catch(err => {
  console.error('Error conectando a MongoDB', err);
});

// --- 3. DEFINICIÓN DEL MODELO DE USUARIO ---
const UsuarioSchema = new mongoose.Schema({
  email: String,
  password: String,
  saldo: { type: Number, default: 0 },
  dob: String,
  transacciones : [{
    fecha: { type: Date, default: Date.now },
    tipo: String,
    monto: Number
  }]
});
const Usuario = mongoose.model('Usuario', UsuarioSchema);

// --- 4. MIDDLEWARE PARA VERIFICAR EL USUARIO EN CADA PETICIÓN ---
// (Esto hace que la barra de navegación dinámica funcione)
app.use(async (req, res, next) => {
    const userEmail = req.cookies.userEmail;
    if (userEmail) {
        const usuario = await Usuario.findOne({ email: userEmail })
        .select('-password') // Excluir el campo password
        .lean();
        if (usuario) {
            res.locals.user = usuario;
        }
    }
    next();
});


// --- 5. RUTAS DE AUTENTICACIÓN ---

// Ruta para MOSTRAR el formulario de registro
app.get('/register', (req, res) => {
  res.render('register'); // Necesitas un archivo register.hbs
});

// Ruta para PROCESAR el registro
app.post('/register', async (req, res) => {
  const { email, password, dob } = req.body;
  // (Aquí deberías añadir una comprobación para ver si el email ya existe)
  const nuevoUsuario = new Usuario({ email, password, dob });
  await nuevoUsuario.save();
  res.redirect('/login');
});

// Ruta para MOSTRAR el formulario de login
app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/nosotros', (req, res) => {
  res.render('about',{ title: 'Sobre Nosotros' });
});
app.get('/deposito', async (req, res) => {
  const userEmail = req.cookies.userEmail;
  if (!userEmail) return res.redirect('/login');

  try {
    const usuario = await Usuario.findOne({ email: userEmail });
    if (!usuario) {
      res.clearCookie('userEmail');
      return res.redirect('/login');
    }

    res.render('deposito', {
      title: 'Depositar',
      saldo: usuario.saldo ?? 0,
      transacciones: (usuario.transacciones || [])
        .slice(-5)
        .reverse()
        .map(t => ({
          fecha: (new Date(t.fecha)).toLocaleDateString('es-CL'),
          tipo: t.tipo,
          monto: t.monto
        }))
    });
  } catch (err) {
    console.error(err);
    res.send('Error al cargar la página de depósito');
  }
});
app.get('/reglas', (req, res) => {
  res.render('rules',{ title: 'Reglas' });
});

app.get('/ruleta', (req, res) => {
  res.render('roulette',{ title: 'Ruleta' });
});



// Ruta para PROCESAR el login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const usuario = await Usuario.findOne({ email, password });
    if (!usuario) {
      return res.send('Credenciales inválidas. <a href="/login">Intentar de nuevo</a>');
    }
    res.cookie('userEmail', usuario.email, {
      maxAge: 900000, // 15 minutos
      httpOnly: true
    });
    res.redirect('/perfil');
  } catch (err) {
    console.error('Error al buscar usuario:', err);
    res.send('Error interno del servidor');
  }
});

// Ruta para CERRAR sesión
app.get('/logout', (req, res) => {
    res.clearCookie('userEmail');
    res.redirect('/login');
});


// --- 6. RUTAS DE LAS PÁGINAS PRINCIPALES ---

// Ruta raíz, redirige al home
app.get('/', (req, res) => {
  res.render('home');
});

// Ruta para la página de perfil del usuario
app.get('/perfil', async (req, res) => {
  const userEmail = req.cookies.userEmail;
  if (!userEmail) {
    return res.redirect('/login');
  }
  try {
    const usuarioEncontrado = await Usuario.findOne({ email: userEmail });
    if (!usuarioEncontrado) {
      res.clearCookie('userEmail');
      return res.redirect('/login');
    }
    const datosParaLaVista = {
      email: usuarioEncontrado.email,
      fechaNacimiento: usuarioEncontrado.dob,
      ciudad: "Santiago, Chile",
      saldo: usuarioEncontrado.saldo ?? 0,
      transacciones: (usuarioEncontrado.transacciones || []).slice(-5).reverse().map(t => ({
      fecha: (new Date(t.fecha)).toLocaleDateString('es-CL'),
      tipo: t.tipo,
      monto: t.monto
  }))
    };
    res.render('perfil', datosParaLaVista);
  } catch (err) {
    console.error("Error al buscar perfil de usuario:", err);
    res.send("Error al cargar el perfil.");
  }
});

// --- DEPÓSITO ---
app.post('/depositar', async (req, res) => {
  const userEmail = req.cookies.userEmail;
  const amount = Number(req.body.amount);

  if (!userEmail) return res.status(401).json({ error: "No autenticado" });
  if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: "Monto inválido" });

  try {
    const usuario = await Usuario.findOne({ email: userEmail });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    usuario.saldo = (usuario.saldo || 0) + amount;

    usuario.transacciones.push({ tipo: 'depósito', monto: amount, fecha: new Date() });

    await usuario.save();

    res.json({ nuevoSaldo: usuario.saldo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al depositar" });
  }
});


// --- RETIRO ---
app.post('/retirar', async (req, res) => {
  const userEmail = req.cookies.userEmail;
  const amount = Number(req.body.amount);

  if (!userEmail) return res.status(401).json({ error: "No autenticado" });
  if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: "Monto inválido" });

  try {
    const usuario = await Usuario.findOne({ email: userEmail });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    if (usuario.saldo < amount) {
      return res.status(400).json({ error: "Saldo insuficiente" });
    }

    usuario.saldo -= amount;

    usuario.transacciones.push({ tipo: 'retiro', monto: amount, fecha: new Date() });

    await usuario.save();

    res.json({ nuevoSaldo: usuario.saldo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al retirar" });
  }
});

// Rutas para las otras páginas 
//app.get('/home', (req, res) => { res.render('home'); });
//app.get('/casino', (req, res) => { res.render('casino'); });
//app.get('/rules', (req, res) => { res.render('rules'); });
//app.get('/transaccion', (req, res) => { res.render('transaccion'); });
//app.get('/about', (req, res) => { res.render('about'); });
//app.get('/perfil', (req, res) => { res.render('perfil'); });


// --- 7. INICIAR EL SERVIDOR ---
app.listen(port, () => {
  console.log(`App corriendo en http://localhost:${port}`);
});

