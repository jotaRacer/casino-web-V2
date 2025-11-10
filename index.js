const express = require('express');
const { engine } = require('express-handlebars');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// --- 1. CONFIGURACIÓN INICIAL ---
const app = express();
const port = 3000;

const path = require('path');
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
    eq: (a, b) => a === b  // <- agregado para arreglar el error “Missing helper: eq”
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
  transacciones: [{
    fecha: { type: Date, default: Date.now },
    tipo: String,
    monto: Number
  }],
  apuestas: [{
    tipo: String,
    valor: String,
    monto: Number,
    resultado: String,
    fecha: { type: Date, default: Date.now }
  }],
  ultimosGanadores: [Number]
});
const Usuario = mongoose.model('Usuario', UsuarioSchema);

// --- 4. MIDDLEWARE PARA VERIFICAR EL USUARIO EN CADA PETICIÓN ---
app.use(async (req, res, next) => {
  const userEmail = req.cookies.userEmail;
  if (userEmail) {
    const usuario = await Usuario.findOne({ email: userEmail })
      .select('-password')
      .lean();
    if (usuario) {
      res.locals.user = usuario;
    }
  }
  next();
});

// --- 5. RUTAS DE AUTENTICACIÓN ---
app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
  const { email, password, dob } = req.body;
  const nuevoUsuario = new Usuario({ email, password, dob });
  await nuevoUsuario.save();
  res.redirect('/login');
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const usuario = await Usuario.findOne({ email, password });
    if (!usuario) return res.send('Credenciales inválidas. <a href="/login">Intentar de nuevo</a>');
    res.cookie('userEmail', usuario.email, { maxAge: 900000, httpOnly: true });
    res.redirect('/perfil');
  } catch (err) {
    console.error('Error al buscar usuario:', err);
    res.send('Error interno del servidor');
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('userEmail');
  res.redirect('/login');
});

// --- 6. RUTAS DE PÁGINAS ---
app.get('/', (req, res) => res.render('home'));
app.get('/nosotros', (req, res) => res.render('about', { title: 'Sobre Nosotros' }));
app.get('/reglas', (req, res) => res.render('rules', { title: 'Reglas' }));

app.get('/perfil', async (req, res) => {
  const userEmail = req.cookies.userEmail;

  if (!userEmail) return res.redirect('/login');
  try {
    const usuario = await Usuario.findOne({ email: userEmail });
    if (!usuario) {
      res.clearCookie('userEmail');
      return res.redirect('/login');
    }
    const historialFormateado = (usuario.apuestas?.slice(-5).reverse() || []).map(apuesta => {
      let tipoMostrado = 'Apuesta';
      if (apuesta.tipo === 'numero') {
        tipoMostrado = 'Número';
      } else if (apuesta.tipo === 'color_o_seccion') {
        if (apuesta.valor === 'rojo' || apuesta.valor === 'negro') {
          tipoMostrado = 'Color';
        } else if (apuesta.valor === 'par' || apuesta.valor === 'impar') {
          tipoMostrado = 'Sección';
        }
      }
    
      return {
        tipo: tipoMostrado,
        valor: apuesta.valor,
        monto: apuesta.monto,
        resultado: apuesta.resultado.charAt(0).toUpperCase() + apuesta.resultado.slice(1),
        resultadoColor: apuesta.resultado === 'ganada' ? '#4caf50' : '#f44336'
      };
    });

    res.render('perfil', {
      email: usuario.email,
      historialApuestas: historialFormateado,
      fechaNacimiento: usuario.dob,
      ciudad: "Santiago, Chile",
      saldo: usuario.saldo ?? 0,
      transacciones: (usuario.transacciones || []).slice(-5).reverse().map(t => ({
        fecha: new Date(t.fecha).toLocaleDateString('es-CL'),
        tipo: t.tipo,
        monto: t.monto
      }))
    });
  } catch (err) {
    console.error("Error al buscar perfil de usuario:", err);
    res.send("Error al cargar el perfil.");
  }
});

// --- DEPÓSITO ---
app.get('/deposito', (req, res) => {
  const userEmail = req.cookies.userEmail;
  if (!userEmail) return res.redirect('/login');

  const saldo = res.locals.user?.saldo ?? 0;
  res.render('deposito', { title: 'Depositar', saldo });
});

app.post('/depositar', async (req, res) => {
  const userEmail = req.cookies.userEmail;
  const amount = Number(req.body.amount);
  if (!userEmail) return res.status(401).json({ error: "No autenticado" });
  if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: "Monto inválido" });

  try {
    const usuario = await Usuario.findOne({ email: userEmail });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    usuario.saldo += amount;
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
    if (usuario.saldo < amount) return res.status(400).json({ error: "Saldo insuficiente" });
    usuario.saldo -= amount;
    usuario.transacciones.push({ tipo: 'retiro', monto: amount, fecha: new Date() });
    await usuario.save();
    res.json({ nuevoSaldo: usuario.saldo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al retirar" });
  }
});

