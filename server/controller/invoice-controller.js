const asyncHandler = require('express-async-handler')
const { StatusCodes } = require('http-status-codes')
const Branch = require("../models/branch-model")
const Product = require("../models/product-model")
const Invoice = require("../models/invoice-model")


const newOfflineSale = asyncHandler(async(req, res) => {
    const { branch_id, productName, productPrice, productUnit, productQuantity } = req.body
    if (!productName || !productPrice || !productUnit || !productQuantity) {
        return res.status(500).json({ err: `Error... Please provide all necessary info!!!` })
    }
    const branchExist = await Branch.findOne({ _id: branch_id })
    if (!branchExist) {
        return res.status(StatusCodes.NOT_FOUND).json({ err: `Error.... Branch with ID ${branch_id} is not a registered branch!!!` })
    }
    // lets ensure only the ceo, the sales person and the branch manager can make sales
    if (req.info.id.role !== 'CEO' && (req.info.id.role !== 'BRANCH MANAGER' && req.info.id.id !== branchExist.branchManager.toString()) && (req.info.id.role !== 'SALES PERSON' && req.info.id.id !== branchExist.salesPerson.toString())) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: `Error... Not authorized to make sale in ${branchExist.location} barnch!!!` })
    }
    // now we check if the product exist and in that branch

})

const editSale = asyncHandler(async(req, res) => {

})

const deleteInvoice = asyncHandler(async(req, res) => {

})

module.exports = { newOfflineSale, editSale, deleteInvoice }