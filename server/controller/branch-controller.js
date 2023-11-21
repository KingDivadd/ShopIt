const asyncHandler = require('express-async-handler')
const mongoose = require('mongoose')
const { StatusCodes } = require('http-status-codes')
const User = require("../models/user-model")
const Branch = require("../models/branch-model")


// only the CEO can create branch. and on creation only the location is required, the rest can be filled later.
const createBranch = asyncHandler(async(req, res) => {
    const { location, branchManager, storeManager, salesPerson, } = req.body
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

// add branch staffs 
const addBranchStaffs = asyncHandler(async(req, res) => {
    const { branch_id, location, branchManager, storeManager, salesPerson, } = req.body
    if (req.info.id.role !== 'CEO' && req.info.id.role !== 'BRANCH MANAGER') {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: `Error... You're not authorized to perform such operation!!!` })
    }
    // check if branch exist
    const branchExist = await Branch.findOne({ _id: branch_id })
    if (!branchExist) {
        return res.status(StatusCodes.NOT_FOUND).json({ err: `Error... Branch with ID ${branch_id} not found!!!` })
    }
    const update = {}
        // only the CEO or business owner can change the branchManager
    if (req.info.id.role === 'CEO') {
        if (branchManager.trim() !== '') {
            // ensure that his role is a store manager
            const isBM = await User.findOne({ _id: branchManager })
            if (!isBM) {
                return res.status(StatusCodes.NOT_FOUND).json({ err: `Error... user not found!!!` })
            }
            if (isBM.role !== 'BRANCH MANAGER') {
                return res.status(500).json({ err: `Error... Selected user's role for BM's position is not branch manager!!!` })
            }
            update.branchManager = branchManager.trim()
            await User.findOneAndUpdate({ _id: branchManager }, { branch: branch_id }, { new: true, runValidators: true })
        }
        if (branchManager.trim() === null) {
            update.branchManager = null
            await User.findOneAndUpdate({ _id: branchManager }, { branch: null }, { new: true, runValidators: true })
        }
    }

    // also ensure the branch manager can only make changes to his branch
    const bmAccess = await User.findOne({ _id: req.info.id.id })
    if (req.info.id.role === 'CEO' || (req.info.id.role === 'BRANCH MANAGER' && bmAccess.branch.toString() === branch_id)) {
        if (location.trim() !== '') {
            // check if the location already exist
            const locationExist = await Branch.findOne({ location })
            if (locationExist) {
                return res.status(500).json({ err: `Error... ${location} is already a registred location!!!` })
            }
            update.location = location.trim()
        }

        if (storeManager.trim() !== '') {
            const isSM = await User.findOne({ _id: storeManager })
            if (!isSM) {
                return res.status(StatusCodes.NOT_FOUND).json({ err: `Error... user not found!!!` })
            }
            if (isSM.role !== 'STORE MANAGER') {
                return res.status(500).json({ err: `Error... Selected user's role for store manager's positon is not a store manager!!!` })
            }
            update.storeManager = storeManager.trim()
            await User.findOneAndUpdate({ _id: storeManager }, { branch: branch_id }, { new: true, runValidators: true })
        }
        if (storeManager.trim() === null) {
            update.storeManager = null
            await User.findOneAndUpdate({ _id: storeManager }, { branch: null }, { new: true, runValidators: true })
        }

        if (salesPerson.trim() !== '') {
            const isSp = await User.findOne({ _id: salesPerson })
            if (!isSp) {
                return res.status(StatusCodes.NOT_FOUND).json({ err: `Error... user not found!!!` })
            }
            if (isSp.role !== 'SALES PERSON') {
                return res.status(500).json({ err: `Error... Selected user's role for sales position is not a sales person!!!` })
            }
            update.salesPerson = salesPerson.trim()
            await User.findOneAndUpdate({ _id: salesPerson }, { branch: branch_id }, { new: true, runValidators: true })
        }
        if (salesPerson.trim() === null) {
            update.salesPerson = null
            await User.findOneAndUpdate({ _id: salesPerson }, { branch: null }, { new: true, runValidators: true })
        }
    } else {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: `Error... You're not authorized to make these changes!!!` })
    }

    const updateBranch = await Branch.findOneAndUpdate({ _id: branch_id }, { $set: update }, { new: true, runValidators: true })

    res.status(StatusCodes.OK).json({ msg: `Staff(s) added to ${updateBranch.location} branch successfully...`, branchInfo: updateBranch })

})

// listed below are to be updated in their respective controllers

const updateBranchInfo = asyncHandler(async(req, res) => {
    const { branch_id, invoiceList, orderList, productList, dailyAcct } = req.body
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
    const { branch_id } = req.body
    if (req.info.id.role !== "CEO") {
        return res.status(StatusCodes.UNAUTHORIZED).json({ err: `Error... Not authorized to perform such operation!!!` })
    }
    // first we have to remove all occurance of that branch

    // first we romove branch Id from all users
    const result = await User.updateMany({ branch: branch_id }, { branch: null }, { new: true, runValidators: true })

    if (!result) {
        return res.status(500).json({ err: `Error... Something went wrong!!!` })
    }
    const branch = await Branch.findOneAndDelete({ _id: branch_id })
    if (!branch) {
        res.status(500).json({ err: `Error... Unable to delete selected Branch` })
    }
    res.status(StatusCodes.OK).json({ msg: `${branch.location} branch deleted successfully.` })
})

module.exports = { createBranch, updateBranchInfo, deleteBranch, getAllBranch, addBranchStaffs }