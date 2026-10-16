import adminModel from '../../models/adminModel.js'
import userModel from '../../models/userModel.js'

export const updateAdminData = async (req, res) => {
	try {
		const { id } = req.admin
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing Admin details' })
		}

		const { newName, newEmail } = req.body
		if (!newName || !newEmail) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const emailCheck = await adminModel.findOne({ email: newEmail })
		if (emailCheck) {
			return res.status(400).json({ success: false, message: 'Account with this email address already exists' })
		}

		const admin = await adminModel.findById(id)
		if (!admin) {
			return res.status(404).json({ success: false, message: 'Admin does not exist' })
		}

		const nameChanged = newName !== admin.name
		const emailChanged = newEmail !== admin.email
		if (!nameChanged && !emailChanged) {
			return res.status(400).json({ success: false, message: 'Old and new information is same' })
		}

		const update = {
			$set: {
				name: newName,
				email: newEmail
			},
			$push: {}
		}

		if (nameChanged) {
			update.$push['updates.nameUpdates'] = {
				$each: [
					{
						oldName: admin.name,
						newName
					}
				],
				$position: 0,
				$slice: 3
			}
		}
		if (emailChanged) {
			update.$push['updates.emailUpdates'] = {
				$each: [
					{
						oldEmail: admin.email,
						newEmail
					}
				],
				$position: 0,
				$slice: 3
			}
		}

		const updatedAdmin = await adminModel.findByIdAndUpdate(id, update, { new: true, runValidators: true })
		if (!updatedAdmin) {
			return res.status(500).json({ success: false, message: 'Failed to update information' })
		}

		return res.status(200).json({ success: true, message: 'Information updated successfully' })
	} catch (error) {
		console.error('Error while updating admin data:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const changeAdminRole = async (req, res) => {
	try {
		const { adminId } = req.params
		const { newRole, reason } = req.body
		if (!adminId || !newRole) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const { uniqueAdminId, adminName, adminEmail } = req.admin
		if (!uniqueAdminId || !adminName || !adminEmail) {
			return res.status(400).json({ success: false, message: 'Missing Admin details' })
		}
		const editedBy = { uniqueAdminId, adminName, adminEmail }

		const toBeUpdatedAdmin = await adminModel.findById(adminId)
		if (!toBeUpdatedAdmin) {
			return res.status(404).json({ success: false, message: 'Admin whose role you want to change does not exist' })
		}

		const roleChanged = newRole !== toBeUpdatedAdmin.role
		if (!roleChanged) {
			return res.status(400).json({ success: false, message: 'Old and new role is same' })
		}

		const updatedAdmin = await adminModel.findByIdAndUpdate(
			adminId,
			{
				$push: {
					'updates.roleUpdates': {
						$each: [
							{
								editedBy,
								oldRole: toBeUpdatedAdmin.role,
								newRole,
								reason: reason || ''
							}
						],
						$position: 0,
						$slice: 3
					}
				}
			},
			{ new: true, runValidators: true }
		)
		if (!updatedAdmin) {
			return res.status(500).json({ success: false, message: 'Failed to update role' })
		}

		return res.status(200).json({ success: true, message: 'Role changed successfully' })
	} catch (error) {
		console.error('Error while changing admin role:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const changeAdminStatus = async (req, res) => {
	try {
		const { adminId } = req.params
		const { newStatus, reason } = req.body
		if (!adminId || !newStatus) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const { uniqueAdminId, adminName, adminEmail } = req.admin
		if (!uniqueAdminId || !adminName || !adminEmail) {
			return res.status(400).json({ success: false, message: 'Missing Admin details' })
		}
		const editedBy = { uniqueAdminId, adminName, adminEmail }

		const toBeUpdatedAdmin = await adminModel.findById(adminId)
		if (!toBeUpdatedAdmin) {
			return res.status(404).json({ success: false, message: 'Admin whose status you want to change does not exist' })
		}

		const statusChanged = newStatus !== toBeUpdatedAdmin.status
		if (!statusChanged) {
			return res.status(400).json({ success: false, message: 'Old and new status is same' })
		}

		const updatedAdmin = await adminModel.findByIdAndUpdate(
			adminId,
			{
				$set: {
					status: newStatus
				},
				$push: {
					'updates.statusUpdates': {
						$each: [
							{
								editedBy,
								oldStatus: toBeUpdatedAdmin.status,
								newStatus,
								reason: reason || ''
							}
						],
						$position: 0,
						$slice: 3
					}
				}
			},
			{ new: true, runValidators: true }
		)
		if (!updatedAdmin) {
			return res.status(500).json({ success: false, message: 'Failed to update status' })
		}

		return res.status(200).json({ success: true, message: 'Admin status changed successfully' })
	} catch (error) {
		console.error('Error while changing admin status:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const changeUserStatus = async (req, res) => {
	try {
		const { userId } = req.params
		const { newStatus, reason } = req.body
		if (!userId || !newStatus) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const { uniqueAdminId, adminName, adminEmail } = req.admin
		if (!uniqueAdminId || !adminName || !adminEmail) {
			return res.status(400).json({ success: false, message: 'Missing Admin details' })
		}
		const editedBy = { uniqueAdminId, adminName, adminEmail }

		const toBeUpdatedUser = await userModel.findById(userId)
		if (!toBeUpdatedUser) {
			return res.status(404).json({ success: false, message: 'User whose status you want to change does not exist' })
		}

		const statusChanged = newStatus !== toBeUpdatedUser.status
		if (!statusChanged) {
			return res.status(400).json({ success: false, message: 'Old and new status is same' })
		}

		const updatedUser = await userModel.findByIdAndUpdate(userId, {
			$set: {
				status: newStatus
			},
			$push: {
				'updates.statusUpdates': {
					$each: [
						{
							editedBy,
							oldStatus: toBeUpdatedUser.status,
							newStatus: newStatus,
							reason: reason || ''
						}
					]
				}
			}
		})
		if (!updatedUser) {
			return res.status(404).json({ success: false, message: 'User does not exist' })
		}

		return res.status(200).json({ success: true, message: 'User status changed successfully' })
	} catch (error) {
		console.error('Error while changing user status:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const getAllAdminsDetailedData = async (req, res) => {
	try {
		const { fields } = req.body
		if (!fields || !Array.isArray(fields)) {
			return res.status(400).json({ success: false, message: 'Missing or invalid details' })
		}

		const { id } = req.admin
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing Admin details' })
		}

		const allowedFields = ['_id', 'uniqueAdminId', 'name', 'email', 'role', 'updates', 'status', 'createdAt']
		const toBeSentFields = fields.filter((field) => allowedFields.includes(field))
		if (toBeSentFields.length === 0) {
			return res.status(400).json({ success: false, message: 'No valid fields requested' })
		}

		const allAdminsDetailedData = await adminModel.find().select(toBeSentFields.join(' '))
		if (!allAdminsDetailedData) {
			return res.status(404).json({ success: false, message: 'Admin does not exist' })
		}

		return res.status(200).json({ success: true, message: 'All data retrieved successfully', allAdminsDetailedData })
	} catch (error) {
		console.error('Error while retrieving all admins detailed data:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const getSingleAdminDetailedData = async (req, res) => {
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

		const adminDetailedData = await adminModel.findById(adminId).select(toBeSentFields.join(' '))
		if (!adminDetailedData) {
			return res.status(404).json({ success: false, message: 'Admin does not exist' })
		}

		return res.status(200).json({ success: true, message: 'Data retrieved successfully', adminDetailedData })
	} catch (error) {
		console.error('Error while retrieving single admin detailed data:', error)
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}
