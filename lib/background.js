/*
 * Tobias Rumiz (Ruminini)
 * https://github.com/Ruminini
 * An animated particles background.
 *
 * Code from multiple authors is used on this implementation.
 * These are not the complete libraries, but only the parts I needed.
 *
 */

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
let particles;
let config;
let colorConfig;
let buffer32;
let animationId;
let dpr;

let fieldScale = 8;
let fieldColumns;
let fieldRows;
let fieldFrame = 0;
let fieldUpdateInterval = 4;
let fieldWorker;
let fieldReady = true;
let logoMask;

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
	initWorker();
	fieldReady = true;
	drawLogo();
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
	fieldFrame++;
	if (fieldFrame % fieldUpdateInterval === 0) {
		requestFieldUpdate();
	}
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
	fieldColumns = Math.floor(columns / fieldScale) + 1;
	fieldRows = Math.floor(rows / fieldScale) + 1;
	field = new Array(columns);
	for (let x = 0; x < columns; x++) {
		field[x] = new Array(rows);
		for (let y = 0; y < rows; y++) {
			field[x][y] = new Vector(0, 0);
		}
	}
}

function initWorker() {
	if (fieldWorker) {
		fieldWorker.terminate();
	}

	fieldWorker = new Worker("lib/flowfield-worker.js");

	// Seed immediately so it's ready before first calculate
	fieldWorker.postMessage({ type: "seed", seed: Math.random() });

	fieldWorker.onmessage = function (e) {
		if (e.data.type === "field") {
			const { resultX, resultY } = e.data;

			// Guard against stale data from a previous resize
			if (resultX.length !== columns * rows) {
				fieldReady = true;
				return;
			}

			for (let x = 0; x < columns; x++) {
				for (let y = 0; y < rows; y++) {
					let idx = y * columns + x;
					field[x][y].x = resultX[idx];
					field[x][y].y = resultY[idx];
				}
			}

			fieldReady = true;
		}
	};

	fieldWorker.onerror = function (e) {
		console.error("Worker error:", e.message, e.filename, e.lineno);
		fieldReady = true; // Don't get stuck
	};
}

function requestFieldUpdate() {
	if (!fieldReady) return; // Worker still busy, skip this frame
	fieldReady = false;

	if (!logoMask || logoMask.length !== columns * rows) {
		logoMask = new Uint8Array(columns * rows);
	}
	for (let x = 0; x < columns; x++) {
		for (let y = 0; y < rows; y++) {
			logoMask[y * columns + x] = buffer32[y * size * w + x * size] ? 1 : 0;
		}
	}

	let maskCopy = new Uint8Array(logoMask);
	fieldWorker.postMessage(
		{
			type: "calculate",
			columns,
			rows,
			fieldColumns,
			fieldRows,
			fieldScale,
			noiseZ,
			zoom: config.zoom,
			fieldForce: config.fieldForce,
			randomForce: config.randomForce,
			logoMaskBuffer: maskCopy.buffer,
			size,
			w,
		},
		[maskCopy.buffer],
	);
}

function drawBackground(alpha = 1) {
	if (alpha < 1) {
		ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
		ctx.fillRect(0, 0, w, h);
	} else {
		ctx.clearRect(0, 0, w, h);
	}
}

function drawLogo() {
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
