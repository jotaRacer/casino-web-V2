const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    saldo: {
        type: Number,
        default: 0
    },
    dob: {
        type: String
    },
    transacciones: [{
        fecha: {
            type: Date,
            default: Date.now
        },
        tipo: {
            type: String,
            enum: ['depósito', 'retiro']
        },
        monto: Number
    }],
    apuestas: [{
        tipo: {
            type: String,
            enum: ['numero', 'color_o_seccion']
        },
        valor: String,
        monto: Number,
        resultado: {
            type: String,
            enum: ['ganada', 'perdida']
        },
        fecha: {
            type: Date,
            default: Date.now
        }
    }],
    ultimosGanadores: [Number]
}, {
    timestamps: true
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
