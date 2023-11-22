const asyncHandler = require('express-async-handler')
const { StatusCodes } = require('http-status-codes')
const User = require("../models/user-model")
const Product = require("../models/product-model")
const Branch = require("../models/branch-model")


const allProducts = asyncHandler(async(req, res) => {

    if (req.info.id.role === 'CEO') {
        const allProducts = await Product.find({}).populate("productBranch", "location")
        if (!allProducts) {
            return res.status(500).json({ err: `Error... Unable to fetch product data!!!` })
        }
        return res.status(StatusCodes.OK).json({ nbProducts: allProducts.length, products: allProducts })
    }

    const user = await User.findOne({ _id: req.info.id.id })
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ err: `Error... User with ID ${user._id} was not found!!!` })
    }
    const branch_id = user.branch
    if (branch_id === null) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: `Error... Only branch registred users can view branch products!!!` })
    }
    const branchExist = await Branch.findOne({ _id: String(branch_id) })
    if (!branchExist) {
        return res.status(StatusCodes.NOT_FOUND).json({ err: `Error... Branch with ID ${branch_id} not found!!!` })
    }
    const product = await Product.find({
        productBranch: { $eq: branch_id }
    }).populate("productBranch", "location")
    if (!product.length) {
        return res.status(StatusCodes.OK).json({ msg: `No product has been added to ${branchExist.location} branch yet...` })
    }
    return res.status(200).json({ location: branchExist.location, numProducts: product.length, products: product })


})

const newProduct = asyncHandler(async(req, res) => {
    const { productName, price, productPic, unit, productBranch, quantity } = req.body
    if (!productName || !price || !unit || !productBranch) {
        return res.status(500).json({ err: `Please provide all product related informations!!!` })
    }

    const user = await User.findOne({ _id: req.info.id.id })

    const branchExist = await Branch.findOne({ _id: productBranch })
    if (!branchExist) {
        return res.status(500).json({ err: `Error... Product cannot be added to an unregisted business branch!!!` })
    }

    if (req.info.id.role === "CEO" || (branchExist.branchManager && String(user.branch) === productBranch)) {
        req.body.productAdder = req.info.id.id
        req.body.totalCost = quantity * price
            // check if product with same name exist, if yes add the new quantity to it
        const productExist = await Product.findOne({ productBranch: { $eq: productBranch } })

        if (productExist) {
            const newQty = Number(productExist.quantity) + Number(quantity)
            const updateProduct = await Product.findOneAndUpdate({ _id: productExist._id }, { quantity: newQty }, { new: true, runValidators: true }).populate('productBranch', 'location')

            return res.status(StatusCodes.OK).json({ msg: `${productName} added successfully`, productInfo: updateProduct })
        }

        // but if it doesn't exist
        const product = await Product.create(req.body)
        if (!product) {
            return res.status(500).json({ err: `Product creation failed!!!` })
        }
        // now we have to add thesame product to the branch
        await Branch.findOneAndUpdate({ _id: productBranch }, { $push: { productList: product._id } }, { new: true, runValidators: true }).populate('productBranch', 'location')

        return res.status(StatusCodes.OK).json({ msg: `${productName} added successfully`, productInfo: product })
    } else {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: `${req.info.id.name}, you're not authorized to perform this operation` })
    }
})

