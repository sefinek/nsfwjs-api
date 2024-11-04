const morgan = require('morgan');

morgan.token('body', req => {
	const { body } = req;
	return (body && typeof body === 'object' && Object.keys(body).length) ? body : null;
});

module.exports = morgan('[:status :method :response-time ms] :url :user-agent :remote-addr ":referrer" :body');