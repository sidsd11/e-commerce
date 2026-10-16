import jwt from 'jsonwebtoken'

import adminModel from '../models/adminModel.js'

export const authAdmin = async (req, res, next) => {
	try {
		const { adminToken } = req.cookies
		if (!adminToken) {
			return res.status(401).json({ success: false, message: 'Not authorized, please login again' })
		}

		const adminTokenDecode = jwt.verify(adminToken, process.env.ADMIN_JWT_SECRET)
		const id = adminTokenDecode?.id
		if (!id) {
			return res.status(401).json({ success: false, message: 'Not authorized, please login again' })
		}

		const admin = await adminModel.findById(id)
		if (!admin || admin.status !== 'active' || (admin.role !== 'Viewer' && admin.role !== 'Editor' && admin.role !== 'Administrator')) {
			res.clearCookie('adminToken', {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
			})

			return res.status(401).json({ success: false, message: 'Not authorized, please login again' })
		}

		req.admin = {
			id,
			uniqueAdminId: admin.uniqueAdminId,
			adminName: admin.name,
			adminEmail: admin.email,
			adminRole: admin.role
		}

		next()
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const isEditorOrAbove = async (req, res, next) => {
	try {
		const { adminRole } = req.admin
		if (!adminRole) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		if (adminRole !== 'Editor' && adminRole !== 'Administrator') {
			return res.status(403).json({ success: false, message: 'You do not have permission for this task' })
		}

		next()
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const isAdministrator = async (req, res, next) => {
	try {
		const { adminRole } = req.admin
		if (!adminRole) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		if (adminRole !== 'Administrator') {
			return res.status(403).json({ success: false, message: 'You do not have permission for this task' })
		}

		next()
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}
