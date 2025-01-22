const nsfw = require('nsfwjs');
const { enableProdMode, node } = require('@tensorflow/tfjs-node');

let model;
const cache = new Map();
const ttl = 4000;

const loadModel = async () => {
	if (!model) {
		enableProdMode();
		model = await nsfw.load('MobileNetV2');
	}
};

const convertToPercentages = predictions =>
	predictions.map(({ className, probability }) => ({
		className,
		probability: +(probability * 100).toFixed(2),
	}));

const classifyImage = async imageBuffer => {
	const cacheKey = imageBuffer.subarray(0, 100).toString('base64');
	const cachedResult = cache.get(cacheKey);
	if (cachedResult && Date.now() - cachedResult.timestamp < ttl) {
		return cachedResult.data;
	}

	if (!model) {
		console.error('Model not loaded. Please load the model first.');
		return { success: false, status: 500, error: 'Model not loaded' };
	}

	try {
		const tensor = node.decodeImage(imageBuffer, 3);
		const predictions = await model.classify(tensor);

		const result = {
			success: true,
			status: 200,
			classifications: convertToPercentages(predictions),
		};
		cache.set(cacheKey, { data: result, timestamp: Date.now() });
		return result;
	} catch (err) {
		console.error('Error classifying image:', err);
		return { success: false, status: 500, error: 'Error classifying image' };
	}
};

module.exports = { loadModel, classifyImage };