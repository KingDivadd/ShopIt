const asyncHandler = require('express-async-handler')
const { StatusCodes } = require('http-status-codes')
const User = require("../models/user-model")
const Branch = require("../models/branch-model")

// only the CEO can create branch. and on creation only the location is required, the rest can be filled later.
const createBranch = asyncHandler(async(req, res) => {
    const { location, branchManager, storeManager, salesPerson, productList, invoiceList, orderList } = req.body
    if (req.info.id.role === "CEO") {
        if (!location) {
            res.status(StatusCodes.BAD_REQUEST).json({ err: `Please provide location for the Branch` })
        }
        // now make sure location does not exist before
        const locationExist = await Branch.findOne({ location })
        if (locationExist) {
            res.status(500).json({ err: `Branch already exist.` })
        } else {

            const newBranch = await Branch.create(req.body)
            if (!newBranch) {
                res.status(500).json({ err: `Error creating a new branch!!!` })
            }
            res.status(StatusCodes.OK).json({ msg: `New Branch created`, branchInfo: newBranch })
        }
    } else {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `Error... NOT AUTHORIZED to perform such operaton` })
    }
})

const updateBranchInfo = asyncHandler(async(req, res) => {
    const { id: branch_Id } = req.params
    const { location, branchManager, storeManager, salesPerson, invoiceList, orderList } = req.body

    const locationExist = await Branch.findOne({ location })
    if (locationExist) {
        res.status(500).json({ err: `Error... cannot change location to already exit location` })
    } else {


        const update = {}
        if (req.info.id.role === "CEO") {
            if (branchManager.trim() !== '') {
                update.branchManager = branchManager.trim()
            }
            if (location.trim() !== '') {
                update.location = location.trim()
            }
            // if (productList.trim() !== '') {
            //     update.productList = productList.trim()
            // }
        }
        if (req.info.id.role === "CEO" || req.info.id.role === "BRANCH MANAGER") {
            if (storeManager.trim() !== '') {
                update.storeManager = storeManager.trim()
            }
            if (salesPerson.trim() !== '') {
                update.salesPerson = salesPerson.trim()
            }
        }
        if (req.info.id.role === "CEO" || req.info.id.role === "BRANCH MANAGER" || req.info.id.role === "SALES PERSON") {
            if (invoiceList.trim() !== '') {
                update.invoiceList = invoiceList.trim()
            }
            if (orderList.trim() !== '') {
                update.orderList = orderList.trim()
            }
        }
        const branchUpdate = await Branch.findOneAndUpdate({ _id: branch_Id }, { $set: update }, { new: true, runValidators: true })
        if (!branchUpdate) {
            res.status(500).json({ err: `Error... Unable to update branch information` })
        }
        // else{
        //     res.status(StatusCodes.UNAUTHORIZED).json({err: `Error... UNAUTHORIZED to perform such operations`})
        // }

    }
})
const getAllBranch = asyncHandler(async(req, res) => {
    if (req.info.id.role === 'CEO') {
        const branch = await Branch.find({})
        res.status(StatusCodes.OK).json({ nbHit: branch.length, allBranch: branch })
    } else {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `Not authorized to perform such operation` })
    }
})
const deleteBranch = asyncHandler(async(req, res) => {
    const { id: branch_Id } = req.params
    if (req.info.id.role === "CEO") {
        const branch = await Branch.findOneAndDelete({ _id: branch_Id })
        if (!branch) {
            res.status(500).json({ err: `Error... Unable to delete selected Branch` })
        }
        res.status(StatusCodes.OK).json({ msg: `${branch.location} deleted successfully.` })
    } else {
        res.status(StatusCodes.UNAUTHORIZED).json({ err: `Not authorized to perform such operation` })
    }
})

module.exports = { createBranch, updateBranchInfo, deleteBranch, getAllBranch }