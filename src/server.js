import express from 'express';
import dotenv from 'dotenv';
import makeDashboard from './canvas/create-canvas.js';

dotenv.config();

const app = express();
app.get('/', async (req, res) => {
	const userAgent = req.headers['user-agent'];
	let rotated = false;
	if (userAgent.includes('curl')) {
		rotated = true;
	}

	const canvas = await makeDashboard(rotated, req.query.user, req.query.battery);

	res.setHeader('Content-Type', 'image/png');
	canvas.createPNGStream().pipe(res);

});

const PORT = 5000;

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});