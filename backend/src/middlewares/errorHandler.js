/**
 * Middleware global para manejo de errores
 */
module.exports = (err, req, res, next) => {
    console.error('❌ Error:', err);

    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';

    res.status(status).json({
        error: true,
        message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack
        })
    });
};
