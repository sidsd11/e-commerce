import productModel from '../models/productModel.js'
import cloudinary from '../config/cloudinary.js'

export const addProduct = async (req, res) => {
	try {
		const { name, description, price, category, gender, status, stock } = req.body
		const { size, quantity } = stock
		if (!name || !description || price === undefined || !category || !gender || !status || !stock || !size || quantity === undefined) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const { adminId, adminName, adminEmail } = req.editorAdmin
		if (!adminId || !adminName || !adminEmail) {
			return res.status(400).json({ success: false, message: 'Missing Admin details' })
		}

		const existingProduct = await productModel.findOne({ name })
		if (existingProduct) {
			return res.status(400).json({ success: false, message: 'Product already exists' })
		}

		const images = req.files || []

		const imagesUrl = await Promise.all(
			images.map((item) => {
				return new Promise((resolve, reject) => {
					const uploadStream = cloudinary.uploader.upload_stream(
						{
							folder: 'Astitra/products',
							resource_type: 'image'
						},
						(error, result) => {
							if (error) {
								reject(error)
							} else {
								resolve(result.secure_url)
							}
						}
					)
					uploadStream.end(item.buffer)
				})
			})
		)

		const addedBy = { adminId, adminName, adminEmail }

		const newProduct = new productModel({
			name,
			description,
			price,
			category,
			gender,
			status,
			images: imagesUrl,
			stock: { size, quantity },
			addedBy,
			'updates.stockUpdates.stockAdded': [
				{
					addedBy,
					addedStock: [
						{
							size,
							quantity
						}
					]
				}
			]
		})
		await newProduct.save()

		return res.status(201).json({ success: true, message: 'Product added successfully' })
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const addStock = async (req, res) => {
	try {
		const { id } = req.params
		const { stock } = req.body
		const { size, quantity } = stock
		if (!id || !stock || !size || !quantity) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const { adminId, adminName, adminEmail } = req.editorAdmin
		if (!adminId || !adminName || !adminEmail) {
			return res.status(400).json({ success: false, message: 'Missing Admin details' })
		}

		const existingProduct = await productModel.findById(id)
		if (!existingProduct) {
			return res.status(404).json({ success: false, message: 'Product does not exist' })
		}

		const stockItem = existingProduct.stock.find((item) => item.size === size)
		if (stockItem) {
			return res.status(400).json({ success: false, message: 'Size already exists' })
		}

		const addedBy = { adminId, adminName, adminEmail }

		const addedProductStock = await productModel.findByIdAndUpdate(
			id,
			{
				$push: {
					stock: {
						$each: [
							{
								size,
								quantity
							}
						],
						$position: 0
					},
					'updates.stockUpdates.stockAdded': {
						$each: [
							{
								addedBy,
								addedStock: [
									{
										size,
										quantity
									}
								]
							}
						],
						$position: 0
					}
				}
			},
			{ new: true, runValidators: true }
		)
		if (!addedProductStock) {
			return res.status(404).json({ success: false, message: 'Product does not exist' })
		}

		return res.status(200).json({ success: true, message: 'Stock added successfully' })
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const deteleStock = async (req, res) => {
	try {
		const { productId, id } = req.params
		if (!productId || !id) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const { adminId, adminName, adminEmail } = req.editorAdmin
		if (!adminId || !adminName || !adminEmail) {
			return res.status(400).json({ success: false, message: 'Missing Admin details' })
		}

		const stockCheck = await productModel.findOne({
			id: productId,
			'stock._id': id
		})
		if (!stockCheck) {
			return res.status(404).json({ success: false, message: 'Stock does not exist' })
		}

		const stockItem = stockCheck.stock.find((stock) => stock._id.toString() === id.toString())
		if (!stockItem) {
			return res.status(404).json({ success: false, message: 'Stock does not exist' })
		}

		const deletedBy = { adminId, adminName, adminEmail }
		const deletedStock = {
			size: stockItem.size,
			quantity: stockItem.quantity
		}
		const updatedProduct = await productModel.findOneAndUpdate(
			{
				id: productId,
				'stock._id': id
			},
			{
				$pull: {
					stock: {
						_id: id
					}
				},
				$push: {
					'updates.stockUpdates.stockDeleted': {
						$each: [
							{
								deletedBy,
								deletedStock
							}
						],
						$position: 0
					}
				}
			},
			{ new: true }
		)
		if (!updatedProduct) {
			return res.status(400).json({ success: false, message: 'Failed to delete stock' })
		}

		return res.status(200).json({ success: true, message: 'Stock deleted successfully' })
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const updateProductData = async (req, res) => {
	try {
		const { id } = req.params
		const { newName, newDescription, newPrice, newCategory, newGender, newStatus, newStock } = req.body
		const { oldStockItems, newStockItems } = newStock
		if (!id || !newName || !newDescription || newPrice === undefined || !newCategory || !newGender || !newStatus || !newStock || !oldStockItems || !newStockItems) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const { adminId, adminName, adminEmail } = req.editorAdmin
		if (!adminId || !adminName || !adminEmail) {
			return res.status(400).json({ success: false, message: 'Missing Admin details' })
		}

		const existingProduct = await productModel.findById(id)
		if (!existingProduct) {
			return res.status(404).json({ success: false, message: 'Product does not exist' })
		}

		const stockItem = existingProduct.stock.find((item) => item.size === oldSize)
		if (!stockItem) {
			return res.status(404).json({ success: false, message: 'Size does not exist' })
		}

		const nameChanged = newName !== existingProduct.name
		const descriptionChanged = newDescription !== existingProduct.description
		const priceChanged = newPrice !== existingProduct.price
		const categoryChanged = newCategory !== existingProduct.category
		const genderChanged = newGender !== existingProduct.gender
		const statusChanged = newStatus !== existingProduct.status
		const sizeChanged = newSizes !== stockItem.size
		const quantityChanged = newQuantities !== stockItem.quantity

		if (!nameChanged && !descriptionChanged && !priceChanged && !categoryChanged && !genderChanged && !statusChanged && !sizeChanged && !quantityChanged) {
			return res.status(400).json({ success: false, message: 'Old and new information is same' })
		}

		const updates = {
			$set: {
				name: newName,
				description: newDescription,
				price: newPrice,
				category: newCategory,
				gender: newGender,
				status: newStatus
			},
			$push: {}
		}

		const editedBy = { adminId, adminName, adminEmail }

		if (nameChanged) {
			updates.$push['updates.nameUpdates'] = {
				$each: [
					{
						editedBy,
						oldName: existingProduct.name,
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
						oldDescription: existingProduct.description,
						newDescription
					}
				],
				$position: 0
			}
		}
		if (priceChanged) {
			updates.$push['updates.priceUpdates'] = {
				$each: [
					{
						editedBy,
						oldPrice: existingProduct.price,
						newPrice
					}
				],
				$position: 0
			}
		}
		if (categoryChanged) {
			updates.$push['updates.categoryUpdates'] = {
				$each: [
					{
						editedBy,
						oldCategory: existingProduct.category,
						newCategory
					}
				],
				$position: 0
			}
		}
		if (genderChanged) {
			updates.$push['updates.genderUpdates'] = {
				$each: [
					{
						editedBy,
						oldGender: existingProduct.gender,
						newGender
					}
				],
				$position: 0
			}
		}
		if (statusChanged) {
			updates.$push['updates.statusUpdates'] = {
				$each: [
					{
						editedBy,
						oldStatus: existingProduct.status,
						newStatus
					}
				],
				$position: 0
			}
		}
		if (sizeChanged) {
			const sizeExists = existingProduct.stock.some((item) => item.size === newSize)
			if (sizeExists) {
				return res.status(400).json({ success: false, message: 'Size already exists' })
			}
			updates.$set['stock.$[item].size'] = newSize
			updates.$push['updates.stockUpdates.sizeUpdates'] = {
				$each: [
					{
						editedBy,
						oldSize,
						newSize
					}
				],
				$position: 0
			}
		}
		if (quantityChanged) {
			updates.$set['stock.$[item].quantity'] = newQuantity
			updates.$push['updates.stockUpdates.quantityUpdates'] = {
				$each: [
					{
						editedBy,
						oldQuantity: stockItem.quantity,
						newQuantity
					}
				],
				$position: 0
			}
		}

		await productModel.findByIdAndUpdate(id, updates, {
			new: true,
			runValidators: true,
			arrayFilters: sizeChanged
				? [
						{
							'item.size': oldSize
						}
					]
				: []
		})

		return res.status(200).json({ success: true, message: 'Product updated successfully' })
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const getAllProductsData = async (req, res) => {
	try {
		const allProductsData = await productModel.find().select({
			updatedAt: 0,
			__v: 0
		})
		if (!allProductsData) {
			return res.status(404).json({ success: false, message: 'Product does not exist' })
		}

		return res.status(200).json({ success: true, message: 'All products data retrieved successfully', allProductsData })
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const getProductData = async (req, res) => {
	try {
		const { id } = req.params
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const productData = await productModel.findById(id).select({
			updatedAt: 0,
			__v: 0
		})
		if (!productData) {
			return res.status(404).json({ success: false, message: 'Product does not exist' })
		}

		return res.status(200).json({ success: true, message: 'Product data retrieved successfully', productData })
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}

export const deleteProduct = async (req, res) => {
	try {
		const { id } = req.params
		if (!id) {
			return res.status(400).json({ success: false, message: 'Missing details' })
		}

		const deleteProduct = await productModel.findByIdAndDelete(id)
		if (!deleteProduct) {
			return res.status(404).json({ success: false, message: 'Product does not exist' })
		}

		return res.status(200).json({ success: true, message: 'Product deleted successfully' })
	} catch (error) {
		return res.status(500).json({ success: false, message: 'Something went wrong' })
	}
}
