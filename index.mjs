import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import helmet from 'helmet';
import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import morgan from './middlewares/morgan.js';
import rateLimit from './middlewares/ratelimit.js';
import timeout from './middlewares/timeout.js';
import token from './middlewares/token.js';
import nsfwService from './services/nsfwImageClassifier.js';
(async () => await nsfwService.loadModel())();

const app = express();

app.use(helmet());
app.use(morgan);
app.use(rateLimit);
app.use(timeout());
app.use(token);

app.get('/api/v1/nsfw-classification', async (req, res) => {
	const { path: imagePath, url: imageUrl } = req.query;

	try {
		if (imagePath) {
			const resolvedPath = path.resolve(imagePath);
			if (!fs.existsSync(resolvedPath) || fs.lstatSync(resolvedPath).isDirectory()) return res.status(400).send('Invalid file path.');
			const imageBuffer = await fs.promises.readFile(resolvedPath);

			console.log(`Classifying image from path: ${imagePath}...`);
			const result = await nsfwService.classifyImage(imageBuffer);
			return res.json(result);
		}

		if (imageUrl) {
			const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

			console.log(`Classifying image from URL: ${imageUrl}...`);
			const result = await nsfwService.classifyImage(response.data);
			return res.json(result);
		}

		res.status(400).json({ success: false, status: 400, message: 'No image path or URL provided.' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, status: 500 });
	}
});

app.use((req, res) => res.status(404).json({ success: false, status: 404 }));
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({ success: false, status: 500 });
	return next;
});

const { PORT } = process.env;
app.listen(PORT, () => process.send ? process.send('ready') : console.log(`Server running at http://127.0.0.1:${PORT}`));