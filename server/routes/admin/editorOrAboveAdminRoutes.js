import express from 'express'

import { authAdmin, isEditorOrAbove } from '../../middlewares/authAdmin.js'
import { register } from '../../controllers/admin/editorOrAboveAdminControllers.js'

const editorOrAboveAdminRouter = express.Router()

/* Protected Routes */
editorOrAboveAdminRouter.use(authAdmin, isEditorOrAbove)

editorOrAboveAdminRouter.post('/register', register)

export default editorOrAboveAdminRouter
