import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true, trim: true },
		description: { type: String, default: '', trim: true },
		addedBy: {
			adminId: { type: String, required: true },
			adminName: { type: String, required: true },
			adminEmail: { type: String, required: true }
		},
		updates: {
			nameUpdates: [
				{
					editedBy: {
						uniqueAdminId: { type: String, required: true },
						adminName: { type: String, required: true },
						adminEmail: { type: String, required: true }
					},
					oldName: { type: String, required: true },
					newName: { type: String, required: true, trim: true },
					timestamp: { type: Date, default: Date.now }
				}
			],
			descriptionUpdates: [
				{
					editedBy: {
						uniqueAdminId: { type: String, required: true },
						adminName: { type: String, required: true },
						adminEmail: { type: String, required: true }
					},
					oldDescription: { type: String, required: true },
					newDescription: { type: String, required: true, trim: true },
					timestamp: { type: Date, default: Date.now }
				}
			]
		}
	},
	{ timestamps: true }
)

const categoryModel = mongoose.models.categories || mongoose.model('categories', categorySchema)
export default categoryModel
