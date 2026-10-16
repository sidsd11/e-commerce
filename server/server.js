import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import cookieParser from 'cookie-parser'

import connectDB from './config/connectDB.js'
import rateLimiter from './middlewares/rateLimiter.js'
import { connectRedis } from './config/redis.js'
import userRouter from './routes/userRoutes.js'
import categoryRouter from './routes/categoryRoutes.js'
import productRouter from './routes/productRoutes.js'
import adminRouter from './routes/admin/adminRoutes.js'
import viewerOrAboveAdminRouter from './routes/admin/viewerOrAboveAdminRoutes.js'
import editorOrAboveAdminRouter from './routes/admin/editorOrAboveAdminRoutes.js'
import administratorAdminRouter from './routes/admin/administratorAdminRoutes.js'

const app = express()
app.set('trust proxy', 1)

const PORT = process.env.PORT || 5000
const allowedOrigins = ['http://localhost:5173']

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res) => {
	res.send('API Working')
})

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok' })
})

app.get('/instance', (req, res) => {
	res.json({
		port: process.env.PORT
	})
})

app.use(rateLimiter)

app.use('/api/user', userRouter)
app.use('/api/category', categoryRouter)
app.use('/api/product', productRouter)
app.use('/api/admin', adminRouter)
app.use('/api/admin/viewer-or-above', viewerOrAboveAdminRouter)
app.use('/api/admin/editor-or-above', editorOrAboveAdminRouter)
app.use('/api/admin/administrator', administratorAdminRouter)

const startServer = async () => {
	try {
		await connectDB()
		await connectRedis()

		app.listen(PORT, () => {
			console.log(`Server is listening on port: ${PORT}`)
		})
	} catch (error) {
		console.error('Failed to start server:', error)
		process.exit(1)
	}
}

startServer()
