const asyncHandler = require('express-async-handler')
const { StatusCodes } = require('http-status-codes')
const Branch = require("../models/branch-model")
const Product = require("../models/product-model")
const Invoice = require("../models/invoice-model")

const newInvoice = asyncHandler(async(req, res) => {
    const { invoice, paymentMethod, paymentStatus, totalPaid } = req.body
    if (!invoice || !paymentMethod || !paymentStatus || !totalPaid) {
        res.status(500).json({ err: `Please fill all fields` })
    }
    // first make sure only users with role can function as salesPerson
    if (!req.info.role) {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `Not authorized to sell, define your role first` })
    }
    // making sure the seller is registered to a branch
    if (!req.info.branch) {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `Not authorized to sell, define your store branch first` })
    }
    // now check if the product in "invoice" exist in the seller's branch
    const branch = await Branch.findOne({ location: req.info.branch })
    if (!branch) {
        res.status(StatusCodes.NOT_FOUND).json({ err: `Error... your branch is not a registered store branch!!!` })
    }
    // productList is a list of IDs of various product
    const productList = branch.productList
    const list = []
    invoice.forEach((data, ind) => {
        productList.forEach(async(info, index) => {
            let product = await Product.findOne({ _id: info }).populate()
            if (data.productName === product.productName) {
                list.push(product)
                    // list.push(productList.indexOf(info))
            }
        });
    });


    // now creating the InvoiceList
    const newInvoice = await Invoice.create({ invoiceItems: invoice, storeBranch: branch._id, paymentStatus: paymentStatus, paymentMethod: paymentMethod, totalCost: '', totalPaid: totalPaid, totalDue: '' - totalPaid, })
    if (!newInvoice) {
        res.status(500).json({ err: `Error... Unable to create a new invoice` })
    }
    const addInvoiceToBranch = await Branch.findOneAndUpdate({ _id: branch._id }, { $push: { invoiceList: newInvoice._id } }, { new: true, runValidators: true })
    if (!addInvoiceToBranch) {
        res.status(500).json({ err: `Error updating branch with invoice id` })
    }
    res.status(StatusCodes.OK).json({ msg: `Invoice created and updated to the branch successfully`, invoiceInfo: newInvoice, branchInfo: addInvoiceToBranch })

    // .........##################################...................

    // let products = [
    //     { "productName": "Emperor 25lit", "price": "32000", "quantity": "5", "total": "160000" },
    //     { "productName": "Emperor 5lit", "price": "6000", "quantity": "25", "total": "160000" },
    //     { "productName": "Sugar 50kg", "price": "40000", "quantity": "3", "total": "120000" },
    //     { "productName": "Semovita 1kg", "price": "7500", "quantity": "1200", "total": "0" },
    //     { "productName": "Semovita 2kg", "price": "7300", "quantity": "250", "total": "0" },
    //     { "productName": "Flour 50kg", "price": "30000", "quantity": "10", "total": "300000" },
    // ]

    // let invoiced = [
    //     { "productName": "Emperor 25lit", "price": "32000", "quantity": "5", "total": "160000" },
    //     { "productName": "Flour 50kg", "price": "30000", "quantity": "10", "total": "300000" },
    //     { "productName": "Sugar 50kg a", "price": "40000", "quantity": "3", "total": "120000" }
    // ]

    // // how do i check if the productName in invoiced matcehes the productName in products and when they match, get the value of their index
    // const absent = []
    // invoiced.forEach(async(data, ind) => {
    //     products.forEach(async(info, index) => {
    //         if (data.productName === info.productName) {
    //             console.log(products.indexOf(info), 'productInfo ', products[index], )
    //         }
    //     });
    // });
    // console.log('absent', absent)
    //     // .........##################################...................


})

// still have to make sure that the quantity doesn't exceeds the available quantity in each
const editInvoice = asyncHandler(async(req, res) => {
    const { id: invoice_Id } = req.params
    const { invoice, paymentMethod, paymentStatus, totalPaid } = req.body
    const getInvoice = await Invoice.findOne({ _id: invoice_Id })
    if (!getInvoice) {
        res.status(StatusCodes.NOT_FOUND).json({ err: `Error... invoice with ID ${invoice_Id} does not exist` })
    }
    if ((req.info.role !== 'BRANCH MANAGER' && req.info.branch !== getInvoice.storeBranch) || req.info.role !== "CE0") {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `Error... You're AUTHORIZED to perform such operation` })
    }
    const branch = await Branch.findOne({ location: req.info.branch })
    const editInvoice = await Invoice.findOneAndUpdate({ _id: invoice_Id }, { invoiceItems: invoice, storeBranch: branch._id, paymentStatus: paymentStatus, paymentMethod: paymentMethod, totalCost: '', totalPaid: totalPaid, totalDue: '' - totalPaid, }, { new: true, runValidators: true })
    if (!editInvoice) {
        res.status(500).json({ err: `Error... Unable to edit invoice with ID ${invoice_Id}` })
    }
    res.status(StatusCodes.OK).json({ err: `Invoice with ID ${invoice_Id} updated successfully.` })
})


const deleteInvoice = asyncHandler(async(req, res) => {
    const { id: invoice_Id } = req.params
    const invoice = await Invoice.findOne({ _id: invoice_Id })
    if (!invoice) {
        res.status(StatusCodes.NOT_FOUND).json({ err: `Error... invoice with ID ${invoice_Id} does not exist` })
    }
    if ((req.info.role !== 'BRANCH MANAGER' && req.info.branch !== invoice.storeBranch) || req.info.role !== "CE0") {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `Error... You're AUTHORIZED to perform such operation` })
    }
    const delInvoice = await Invoice.findOneAndDelete({ _id: invoice_Id })
    if (!delInvoice) {
        res.status(500).json({ err: `Error deleting invoice!!!` })
    }
    // new removing it from branch
    const branch = await Branch.findOne({ location: req.info.branch })
    let invoiceList = branch.invoiceList
    invoiceList.splice(invoiceList.indexOf(invoice_Id), 1)
    const updateBranch = await Branch.findOneAndUpdate({ _id: branch._id }, { invoiceList }, { new: true, runValidators: true })
    if (!updateBranch) {
        res.status(500).json({ err: `Error updating invoiceList in ${req.info.branch} branch` })
    }
    res.status(StatusCodes.OK).json({ err: `Invoice DELETED and updated successfully in ${req.info.branch} branch` })
})

module.exports = { newInvoice, editInvoice, deleteInvoice }