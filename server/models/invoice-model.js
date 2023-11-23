const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: String, trim: true, required: true },
    subTotal: { type: String, trim: true, required: true },
    addedBy: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
});

const invoiceSchema = new mongoose.Schema({
    invoiceItems: [{ type: mongoose.Types.ObjectId, ref: 'InvoiceItem', required: true }],
    customer: { type: mongoose.Schema.Types.Mixed, ref: 'User' },
    branch: { type: mongoose.Types.ObjectId, ref: 'Branch', required: true, },
    paymentStatus: { type: String, enum: ['PAID', 'PARTIAL', 'DUE'], required: true },
    paymentMethod: { type: String, enum: ['CASH', 'TRANSFER', 'POS', 'MULTIPLE'], required: true },
    totalAmount: { type: String, trim: true, required: true },
    totalPaid: { type: String, trim: true, required: true },
    sellDue: { type: String, trim: true, default: 0, required: true },
    totalItems: { type: String, trim: true, required: true },
    addedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);