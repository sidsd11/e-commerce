import categoryModel from '../models/categoryModel.js'

export const addCategory = async (req, res) => {
	try {
		const { name, description } = req.body
		if (!name || !description) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const { adminId, adminName, adminEmail } = req.editorAdmin
		if (!adminId || !adminName || !adminEmail) {
			return res.status(400).json({ success: false, message: 'Missing Admin details' })
		}

		const existingCategory = await categoryModel.findOne({ name })
		if (existingCategory) {
			return res.status(400).json({ success: false, message: 'Category already exists' })
		}

		const newCategory = new categoryModel({
			name,
			description,
			addedBy: { adminId, adminName, adminEmail }
		})
		await newCategory.save()

		return res.status(201).json({ success: true, message: 'Category added successfully' })
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const updateCategoryData = async (req, res) => {
	try {
		const { id } = req.params
		const { newName, newDescription } = req.body
		if (!id || !newName || !newDescription) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const { adminId, adminName, adminEmail } = req.editorAdmin
		if (!adminId || !adminName || !adminEmail) {
			return res.status(400).json({ success: false, message: 'Missing Admin details' })
		}

		const existingCategory = await categoryModel.findById(id)
		if (!existingCategory) {
			return res.status(404).json({ success: false, message: 'Category does not exist' })
		}

		const nameChanged = newName !== existingCategory.name
		const descriptionChanged = newDescription !== existingCategory.description

		if (!nameChanged && !descriptionChanged) {
			return res.status(400).json({ success: false, message: 'Old and new information is same' })
		}

		const updates = {
			$set: {
				name: newName,
				description: newDescription
			},
			$push: {}
		}
		const editedBy = { adminId, adminName, adminEmail }

		if (nameChanged) {
			updates.$push['updates.nameUpdates'] = {
				$each: [
					{
						editedBy,
						oldName: existingCategory.name,
						newName
					}
				],
				$position: 0
			}
		}

		if (descriptionChanged) {
			updates.$push['updates.descriptionUpdates'] = {
				$each: [
					{
						editedBy,
						oldDescription: existingCategory.description,
						newDescription
					}
				],
				$position: 0
			}
		}

		await categoryModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true })

		return res.status(200).json({ success: true, message: 'Category updated successfully' })
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const getAllCategoriesData = async (req, res) => {
	try {
		const allCategoriesData = await categoryModel.find().select({
			updatedAt: 0,
			__v: 0
		})
		if (!allCategoriesData) {
			return res.status(404).json({ success: false, message: 'Category does not exist' })
		}

		return res.status(200).json({ success: true, message: 'All categories data retrieved successfully', allCategoriesData })
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const getSingleCategoryData = async (req, res) => {
	try {
		const { id } = req.params
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const categoryData = await categoryModel.findById(id).select({
			updatedAt: 0,
			__v: 0
		})
		if (!categoryData) {
			return res.status(404).json({ success: false, message: 'Category does not exist' })
		}

		return res.status(200).json({ success: true, message: 'Category data retrieved successfully', categoryData })
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const deleteCategory = async (req, res) => {
	try {
		const { id } = req.params
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const deleteCategory = await categoryModel.findByIdAndDelete(id)
		if (!deleteCategory) {
			return res.status(404).json({ success: false, message: 'Category does not exist' })
		}

		return res.status(200).json({ success: true, message: 'Category deleted successfully' })
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}