// --- RULETA ---
app.get('/ruleta', async (req, res) => {
  const userEmail = req.cookies.userEmail;
  if (!userEmail) {
    return res.redirect('/login');
  }

  try {
    const usuario = await Usuario.findOne({ email: userEmail }).lean();
    if (!usuario) {
      res.clearCookie('userEmail');
      return res.redirect('/login');
    }

    // --- LÓGICA DE PREPARACIÓN DE HISTORIAL ---
    const numerosRojos = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

    // Procesa los números ganadores
    const ultimosGanadoresConColor = (usuario.ultimosGanadores?.slice(-5).reverse() || []).map(num => {
      let color = 'negro';
      if (num === 0) color = 'verde';
      if (numerosRojos.includes(num)) color = 'rojo';
      return { num, color };
    });

    
    const slotsVacios = 5 - ultimosGanadoresConColor.length;
    for (let i = 0; i < slotsVacios; i++) {
      ultimosGanadoresConColor.push({ empty: true });
    }
 

    // Procesa el historial de apuestas
    const historialFormateado = (usuario.apuestas?.slice(-5).reverse() || []).map(apuesta => {
      let tipoMostrado = 'Apuesta';
      if (apuesta.tipo === 'numero') {
        tipoMostrado = 'Número';
      } else if (apuesta.tipo === 'color_o_seccion') {
        if (apuesta.valor === 'rojo' || apuesta.valor === 'negro') {
          tipoMostrado = 'Color';
        } else if (apuesta.valor === 'par' || apuesta.valor === 'impar') {
          tipoMostrado = 'Sección';
        }
      }

      return {
        tipo: tipoMostrado,
        valor: apuesta.valor,
        monto: apuesta.monto,
        resultado: apuesta.resultado.charAt(0).toUpperCase() + apuesta.resultado.slice(1),
        resultadoColor: apuesta.resultado === 'ganada' ? '#4caf50' : '#f44336'
      };
    });

    res.render('roulette', { 
      title: 'Ruleta', 
      saldo: usuario.saldo ?? 0,
      ultimosGanadores: ultimosGanadoresConColor,
      historialApuestas: historialFormateado
    });

  } catch (err) {
    console.error('Error al cargar la ruleta:', err);
    res.send('Error al cargar la ruleta');
  }
});

// --- APOSTAR ---
app.post('/apostar', async (req, res) => {
  const userEmail = req.cookies.userEmail;
  const { tipo, valor, monto } = req.body;

  if (!userEmail) return res.status(401).json({ error: "No autenticado" });
  if (isNaN(monto) || monto <= 0) return res.status(400).json({ error: "Monto inválido" });

  try {
    const usuario = await Usuario.findOne({ email: userEmail });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    if (usuario.saldo < monto) return res.status(400).json({ error: "Saldo insuficiente" });

    // Resta el monto del saldo ANTES de calcular el resultado
    usuario.saldo -= monto;


   //Simular número ganador (0-36)
    const numeroGanador = Math.floor(Math.random() * 37);
    
    //Definir arrays de colores
    const numerosRojos = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const numerosNegros = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

    let resultado = "perdida"; 
    let ganancia = 0; 

    // Comprobar el resultado según el tipo de apuesta
    if (tipo === 'numero') {
      if (parseInt(valor, 10) === numeroGanador) {
        resultado = "ganada";
        ganancia = monto * 36; 
      }
    } 
    else if (tipo === 'color_o_seccion') {
      switch (valor) {
        case 'rojo':
          if (numerosRojos.includes(numeroGanador)) {
            resultado = "ganada";
            ganancia = monto * 2; // Paga 1 a 1
          }
          break;
        case 'negro':
          if (numerosNegros.includes(numeroGanador)) {
            resultado = "ganada";
            ganancia = monto * 2; // Paga 1 a 1
          }
          break;
        case 'par':
          if (numeroGanador !== 0 && numeroGanador % 2 === 0) {
            resultado = "ganada";
            ganancia = monto * 2; // Paga 1 a 1
          }
          break;
        case 'impar':
          if (numeroGanador !== 0 && numeroGanador % 2 !== 0) {
            resultado = "ganada";
            ganancia = monto * 2; // Paga 1 a 1
          }
          break;
      }
    }

    // Sumar la ganancia al saldo
    usuario.saldo += ganancia;

    // Guardar apuesta en historial
    usuario.apuestas.push({
      tipo,
      valor,
      monto,
      resultado,
      fecha: new Date()
    });

    // Guardar número ganador
    usuario.ultimosGanadores.push(numeroGanador);
    if (usuario.ultimosGanadores.length > 5)
      usuario.ultimosGanadores = usuario.ultimosGanadores.slice(-5);

    await usuario.save();

    res.json({
      resultado,
      numeroGanador,
      monto,
      nuevoSaldo: usuario.saldo
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al procesar apuesta" });
  }
});

// --- 7. INICIAR SERVIDOR ---
app.listen(port, () => {
  console.log(`App corriendo en http://localhost:${port}`);
});
