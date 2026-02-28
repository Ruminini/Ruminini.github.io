/*
 * A simplex noise algorithm.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 */

class Grad {
	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
	dot3(x, y, z) {
		return this.x * x + this.y * y + this.z * z;
	}
}

const grad3 = [
	new Grad(1, 1, 0),
	new Grad(-1, 1, 0),
	new Grad(1, -1, 0),
	new Grad(-1, -1, 0),
	new Grad(1, 0, 1),
	new Grad(-1, 0, 1),
	new Grad(1, 0, -1),
	new Grad(-1, 0, -1),
	new Grad(0, 1, 1),
	new Grad(0, -1, 1),
	new Grad(0, 1, -1),
	new Grad(0, -1, -1),
];

const p = [
	151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
	36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234,
	75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237,
	149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48,
	27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105,
	92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73,
	209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86,
	164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38,
	147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189,
	28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101,
	155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
	178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12,
	191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31,
	181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
	138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215,
	61, 156, 180,
];

const perm = new Array(512);
const gradP = new Array(512);

function seed(s) {
	if (s > 0 && s < 1) s *= 65536;
	s = Math.floor(s);
	if (s < 256) s |= s << 8;
	for (let i = 0; i < 256; i++) {
		let v;
		if (i & 1) {
			v = p[i] ^ (s & 255);
		} else {
			v = p[i] ^ ((s >> 8) & 255);
		}
		perm[i] = perm[i + 256] = v;
		gradP[i] = gradP[i + 256] = grad3[v % 12];
	}
}

const F3 = 1 / 3;
const G3 = 1 / 6;

function simplex3(xin, yin, zin) {
	let n0, n1, n2, n3;
	let s = (xin + yin + zin) * F3;
	let i = Math.floor(xin + s);
	let j = Math.floor(yin + s);
	let k = Math.floor(zin + s);
	let t = (i + j + k) * G3;

	let x0 = xin - i + t;
	let y0 = yin - j + t;
	let z0 = zin - k + t;

	let i1, j1, k1, i2, j2, k2;
	if (x0 >= y0) {
		if (y0 >= z0) {
			i1 = 1;
			j1 = 0;
			k1 = 0;
			i2 = 1;
			j2 = 1;
			k2 = 0;
		} else if (x0 >= z0) {
			i1 = 1;
			j1 = 0;
			k1 = 0;
			i2 = 1;
			j2 = 0;
			k2 = 1;
		} else {
			i1 = 0;
			j1 = 0;
			k1 = 1;
			i2 = 1;
			j2 = 0;
			k2 = 1;
		}
	} else {
		if (y0 < z0) {
			i1 = 0;
			j1 = 0;
			k1 = 1;
			i2 = 0;
			j2 = 1;
			k2 = 1;
		} else if (x0 < z0) {
			i1 = 0;
			j1 = 1;
			k1 = 0;
			i2 = 0;
			j2 = 1;
			k2 = 1;
		} else {
			i1 = 0;
			j1 = 1;
			k1 = 0;
			i2 = 1;
			j2 = 1;
			k2 = 0;
		}
	}

	let x1 = x0 - i1 + G3,
		y1 = y0 - j1 + G3,
		z1 = z0 - k1 + G3;
	let x2 = x0 - i2 + 2 * G3,
		y2 = y0 - j2 + 2 * G3,
		z2 = z0 - k2 + 2 * G3;
	let x3 = x0 - 1 + 3 * G3,
		y3 = y0 - 1 + 3 * G3,
		z3 = z0 - 1 + 3 * G3;

	i &= 255;
	j &= 255;
	k &= 255;

	let gi0 = gradP[i + perm[j + perm[k]]];
	let gi1 = gradP[i + i1 + perm[j + j1 + perm[k + k1]]];
	let gi2 = gradP[i + i2 + perm[j + j2 + perm[k + k2]]];
	let gi3 = gradP[i + 1 + perm[j + 1 + perm[k + 1]]];

	let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
	n0 = t0 < 0 ? 0 : ((t0 *= t0), t0 * t0 * gi0.dot3(x0, y0, z0));

	let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
	n1 = t1 < 0 ? 0 : ((t1 *= t1), t1 * t1 * gi1.dot3(x1, y1, z1));

	let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
	n2 = t2 < 0 ? 0 : ((t2 *= t2), t2 * t2 * gi2.dot3(x2, y2, z2));

	let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
	n3 = t3 < 0 ? 0 : ((t3 *= t3), t3 * t3 * gi3.dot3(x3, y3, z3));

	return 32 * (n0 + n1 + n2 + n3);
}

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
		size,
		w,
	} = data;

	const logoMask = new Uint8Array(logoMaskBuffer);

	const lowFieldX = new Float32Array(fieldColumns * fieldRows);
	const lowFieldY = new Float32Array(fieldColumns * fieldRows);

	for (let x = 0; x < fieldColumns; x++) {
		for (let y = 0; y < fieldRows; y++) {
			let nx = (x * fieldScale) / zoom;
			let ny = (y * fieldScale) / zoom;
			let idx = y * fieldColumns + x;
			lowFieldX[idx] = (simplex3(nx, ny, noiseZ) * fieldForce) / 20;
			lowFieldY[idx] =
				(simplex3(nx + 40000, ny + 40000, noiseZ) * fieldForce) / 20;
		}
	}

	const resultX = new Float32Array(columns * rows);
	const resultY = new Float32Array(columns * rows);

	for (let x = 0; x < columns; x++) {
		for (let y = 0; y < rows; y++) {
			let idx = y * columns + x;

			if (logoMask[idx]) {
				resultX[idx] = (Math.random() - 0.5) * randomForce;
				resultY[idx] = (Math.random() - 0.5) * randomForce;
			} else {
				let lx = x / fieldScale;
				let ly = y / fieldScale;

				let x0 = Math.floor(lx);
				let y0 = Math.floor(ly);
				let x1 = Math.min(x0 + 1, fieldColumns - 1);
				let y1 = Math.min(y0 + 1, fieldRows - 1);

				let fx = lx - x0;
				let fy = ly - y0;

				let i00 = y0 * fieldColumns + x0;
				let i10 = y0 * fieldColumns + x1;
				let i01 = y1 * fieldColumns + x0;
				let i11 = y1 * fieldColumns + x1;

				let topX = lowFieldX[i00] + (lowFieldX[i10] - lowFieldX[i00]) * fx;
				let botX = lowFieldX[i01] + (lowFieldX[i11] - lowFieldX[i01]) * fx;
				resultX[idx] = topX + (botX - topX) * fy;

				let topY = lowFieldY[i00] + (lowFieldY[i10] - lowFieldY[i00]) * fx;
				let botY = lowFieldY[i01] + (lowFieldY[i11] - lowFieldY[i01]) * fx;
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
		seed(msg.seed);
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
