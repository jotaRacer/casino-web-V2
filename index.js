const express = require('express')
const { engine } = require('express-handlebars')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');

const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const port = 3000

//mongo db

const mongoose = require('mongoose')

mongoose.connect('mongodb+srv://jokum:290804@joaquin.o9eq1qt.mongodb.net/?retryWrites=true&w=majority&appName=Joaquin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Conexión exitosa a MongoDB Atlas')
})
.catch(err => {
  console.error('Error conectando a MongoDB', err)
})

const UsuarioSchema = new mongoose.Schema({
  email: String,
  password: String,
  dob: String
})
const Usuario = mongoose.model('Usuario', UsuarioSchema)

app.post('/register', async (req, res) => {
  const { email, password, dob } = req.body
  const nuevoUsuario = new Usuario({ email, password, dob })
  await nuevoUsuario.save()
  res.redirect('/perfil')
})

app.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const usuario = await Usuario.findOne({ email, password })

    if (!usuario) {
      return res.send('Credenciales inválidas. <a href="/login">Intentar de nuevo</a>')
    }

    res.cookie('userEmail', usuario.email, {
      maxAge: 900000,
      httpOnly: true
    });

    res.redirect('/perfil');

  } catch (err) {
    console.error('Error al buscar usuario:', err)
    res.send('Error interno del servidor')
  }
})

//perfil de usuario
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
      saldo: 500000,
      transacciones: [
        { fecha: "01/09/2025", tipo: "Depósito", monto: 100000 },
        { fecha: "30/08/2025", tipo: "Apuesta", monto: -20000 }
      ]
    };

    res.render('perfil', datosParaLaVista);

  } catch (err) {
    console.error("Error al buscar perfil de usuario:", err);
    res.send("Error al cargar el perfil.");
  }
});

// index.js (añade esta nueva ruta)

app.get('/welcome', (req, res) => {
  // Leemos la cookie 'userEmail' que creamos en el login
  const userEmail = req.cookies.userEmail;

  if (userEmail) {
    // Si la cookie existe, el usuario está "logueado"
    // Renderizamos la vista y le pasamos el email para mostrarlo
    res.render('welcome', { email: userEmail });
  } else {
    // Si no hay cookie, no tiene permiso, lo mandamos al login
    res.redirect('/login');
  }
});

// Configurar Handlebars con layout por defecto
app.engine('handlebars', engine({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')
app.set('views', './views')

// Leer datos de formularios
app.use(bodyParser.urlencoded({ extended: true }))

// "Base de datos" temporal
const usuarios = []

// Registro
app.get('/register', (req, res) => {
  res.render('register')
})

app.post('/register', (req, res) => {
  const { email, password } = req.body
  const existe = usuarios.find(u => u.username === email)
  if (existe) return res.send('Usuario ya existe. <a href="/register">Volver</a>')
  usuarios.push({ email, password })
  console.log(usuarios)
  res.redirect('/login')
})

// Login
app.get('/login', (req, res) => {
  res.render('login')
})

app.post('/login', (req, res) => {
  const { username, password } = req.body
  const usuario = usuarios.find(u => u.username === username && u.password === password)
  if (!usuario) return res.send('Credenciales inválidas. <a href="/login">Intentar de nuevo</a>')
  res.render('welcome', { username })
})

// Ruta raíz
app.get('/', (req, res) => {
  res.redirect('/login')
})

app.listen(port, () => {
  console.log(`App corriendo en http://localhost:${port}`)
})