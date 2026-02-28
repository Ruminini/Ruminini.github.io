importScripts("simplex-noise.js");

function calculateField(data) {
	const {
		columns,
		rows,
		fieldColumns,
		fieldRows,
		fieldScale,
		noiseZ,
		zoom,
		fieldForce,
		randomForce,
		logoMaskBuffer,
	} = data;

	const logoMask = new Uint8Array(logoMaskBuffer);

	const lowFieldX = new Float32Array(fieldColumns * fieldRows);
	const lowFieldY = new Float32Array(fieldColumns * fieldRows);

	for (let x = 0; x < fieldColumns; x++) {
		for (let y = 0; y < fieldRows; y++) {
			const nx = (x * fieldScale) / zoom;
			const ny = (y * fieldScale) / zoom;
			const idx = y * fieldColumns + x;
			lowFieldX[idx] =
				(self.simplexNoise.simplex3(nx, ny, noiseZ) * fieldForce) / 20;
			lowFieldY[idx] =
				(self.simplexNoise.simplex3(nx + 40000, ny + 40000, noiseZ) *
					fieldForce) /
				20;
		}
	}

	const resultX = new Float32Array(columns * rows);
	const resultY = new Float32Array(columns * rows);

	for (let x = 0; x < columns; x++) {
		for (let y = 0; y < rows; y++) {
			const idx = y * columns + x;

			if (logoMask[idx]) {
				resultX[idx] = (Math.random() - 0.5) * randomForce;
				resultY[idx] = (Math.random() - 0.5) * randomForce;
			} else {
				const lx = x / fieldScale;
				const ly = y / fieldScale;
				const x0 = Math.floor(lx);
				const y0 = Math.floor(ly);
				const x1 = Math.min(x0 + 1, fieldColumns - 1);
				const y1 = Math.min(y0 + 1, fieldRows - 1);
				const fx = lx - x0;
				const fy = ly - y0;

				const i00 = y0 * fieldColumns + x0;
				const i10 = y0 * fieldColumns + x1;
				const i01 = y1 * fieldColumns + x0;
				const i11 = y1 * fieldColumns + x1;

				const topX = lowFieldX[i00] + (lowFieldX[i10] - lowFieldX[i00]) * fx;
				const botX = lowFieldX[i01] + (lowFieldX[i11] - lowFieldX[i01]) * fx;
				resultX[idx] = topX + (botX - topX) * fy;

				const topY = lowFieldY[i00] + (lowFieldY[i10] - lowFieldY[i00]) * fx;
				const botY = lowFieldY[i01] + (lowFieldY[i11] - lowFieldY[i01]) * fx;
				resultY[idx] = topY + (botY - topY) * fy;
			}
		}
	}

	return { resultX, resultY };
}

let seeded = false;

self.onmessage = function (e) {
	const msg = e.data;

	if (msg.type === "seed") {
		self.simplexNoise.seed(msg.seed); // <-- changed
		seeded = true;
		return;
	}

	if (msg.type === "calculate") {
		if (!seeded) return;
		const { resultX, resultY } = calculateField(msg);
		self.postMessage({ type: "field", resultX, resultY }, [
			resultX.buffer,
			resultY.buffer,
		]);
	}
};
