import redisClient from '../config/redis.js'

const rateLimiter = async (req, res, next) => {
	try {
		const ip = req.ip
		const key = `rate-limit:${ip}:${req.path}`
		const requestCount = await redisClient.incr(key)
		if (requestCount === 1) {
			await redisClient.expire(key, 60)
		}
		/* if (requestCount > 10) {
			return res.status(429).json({
				success: false,
				message: 'Too many requests, please wait for a while'
			})
		} */

		if (requestCount > 20) {
			res.setHeader('redis-ratelimit-message', 'Too many requests')
		}

		next()
	} catch (error) {
		console.error('Error in rateLimiter', error)
		//return res.status(500).json({ success: false, message: 'Something went wrong' })
		next()
	}
}

export default rateLimiter
