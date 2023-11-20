const express = require('express')
const router = express.Router()
const { createBranch, deleteBranch, updateBranchInfo, getAllBranch } = require('../controller/branch-controller')
const tokenDecoder = require("../middleware/auth-middleware")

router.route('/create-branch').post(tokenDecoder, createBranch)
router.route('/edit-branch-info/:id').patch(tokenDecoder, updateBranchInfo)
router.route('/delete-branch/:id').delete(tokenDecoder, deleteBranch)
router.route('/all-branch').get(tokenDecoder, getAllBranch)

module.exports = router