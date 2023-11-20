const cloudinary = require('cloudinary').v2
const multer = require('multer')
const User = require('../models/user-model')
const { StatusCodes } = require('http-status-codes')

// configure cloudinary with api credentials
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_secret: process.env.API_SECRET,
    api_key: process.env.API_KEY,
})

// setting up multer for handling file uploads
const storage = multer.memoryStorage()
const upload = multer({ storage: storage }).single('image')

// Define a route for handling file uploads
const uploadImage = (req, res, next) => {
    upload(req, res, (error) => {
        if (error) {
            return res.status(400).send('Error uploading the file: ' + error.message);
        }

        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/png') {
            // Upload the image to Cloudinary
            cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
                if (error) {
                    return res.status(500).send('Error uploading to Cloudinary: ' + error.message);
                }
                // now add the url to the user's schema
                updatePic(url = result.secure_url, req, res)
                    // Return the Cloudinary URL of the uploaded image
                    // res.json({ url: result.secure_url });
                    // I want to then add this pic to the respect user's db
            }).end(req.file.buffer);
        } else {
            return res.status(400).send("File format not supported")
        }
    })
}


const updatePic = async(url, req, res) => {
    const { id: user_Id } = req.params
        // in order to update the image, we have to remove the present one there and deleting frm cloudinary
    const oldPic = await User.findOne({ _id: user_Id })
    const segment = oldPic.pic.split('/')
    const public_Id = segment[segment.length - 1].split('.')[0]
        // new deleting the old image
    const removeImage = cloudinary.uploader.destroy(public_Id)
    if (removeImage.get("result") === "ok") {
        const user = await User.findOneAndUpdate({ _id: user_Id }, { pic: url }, { new: true, runValidator: true })
        if (!user) {
            res.status(500).json({ msg: "Error... unable to change you photo" })
        }
        res.status(200).json({ msg: "Image changed successfully", userInfo: user })
    } else {
        res.status(500).json({ err: `Unable to change image` })
    }

}


module.exports = { uploadImage }