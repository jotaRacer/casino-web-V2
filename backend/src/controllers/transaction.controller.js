const Usuario = require('../models/Usuario');

/**
 * POST /api/transactions/deposit
 * Depositar dinero en la cuenta
 */
exports.deposit = async (req, res, next) => {
    try {
        const { amount } = req.body;
        const userId = req.user.userId;

        // Validar monto
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Monto inválido' });
        }

        const user = await Usuario.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Actualizar saldo
        user.saldo += Number(amount);

        // Registrar transacción
        user.transacciones.push({
            tipo: 'depósito',
            monto: Number(amount),
            fecha: new Date()
        });

        await user.save();

        res.json({
            message: 'Depósito realizado exitosamente',
            newBalance: user.saldo,
            transaction: {
                tipo: 'depósito',
                monto: Number(amount),
                fecha: new Date()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/transactions/withdraw
 * Retirar dinero de la cuenta
 */
exports.withdraw = async (req, res, next) => {
    try {
        const { amount } = req.body;
        const userId = req.user.userId;

        // Validar monto
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Monto inválido' });
        }

        const user = await Usuario.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar saldo suficiente
        if (user.saldo < Number(amount)) {
            return res.status(400).json({ message: 'Saldo insuficiente' });
        }

        // Actualizar saldo
        user.saldo -= Number(amount);

        // Registrar transacción
        user.transacciones.push({
            tipo: 'retiro',
            monto: Number(amount),
            fecha: new Date()
        });

        await user.save();

        res.json({
            message: 'Retiro realizado exitosamente',
            newBalance: user.saldo,
            transaction: {
                tipo: 'retiro',
                monto: Number(amount),
                fecha: new Date()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/transactions/history
 * Obtener historial de transacciones
 */
exports.getHistory = async (req, res, next) => {
    try {
        const user = await Usuario.findById(req.user.userId).select('transacciones');

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const transactions = (user.transacciones || []).slice(-10).reverse().map(t => ({
            fecha: new Date(t.fecha).toLocaleDateString('es-CL'),
            tipo: t.tipo,
            monto: t.monto
        }));

        res.json({ transactions });
    } catch (error) {
        next(error);
    }
};
