const asyncHandler = require('express-async-handler')
const { StatusCodes } = require('http-status-codes')
const Branch = require("../models/branch-model")
const Product = require("../models/product-model")
const Invoice = require("../models/invoice-model")
const User = require("../models/user-model")
const InvoiceItem = require("../models/invoice-item-model")


const newOfflineSale = asyncHandler(async(req, res) => {
    const { branch_id, productName, quantity } = req.body

    if (!branch_id || !productName || !quantity) {
        return res.status(500).json({ err: `Error... Please provide all necessary info to make a sale!!!` })
    }
    const seller = await User.findOne({ _id: req.info.id.id })
    const branchExist = await Branch.findOne({ _id: branch_id })
    if (!branchExist) {
        return res.status(404).json({ err: `Error... Branch with ID of ${branch_id} is not a registered branch!!!` })
    }

    if (req.info.id.role !== 'CEO' && !(req.info.id.role === 'BRANCH MANAGER' || seller.branch === branch_id)) {
        return res.status(401).json({ err: `Error... ${req.info.id.name}, you're not authorized to make sales in ${branchExist.location} branch` })
    }

    const productExist = await Product.findOne({ productBranch: branch_id, productName: productName })
    if (!productExist) {
        return res.send("product not available in branch")
    }
    if (Number(quantity) > Number(productExist.quantity.replace(/,/g, ''))) {
        return res.status(500).json({ err: `Error... Insufficient product, restock ${productName} in ${branchExist.location}` })
    }
    const saleList = {}
    const newProductInfo = {}
    saleList.productName = productName
    saleList.quantity = Number(quantity).toLocaleString()
    saleList.unitPrice = productExist.price
    const subTotal = Number(quantity) * Number(productExist.price.replace(/,/g, ''))
    saleList.subTotal = subTotal.toLocaleString()
    saleList.addedBy = req.info.id.id
        // const newInviceItem = await InvoiceItem.create(saleList)

    newProductInfo.productName = productName
    const quantity_left = Number(productExist.quantity.replace(/,/g, '')) - Number(quantity)
    newProductInfo.quantity = quantity_left.toLocaleString()
    newProductInfo.unitPrice = productExist.price
    const totalCost = Number(productExist.price.replace(/,/g, '')) * Number(quantity_left)
    newProductInfo.totalCost = totalCost.toLocaleString()
        // const updatedProduct = await Product.findOneAndUpdate({_id: productExist._id}, {$set: newProductInfo}, {new: true, runValidators: true})

    res.status(200).json({
        msg: `${quantity} ${productExist.unit} of ${productName} sold successfully...`,
        newBranchProduct: updatedProduct
    })

})

const newSale = asyncHandler(async(req, res) => {
    const { branch_id, sale, customer, paymentStatus, paymentMethod, totalPaid } = req.body

    if (!branch_id || !sale.length) {
        return res.status(500).json({ err: `Error... Provide all necessary informations to make sale!!!` })
    }

    const seller = await User.findOne({ _id: req.info.id.id })
    const branchExist = await Branch.findOne({ _id: branch_id })
    if (!branchExist) {
        return res.status(404).json({ err: `Error... Branch with ID of ${branch_id} is not a registered branch!!!` })
    }
    if (req.info.id.role !== 'CEO' && !(req.info.id.role === 'BRANCH MANAGER' || seller.branch === branch_id)) {
        return res.status(401).json({ err: `Error... ${req.info.id.name}, you're not authorized to make sales in ${branchExist.location} branch` })
    }

    const update = {}
    let saleListBox = []
    let productLeftBox = []
    for (let i = sale.length; i--; i > 0) {
        const productExist = await Product.findOne({ productBranch: branch_id, productName: sale[i].productName })
        if (!productExist) {
            return res.send(`${sale[i].productName} not found in the branch!!!`)
        }

        if (Number(sale[i].quantity) > Number(productExist.quantity.replace(/,/g, ''))) {
            return res.status(500).json({ err: `Error... Insufficient product, restock ${sale[i].productName} in ${branchExist.location}` })
        }

        const saleList = {}
        saleList.productName = sale[i].productName
        saleList.quantity = Number(sale[i].quantity).toLocaleString()
        saleList.unitPrice = productExist.price
        const subTotal = Number(sale[i].quantity) * Number(productExist.price.replace(/,/g, ''))
        saleList.subTotal = subTotal.toLocaleString()
        saleList.addedBy = req.info.id.id

        const newProductInfo = {}
        newProductInfo.productName = sale[i].productName
        const quantity_left = Number(productExist.quantity.replace(/,/g, '')) - Number(sale[i].quantity)
        newProductInfo.quantity = quantity_left.toLocaleString()
        newProductInfo.unitPrice = productExist.price
        const totalCost = Number(productExist.price.replace(/,/g, '')) * Number(quantity_left)
        newProductInfo.totalCost = totalCost.toLocaleString()

        saleListBox.push(saleList)
        productLeftBox.push(newProductInfo)
        await Product.findOneAndUpdate({ _id: productExist._id }, { $set: newProductInfo }, { new: true, runValidators: true })
    }


    if (branch_id.trim() !== '') {
        update.branch = branch_id.trim()
    }
    if (customer.trim() !== '') {
        update.customer = customer.trim()
    } else { update.customer = 'Walk-In Customer' }

    if (paymentStatus.trim() !== '') {
        update.paymentStatus = paymentStatus.trim()
    }
    if (paymentMethod.trim() !== '') {
        update.paymentMethod = paymentMethod.trim()
    }

    const totalSubTotal = saleListBox.reduce((accumulator, item) => {
        // Remove commas and convert to a number
        const subTotal = Number(item.subTotal.replace(/,/g, ''));

        // Add the current subTotal to the accumulator
        return accumulator + subTotal;
    }, 0);

    update.totalAmount = totalSubTotal.toLocaleString()

    const totalItems = saleListBox.reduce((accumulator, item) => {
        // Remove commas and convert to a number
        const subTotal = Number(item.quantity.replace(/,/g, ''));

        // Add the current subTotal to the accumulator
        return accumulator + subTotal;
    }, 0);

    if (totalPaid.trim() !== '') {
        update.totalPaid = Number(totalPaid.trim()).toLocaleString()
        const sellDue = Number(totalSubTotal) - Number(totalPaid)
        update.sellDue = sellDue.toLocaleString()
    }
    update.totalItems = totalItems.toLocaleString()
    update.addedBy = req.info.id.id
    update.invoiceItems = saleListBox.reverse()

    const newInvoice = await Invoice.create(update)

    return res.send({ msg: `Sales created successfully`, invoice: newInvoice })
})
const editSale = asyncHandler(async(req, res) => {

})

const deleteInvoice = asyncHandler(async(req, res) => {

})

module.exports = { newOfflineSale, newSale, editSale, deleteInvoice }