const updateProductInfo = asyncHandler(async(req, res) => {
    const { product_id, productName, price, productPic, unit, quantity } = req.body
    const productExist = await Product.findOne({ _id: product_id })
    if (!productExist) {
        return res.status(StatusCodes.NOT_FOUND).json({ err: `Product with product ID ${product_id} not found!!!` })
    }
    const productBranch = await Branch.findOne({ _id: productExist.productBranch })

    if (req.info.id.role === "CEO" || (req.info.id.role === "BRANCH MANAGER" && productBranch.branchManager === req.info.id.id)) {
        const update = {}
        if (productName.trim() !== '') {
            update.productName = productName.trim()
        }

        if (productPic.trim() !== '') {
            update.productPic = productPic.trim()
        }

        if (unit.trim() !== '') {
            update.unit = unit.trim()
        }

        if (price.trim() !== '') {
            update.price = price.trim()
        }

        if (quantity.trim() !== '') {
            update.quantity = quantity.trim()
        }

        const newProduct = await Product.findOneAndUpdate({ _id: product_id }, { $set: update }, { new: true, runValidators: true })

        const totalCost = Number(newProduct.price) * Number(newProduct.quantity)

        const updateProduct = await Product.findOneAndUpdate({ _id: product_id }, { totalCost }, { new: true, runValidators: true })
        if (!updateProduct) {
            res.status(500).json({ err: `Error, unable to update product info. contact your developers!!!` })
        }
        res.status(StatusCodes.OK).json({ msg: `Product updated successfully`, productInfo: updateProduct })
    } else {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `${req.info.id.name}, you're not authorized to perfom this operation` })
    }
})

const transferProduct = asyncHandler(async(req, res) => {
    const { product_id, oldBranch, newBranch, quantity } = req.body
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
    if (!productList.includes(product_id)) {
        res.status(StatusCodes.NOT_FOUND).json({ err: `Selected product does not exist in the branch` })
    }
    let product = productList(productList.indexOf(product_id))
        // the product above is in form of an ID
        // new we will pupulate the product to get the rem. qty
    const fetchProduct = await Product.findOne({ _id: product })
    if (!fetchProduct) {
        res.status(StatusCodes.NOT_FOUND).json({ err: `Error fetching product` })
    }
    // new we subtrach
    if (fetchProduct.quantity < quantity) {
        res.status(500).json({ err: `Error... insufficient product` })
    }
    let oldBranchProductQty = fetchProduct.quantity - quantity
    productList(productList.indexOf(product_id)) = oldBranchProductQty
    const updateOldBranch = await Branch.findOneAndUpdate({ location: oldBranch }, { productList }, { new: true, runValidators: true })
    if (!updateOldBranch) {
        res.status(500).json({ err: `Error... Could not update the old branch with new prudct quantity!!!` })
    }
    // now in the new branch, 1. we first check if it exist. 2. we then check if there's a product with similar name (if yes we add to it, and if no, we create a new one)
    const newBranchExist = await Branch.findOne({ location: newBranch })
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
    const { product_id } = req.body

    const productExist = await Product.findOne({ _id: product_id })
    if (!productExist) {
        return res.status(404).json({ err: `Error... Product with ID ${product_id} not found!!!` })
    }
    const user = await User.findOne({ _id: req.info.id.id })
    if (!user) {
        return res.status(404).json({ err: `Error... User not found!!!` })
    }
    if (user.branch === null) {
        return res.status(401).json({ err: `Error... You're not authorized to delete product` })
    }

    console.log(productExist.productBranch)
    if (productExist.productBranch === null) {
        const removeProduct = await Product.findOneAndDelete({ _id: product_id })
        return res.status(StatusCodes.OK).json({ msg: `Product deleted successfully`, deletedProduct: removeProduct })

    }

    if (req.info.id.role === "CEO" || (req.info.id.role === "BRANCH MANAGER" && String(user.branch) === productExist.productBranch)) {
        const removeProduct = await Product.findOneAndDelete({ _id: product_id })
        if (!removeProduct) {
            return res.status(500).json({ err: `Error... Unable to detele ${productExist.productName}!!!` })
        }
        // new removing the product from the branch
        const updatedBranch = await Branch.findOneAndUpdate({ _id: productExist.productBranch }, { $pull: { productList: product_id } }, { new: true, runValidators: true }).select("productList")
        if (!updatedBranch) {
            return res.status(500).json({ err: `Error... Unable to remove deleted product from ${updatedBranch.location} branch!!!` })
        }
        return res.status(StatusCodes.OK).json({ msg: `Product deleted successfully`, productInfo: removeProduct, newBranch: updatedBranch })
    } else {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: `${req.info.id.name}, you're not authorized to perfom this operation!!!` })
    }
})

module.exports = { newProduct, updateProductInfo, transferProduct, deleteProduct, allProducts }