import { weatherLegendMap } from './weather-data.js';
import dayjs from 'dayjs';
import { HEIGHT, WIDTH } from './create-canvas.js';
import { loadImage } from 'canvas';
import dotenv from 'dotenv';

import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import * as path from 'node:path';

const __dirname = import.meta.dirname;

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
			humidity: time.data.instant.details.relative_humidity,
			windSpeed: time.data.instant.details.wind_speed,
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

	const tempIcon = await loadImage(path.join(__dirname, '../images/temperature.png'));
	const rainIcon = await loadImage(path.join(__dirname, '../images/rain.png'));
	const humidityIcon = await loadImage(path.join(__dirname, '../images/humidity.png'));
	const windIcon = await loadImage(path.join(__dirname, '../images/wind.png'));

	basePos[1] += 20;

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
		const temp = Math.round(forecast.temperature);
		let measuredText = ctx.measureText(`${temp}`);
		ctx.fillText(`${temp}`, basePos[0] + width / 2 + padding + i * (width + padding * 2), basePos[1] + (HEIGHT / 6));
		ctx.drawImage(tempIcon, basePos[0] + padding + i * (width + padding * 2), basePos[1] + (HEIGHT / 6) - 40, 32, 32);
		ctx.textAlign = 'left';
		ctx.fillStyle = '#333';
		ctx.font = '25px "Tilt Neon"';
		ctx.textBaseline = 'top';
		ctx.fillText('°C', basePos[0] + width / 2 + padding + i * (width + padding * 2) + measuredText.width / 2, basePos[1] + (HEIGHT / 6) - 45);

		ctx.fillStyle = '#000';
		ctx.font = '40px "Tilt Neon"';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		measuredText = ctx.measureText(`${forecast.precipitation}`);
		ctx.fillText(`${forecast.precipitation}`, basePos[0] + width / 2 + padding + i * (width + padding * 2), basePos[1] + (HEIGHT / 6));
		ctx.drawImage(rainIcon, basePos[0] + padding + i * (width + padding * 2), basePos[1] + (HEIGHT / 6) + padding, 32, 32);
		ctx.textAlign = 'left';
		ctx.fillStyle = '#333';
		ctx.font = '25px "Tilt Neon"';
		ctx.textBaseline = 'bottom';
		ctx.fillText(' mm', basePos[0] + width / 2 + padding + i * (width + padding * 2) + measuredText.width / 2, basePos[1] + (HEIGHT / 6) + 45);

		ctx.fillStyle = '#000';
		ctx.font = '40px "Tilt Neon"';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		const humidity = Math.round(forecast.humidity);
		measuredText = ctx.measureText(`${humidity}`);
		ctx.fillText(`${humidity}`, basePos[0] + width / 2 + padding + i * (width + padding * 2), basePos[1] + (HEIGHT / 6) + 45);
		ctx.drawImage(humidityIcon, basePos[0] + padding + i * (width + padding * 2), basePos[1] + (HEIGHT / 6) + 45 + padding, 32, 32);
		ctx.textAlign = 'left';
		ctx.fillStyle = '#333';
		ctx.font = '25px "Tilt Neon"';
		ctx.textBaseline = 'bottom';
		ctx.fillText('%', basePos[0] + width / 2 + padding + i * (width + padding * 2) + measuredText.width / 2, basePos[1] + (HEIGHT / 6) + 90);

		ctx.fillStyle = '#000';
		ctx.font = '40px "Tilt Neon"';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		measuredText = ctx.measureText(`${forecast.windSpeed}`);
		ctx.fillText(`${forecast.windSpeed}`, basePos[0] + width / 2 + padding + i * (width + padding * 2), basePos[1] + (HEIGHT / 6) + 90);
		ctx.drawImage(windIcon, basePos[0] + padding + i * (width + padding * 2), basePos[1] + (HEIGHT / 6) + 90 + padding, 32, 32);
		ctx.textAlign = 'left';
		ctx.fillStyle = '#333';
		ctx.font = '25px "Tilt Neon"';
		ctx.textBaseline = 'bottom';
		ctx.fillText('mps', basePos[0] + width / 2 + padding + i * (width + padding * 2) + measuredText.width / 2, basePos[1] + (HEIGHT / 6) + 135);

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