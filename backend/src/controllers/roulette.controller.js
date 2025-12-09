const Usuario = require('../models/Usuario');
const { NUMEROS_ROJOS, NUMEROS_NEGROS } = require('../utils/constants');

/**
 * POST /api/roulette/bet
 * Realizar una apuesta en la ruleta
 */
exports.placeBet = async (req, res, next) => {
    try {
        const { tipo, valor, monto } = req.body;
        const userId = req.user.userId;

        // Validar datos
        if (!tipo || !valor || !monto) {
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        if (isNaN(monto) || monto <= 0) {
            return res.status(400).json({ message: 'Monto inválido' });
        }

        const user = await Usuario.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar saldo suficiente
        if (user.saldo < Number(monto)) {
            return res.status(400).json({ message: 'Saldo insuficiente' });
        }

        // Restar el monto del saldo ANTES de calcular el resultado
        user.saldo -= Number(monto);

        // Simular número ganador (0-36)
        const numeroGanador = Math.floor(Math.random() * 37);

        let resultado = 'perdida';
        let ganancia = 0;

        // Comprobar el resultado según el tipo de apuesta
        if (tipo === 'numero') {
            // Apuesta a número específico (paga 36:1)
            if (parseInt(valor, 10) === numeroGanador) {
                resultado = 'ganada';
                ganancia = Number(monto) * 36;
            }
        } else if (tipo === 'color_o_seccion') {
            switch (valor) {
                case 'rojo':
                    if (NUMEROS_ROJOS.includes(numeroGanador)) {
                        resultado = 'ganada';
                        ganancia = Number(monto) * 2; // Paga 1:1
                    }
                    break;
                case 'negro':
                    if (NUMEROS_NEGROS.includes(numeroGanador)) {
                        resultado = 'ganada';
                        ganancia = Number(monto) * 2; // Paga 1:1
                    }
                    break;
                case 'par':
                    if (numeroGanador !== 0 && numeroGanador % 2 === 0) {
                        resultado = 'ganada';
                        ganancia = Number(monto) * 2; // Paga 1:1
                    }
                    break;
                case 'impar':
                    if (numeroGanador !== 0 && numeroGanador % 2 !== 0) {
                        resultado = 'ganada';
                        ganancia = Number(monto) * 2; // Paga 1:1
                    }
                    break;
            }
        }

        // Sumar la ganancia al saldo
        user.saldo += ganancia;

        // Guardar apuesta en historial
        user.apuestas.push({
            tipo,
            valor,
            monto: Number(monto),
            resultado,
            fecha: new Date()
        });

        // Guardar número ganador en historial
        user.ultimosGanadores.push(numeroGanador);
        if (user.ultimosGanadores.length > 5) {
            user.ultimosGanadores = user.ultimosGanadores.slice(-5);
        }

        await user.save();

        res.json({
            resultado,
            numeroGanador,
            monto: Number(monto),
            ganancia,
            nuevoSaldo: user.saldo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/roulette/history
 * Obtener historial de apuestas
 */
exports.getBetHistory = async (req, res, next) => {
    try {
        const user = await Usuario.findById(req.user.userId).select('apuestas');

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const historialApuestas = (user.apuestas?.slice(-10).reverse() || []).map(apuesta => {
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
                resultadoColor: apuesta.resultado === 'ganada' ? '#4caf50' : '#f44336',
                fecha: apuesta.fecha
            };
        });

        res.json({ bets: historialApuestas });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/roulette/winners
 * Obtener últimos números ganadores
 */
exports.getWinningNumbers = async (req, res, next) => {
    try {
        const user = await Usuario.findById(req.user.userId).select('ultimosGanadores');

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const ultimosGanadoresConColor = (user.ultimosGanadores?.slice(-5).reverse() || []).map(num => {
            let color = 'negro';
            if (num === 0) color = 'verde';
            if (NUMEROS_ROJOS.includes(num)) color = 'rojo';
            return { num, color };
        });

        // Rellenar con slots vacíos si hay menos de 5
        const slotsVacios = 5 - ultimosGanadoresConColor.length;
        for (let i = 0; i < slotsVacios; i++) {
            ultimosGanadoresConColor.push({ empty: true });
        }

        res.json({ winners: ultimosGanadoresConColor });
    } catch (error) {
        next(error);
    }
};
