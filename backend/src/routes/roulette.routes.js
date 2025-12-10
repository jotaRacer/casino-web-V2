const express = require('express');
const router = express.Router();

// IMPORTANTE: Los nombres dentro de las llaves deben coincidir exactamente con el controlador
const { 
    getRoulettePage, 
    placeBet, 
    getBetHistory, 
    getWinningNumbers 
} = require('../controllers/roulette.controller');

const { authenticate } = require('../middlewares/auth.middleware');

/**
 * RUTAS DE LA RULETA
 */

// 1. Mostrar la página (Vista)
router.get('/ruleta', authenticate, getRoulettePage);

// 2. Realizar apuesta (API)
router.post('/bet', authenticate, placeBet);

// 3. Obtener historial (API)
router.get('/history', authenticate, getBetHistory);

// 4. Últimos ganadores (API)
router.get('/winners', authenticate, getWinningNumbers);

module.exports = router;