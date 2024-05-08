import { createCanvas } from 'canvas';
import { drawCalendar } from './calendar.js';
import { drawMetaInfo } from './meta.js';
import { drawCalendarEvents } from './calendar-events.js';
import { drawWeather } from './weather.js';

// 1448x1072 is the size of Kindle PW4 screen
export const WIDTH = 1448;
export const HEIGHT = 1072;

export default async function makeDashboard(rotated, userActionCount, batteryLevel) {
	console.log('Drawing canvas');

	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	drawBounds(ctx);
	drawCalendar(ctx);
	drawMetaInfo(ctx, userActionCount, batteryLevel);
	// await drawCalendarEvents(ctx);
	await drawWeather(ctx);

	if (!rotated) {
		return canvas;
	}

	console.log('Rotating canvas');

	const rotatedCanvas = createCanvas(HEIGHT, WIDTH);
	const rotatedCtx = rotatedCanvas.getContext('2d');

	rotatedCtx.translate(HEIGHT, 0);
	rotatedCtx.rotate(Math.PI / 2);
	rotatedCtx.drawImage(canvas, 0, 0);

	return rotatedCanvas;
}

const drawBounds = (ctx) => {
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 10;
	ctx.beginPath();
	ctx.moveTo(0, HEIGHT * 2 / 3);
	ctx.lineTo(WIDTH, HEIGHT * 2 / 3);
	ctx.stroke();
	ctx.closePath();
};