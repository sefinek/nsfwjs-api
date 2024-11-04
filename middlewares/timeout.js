const timeout = require('express-timeout-handler');

module.exports = () => timeout.handler({
	timeout: 30000,
	onTimeout: (req, res) => res.status(503).json({ success: false, status: 503 }),
	disable: ['write', 'setHeaders', 'send', 'json', 'end'],
});