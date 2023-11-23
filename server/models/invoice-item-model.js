const mongoose = require('mongoose')

const invoiceItemSchema = new mongoose.Schema({
    productName: { type: String, trim: true, required: true },
    quantity: { type: String, trim: true, required: true },
    unitPrice: { type: String, trim: true, required: true },
    subTotal: { type: String, trim: true, required: true },
    addedBy: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    branch: { type: mongoose.Types.ObjectId, ref: "Branch" }
})

module.exports = mongoose.model("InvoiceItem", invoiceItemSchema)