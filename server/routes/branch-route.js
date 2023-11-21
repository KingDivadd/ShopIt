const express = require('express')
const router = express.Router()
const { createBranch, deleteBranch, updateBranchInfo, getAllBranch, addBranchStaffs } = require('../controller/branch-controller')
const tokenDecoder = require("../middleware/auth-middleware")

router.route('/create-branch').post(tokenDecoder, createBranch)
router.route('/edit-branch-info').patch(tokenDecoder, updateBranchInfo)
router.route('/add-branch-staff').patch(tokenDecoder, addBranchStaffs)
router.route('/delete-branch').delete(tokenDecoder, deleteBranch)
router.route('/all-branch').get(tokenDecoder, getAllBranch)

module.exports = router