import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true, trim: true },
		description: { type: String, required: true, default: '', trim: true },
		price: { type: Number, required: true, min: 0 },
		images: { type: [String], default: [] },
		category: { type: String, required: true, default: '', trim: true },
		gender: { type: String, required: true, enum: ['Boy', 'Girl', 'Both'] },
		stock: [
			{
				size: { type: String, required: true, trim: true },
				quantity: { type: Number, required: true, min: 0 }
			}
		],
		status: { type: String, enum: ['Active', 'Inactive'], default: 'Inactive' },
		isOutOfStock: { type: Boolean, required: true, default: false },
		addedBy: {
			uniqueAdminId: { type: String, required: true },
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
					reason: { type: String, default: '', trim: true },
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
					reason: { type: String, default: '', trim: true },
					timestamp: { type: Date, default: Date.now }
				}
			],
			priceUpdates: [
				{
					editedBy: {
						uniqueAdminId: { type: String, required: true },
						adminName: { type: String, required: true },
						adminEmail: { type: String, required: true }
					},
					oldPrice: { type: Number, required: true, min: 0 },
					newPrice: { type: Number, required: true, min: 0 },
					reason: { type: String, default: '', trim: true },
					timestamp: { type: Date, default: Date.now }
				}
			],
			imagesUpdates: [
				{
					editedBy: {
						uniqueAdminId: { type: String, required: true },
						adminName: { type: String, required: true },
						adminEmail: { type: String, required: true }
					},
					addedImages: {
						links: { type: [String] },
						timestamp: { type: Date, default: Date.now }
					},
					deletedImages: {
						links: { type: [String] },
						timestamp: { type: Date, default: Date.now }
					},
					reason: { type: String, default: '', trim: true },
					timestamp: { type: Date, default: Date.now }
				}
			],
			categoryUpdates: [
				{
					editedBy: {
						uniqueAdminId: { type: String, required: true },
						adminName: { type: String, required: true },
						adminEmail: { type: String, required: true }
					},
					oldCategory: { type: String, required: true },
					newCategory: { type: String, required: true, trim: true },
					reason: { type: String, default: '', trim: true },
					timestamp: { type: Date, default: Date.now }
				}
			],
			genderUpdates: [
				{
					editedBy: {
						uniqueAdminId: { type: String, required: true },
						adminName: { type: String, required: true },
						adminEmail: { type: String, required: true }
					},
					oldGender: { type: String, required: true, enum: ['Boy', 'Girl', 'Both'] },
					newGender: { type: String, required: true, enum: ['Boy', 'Girl', 'Both'] },
					reason: { type: String, default: '', trim: true },
					timestamp: { type: Date, default: Date.now }
				}
			],
			stockUpdates: {
				stockAdded: [
					{
						addedBy: {
							uniqueAdminId: { type: String, required: true },
							adminName: { type: String, required: true },
							adminEmail: { type: String, required: true }
						},
						addedStock: {
							size: { type: String, required: true, trim: true },
							quantity: { type: Number, required: true, min: 0 }
						},
						timestamp: { type: Date, default: Date.now }
					}
				],
				stockDeleted: [
					{
						deletedBy: {
							uniqueAdminId: { type: String, required: true },
							adminName: { type: String, required: true },
							adminEmail: { type: String, required: true }
						},
						deletedStock: {
							size: { type: String, required: true },
							quantity: { type: Number, required: true, min: 0 }
						},
						reason: { type: String, default: '', trim: true },
						timestamp: { type: Date, default: Date.now }
					}
				],
				stockUpdates: [
					{
						editedBy: {
							uniqueAdminId: { type: String, required: true },
							adminName: { type: String, required: true },
							adminEmail: { type: String, required: true }
						},
						oldStock: {
							size: { type: String, required: true },
							quantity: { type: Number, required: true, min: 0 }
						},
						newStock: {
							size: { type: String, required: true, trim: true },
							quantity: { type: Number, required: true, min: 0 }
						},
						reason: { type: String, default: '', trim: true },
						timestamp: { type: Date, default: Date.now }
					}
				]
			},
			statusUpdates: [
				{
					editedBy: {
						uniqueAdminId: { type: String, required: true },
						adminName: { type: String, required: true },
						adminEmail: { type: String, required: true }
					},
					oldStatus: { type: String, required: true, enum: ['Active', 'Inactive'] },
					newStatus: { type: String, required: true, enum: ['Active', 'Inactive'] },
					reason: { type: String, default: '', trim: true },
					timestamp: { type: Date, default: Date.now }
				}
			],
			outOfStockUpdates: [{ timestamp: { type: Date, default: Date.now } }]
		}
	},
	{ timestamps: true }
)

const productModel = mongoose.models.products || mongoose.model('products', productSchema)
export default productModel
