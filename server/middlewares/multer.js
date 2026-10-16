import multer from 'multer'

const storage = multer.memoryStorage()

const upload = multer({
	storage,
	limits: {
		files: 5,
		fileSize: 5 * 1024 * 1024
	},
	fileFilter: (req, file, callback) => {
		if (file.mimetype.startsWith('image/')) {
			callback(null, true)
		} else {
			callback(new Error('Only image files are allowed'))
		}
	}
})

export default upload
