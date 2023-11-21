const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    productName: { type: String, trim: true, required: true, },
    price: { type: Number, trim: true },
    totalCost: { type: Number, trim: true },
    quantity: { type: Number, trim: true, default: 0 },
    productPic: { type: String, trim: true, default: 'http://produc-image' },
    productAdder: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    productBranch: { type: String, trim: true, required: true },
    unit: { type: String, enum: ["ctn(s)", "bag(s)", "keg(s)", "pack(s)", "pcs", "bottle(s)"] }
}, { timestamps: true })

module.exports = mongoose.model("Product", productSchema)