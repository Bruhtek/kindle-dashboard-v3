import { WIDTH } from './create-canvas.js';
import dayjs from 'dayjs';

/**
 * This draws meta info - user action count, battery, last update time
 * @param ctx - Canvas context
 */
export const drawMetaInfo = (ctx, userActionCount, batteryLevel) => {
	const basePos = [WIDTH / 2, 10];
	const width = WIDTH / 2;
	const height = 70;

	ctx.font = 'semibold 50px Quicksand';

	const boxSize = 60;
	const padding = 5;
	for (let i = 0; i < 3; i++) {
		ctx.fillStyle = '#555';
		ctx.fillRect(basePos[0] + boxSize * i + padding * i, basePos[1] + 2, boxSize, boxSize);

		if (i < userActionCount) {
			ctx.fillStyle = '#fff';
			ctx.fillText('X', basePos[0] + boxSize * i + padding * i + boxSize / 2 - 1, basePos[1] + boxSize / 2);
		}
	}

	let message = 'Battery: ' + batteryLevel + '%';

	ctx.textAlign = 'right';
	ctx.textBaseline = 'top';
	ctx.fillText(message, basePos[0] + width - 20, basePos[1]);

	message = dayjs().format('HH:mm');

	ctx.textAlign = 'middle';
	ctx.fillText(message, basePos[0] + width / 2, basePos[1]);

	ctx.fillStyle = '#000';
	ctx.fillRect(basePos[0], basePos[1] + height, width, 5);
};