const asyncHandler = require('express-async-handler')
const { StatusCodes } = require('http-status-codes')
const User = require("../models/user-model")
const Product = require("../models/product-model")
const Branch = require("../models/branch-model")

// the product should be a list
const newProduct = asyncHandler(async(req, res) => {
    const { productName, price, productPic, unit, productBranch, quantity } = req.body
    if (!productName || !price || !productPic || !unit || !productBranch) {
        res.status(500).json({ err: `Please provide all producte related informations` })
    }
    if (req.info.role === "CEO") {
        req.body.productAdder = req.info.id
        req.body.totalCost = quantity * price
            // check if productBranch exist
        const branchExist = await Branch.findOne({ location: productBranch })
        if (!branchExist) {
            res.status(500).json({ err: `Error... Product cannot be added to an unregisted store branch` })
        }
        const product = await Product.create(req.body)
        if (!product) {
            res.status(500).json({ err: `Product creation failed!!!` })
        }
        res.status(StatusCodes.OK).json({ msg: `${productName} added successfully`, productInfo: product })
    } else {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `${req.info.name}, you're not authorized to perform this operation` })
    }
})

const updateProductInfo = asyncHandler(async(req, res) => {
    const { id: product_Id } = req.params
    const { productName, price, productPic, unit, quantity } = req.body
    req.body.productAdder = req.info.id
    if (req.info.role === "CEO" || req.info.role === "BRANCH MANAGER") {
        const update = {}
        if (productName.trim() !== '') {
            update.productName = productName.trim()
        }

        if (price.trim() !== '') {
            update.price = price.trim()
        }
        // req.body.totalCost = quantity * price

        if (productPic.trim() !== '') {
            update.productPic = productPic.trim()
        }

        if (unit.trim() !== '') {
            update.unit = unit.trim()
        }

        if (quantity.trim() !== '') {
            update.quantity = quantity.trim()
        }
        const updateProduct = await Product.findOneAndUpdate({ _id: product_Id }, { $set: update }, { new: true, runValidators: true })
        if (!updateProduct) {
            res.status(500).json({ err: `Error, unable to update product info. contact your developers!!!` })
        }
        res.status(StatusCodes.OK).json({ msg: `Product updated successfully`, productInfo: updateProduct })
    } else {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `${req.info.name}, you're not authorized to perfom this operation` })
    }
})

const transferProduct = asyncHandler(async(req, res) => {
    const { id: product_Id } = req.params
    const { oldBranch, newBranch, quantity } = req.body
    if (req.info.role !== "CEO") {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `Error... You're unathorized to perform this operation` })
    }
    // check if the old branch exist
    const oldBranchExist = await Branch.findOne({ location: oldBranch })
    if (!oldBranchExist) {
        res.status(StatusCodes.NOT_FOUND).json({ err: `Cannot tranfer product from an unregistered branch` })
    }
    // new fetch the productList
    let productList = oldBranchExist.productList
    if (!productList.includes(product_Id)) {
        res.status(StatusCodes.NOT_FOUND).json({ err: `Selected product does not exist in the branch` })
    }
    let product = productList(productList.indexOf(product_Id))
        // the product above is in form of an ID
        // new we will pupulate the product to get the rem. qty
    const fetchProduct = await Product.findOne({ _id: product }).populate()
    if (!fetchProduct) {
        res.status(StatusCodes.NOT_FOUND).json({ err: `Error fetching product` })
    }
    // new we subtrach
    if (fetchProduct.quantity < quantity) {
        res.status(500).json({ err: `Error... insufficient product` })
    }
    let oldBranchProductQty = fetchProduct.quantity - quantity
    productList(productList.indexOf(product_Id)) = oldBranchProductQty
    const updateOldBranch = await Branch.findOneAndUpdate({ location: oldBranch }, { productList }, { new: true, runValidators: true })
    if (!updateOldBranch) {
        res.status(500).json({ err: `Error... Could not update the old branch with new prudct quantity` })
    }
    // now in the new branch, 1. we first check if it exist. 2. we then check if there's a product with similar name (if yes we add to it, and if no, we create a new one)
    const newBranchExist = await Branch.findOne({ location: newBranch }).populate()
    if (!newBranchExist) {
        res.status(StatusCodes.NOT_FOUND).json({ err: `Secondary branch does not exist. Create the branch before atempting to transfer product` })
    }
    // new fetch productList
    let newProductList = newBranchExist.productList
        // newProductList is a list of IDs, how do i check if anyone has the same name
        // perharps I will loop through the list running the and making a get request,
    const den = []
    newProductList.forEach(async id => {
        let product = await Product.findOne({ _id: id })
        if (product.productName === fetchProduct.productName) {
            den.push(id)
        }
    });
    if (den.length === 0) {
        console.log('the product does not exit in the new branch so we will have to create it');
        const newProduct = await Product.create({ productName: fetchProduct.productName, price: fetchProduct.price, quantity: quantity, totalCost: price * quantity, productAdder: req.info.id, productBranch: newBranch })
        if (!newProduct) {
            res.status(500).json({ err: `Product transfer to ${newBranch} failed!!!` })
        }
        res.status(StatusCodes.OK).json({ msg: `${newProduct.productName} transfered to ${newBranch} successfully...` })
    }
    // if den.length = 1 i.e product already exist in the branch

    const oldProduct = await Product.findOneAndUpdate({ _id: den[0] }, { quantity: quantity, totalCost: price * quantity }, { new: true, runValidators: true })
    if (!oldProduct) {
        res.status(500).json({ err: `Error... unable to update ${oldProduct.productName} in ${newBranch}` })
    }
    res.status(StatusCodes.OK).json({ msg: `${quantity} ${oldProduct.unit} of ${oldProduct.productName} has been transfered from ${oldBranch} to ${newBranch}` })
})

const deleteProduct = asyncHandler(async(req, res) => {
    const { id: product_Id } = req.params
    if (req.info.role === "CE0" || req.info.role === "BRANCH MANAGER") {
        const product = await Product.findOneAndDelete({ _id: product_Id })
        if (!product) {
            res.status(500).json({ err: `Error, unable to delete product info. contact your developers!!!` })
        }
        res.status(StatusCodes.OK).json({ msg: `Product deleted successfully`, productInfo: product })
    } else {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `${req.info.name}, you're not authorized to perfom this operation` })
    }
})

module.exports = { newProduct, updateProductInfo, transferProduct, deleteProduct }