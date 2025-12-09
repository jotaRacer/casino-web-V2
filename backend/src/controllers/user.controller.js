const Usuario = require('../models/Usuario');

/**
 * GET /api/users/profile
 * Obtener perfil del usuario autenticado
 */
exports.getProfile = async (req, res, next) => {
    try {
        const user = await Usuario.findById(req.user.userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Formatear historial de apuestas
        const historialApuestas = (user.apuestas?.slice(-5).reverse() || []).map(apuesta => {
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
                resultadoColor: apuesta.resultado === 'ganada' ? '#4caf50' : '#f44336'
            };
        });

        res.json({
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                dob: user.dob,
                saldo: user.saldo,
                historialApuestas,
                transacciones: (user.transacciones || []).slice(-5).reverse().map(t => ({
                    fecha: new Date(t.fecha).toLocaleDateString('es-CL'),
                    tipo: t.tipo,
                    monto: t.monto
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/users/profile
 * Actualizar perfil del usuario
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const { firstName, lastName, dob } = req.body;

        const user = await Usuario.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Actualizar campos
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (dob) user.dob = dob;

        await user.save();

        res.json({
            message: 'Perfil actualizado exitosamente',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                dob: user.dob
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/users/balance
 * Obtener saldo actual del usuario
 */
exports.getBalance = async (req, res, next) => {
    try {
        const user = await Usuario.findById(req.user.userId).select('saldo');

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ balance: user.saldo });
    } catch (error) {
        next(error);
    }
};
