import crypto from 'crypto'

import userModel from '../models/userModel.js'
import adminModel from '../models/adminModel.js'

const generateUniqueId = async (type) => {
	const accountType = type.toLowerCase()
	const config = {
		user: {
			model: userModel,
			field: 'uniqueUserId'
		},
		admin: {
			model: adminModel,
			field: 'uniqueAdminId'
		}
	}
	if (!config[accountType]) {
		return 'Invalid'
	}

	const { model, field } = config[accountType]

	let uniqueId
	let uniqueIdExists = true
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
	const len = characters.length
	while (uniqueIdExists) {
		uniqueId = ''

		for (let i = 0; i < 6; i++) {
			const index = crypto.randomInt(0, len)
			uniqueId += characters[index]
		}

		uniqueIdExists = await model.exists({ [field]: uniqueId })
	}

	return uniqueId
}

export default generateUniqueId
