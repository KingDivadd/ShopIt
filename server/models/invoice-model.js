const mongoose = require('mongoose')

const invoiceSchema = new mongoose.Schema({
    invoiceItems: [{ type: String, required: true }],
    storeBranch: { type: mongoose.Types.ObjectId, ref: "Branch", required: true },
    paymentStatus: { type: String, enum: ['PAID', 'PARTIAL', 'DUE'], required: true },
    paymentMethod: { type: String, enum: ['CASH', 'TRANSFER', 'POS', 'MULTIPLE'], required: true },
    totalCost: { type: Number, trim: true, required: true },
    totalPaid: { type: Number, trim: true, required: true },
    totalDue: { type: Number, trim: true, default: 0, required: true }
}, { timestamps: true })

module.exports = mongoose.model("Invoice", invoiceSchema)