import mongoose from 'mongoose'

const connectDB = async () => {
	try {
		await mongoose.connect(`${process.env.MONGODB_URI}/Astitra`)
		console.log(`Connected to ${mongoose.connection.name} database`)
	} catch (error) {
		console.error('Failed to connect to MongoDB:', error)
		process.exit(1)
	}
}

export default connectDB
