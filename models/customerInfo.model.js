const Monggose = require('mongoose');

const customerInfoSchema = new Monggose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    panCard: {
        type: String,
    },
    lastActivity: [
        {
            time: {
                type: Date,
                default: Date.now
            },
            purpose: {
                type: String,
                enum: ['report', 'reference', 'goal', 'connect'],
            },
            reference: {
                ref: "ReportModel",
                type: Monggose.Schema.Types.ObjectId,
                required: true
            },
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const CustomerInfo = Monggose.model('CustomerInfo', customerInfoSchema);
module.exports = CustomerInfo;