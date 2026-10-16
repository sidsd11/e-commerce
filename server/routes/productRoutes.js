import express from 'express'

import { authAdmin, isEditorOrAbove } from '../middlewares/authAdmin.js'
import { addProduct, addStock, deleteProduct, getAllProductsData, getProductData, updateProductData } from '../controllers/productControllers.js'
import upload from '../middlewares/multer.js'

const productRouter = express.Router()

/* Protected Routes */
productRouter.use(authAdmin)

productRouter.get('/get-product-data/:productId', getProductData)
productRouter.get('/get-all-products-data', getAllProductsData)

/* Editor or Above Routes */
productRouter.use(isEditorOrAbove)

productRouter.post('/add-product', upload.array('images', 5), addProduct)
productRouter.post('/add-stock/:stockId', addStock)

productRouter.patch('/update-product-data/:productId', updateProductData)

productRouter.delete('/delete-product/:productId', deleteProduct)

export default productRouter
