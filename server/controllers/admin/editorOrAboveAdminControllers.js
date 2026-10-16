import bcrypt from 'bcryptjs'

import adminModel from '../../models/adminModel.js'
import transporter from '../../config/nodemailer.js'
import generateUniqueId from '../../utils/generateUniqueId.js'

export const register = async (req, res) => {
	try {
		const { name, email, password, role } = req.body
		if (!name || !email || !password || !role) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const existingAdmin = await adminModel.findOne({ email })
		if (existingAdmin) {
			return res.status(400).json({ success: false, message: 'Admin already exists with this email address' })
		}

		const uniqueAdminId = await generateUniqueId('admin')
		if (uniqueAdminId === 'Invalid') {
			return res.status(500).json({ success: false, message: 'Failed to generate uniqueAdminId' })
		}

		const hashedPassword = await bcrypt.hash(password, 10)

		const newAdmin = new adminModel({ uniqueAdminId, name, email, password: hashedPassword, role })
		await newAdmin.save()

		try {
			const mailOptions = {
				from: process.env.SENDER_EMAIL,
				to: email,
				subject: 'Welcome to Astitra',
				text: `Welcome ${name.trim()} to Astitra. Your admin account as ${role} has been created successfully.`
			}
			await transporter.sendMail(mailOptions)
		} catch (emailError) {
			console.error('Error while sending welcome email:', emailError)
		}

		return res.status(201).json({ success: true, message: 'Account created successfully' })
	} catch (error) {
		console.error('Error while registering admin:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}
