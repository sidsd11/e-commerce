import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema(
	{
		uniqueAdminId: { type: String, required: true, unique: true, immutable: true },
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, trim: true, lowercase: true },
		password: { type: String, required: true },
		role: { type: String, enum: ['Editor', 'Viewer', 'Administrator'], required: true, default: 'Viewer' },
		resetPasswordOtp: { type: String, default: null },
		resetPasswordOtpExpiresAt: { type: Date, default: null },
		passwordChangedAt: { type: Date, default: null },
		profilePicture: { type: String, default: '' },
		updates: {
			nameUpdates: [
				{
					oldName: { type: String, required: true },
					newName: { type: String, required: true, trim: true },
					timestamp: { type: Date, default: Date.now }
				}
			],
			emailUpdates: [
				{
					oldEmail: { type: String, required: true },
					newEmail: { type: String, required: true, trim: true, lowercase: true },
					timestamp: { type: Date, default: Date.now }
				}
			],
			roleUpdates: [
				{
					editedBy: {
						uniqueAdminId: { type: String, required: true },
						adminName: { type: String, required: true },
						adminEmail: { type: String, required: true }
					},
					oldRole: { type: String, enum: ['Editor', 'Viewer', 'Administrator'], required: true },
					newRole: { type: String, enum: ['Editor', 'Viewer', 'Administrator'], required: true },
					reason: { type: String, default: '', trim: true },
					timestamp: { type: Date, default: Date.now }
				}
			]
		},
		status: { type: String, enum: ['active', 'blocked', 'suspended', 'deleted'], default: 'active' }
	},
	{ timestamps: true }
)

const adminModel = mongoose.models.admins || mongoose.model('admins', adminSchema)
export default adminModel
