import express from 'express'

import { authAdmin, isAdministrator } from '../../middlewares/authAdmin.js'
import { changeAdminRole, changeAdminStatus, changeUserStatus, getAllAdminsDetailedData, getSingleAdminDetailedData, updateAdminData } from '../../controllers/admin/administratorAdminControllers.js'

const administratorAdminRouter = express.Router()

/* Protected Routes */
administratorAdminRouter.use(authAdmin, isAdministrator)

administratorAdminRouter.get('/get-all-admins-detailed-data', getAllAdminsDetailedData)
administratorAdminRouter.get('/get-single-admin-detailed-data/:adminId', getSingleAdminDetailedData)

administratorAdminRouter.patch('/update-admin-data/:adminId', updateAdminData)
administratorAdminRouter.patch('/change-admin-role/:adminId', changeAdminRole)
administratorAdminRouter.patch('/change-admin-status/:adminId', changeAdminStatus)
administratorAdminRouter.patch('/change-user-status/:userId', changeUserStatus)

export default administratorAdminRouter
