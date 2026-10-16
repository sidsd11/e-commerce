import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'

import userModel from '../models/userModel.js'
import transporter from '../config/nodemailer.js'
import generateUniqueId from '../utils/generateUniqueId.js'
import productModel from '../models/productModel.js'

export const register = async (req, res) => {
	try {
		const { name, email, password } = req.body
		if (!name || !email || !password) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}
		const normalizedEmail = email.trim().toLowerCase()

		const existingUser = await userModel.findOne({ email: normalizedEmail })
		if (existingUser) {
			return res.status(409).json({ success: false, message: 'User already exists, please login to continue' })
		}

		const uniqueUserId = await generateUniqueId('user')
		if (uniqueUserId === 'Invalid') {
			return res.status(500).json({ success: false, message: 'Failed to generate uniqueUserId' })
		}

		const hashedPassword = await bcrypt.hash(password, 10)

		const newUser = new userModel({ uniqueUserId, name, email: normalizedEmail, password: hashedPassword })
		await newUser.save()

		const token = jwt.sign({ id: newUser._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' })
		res.cookie('token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000
		})

		try {
			const mailOptions = {
				from: process.env.SENDER_EMAIL,
				to: normalizedEmail,
				subject: 'Welcome to Astitra',
				text: `Welcome ${name.trim()} to Astitra. Your account has been created successfully.`
			}
			await transporter.sendMail(mailOptions)
		} catch (emailError) {
			console.error('Error while sending welcome email:', emailError)
		}

		return res.status(200).json({ success: true, message: 'Account created successfully' })
	} catch (error) {
		console.error('Error while registering user:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const login = async (req, res) => {
	try {
		const { email, password } = req.body
		if (!email || !password) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}
		const normalizedEmail = email.trim().toLowerCase()

		const user = await userModel.findOne({ email: normalizedEmail })
		if (!user) {
			return res.status(404).json({ success: false, message: 'Account with this email does not exist. Please register first to login' })
		}
		if (user.status === 'blocked') {
			return res.status(403).json({ success: false, message: 'Your account has been blocked' })
		}
		if (user.status === 'suspended') {
			return res.status(403).json({ success: false, message: 'Your account is temporarily suspended' })
		}
		if (user.status === 'deleted') {
			return res.status(403).json({ success: false, message: 'Your account is no longer available' })
		}
		if (!user.password) {
			return res.status(400).json({ success: false, message: 'This account uses Google login. Please continue with Google to continue' })
		}

		const passwordCheck = await bcrypt.compare(password, user.password)
		if (!passwordCheck) {
			return res.status(400).json({ success: false, message: 'Incorrect email or password' })
		}

		const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' })
		res.cookie('token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000
		})

		return res.status(200).json({ success: true, message: 'User logged in successfully' })
	} catch (error) {
		console.error('Error while logging in user:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
export const googleLogin = async (req, res) => {
	try {
		const { credential } = req.body
		if (!credential) {
			return res.status(400).json({ success: false, message: 'Google credential is missing' })
		}

		const ticket = await googleClient.verifyIdToken({
			idToken: credential,
			audience: process.env.GOOGLE_CLIENT_ID
		})

		const payload = ticket.getPayload()
		const { sub: googleId, name, email: emailFromGoogle, picture, email_verified } = payload
		if (!email_verified || !emailFromGoogle) {
			return res.status(400).json({ success: false, message: 'Google email is not verified' })
		}
		const normalizedEmail = emailFromGoogle.trim().toLowerCase()

		let user = await userModel.findOne({ googleId })
		if (!user) {
			user = await userModel.findOne({ email: normalizedEmail })
			if (user) {
				if (user.googleId && user.googleId !== googleId) {
					return res.status(400).json({ success: false, message: 'This email is already linked to another Google account' })
				}
				user.googleId = googleId
				user.isAccountVerified = true
				if (picture && !user.profilePicture) {
					user.profilePicture = picture
				}
				if (!user.accountVerifiedAt) {
					user.accountVerifiedAt = Date.now()
				}
				await user.save()
			} else {
				const uniqueUserId = await generateUniqueId('user')
				if (uniqueUserId === 'Invalid') {
					return res.status(500).json({ success: false, message: 'Failed to generate unique uniqueUserId' })
				}

				user = new userModel({
					uniqueUserId,
					name,
					email: normalizedEmail,
					password: null,
					googleId,
					isAccountVerified: true,
					profilePicture: picture || '',
					accountVerifiedAt: Date.now()
				})
				await user.save()
			}
		}

		const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' })

		res.cookie('token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000
		})

		return res.status(200).json({ success: true, message: 'Google login successful' })
	} catch (error) {
		console.error('Error while logging in user via Google:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const logout = async (req, res) => {
	try {
		const { token } = req.cookies
		if (!token) {
			return res.status(400).json({ success: false, message: 'User is not logged in' })
		}

		res.clearCookie('token', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
		})

		return res.status(200).json({ success: true, message: 'User logged out successfully' })
	} catch (error) {
		console.error('Error while logging out user:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const isAuth = async (req, res) => {
	try {
		return res.status(200).json({ success: true, message: 'User is authenticated' })
	} catch (error) {
		console.error('Error while checking user authentication:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const getUserData = async (req, res) => {
	try {
		const { fields } = req.body
		if (!fields || !Array.isArray(fields) || fields.length === 0) {
			return res.status(400).json({ success: false, message: 'Missing or invalid details' })
		}

		const { id } = req.user
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing User details' })
		}

		const allowedFields = ['_id', 'uniqueUserId', 'name', 'email', 'isAccountVerified', 'accountVerifiedAt', 'passwordChangedAt', 'profilePicture', 'wishlist', 'updates', 'status', 'addresses', 'createdAt']
		const toBeSentFields = fields.filter((field) => allowedFields.includes(field))
		if (toBeSentFields.length === 0) {
			return res.status(400).json({ success: false, message: 'No valid fields requested' })
		}

		const userData = await userModel.findById(id).select(toBeSentFields.join(' '))
		if (!userData) {
			return res.status(404).json({ success: false, message: 'User does not exist' })
		}

		return res.status(200).json({ success: true, message: 'Data retrieved successfully', userData })
	} catch (error) {
		console.error('Error while retrieving user data:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const sendVerifyAccountOtp = async (req, res) => {
	try {
		const { id } = req.user
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing User details' })
		}

		const user = await userModel.findById(id)
		if (!user) {
			return res.status(404).json({ success: false, message: 'User does not exist' })
		}
		if (user.isAccountVerified) {
			return res.status(400).json({ success: false, message: 'User is already verified' })
		}

		const otp = String(Math.floor(100000 + Math.random() * 900000))
		const hashedOtp = await bcrypt.hash(otp, 10)

		try {
			const mailOptions = {
				from: process.env.SENDER_EMAIL,
				to: user.email,
				subject: 'OTP to verify your account',
				text: `OTP to verify your account is ${otp}. It will expire in next 5 minutes.`
			}
			await transporter.sendMail(mailOptions)
		} catch (emailError) {
			console.error('Error while sending account verification OTP via email:', emailError)
			return res.status(500).json({ success: false, message: 'Failed to send OTP via email' })
		}

		const updatedUser = await userModel.findByIdAndUpdate(id, {
			$set: {
				verifyAccountOtp: hashedOtp,
				verifyAccountOtpExpiresAt: Date.now() + 5 * 60 * 1000
			}
		})
		if (!updatedUser) {
			return res.status(500).json({ success: false, message: 'Failed to send OTP' })
		}

		return res.status(200).json({ success: true, message: 'An OTP to verify account has been sent successfully to your registered email address' })
	} catch (error) {
		console.error('Error while sending account verification OTP:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const verifyAccount = async (req, res) => {
	try {
		const { id } = req.user
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing User details' })
		}

		const { otp } = req.body
		if (!otp) {
			return res.status(400).json({ success: false, message: 'Missing OTP' })
		}

		const user = await userModel.findById(id)
		if (!user) {
			return res.status(404).json({ success: false, message: 'User does not exist' })
		}
		if (user.isAccountVerified) {
			return res.status(400).json({ success: false, message: 'User is already verified' })
		}
		if (user.verifyAccountOtpExpiresAt < Date.now()) {
			return res.status(400).json({ success: false, message: 'OTP has expired' })
		}
		const otpCheck = await bcrypt.compare(otp, user.verifyAccountOtp)
		if (!otpCheck || user.verifyAccountOtp === '' || user.verifyAccountOtp === null || otp === '') {
			return res.status(400).json({ success: false, message: 'Incorrect OTP' })
		}

		const updatedUser = await userModel.findByIdAndUpdate(id, {
			$set: {
				isAccountVerified: true,
				verifyAccountOtp: null,
				verifyAccountOtpExpiresAt: null,
				accountVerifiedAt: Date.now()
			}
		})
		if (!updatedUser) {
			return res.status(500).json({ success: false, message: 'Failed to verify OTP' })
		}

		try {
			const mailOptions = {
				from: process.env.SENDER_EMAIL,
				to: user.email,
				subject: 'Account verified successfully',
				text: 'Your account has been verified successfully.'
			}
			await transporter.sendMail(mailOptions)
		} catch (emailError) {}

		return res.status(200).json({ success: true, message: 'User verified successfully' })
	} catch (error) {
		console.error('Error while verifying user account:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const sendResetPasswordOtp = async (req, res) => {
	try {
		const { id } = req.user
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing User details' })
		}

		const user = await userModel.findById(id)
		if (!user) {
			return res.status(404).json({ success: false, message: 'User does not exist' })
		}

		const otp = String(Math.floor(100000 + Math.random() * 900000))
		const hashedOtp = await bcrypt.hash(otp, 10)

		try {
			const mailOptions = {
				from: process.env.SENDER_EMAIL,
				to: user.email,
				subject: 'OTP to reset your password',
				text: `OTP to reset your password is ${otp}. It will expire in next 5 minutes.`
			}
			await transporter.sendMail(mailOptions)
		} catch (emailError) {
			console.error('Error while sending reset password OTP via email:', emailError)
			return res.status(500).json({ success: false, message: 'Failed to send OTP via email' })
		}

		const updatedUser = await userModel.findByIdAndUpdate(id, {
			$set: {
				resetPasswordOtp: hashedOtp,
				resetPasswordOtpExpiresAt: Date.now() + 5 * 60 * 1000
			}
		})
		if (!updatedUser) {
			return res.status(500).json({ success: false, message: 'Failed to send OTP' })
		}

		return res.status(200).json({ success: true, message: 'An OTP to reset password has been sent successfully to your registered email address' })
	} catch (error) {
		console.error('Error while sending reset password OTP:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const resetPassword = async (req, res) => {
	try {
		const { id } = req.user
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing User details' })
		}

		const { otp, newPassword } = req.body
		if (!otp || !newPassword) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const user = await userModel.findById(id)
		if (!user) {
			return res.status(404).json({ success: false, message: 'User does not exist' })
		}
		if (user.resetPasswordOtpExpiresAt < Date.now()) {
			return res.status(400).json({ success: false, message: 'OTP has expired' })
		}
		const otpCheck = await bcrypt.compare(otp, user.resetPasswordOtp)
		if (!otpCheck || user.resetPasswordOtp === '' || user.resetPasswordOtp === null || otp === '') {
			return res.status(400).json({ success: false, message: 'Incorrect OTP' })
		}

		const passwordCheck = await bcrypt.compare(newPassword, user.password)
		if (passwordCheck) {
			return res.status(400).json({ success: false, message: 'Old and new password cannot be same' })
		}

		const hashedNewPassword = await bcrypt.hash(newPassword, 10)

		const updatedUser = await userModel.findByIdAndUpdate(id, {
			$set: {
				resetPasswordOtp: null,
				resetPasswordOtpExpiresAt: null,
				password: hashedNewPassword,
				passwordChangedAt: Date.now()
			}
		})
		if (!updatedUser) {
			return res.status(500).json({ success: false, message: 'Failed to reset password' })
		}

		res.clearCookie('token', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
		})

		return res.status(200).json({ success: true, message: 'Password changed successfully. Please login again' })
	} catch (error) {
		console.error('Error while resetting user password:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const updateUserProfile = async (req, res) => {
	try {
		const { id } = req.user
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing User details' })
		}

		const { newName, newEmail } = req.body
		if (!newName || !newEmail) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}
		const normalizedEmail = newEmail.trim().toLowerCase()

		const emailCheck = await userModel.findOne({ email: normalizedEmail })
		if (emailCheck) {
			return res.status(400).json({ success: false, message: 'Account with this email address already exists' })
		}

		const user = await userModel.findById(id)
		if (!user) {
			return res.status(404).json({ success: false, message: 'User does not exist' })
		}

		const nameChanged = newName !== user.name
		const emailChanged = normalizedEmail !== user.email
		if (!nameChanged && !emailChanged) {
			return res.status(400).json({ success: false, message: 'Old and new information cannot be same' })
		}

		const update = {
			$set: {
				name: newName,
				email: normalizedEmail
			},
			$push: {}
		}

		if (nameChanged) {
			update.$push['updates.nameUpdates'] = {
				$each: [
					{
						oldName: user.name,
						newName
					}
				],
				$position: 0,
				$slice: 3
			}
		}
		if (emailChanged) {
			update.$set.isAccountVerified = false
			update.$set.accountVerifiedAt = null
			update.$push['updates.emailUpdates'] = {
				$each: [
					{
						oldEmail: user.email,
						newEmail: normalizedEmail
					}
				],
				$position: 0,
				$slice: 3
			}
		}

		const updatedUser = await userModel.findByIdAndUpdate(id, update, {
			new: true,
			runValidators: true
		})
		if (!updatedUser) {
			return res.status(500).json({ success: false, message: 'Failed to update information' })
		}

		return res.status(200).json({ success: true, message: 'Profile updated successfully' })
	} catch (error) {
		console.error('Error while updating user profile:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const updateProfilePicture = async (req, res) => {
	try {
		const { id } = req.user
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing User details' })
		}

		const { profilePicture } = req.body
		if (!profilePicture) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const updatedUser = await userModel.findByIdAndUpdate(
			id,
			{
				$set: profilePicture
			},
			{ new: true, runValidators: true }
		)
		if (!updatedUser) {
			return res.status(500).json({ success: false, message: 'Failed to update profile picture' })
		}

		return res.status(200).json({ success: true, message: 'Profile picture updated successfully' })
	} catch (error) {
		console.error('Error while updating profile picture:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const addAddress = async (req, res) => {
	try {
		const { id } = req.user
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing User details' })
		}

		const { firstName, lastName, addressLine1, addressLine2, landmark, area, city, pincode, state, contactNo, addressType, addressLabel } = req.body
		if (!firstName || !lastName || !addressLine1 || !addressLine2 || !area || !city || !pincode || !state || !contactNo || !addressType) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const user = await userModel.findById(id)
		if (!user) {
			return res.status(404).json({ success: false, message: 'User does not exist' })
		}

		const isDefault = user.addresses.length < 1

		const newAddress = await userModel.findByIdAndUpdate(
			id,
			{
				$push: {
					addresses: {
						firstName,
						lastName,
						addressLine1,
						addressLine2,
						landmark,
						area,
						city,
						pincode,
						state,
						contactNo,
						addressType,
						addressLabel: addressType === 'other' ? addressLabel : '',
						isDefault
					}
				}
			},
			{ new: true, runValidators: true }
		)
		if (!newAddress) {
			return res.status(500).json({ success: false, message: 'Failed to add address' })
		}

		return res.status(200).json({ success: true, message: 'Address added successfully' })
	} catch (error) {
		console.error('Error while adding address:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const editAddress = async (req, res) => {
	try {
		const { id } = req.user
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing User details' })
		}

		const { addressId } = req.params
		if (!addressId) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const user = await userModel.findById(id)
		if (!user) {
			return res.status(404).json({ success: false, message: 'User does not exist' })
		}

		const addressToCheck = user.addresses.id(addressId)
		if (!addressToCheck) {
			return res.status(404).json({ success: false, message: 'Address does not exist' })
		}

		const { newFirstName, newLastName, newAddressLine1, newAddressLine2, newLandmark, newArea, newCity, newPincode, newState, newContactNo, newAddressType, newAddressLabel } = req.body
		if (!newFirstName || !newLastName || !newAddressLine1 || !newAddressLine2 || !newArea || !newCity || !newPincode || !newState || !newContactNo || !newAddressType) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const firstNameChanged = newFirstName !== addressToCheck.firstName
		const lastNameChanged = newLastName !== addressToCheck.lastName
		const addressLine1Changed = newAddressLine1 !== addressToCheck.addressLine1
		const addressLine2Changed = newAddressLine2 !== addressToCheck.addressLine2
		const landmarkChanged = newLandmark !== addressToCheck.landmark
		const areaChanged = newArea !== addressToCheck.area
		const cityChanged = newCity !== addressToCheck.city
		const pincodeChanged = newPincode !== addressToCheck.pincode
		const stateChanged = newState !== addressToCheck.state
		const contactNoChanged = newContactNo !== addressToCheck.contactNo
		const addressTypeChanged = newAddressType !== addressToCheck.addressType
		const addressLabelChanged = newAddressType === 'other' && newAddressLabel !== addressToCheck.addressLabel
		if (!firstNameChanged && !lastNameChanged && !addressLine1Changed && !addressLine2Changed && !landmarkChanged && !areaChanged && !cityChanged && !pincodeChanged && !stateChanged && !contactNoChanged && !addressTypeChanged && !addressLabelChanged) {
			return res.status(400).json({ success: false, message: 'Old and new information cannot be same' })
		}

		const updatedAddress = await userModel.findOneAndUpdate(
			{
				_id: id,
				'addresses._id': addressId
			},
			{
				$set: {
					'addresses.$.firstName': newFirstName,
					'addresses.$.lastName': newLastName,
					'addresses.$.addressLine1': newAddressLine1,
					'addresses.$.addressLine2': newAddressLine2,
					'addresses.$.landmark': newLandmark,
					'addresses.$.area': newArea,
					'addresses.$.city': newCity,
					'addresses.$.pincode': newPincode,
					'addresses.$.state': newState,
					'addresses.$.addressType': newAddressType,
					'addresses.$.addressLabel': newAddressType === 'other' ? newAddressLabel : '',
					'addresses.$.contactNo': newContactNo
				}
			},
			{ new: true, runValidators: true }
		)
		if (!updatedAddress) {
			return res.status(500).json({ success: false, message: 'Failed to edit address' })
		}

		return res.status(200).json({ success: true, message: 'Address edited successfully' })
	} catch (error) {
		console.error('Error while editing address:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const markAddressAsDefault = async (req, res) => {
	try {
		const { id } = req.user
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing User details' })
		}

		const { addressId } = req.params
		if (!addressId) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const addressToMarkAsDefault = await userModel.findOne(
			{
				_id: id,
				'addresses._id': addressId
			},
			{
				'addresses.$': 1
			}
		)
		if (!addressToMarkAsDefault) {
			return res.status(404).json({ success: false, message: 'Address not found' })
		}
		if (addressToMarkAsDefault.addresses[0].isDefault) {
			return res.status(400).json({ success: false, message: 'Address is already marked as default' })
		}

		const updatedUser = await userModel.findByIdAndUpdate(id, {
			$set: {
				'addresses.$[].isDefault': false
			}
		})
		if (!updatedUser) {
			return res.status(500).json({ success: false, message: 'Failed to edit address' })
		}

		const updatedAddress = await userModel.findOneAndUpdate(
			{
				_id: id,
				'addresses._id': addressId
			},
			{
				$set: {
					'addresses.$.isDefault': true
				}
			},
			{ new: true }
		)
		await updatedAddress.validate()
		if (!updatedAddress) {
			return res.status(500).json({ success: false, message: 'Failed to edit address' })
		}

		return res.status(200).json({ success: true, message: 'Address marked as default successfully' })
	} catch (error) {
		console.error('Error while marking address as default:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const deleteAddress = async (req, res) => {
	try {
		const { id } = req.user
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing User details' })
		}

		const { addressId } = req.params
		if (!addressId) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const deletedAddress = await userModel.findOneAndUpdate(
			{
				_id: id,
				'addresses._id': addressId
			},
			{
				$pull: {
					addresses: {
						_id: addressId
					}
				}
			},
			{ new: true }
		)
		if (!deletedAddress) {
			return res.status(500).json({ success: false, message: 'Failed to delete address' })
		}

		return res.status(200).json({ success: true, message: 'Address deleted successfully' })
	} catch (error) {
		console.error('Error while deleting address:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const addProductInWishlist = async (req, res) => {
	try {
		const { id } = req.user
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing User details' })
		}

		const { productId } = req.params
		if (!productId) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const productCheck = await productModel.findById(productId)
		if (!productCheck) {
			return res.status(404).json({ success: false, message: 'Product does not exist' })
		}

		const updatedUser = await userModel.findOneAndUpdate(
			{
				_id: id
			},
			{
				$addToSet: {
					wishlist: productId
				}
			},
			{ new: true, runValidators: true }
		)
		if (!updatedUser) {
			return res.status(500).json({ success: false, message: 'Failed to add it in wishlist' })
		}

		return res.status(200).json({ success: true, message: 'Product added in wishlist' })
	} catch (error) {
		console.error('Error while adding product in wishlist:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const removeProductFromWishlist = async (req, res) => {
	try {
		const { id } = req.user
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing User details' })
		}

		const { productId } = req.params
		if (!productId) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const productCheck = await productModel.findById(productId)
		if (!productCheck) {
			return res.status(404).json({ success: false, message: 'Product does not exist' })
		}

		const updatedUser = await userModel.findOneAndUpdate(
			{
				_id: id
			},
			{
				$pull: {
					wishlist: productId
				}
			},
			{ new: true, runValidators: true }
		)
		if (!updatedUser) {
			return res.status(500).json({ success: false, message: 'Failed to remove it from wishlist' })
		}

		return res.status(200).json({ success: true, message: 'Product removed from wishlist' })
	} catch (error) {
		console.error('Error while removing product from wishlist:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const getWishlist = async (req, res) => {
	try {
		const { id } = req.user
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing User details' })
		}

		const user = await userModel.findById(id).populate('wishlist')
		if (!user) {
			return res.status(404).json({ success: false, message: 'User does not exist' })
		}

		return res.status(200).json({ success: true, message: 'Wishlist retrieved successfully', wishlist: user.wishlist })
	} catch (error) {
		console.error('Error while retrieving wishlist:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}
