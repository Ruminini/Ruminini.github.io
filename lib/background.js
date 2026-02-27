/*
 * An animated particles background.
 *
 * Code from multiple authors is used on this implementation.
 * These are not the complete libraries, but only the parts I needed.
 *
 */

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

var grad3 = [
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
var p = [
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
var perm = new Array(512);
var gradP = new Array(512);
function seed(seed) {
	if (seed > 0 && seed < 1) {
		seed *= 65536;
	}
	seed = Math.floor(seed);
	if (seed < 256) {
		seed |= seed << 8;
	}
	for (var i = 0; i < 256; i++) {
		var v;
		if (i & 1) {
			v = p[i] ^ (seed & 255);
		} else {
			v = p[i] ^ ((seed >> 8) & 255);
		}
		perm[i] = perm[i + 256] = v;
		gradP[i] = gradP[i + 256] = grad3[v % 12];
	}
}

var F3 = 1 / 3;
var G3 = 1 / 6;

function simplex3(xin, yin, zin) {
	var n0, n1, n2, n3;
	var s = (xin + yin + zin) * F3;
	var i = Math.floor(xin + s);
	var j = Math.floor(yin + s);
	var k = Math.floor(zin + s);
	var t = (i + j + k) * G3;

	var x0 = xin - i + t;
	var y0 = yin - j + t;
	var z0 = zin - k + t;

	var i1, j1, k1;
	var i2, j2, k2;
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
	var x1 = x0 - i1 + G3;
	var y1 = y0 - j1 + G3;
	var z1 = z0 - k1 + G3;

	var x2 = x0 - i2 + 2 * G3;
	var y2 = y0 - j2 + 2 * G3;
	var z2 = z0 - k2 + 2 * G3;

	var x3 = x0 - 1 + 3 * G3;
	var y3 = y0 - 1 + 3 * G3;
	var z3 = z0 - 1 + 3 * G3;

	i &= 255;
	j &= 255;
	k &= 255;

	var gi0 = gradP[i + perm[j + perm[k]]];
	var gi1 = gradP[i + i1 + perm[j + j1 + perm[k + k1]]];
	var gi2 = gradP[i + i2 + perm[j + j2 + perm[k + k2]]];
	var gi3 = gradP[i + 1 + perm[j + 1 + perm[k + 1]]];

	var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
	if (t0 < 0) {
		n0 = 0;
	} else {
		t0 *= t0;
		n0 = t0 * t0 * gi0.dot3(x0, y0, z0);
	}

	var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
	if (t1 < 0) {
		n1 = 0;
	} else {
		t1 *= t1;
		n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
	}

	var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
	if (t2 < 0) {
		n2 = 0;
	} else {
		t2 *= t2;
		n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
	}

	var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
	if (t3 < 0) {
		n3 = 0;
	} else {
		t3 *= t3;
		n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
	}

	return 32 * (n0 + n1 + n2 + n3);
}

/*
  Johan Karlsson (DonKarlssonSan)
  https://github.com/DonKarlssonSan/vectory
  https://codepen.io/DonKarlssonSan/post/particles-in-simplex-noise-flow-field
*/

class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	addTo(v) {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	setLength(length) {
		var angle = this.getAngle();
		this.x = Math.cos(angle) * length;
		this.y = Math.sin(angle) * length;
	}

	getAngle() {
		return Math.atan2(this.y, this.x);
	}

	getLength() {
		return Math.hypot(this.x, this.y);
	}
}

class Particle {
	constructor(x, y) {
		this.pos = new Vector(x, y);
		this.prevPos = new Vector(x, y);
		this.vel = new Vector(Math.random() - 0.5, Math.random() - 0.5);
		this.acc = new Vector(0, 0);

		// Round hue and lightness so particles group into fewer colors
		let hue =
			Math.round(
				(Math.random() * colorConfig.hueRange + colorConfig.baseHue) / 5,
			) * 5;
		let lightness =
			Math.round(
				(Math.random() * colorConfig.lightnessVariance +
					50 -
					colorConfig.lightnessVariance) /
					5,
			) * 5;
		this.col = `hsla(${hue},${colorConfig.colorSaturation}%,${lightness}%,${colorConfig.particleOpacity})`;
	}

	move(acc) {
		this.prevPos.x = this.pos.x;
		this.prevPos.y = this.pos.y;
		if (acc) {
			this.vel.addTo(acc);
		}
		this.pos.addTo(this.vel);
		if (this.vel.getLength() > config.particleSpeed) {
			this.vel.setLength(config.particleSpeed);
		}
	}

	wrap() {
		if (this.pos.x > w) {
			this.prevPos.x = this.pos.x = 0;
		} else if (this.pos.x < 0) {
			this.prevPos.x = this.pos.x = w - 1;
		}
		if (this.pos.y > h) {
			this.prevPos.y = this.pos.y = 0;
		} else if (this.pos.y < 0) {
			this.prevPos.y = this.pos.y = h - 1;
		}
	}
}

let canvas;
let ctx;
let field;
let w, h;
let imgX, imgY;
let imgSize;
let size;
let columns;
let rows;
let noiseZ;
let hue;
let particles;
let config;
let colorConfig;
let buffer32;
let animationId;
let dpr;

// FPS Counter
let fpsCounter = {
	frames: 0,
	lastTime: performance.now(),
	fps: 0,
	element: null,

	init() {
		this.element = document.createElement("div");
		this.element.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            color: #0f0;
            font-family: monospace;
            font-size: 14px;
            z-index: 9999;
            background: rgba(0,0,0,0.7);
            padding: 8px 12px;
            border-radius: 4px;
            pointer-events: none;
        `;
		document.body.appendChild(this.element);
	},

	update() {
		this.frames++;
		let now = performance.now();
		let delta = now - this.lastTime;

		// Update display once per second
		if (delta >= 1000) {
			this.fps = Math.round((this.frames * 1000) / delta);
			this.frames = 0;
			this.lastTime = now;
			this.element.textContent = `FPS: ${this.fps}`;
		}
	},
	updateDetailed(fieldTime, particleTime, otherTime) {
		this.frames++;
		let now = performance.now();
		let delta = now - this.lastTime;

		if (delta >= 1000) {
			this.fps = Math.round((this.frames * 1000) / delta);
			this.frames = 0;
			this.lastTime = now;
			this.element.innerHTML =
				`FPS: ${this.fps}<br>` +
				`Field: ${fieldTime.toFixed(1)}ms<br>` +
				`Particles: ${particleTime.toFixed(1)}ms<br>` +
				`Other: ${otherTime.toFixed(1)}ms`;
		}
	},
};

function setup() {
	window.addEventListener("resize", () => reset(), false);
	fpsCounter.init();
	size = 5;
	noiseZ = 0;
	canvas = document.querySelector("#canvas");
	ctx = canvas.getContext("2d");
	colorConfig = {
		particleOpacity: 0.1,
		baseHue: 135,
		hueRange: 50,
		lightnessVariance: 40,
		colorSaturation: 100,
	};
	seed(Math.random());
	reset();
}

function reset(force = false) {
	dpr = window.devicePixelRatio || 1;
	let newW = Math.round(canvas.getBoundingClientRect().width * dpr);
	let newH = Math.round(canvas.getBoundingClientRect().height * dpr);
	if (newW === w && newH === h && !force) return;
	w = canvas.width = newW;
	h = canvas.height = newH;
	if (animationId) cancelAnimationFrame(animationId);
	imgSize = Math.min(w, h) * 0.4;
	imgSize += imgSize / dpr < 300 ? imgSize * 0.5 : 0;
	if (w > h) {
		imgX = w * 0.9 - imgSize / 2;
		imgY = h / 2;
	} else {
		imgX = w / 2;
		imgY = h * 0.9 - imgSize / 2;
	}
	updateConfig(imgSize / 400);
	columns = Math.floor(w / size) + 1;
	rows = Math.floor(h / size) + 1;
	initParticles();
	initField();
	drawText();
}

function updateConfig(scale = 1) {
	config = {
		zoom: Math.round(50 * scale),
		noiseSpeed: 0.007 * scale,
		particleSpeed: 0.3 * scale,
		fieldForce: Math.round(50 * scale),
		randomForce: Math.round(6 * scale),
	};
	size = Math.round(5 * scale);
}

function initParticles() {
	particles = [];
	for (let i = 0; i < 2000; i++) {
		particles.push(genParticle());
	}
}

function genParticle() {
	return new Particle(
		gaussianRandom(imgX, imgSize / 2),
		gaussianRandom(imgY, imgSize / 2),
	);
}

function gaussianRandom(mean = 0, stdDev = 1) {
	let u = Math.random();
	let v = Math.random();
	let gaussian = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
	return mean + gaussian * stdDev;
}

function draw() {
	animationId = requestAnimationFrame(draw);

	let t0 = performance.now();
	calculateField();
	let t1 = performance.now();
	drawParticles();
	let t2 = performance.now();
	noiseZ += config.noiseSpeed;
	darkenBackground();
	particles.shift();
	particles.push(genParticle());
	let t3 = performance.now();

	fpsCounter.updateDetailed(t1 - t0, t2 - t1, t3 - t2);
}

let cleaner = 0;
function darkenBackground() {
	cleaner++;
	if (cleaner > 30) {
		drawBackground(0.02);
		cleaner = 0;
	}
}

function initField() {
	field = new Array(columns);
	for (let x = 0; x < columns; x++) {
		field[x] = new Array(columns);
		for (let y = 0; y < rows; y++) {
			field[x][y] = new Vector(0, 0);
		}
	}
}

function calculateField() {
	let x1;
	let y1;
	for (let x = 0; x < columns; x++) {
		for (let y = 0; y < rows; y++) {
			let color = buffer32[y * size * w + x * size];
			if (color) {
				x1 = (Math.random() - 0.5) * config.randomForce;
				y1 = (Math.random() - 0.5) * config.randomForce;
			} else {
				x1 =
					(simplex3(x / config.zoom, y / config.zoom, noiseZ) *
						config.fieldForce) /
					20;
				y1 =
					(simplex3(x / config.zoom + 40000, y / config.zoom + 40000, noiseZ) *
						config.fieldForce) /
					20;
			}
			field[x][y].x = x1;
			field[x][y].y = y1;
		}
	}
}

function drawBackground(alpha = 1) {
	if (alpha < 1) {
		ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
		ctx.fillRect(0, 0, w, h);
	} else {
		ctx.clearRect(0, 0, w, h);
	}
}

function drawText() {
	let logo = new Image();
	logo.crossOrigin = "anonymous";
	logo.src = "../assets/LOGO.svg";
	logo.onload = () => {
		let leftMargin = imgX - imgSize / 2;
		let topMargin = imgY - imgSize / 2;
		drawBackground();
		ctx.drawImage(logo, leftMargin, topMargin, imgSize, imgSize);
		let image = ctx.getImageData(0, 0, w, h);
		buffer32 = new Uint32Array(image.data.buffer);
		drawBackground();
		draw();
	};
}

function drawParticles() {
	let colorGroups = new Map();

	particles.forEach((p) => {
		let x = p.pos.x / size;
		let y = p.pos.y / size;
		let v;
		if (x >= 0 && x < columns && y >= 0 && y < rows) {
			v = field[Math.floor(x)][Math.floor(y)];
		}
		p.move(v);
		p.wrap();

		if (!colorGroups.has(p.col)) {
			colorGroups.set(p.col, []);
		}
		colorGroups.get(p.col).push(p);
	});

	colorGroups.forEach((group, color) => {
		ctx.beginPath();
		ctx.strokeStyle = color;
		for (let i = 0; i < group.length; i++) {
			let p = group[i];
			ctx.moveTo(p.prevPos.x, p.prevPos.y);
			ctx.lineTo(p.pos.x, p.pos.y);
		}
		ctx.stroke();
	});
}

setup();
reset(true);
