const { verifyToken } = require('../utils/jwt');

/**
 * Middleware para verificar autenticación JWT compatible con Cookies y Headers
 */
exports.authenticate = async (req, res, next) => {
    try {
        // 1. Intentar obtener el token de la cookie o del header
        const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        // 2. Si no hay token, verificar si la petición espera HTML o JSON
        if (!token) {
            if (req.accepts('html')) {
                return res.redirect('/login'); // Redirigir al login si es navegación web
            }
            return res.status(401).json({
                message: 'No se proporcionó token de autenticación'
            });
        }

        // 3. Verificar y decodificar token
        const decoded = verifyToken(token);

        // 4. Agregar información al request y a res.locals para Handlebars
        req.user = decoded; // { userId, email }
        res.locals.user = decoded; // Permite usar {{user.email}} en las vistas

        next();
    } catch (error) {
        // Limpiar cookie si el token es inválido/expirado
        res.clearCookie('token');

        if (req.accepts('html')) {
            return res.redirect('/login');
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        
        return res.status(401).json({ message: 'Token inválido o error de autenticación' });
    }
};