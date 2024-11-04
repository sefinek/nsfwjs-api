module.exports = (req, res, next) => {
	const token = req.headers['x-secret-key'];
	if (!token) {
		return res.status(401).json({ success: false, status: 401 });
	}

	if (token !== process.env.SECRET_TOKEN) {
		return res.status(403).json({ success: false, status: 401 });
	}

	next();
};