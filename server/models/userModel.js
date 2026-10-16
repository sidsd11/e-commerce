import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
	{
		uniqueUserId: { type: String, required: true, unique: true, immutable: true },
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, trim: true, lowercase: true },
		password: { type: String, default: null },
		googleId: { type: String, unique: true, sparse: true },
		isAccountVerified: { type: Boolean, required: true, default: false },
		accountVerifiedAt: { type: Date, default: null },
		verifyAccountOtp: { type: String, default: null },
		verifyAccountOtpExpiresAt: { type: Date, default: null },
		resetPasswordOtp: { type: String, default: null },
		resetPasswordOtpExpiresAt: { type: Date, default: null },
		passwordChangedAt: { type: Date, default: null },
		profilePicture: { type: String, default: '' },
		addresses: {
			type: [
				{
					firstName: { type: String, required: true, trim: true },
					lastName: { type: String, required: true, trim: true },
					addressLine1: { type: String, required: true, trim: true },
					addressLine2: { type: String, default: '', trim: true },
					landmark: { type: String, default: '', trim: true },
					area: { type: String, required: true, trim: true },
					city: { type: String, required: true, trim: true },
					pincode: { type: String, required: true, match: /^[1-9][0-9]{5}$/, trim: true },
					state: { type: String, required: true, trim: true },
					contactNo: { type: String, required: true, match: /^\d{10}$/, trim: true },
					addressType: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
					addressLabel: { type: String, default: '', trim: true },
					isDefault: { type: Boolean, default: false }
				}
			],
			validate: {
				validator: function (addresses) {
					return addresses.filter((address) => address.isDefault).length <= 1
				},
				message: 'Only 1 address can be default'
			}
		},
		status: { type: String, enum: ['active', 'blocked', 'suspended', 'deleted'], default: 'active' },
		wishlist: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'products'
			}
		],
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
			statusUpdates: [
				{
					editedBy: {
						uniqueAdminId: { type: String, required: true },
						adminName: { type: String, required: true },
						adminEmail: { type: String, required: true }
					},
					oldStatus: { type: String, required: true, enum: ['active', 'blocked', 'suspended', 'deleted'] },
					newStatus: { type: String, required: true, enum: ['active', 'blocked', 'suspended', 'deleted'] },
					reason: { type: String, default: '', trim: true },
					timestamp: { type: Date, default: Date.now }
				}
			]
		}
	},
	{ timestamps: true }
)

const userModel = mongoose.models.users || mongoose.model('users', userSchema)
export default userModel
