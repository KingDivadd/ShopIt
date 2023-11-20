const express = require('express')
const router = express.Router()
const { deleteInvoice, editInvoice, newInvoice } = require('../controller/invoice-controller')
const tokenDecoder = require('../middleware/auth-middleware')

router.route('/new-invoice').post(tokenDecoder, newInvoice)
router.route('/edit-invoice/:id').patch(tokenDecoder, editInvoice)
router.route('/delete-invoice/:id').delete(tokenDecoder, deleteInvoice)

module.exports = router