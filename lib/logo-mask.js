export function loadLogoMask(canvas, ctx, imgX, imgY, imgSize, w, h) {
	return new Promise((resolve) => {
		const logo = new Image();
		logo.crossOrigin = "anonymous";
		logo.src = "../assets/LOGO.svg";
		logo.onload = () => {
			const leftMargin = imgX - imgSize / 2;
			const topMargin = imgY - imgSize / 2;
			ctx.clearRect(0, 0, w, h);
			ctx.drawImage(logo, leftMargin, topMargin, imgSize, imgSize);
			const image = ctx.getImageData(0, 0, w, h);
			const buffer32 = new Uint32Array(image.data.buffer);
			ctx.clearRect(0, 0, w, h);
			resolve(buffer32);
		};
	});
}

export function buildLogoMask(buffer32, columns, rows, size, w) {
	const logoMask = new Uint8Array(columns * rows);
	for (let x = 0; x < columns; x++) {
		for (let y = 0; y < rows; y++) {
			logoMask[y * columns + x] = buffer32[y * size * w + x * size] ? 1 : 0;
		}
	}
	return logoMask;
}
