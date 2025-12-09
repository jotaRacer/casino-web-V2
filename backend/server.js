require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 8080;

// Función principal
async function startServer() {
    try {
        // Conectar a la base de datos
        await connectDB();

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('='.repeat(60));
            console.log('🚀 Servidor iniciado correctamente');
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✅ Base de datos: Conectada a MongoDB`);
            console.log('='.repeat(60));
            console.log('\n💡 Prueba el servidor en: http://localhost:' + PORT);
            console.log('💡 Health check: http://localhost:' + PORT + '/api/health\n');
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

startServer();