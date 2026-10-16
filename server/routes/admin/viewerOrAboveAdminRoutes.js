import express from 'express'

import { authAdmin } from '../../middlewares/authAdmin.js'
import { getAllAdminsBasicData, getSingleAdminBasicData, isAuth, resetPassword, sendResetPasswordOtp } from '../../controllers/admin/viewerOrAboveAdminControllers.js'

const viewerOrAboveAdminRouter = express.Router()

/* Protected Routes */
viewerOrAboveAdminRouter.use(authAdmin)

viewerOrAboveAdminRouter.get('/is-auth', isAuth)
viewerOrAboveAdminRouter.get('/get-all-admins-basic-data', getAllAdminsBasicData)
viewerOrAboveAdminRouter.get('/get-single-admin-basic-data/:adminId', getSingleAdminBasicData)

viewerOrAboveAdminRouter.post('/send-reset-password-otp', sendResetPasswordOtp)
viewerOrAboveAdminRouter.post('/reset-password', resetPassword)

export default viewerOrAboveAdminRouter
