import express from 'express'

import { login, logout } from '../../controllers/admin/adminControllers.js'

const adminRouter = express.Router()

/* Public Routes */
adminRouter.post('/login', login)
adminRouter.post('/logout', logout)

export default adminRouter
