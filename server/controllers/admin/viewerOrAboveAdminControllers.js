import bcrypt from 'bcryptjs'

import adminModel from '../../models/adminModel.js'
import transporter from '../../config/nodemailer.js'

export const isAuth = async (req, res) => {
	try {
		return res.status(200).json({ success: true, message: 'Admin is authenticated' })
	} catch (error) {
		console.error('Error while checking admin authentication:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const getAllAdminsBasicData = async (req, res) => {
	try {
		const { fields } = req.body
		if (!fields || !Array.isArray(fields)) {
			return res.status(400).json({ success: false, message: 'Missing or invalid details' })
		}

		const allowedFields = ['_id', 'uniqueAdminId', 'name', 'email', 'role', 'createdAt']
		const toBeSentFields = fields.filter((field) => allowedFields.includes(field))
		if (toBeSentFields.length === 0) {
			return res.status(400).json({ success: false, message: 'No valid fields requested' })
		}

		const allAdminsBasicData = await adminModel.find().select(toBeSentFields.join(' '))
		if (!allAdminsBasicData) {
			return res.status(404).json({ success: false, message: 'Admin does not exist' })
		}

		return res.status(200).json({ success: true, message: 'Data retrieved successfully', allAdminsBasicData })
	} catch (error) {
		console.error('Error while retrieving all admins basic data:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const getSingleAdminBasicData = async (req, res) => {
	try {
		const { adminId } = req.params
		if (!adminId) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const { fields } = req.body
		if (!fields || !Array.isArray(fields)) {
			return res.status(400).json({ success: false, message: 'Missing or invalid details' })
		}

		const allowedFields = ['_id', 'uniqueAdminId', 'name', 'email', 'role', 'createdAt']
		const toBeSentFields = fields.filter((field) => allowedFields.includes(field))
		if (toBeSentFields.length === 0) {
			return res.status(400).json({ success: false, message: 'No valid fields requested' })
		}

		const adminBasicData = await adminModel.findById(adminId).select(toBeSentFields.join(' '))
		if (!adminBasicData) {
			return res.status(404).json({ success: false, message: 'Admin does not exist' })
		}

		return res.status(200).json({ success: true, message: 'Data retrieved successfully', adminBasicData })
	} catch (error) {
		console.error('Error while retrieving single admin basic data:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const sendResetPasswordOtp = async (req, res) => {
	try {
		const { id } = req.admin
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing Admin details' })
		}

		const admin = await adminModel.findById(id)
		if (!admin) {
			return res.status(404).json({ success: false, message: 'Admin does not exist' })
		}

		const otp = String(Math.floor(100000 + Math.random() * 900000))
		const hashedOtp = await bcrypt.hash(otp, 10)

		try {
			const mailOptions = {
				from: process.env.SENDER_EMAIL,
				to: admin.email,
				subject: 'OTP to reset your password',
				text: `OTP to reset your password is ${otp}. It will expire in next 5 minutes.`
			}
			await transporter.sendMail(mailOptions)
		} catch (emailError) {
			console.error('Error while sending OTP via email:', emailError)
			return res.status(500).json({ success: false, message: 'Failed to send OTP via email' })
		}

		const updatedAdmin = await adminModel.findByIdAndUpdate(id, {
			$set: {
				resetPasswordOtp: hashedOtp,
				resetPasswordOtpExpiresAt: Date.now() + 5 * 60 * 1000
			}
		})
		if (!updatedAdmin) {
			return res.status(500).json({ success: false, message: 'Failed to send OTP' })
		}

		return res.status(200).json({ success: true, message: 'An OTP to reset password has been sent successfully' })
	} catch (error) {
		console.error('Error while sending reset password OTP:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const resetPassword = async (req, res) => {
	try {
		const { id } = req.admin
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing Admin details' })
		}

		const { otp, password } = req.body
		if (!otp || !password) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const admin = await adminModel.findById(id)
		if (!admin) {
			return res.status(404).json({ success: false, message: 'Admin does not exist' })
		}
		if (admin.resetPasswordOtpExpiresAt < Date.now()) {
			return res.status(400).json({ success: false, message: 'OTP has expired' })
		}
		const otpCheck = await bcrypt.compare(otp, admin.resetPasswordOtp)
		if (!otpCheck || admin.resetPasswordOtp === '' || admin.resetPasswordOtp === null || otp === '') {
			return res.status(400).json({ success: false, message: 'Incorrect OTP' })
		}

		const passwordCheck = await bcrypt.compare(password, admin.password)
		if (passwordCheck) {
			return res.status(400).json({ success: false, message: 'Old and new password cannot be same' })
		}

		const newPassword = await bcrypt.hash(password, 10)

		const updatedAdmin = await adminModel.findByIdAndUpdate(id, {
			$set: {
				resetPasswordOtp: null,
				resetPasswordOtpExpiresAt: null,
				password: newPassword,
				passwordChangedAt: Date.now()
			}
		})
		if (!updatedAdmin) {
			return res.status(500).json({ success: false, message: 'Failed to reset password' })
		}

		res.clearCookie('adminToken', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
		})

		return res.status(200).json({ success: true, message: 'Password changed successfully. Please login again' })
	} catch (error) {
		console.error('Error while resetting password:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}
