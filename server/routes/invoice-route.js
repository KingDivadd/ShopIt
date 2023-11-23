const express = require('express')
const router = express.Router()
const { deleteInvoice, newOfflineSale, newSale } = require('../controller/invoice-controller')
const tokenDecoder = require('../middleware/auth-middleware')

router.route('/new-off-sale').post(tokenDecoder, newOfflineSale)
router.route('/new-sale').post(tokenDecoder, newSale)

module.exports = router