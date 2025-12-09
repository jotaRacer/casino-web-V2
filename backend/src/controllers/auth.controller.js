const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');

/**
 * POST /api/auth/register
 * Registrar un nuevo usuario
 */
exports.register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, dob } = req.body;

        // Validar campos requeridos
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                message: 'Todos los campos son requeridos'
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await Usuario.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'El email ya está registrado'
            });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
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
            user: {
                id: newUser._id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validar campos
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario
        const user = await Usuario.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: 'Credenciales incorrectas'
            });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: 'Credenciales incorrectas'
            });
        }

        // Generar token JWT
        const token = generateToken({
            userId: user._id,
            email: user.email
        });

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                saldo: user.saldo
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/logout
 * Cerrar sesión (con JWT se maneja en el frontend)
 */
exports.logout = async (req, res) => {
    res.json({
        message: 'Logout exitoso. Elimina el token del cliente.'
    });
};

/**
 * GET /api/auth/me
 * Obtener usuario actual autenticado
 */
exports.getCurrentUser = async (req, res, next) => {
    try {
        const user = await Usuario.findById(req.user.userId).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        res.json({ user });
    } catch (error) {
        next(error);
    }
};
