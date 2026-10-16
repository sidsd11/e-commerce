import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
	{
		uniqueUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
		orderId: { type: String, required: true, unique: true, index: true },
		orderDate: { type: Date, default: Date.now },
		items: [
			{
				productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
				productName: { type: String, required: true },
				productSize: { type: String, required: true },
				quantity: { type: Number, required: true, min: 1 },
				price: { type: Number, required: true, min: 0 },
				discount: { type: Number, required: true, defailt: 0 }
			}
		],
		amount: { type: Number, required: true, min: 0 },
		paymentMode: { type: String, trim: true },
		paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded', 'Processing'], default: 'Pending' },
		deliveryStatus: {
			type: String,
			enum: ['Placed', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for delivery', 'Delivered', 'Cancelled'],
			default: 'Placed'
		},
		updates: {
			paymentStatusUpdates: [
				{
					oldPaymentStatus: { type: String, required: true, enum: ['Pending', 'Paid', 'Failed', 'Refunded', 'Processing'] },
					newPaymentStatus: { type: String, required: true, enum: ['Pending', 'Paid', 'Failed', 'Refunded', 'Processing'] },
					timestamp: { type: Date, default: Date.now }
				}
			],
			deliveryStatusUpdates: [
				{
					oldDeliveryStatus: { type: String },
					newDeliveryStatus: { type: String },
					timestamp: { type: Date, default: Date.now }
				}
			]
		},
		estimatedDeliveryDate: { type: Date, default: null },
		deliveredDate: { type: Date, default: null }
	},
	{ timestamps: true }
)

const orderModel = mongoose.models.orders || mongoose.model('orders', orderSchema)
export default orderModel
