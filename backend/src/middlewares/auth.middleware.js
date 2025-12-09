const { verifyToken } = require('../utils/jwt');

/**
 * Middleware para verificar autenticación JWT
 */
exports.authenticate = async (req, res, next) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'No se proporcionó token de autenticación'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verificar y decodificar token
        const decoded = verifyToken(token);

        // Agregar información del usuario al request
        req.user = decoded; // { userId, email }

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        res.status(401).json({ message: 'Error de autenticación' });
    }
};
