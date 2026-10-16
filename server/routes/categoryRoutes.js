import express from 'express'

import { authAdmin, isEditorOrAbove } from '../middlewares/authAdmin.js'
import { addCategory, deleteCategory, getAllCategoriesData, getSingleCategoryData, updateCategoryData } from '../controllers/categoryController.js'

const categoryRouter = express.Router()

/* Protected Routes */
categoryRouter.use(authAdmin)

categoryRouter.get('/get-single-category-data/:categoryId', getSingleCategoryData)
categoryRouter.get('/get-all-categories-data', getAllCategoriesData)

/* Editor or Above Routes */
categoryRouter.post('/add-category', isEditorOrAbove, addCategory)

categoryRouter.patch('/update-category-data/:categoryId', isEditorOrAbove, updateCategoryData)

categoryRouter.delete('/delete-category/:categoryId', isEditorOrAbove, deleteCategory)

export default categoryRouter
