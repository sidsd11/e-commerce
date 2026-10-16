import { createClient } from 'redis'

const redisClient = createClient({
	username: process.env.REDIS_USERNAME,
	password: process.env.REDIS_PASSWORD,
	socket: {
		host: process.env.REDIS_HOST,
		port: Number(process.env.REDIS_PORT)
	}
})

redisClient.on('error', (err) => {
	console.error('Redis error', err)
})

export const connectRedis = async () => {
	try {
		await redisClient.connect()
		console.log('Redis connected successfully')
	} catch (error) {
		console.error('Redis connection failed:', error)
		process.exit(1)
	}
}

export default redisClient
