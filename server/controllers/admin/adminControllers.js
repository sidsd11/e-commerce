import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import adminModel from '../../models/adminModel.js'

export const login = async (req, res) => {
	try {
		const { email, password } = req.body
		if (!email || !password) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const admin = await adminModel.findOne({ email })
		if (!admin) {
			return res.status(404).json({ success: false, message: 'Admin not found. Please register first to login' })
		}
		if (admin.status === 'blocked') {
			return res.status(403).json({ success: false, message: 'Your account has been blocked' })
		}
		if (admin.status === 'suspended') {
			return res.status(403).json({ success: false, message: 'Your account is temporarily suspended' })
		}
		if (admin.status === 'deleted') {
			return res.status(403).json({ success: false, message: 'Your account is no longer available' })
		}

		const passwordCheck = await bcrypt.compare(password, admin.password)
		if (!passwordCheck) {
			return res.status(400).json({ success: false, message: 'Incorrect email or password' })
		}

		const adminToken = jwt.sign({ id: admin._id.toString() }, process.env.ADMIN_JWT_SECRET, { expiresIn: '7d' })
		res.cookie('adminToken', adminToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000
		})

		return res.status(200).json({ success: true, message: 'Admin logged in successfully' })
	} catch (error) {
		console.error('Error while logging in:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const logout = async (req, res) => {
	try {
		const { adminToken } = req.cookies
		if (!adminToken) {
			return res.status(400).json({ success: false, message: 'Admin is not logged in' })
		}

		res.clearCookie('adminToken', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
		})

		return res.status(200).json({ success: true, message: 'Admin logged out successfully' })
	} catch (error) {
		console.error('Error while logging out:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}
