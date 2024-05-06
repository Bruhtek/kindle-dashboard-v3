import { weatherLegendMap } from './weather-data.js';
import dayjs from 'dayjs';
import { HEIGHT, WIDTH } from './create-canvas.js';
import { loadImage } from 'canvas';
import dotenv from 'dotenv';

import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dotenv.config();

if (process.env.METNO_USER_AGENT === undefined) {
	console.error('METNO_USER_AGENT is not set');
	process.exit(1);
}

dayjs.extend(utc);
dayjs.extend(timezone);

if (process.env.TZ !== undefined) {
	dayjs.tz.setDefault(process.env.TZ);
}

const getWeather = async () => {
	const lat = process.env.METNO_LATITUDE || 0;
	const lon = process.env.METNO_LONGITUDE || 0;

	const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/complete.json?lat=${lat}&lon=${lon}`, {
		method: 'GET',
		headers: {
			'User-Agent': process.env.METNO_USER_AGENT,
		},
	});

	if (!res.ok) {
		throw new Error(`Failed to fetch weather data: ${res.status} ${res.statusText}`);
	}

	const data = await res.json();

	const weather = [];

	const timeseries = data.properties.timeseries;
	for (const time of timeseries) {
		const timeData = {
			time: time.time,
			temperature: time.data.instant.details.air_temperature,
			weather: time.data.next_1_hours?.summary?.symbol_code,
			precipitation: time.data.next_1_hours?.details?.precipitation_amount,
		};

		const date = dayjs.tz(timeData.time, 'UTC');
		const now = dayjs();

		if (date.diff(now, 'hour') > 24 || date.isBefore(now, 'hour')) {
			continue;
		}

		weather.push(timeData);
	}

	return weather;
};

export const drawWeather = async (ctx) => {
	const weather = await getWeather();

	const forecastHours = 10;
	const padding = 10;

	const basePos = [0, HEIGHT * 2 / 3];
	const width = WIDTH / forecastHours - padding * 2;

	let i = 0;

	for (const forecast of weather) {
		if (i >= forecastHours) {
			break;
		}

		const [weatherType, weatherSubType] = forecast.weather.split('_');
		const weatherTitle = weatherLegendMap[weatherType];
		const image = await loadImage(`https://github.com/metno/weathericons/blob/main/weather/png/${forecast.weather}.png?raw=true`);

		ctx.shadowColor = '#000';
		for (let x = -1; x <= 1; x++) {
			for (let y = -1; y <= 1; y++) {
				ctx.shadowOffsetX = x;
				ctx.shadowOffsetY = y;
				ctx.drawImage(image, basePos[0] + padding + i * (width + padding * 2), basePos[1] + padding, width, width);
			}
		}

		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowColor = 'transparent';

		const hour = dayjs(forecast.time).format('HH');
		ctx.fillStyle = '#000';
		ctx.font = '25px "Tilt Neon"';
		ctx.textAlign = 'right';
		ctx.textBaseline = 'top';
		ctx.fillText(hour, basePos[0] + width + padding + i * (width + padding * 2), basePos[1] + padding);


		ctx.fillStyle = '#000';
		ctx.font = '40px "Tilt Neon"';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		const measuredTemp = ctx.measureText(`${forecast.temperature}`);
		ctx.fillText(`${forecast.temperature}`, basePos[0] + width / 2 + padding + i * (width + padding * 2), basePos[1] + (HEIGHT / 6));
		ctx.textAlign = 'left';
		ctx.fillStyle = '#333';
		ctx.font = '25px "Tilt Neon"';
		ctx.textBaseline = 'top';
		ctx.fillText('°C', basePos[0] + width / 2 + padding + i * (width + padding * 2) + measuredTemp.width / 2, basePos[1] + (HEIGHT / 6) - 45);

		ctx.fillStyle = '#000';
		ctx.font = '40px "Tilt Neon"';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		const measuredPrecipitation = ctx.measureText(`${forecast.precipitation}`);
		ctx.fillText(`${forecast.precipitation}`, basePos[0] + width / 2 + padding + i * (width + padding * 2), basePos[1] + (HEIGHT / 6));
		ctx.textAlign = 'left';
		ctx.fillStyle = '#333';
		ctx.font = '25px "Tilt Neon"';
		ctx.textBaseline = 'bottom';
		ctx.fillText('mm', basePos[0] + width / 2 + padding + i * (width + padding * 2) + measuredPrecipitation.width / 2, basePos[1] + (HEIGHT / 6) + 45);

		ctx.fillStyle = '#000';
		ctx.font = '30px "Tilt Neon"';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		const lines = getLines(ctx, weatherTitle, width);

		const lineBaseY = HEIGHT - padding;

		if (lines.length > 3) {
			lines.length = 3;
		}

		if (lines.length === 1) {
			ctx.fillText(lines[0], basePos[0] + width / 2 + padding + i * (width + padding * 2), lineBaseY - 30);
		} else if (lines.length === 2) {
			ctx.fillText(lines[0], basePos[0] + width / 2 + padding + i * (width + padding * 2), lineBaseY - 45);
			ctx.fillText(lines[1], basePos[0] + width / 2 + padding + i * (width + padding * 2), lineBaseY - 15);
		} else {
			ctx.fillText(lines[0], basePos[0] + width / 2 + padding + i * (width + padding * 2), lineBaseY - 60);
			ctx.fillText(lines[1], basePos[0] + width / 2 + padding + i * (width + padding * 2), lineBaseY - 30);
			ctx.fillText(lines[2], basePos[0] + width / 2 + padding + i * (width + padding * 2), lineBaseY);
		}

		i++;
	}
};

function getLines(ctx, text, maxWidth) {
	let words = text.split(' ');
	let lines = [];
	let currentLine = words[0];

	for (let i = 1; i < words.length; i++) {
		let word = words[i];
		let width = ctx.measureText(currentLine + ' ' + word).width;
		if (width < maxWidth) {
			currentLine += ' ' + word;
		} else {
			lines.push(currentLine);
			currentLine = word;
		}
	}
	lines.push(currentLine);
	return lines;
}