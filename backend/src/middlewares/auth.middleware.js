const { verifyToken } = require('../utils/jwt');

/**
 * Middleware para verificar autenticación JWT (solo Authorization header)
 */
exports.authenticate = async (req, res, next) => {
    try {
        // Obtener el token del header Authorization: Bearer <token>
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'No se proporcionó token de autenticación'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verificar y decodificar token
        const decoded = verifyToken(token);

        // Agregar información al request
        req.user = decoded; // { userId, email }

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }

        return res.status(401).json({ message: 'Token inválido' });
    }
};