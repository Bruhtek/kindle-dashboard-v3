import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday.js';

dayjs.extend(weekday);

import { HEIGHT, WIDTH } from './create-canvas.js';

/**
 * This draws the basic calendar view, highlighting the current day
 * @param ctx - Canvas context
 */
export const drawCalendar = (ctx) => {
	const calendarWidth = WIDTH / 2;
	const calendarHeight = HEIGHT * 2 / 3;

	const now = dayjs();
	const title = now.format('ddd, DD MMM YYYY');
	ctx.font = 'semibold 70px Quicksand';
	ctx.fillStyle = '#555';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(title, calendarWidth / 2, 50);

	drawCalendarTable(ctx, now, calendarWidth, calendarHeight);
};
const drawCalendarTable = (ctx, now, width) => {
	const tableColumns = 7;
	const tableRows = 6;

	const cellSize = 90;
	const cellPadding = 5;

	const totalWidth = cellSize * tableColumns + cellPadding * (tableColumns + 1);
	const startPosX = (width - totalWidth) / 2;

	const month = now.startOf('month');
	const sunday = month.weekday(0);
	let monday = month.weekday(1);
	if (sunday.date() === 1) {
		monday = monday.weekday(-6);
	}

	let date = sunday;
	if ((process.env.START_OF_WEEK || 1) == 1) {
		date = monday;
	}
	for (let i = 0; i < tableRows; i++) {
		for (let j = 0; j < tableColumns; j++) {
			const posX = startPosX + j * (cellSize + cellPadding);
			const posY = 120 + i * (cellSize + cellPadding);

			if (now.isSame(date, 'day')) {
				ctx.fillStyle = '#777';
				ctx.fillRect(posX, posY, cellSize, cellSize);
			}

			ctx.font = 'bold 55px Courier New';

			if (now.isSame(date, 'month')) {
				ctx.fillStyle = '#000';
			} else {
				ctx.fillStyle = '#aaa';
			}

			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(date.format('DD'), posX + cellSize / 2, posY + cellSize / 2);

			date = date.add(1, 'day');
		}
	}
};