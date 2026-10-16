import express from 'express'

import authUser from '../middlewares/authUser.js'
import { addAddress, addProductInWishlist, deleteAddress, editAddress, getUserData, getWishlist, googleLogin, isAuth, login, logout, markAddressAsDefault, register, removeProductFromWishlist, resetPassword, sendVerifyAccountOtp, sendResetPasswordOtp, updateProfilePicture, updateUserProfile, verifyAccount } from '../controllers/userControllers.js'
import upload from '../middlewares/multer.js'

const userRouter = express.Router()

/* Public routes */
userRouter.post('/register', register)
userRouter.post('/login', login)
userRouter.post('/google-login', googleLogin)
userRouter.post('/logout', logout)

/* Protected routes */
userRouter.use(authUser)

userRouter.get('/is-auth', isAuth)
userRouter.get('/get-user-data', getUserData)
userRouter.get('/get-wishlist', getWishlist)

userRouter.post('/send-account-verify-otp', sendVerifyAccountOtp)
userRouter.post('/verify-account', verifyAccount)
userRouter.post('/send-reset-password-otp', sendResetPasswordOtp)
userRouter.post('/reset-password', resetPassword)

userRouter.patch('/update-user-data', updateUserProfile)
userRouter.patch('/add-address', addAddress)
userRouter.patch('/edit-address/:addressId', editAddress)
userRouter.patch('/mark-address-as-default/:addressId', markAddressAsDefault)
userRouter.patch('/add-product-in-wishlist/:productId', addProductInWishlist)
userRouter.patch('/update-profile-picture', upload.single('profilePicture'), updateProfilePicture)

userRouter.delete('/delete-address/:addressId', deleteAddress)
userRouter.delete('/remove-product-from-wishlist/:productId', removeProductFromWishlist)

export default userRouter
