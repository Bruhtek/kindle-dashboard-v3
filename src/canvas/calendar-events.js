import { KalenderEvents } from 'kalender-events';
import dayjs from 'dayjs';
import { HEIGHT, WIDTH } from './create-canvas.js';
import dotenv from 'dotenv';

dotenv.config();

const kalenderEvents = new KalenderEvents({
	url: process.env.CALDAV_URL || '',
	username: process.env.CALDAV_USERNAME || '',
	password: process.env.CALDAV_PASSWORD || '',
});

/**
 * Get all events for a specific day
 * @param offset - The day offset from today
 */
const getEventsForDayOffset = async (offset) => {
	const now = dayjs().startOf('day').add(offset, 'day');
	const dateObj = now.toDate();

	return await kalenderEvents.getEvents({
		url: process.env.CALDAV_URL || '',
		type: 'caldav',
		pastview: 0,
		pastviewUnits: 'days',
		now: dateObj,
		preview: 1,
		previewUnits: 'days',
	});
};

let eventsForToday = [];
let eventsForTomorrow = [];

let lastUpdated = 0;

export const drawCalendarEvents = async (ctx) => {
	const basePos = [WIDTH / 2, 90];
	const width = WIDTH / 2;
	const height = HEIGHT * 2 / 3 - basePos[1] - 10;

	try {
		if (Date.now() - lastUpdated > 1000 * 60 * 20) {
			eventsForToday = await getEventsForDayOffset(0);
			eventsForTomorrow = await getEventsForDayOffset(1);
			lastUpdated = Date.now();
		}
	} catch (e) {
		console.error(e);
		console.error('Failed to get events');
	}

	// console.log(eventsForToday);
	// console.log(eventsForTomorrow);

	drawEvents(ctx, eventsForToday, basePos, width / 2, height, 'Today:');
	drawEvents(ctx, eventsForTomorrow, [basePos[0] + width / 2, basePos[1]], width / 2, height, 'Tomorrow:');
};

const drawEvents = (ctx, events, basePos, width, height, title) => {
	const allDayEvents = events.filter((event) => event.allDay);
	const timedEvents = events.filter((event) => !event.allDay);

	let currentY = basePos[1];
	let padding = 5;
	const fontSize = 40;
	const lineHeight = 50;

	ctx.font = `semibold ${fontSize}px Quicksand`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	ctx.fillStyle = '#000';

	const measured = ctx.measureText(title);
	ctx.fillText(title, basePos[0] + padding + width / 2, currentY);
	ctx.fillStyle = '#555';
	currentY += fontSize + padding;
	ctx.fillRect(basePos[0] + (width - measured.width) / 2, currentY, measured.width, 5);

	ctx.textAlign = 'left';
	ctx.fillStyle = '#000';

	padding = 15;

	if (!allDayEvents.length && !timedEvents.length) {
		ctx.fillStyle = '#555';
		ctx.textAlign = 'center';
		ctx.fillText('No events!', basePos[0] + width / 2, currentY + lineHeight);
		return;
	}

	if (allDayEvents.length > 0) {
		for (const event of allDayEvents) {
			ctx.beginPath();
			ctx.arc(basePos[0] + padding, currentY + lineHeight / 2, 10, 0, Math.PI * 2);
			ctx.fillStyle = '#555';
			ctx.fill();

			ctx.fillStyle = '#000';
			ctx.fillText(event.summary, basePos[0] + padding + 20, currentY);
			currentY += lineHeight;
		}
		ctx.fillStyle = '#aaa';
		ctx.fillRect(basePos[0] + 10, currentY, width - 20, 5);
		currentY += padding;
	}

	for (const event of timedEvents) {
		const start = dayjs(event.eventStart);
		const startStr = start.format('HH:mm');

		let currentX = basePos[0] + padding;
		ctx.fillStyle = '#555';
		ctx.textBaseline = 'middle';
		ctx.font = `semibold ${fontSize * 3 / 4}px Quicksand`;
		const measured = ctx.measureText(startStr);
		ctx.fillText(startStr, currentX, currentY + lineHeight / 2);
		currentX += measured.width + padding;

		ctx.save();
		ctx.textBaseline = 'top';
		ctx.font = `semibold ${fontSize}px Quicksand`;
		ctx.fillStyle = '#000';
		ctx.beginPath();
		ctx.rect(currentX, currentY, width - padding * 2 - measured.width, lineHeight);
		ctx.clip();
		ctx.fillText(event.summary, currentX, currentY);
		ctx.restore();

		currentY += lineHeight;
		if (currentY > basePos[1] + height) {
			break;
		}
	}
};