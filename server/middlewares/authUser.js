import jwt from 'jsonwebtoken'

import userModel from '../models/userModel.js'

const authUser = async (req, res, next) => {
	try {
		const { token } = req.cookies
		if (!token) {
			return res.status(401).json({ success: false, message: 'Not authorized, please login again' })
		}

		const tokenDecode = jwt.verify(token, process.env.JWT_SECRET)
		const id = tokenDecode?.id
		if (!id) {
			return res.status(401).json({ success: false, message: 'Not authorized, please login again' })
		}

		const user = await userModel.findById(id)
		if (!user || user?.status !== 'active') {
			res.clearCookie('token', {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
			})

			return res.status(401).json({ success: false, message: 'Not authorized, please login again' })
		}

		req.user = { id }

		next()
	} catch (error) {
		return res.status(401).json({ success: false, message: 'Not authorized, please login again' })
	}
}

export default authUser
