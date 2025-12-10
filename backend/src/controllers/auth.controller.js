const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');

/**
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, dob } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        const existingUser = await Usuario.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new Usuario({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            dob
        });

        await newUser.save();

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: { id: newUser._id, email: newUser.email }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son requeridos' });
        }

        const user = await Usuario.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        // 1. Generar token JWT
        const token = generateToken({
            userId: user._id,
            email: user.email
        });

        // 2. CONFIGURAR LA COOKIE (Punto clave para que funcione el requireAuth)
        res.cookie('token', token, {
    httpOnly: true, // Seguridad contra XSS
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 3600000 // 1 hora
});

        // 3. Respuesta JSON (para el frontend desacoplado)
        res.json({
            message: 'Login exitoso',
            token, // Lo enviamos por si el frontend lo guarda en localStorage
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                saldo: user.saldo
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
    // Limpiamos la cookie del servidor
    res.clearCookie('token');
    res.json({
        message: 'Logout exitoso. Cookie eliminada.'
    });
};

/**
 * GET /api/auth/me
 */
exports.getCurrentUser = async (req, res, next) => {
    try {
        const user = await Usuario.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json({ user });
    } catch (error) {
        next(error);
    }
};