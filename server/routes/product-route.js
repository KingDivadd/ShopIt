const express = require('express')
const router = express.Router()
const { deleteProduct, newProduct, transferProduct, updateProductInfo, getBranchProducts, allBranchProducts } = require("../controller/product-controller")
const tokenDecoder = require('../middleware/auth-middleware')

router.route('/new-product').post(tokenDecoder, newProduct)
router.route('/branch-products').post(tokenDecoder, getBranchProducts)
router.route('/all-branch-products').get(tokenDecoder, allBranchProducts)
router.route('/edit-product-info').patch(tokenDecoder, updateProductInfo)
router.route('/tranfer-product/:id').post(tokenDecoder, transferProduct)
router.route('/delete-product/:id').post(tokenDecoder, deleteProduct)

module.exports = router