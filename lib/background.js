/*
 * Tobias Rumiz (Ruminini)
 * https://github.com/Ruminini
 * An animated particles background.
 */

import { Vector } from "./Vector.js";
import { Particle } from "./Particle.js";
import { FpsCounter } from "./fps-counter.js";
import { loadLogoMask, buildLogoMask } from "./logo-mask.js";
import {
	DEBUG,
	PARTICLE_COUNT,
	DARKEN_INTERVAL,
	DARKEN_ALPHA,
	CLEANUP_INTERVAL,
	CLEANUP_THRESHOLD,
	FIELD_SCALE,
	FIELD_UPDATE_INTERVAL,
	colorConfig,
	createDynamicConfig,
} from "./config.js";

let canvas, ctx;
let field;
let w, h;
let imgX, imgY, imgSize;
let size;
let columns, rows;
let noiseZ = 0;
let particles;
let config;
let buffer32;
let animationId;
let dpr;

let fieldColumns, fieldRows;
let fieldFrame = 0;
let fieldWorker;
let fieldReady = true;

let particleIndex = 0;
let darkenCounter = 0;
let cleanupCounter = 0;

let fpsCounter;

function setup() {
	window.addEventListener("resize", () => reset(), false);
	if (DEBUG) {
		fpsCounter = new FpsCounter();
		fpsCounter.init();
	}
	canvas = document.querySelector("#canvas");
	ctx = canvas.getContext("2d");
	reset(true);
}

async function reset(force = false) {
	dpr = window.devicePixelRatio || 1;
	const newW = Math.round(canvas.getBoundingClientRect().width * dpr);
	const newH = Math.round(canvas.getBoundingClientRect().height * dpr);
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

	config = createDynamicConfig(imgSize / 400);
	size = config.size;
	columns = Math.floor(w / size) + 1;
	rows = Math.floor(h / size) + 1;

	initParticles();
	initField();
	initWorker();

	fieldReady = true;
	particleIndex = 0;
	darkenCounter = 0;
	cleanupCounter = 0;

	buffer32 = await loadLogoMask(canvas, ctx, imgX, imgY, imgSize, w, h);
	draw();
}

function initParticles() {
	particles = [];
	for (let i = 0; i < PARTICLE_COUNT; i++) {
		particles.push(genParticle());
	}
}

function genParticle() {
	return new Particle(
		gaussianRandom(imgX, imgSize / 2),
		gaussianRandom(imgY, imgSize / 2),
		colorConfig,
	);
}

function gaussianRandom(mean = 0, stdDev = 1) {
	const u = Math.random();
	const v = Math.random();
	const gaussian = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
	return mean + gaussian * stdDev;
}

function initField() {
	fieldColumns = Math.floor(columns / FIELD_SCALE) + 1;
	fieldRows = Math.floor(rows / FIELD_SCALE) + 1;
	field = new Array(columns);
	for (let x = 0; x < columns; x++) {
		field[x] = new Array(rows);
		for (let y = 0; y < rows; y++) {
			field[x][y] = new Vector(0, 0);
		}
	}
}

function initWorker() {
	fieldWorker?.terminate();
	fieldWorker = new Worker("lib/flowfield-worker.js");
	fieldWorker.postMessage({ type: "seed", seed: Math.random() });

	fieldWorker.onmessage = function (e) {
		if (e.data.type === "field") {
			const { resultX, resultY } = e.data;
			if (resultX.length !== columns * rows) {
				fieldReady = true;
				return;
			}
			for (let x = 0; x < columns; x++) {
				for (let y = 0; y < rows; y++) {
					const idx = y * columns + x;
					field[x][y].x = resultX[idx];
					field[x][y].y = resultY[idx];
				}
			}
			fieldReady = true;
		}
	};

	fieldWorker.onerror = function (e) {
		console.error("Worker error:", e.message, e.filename, e.lineno);
		fieldReady = true;
	};
}

function requestFieldUpdate() {
	if (!fieldReady) return;
	fieldReady = false;

	const logoMask = buildLogoMask(buffer32, columns, rows, size, w);
	fieldWorker.postMessage(
		{
			type: "calculate",
			columns,
			rows,
			fieldColumns,
			fieldRows,
			fieldScale: FIELD_SCALE,
			noiseZ,
			zoom: config.zoom,
			fieldForce: config.fieldForce,
			randomForce: config.randomForce,
			logoMaskBuffer: logoMask.buffer,
			size,
			w,
		},
		[logoMask.buffer],
	);
}

function drawParticles() {
	const colorGroups = new Map();

	for (let i = 0; i < particles.length; i++) {
		const p = particles[i];
		const x = p.pos.x / size;
		const y = p.pos.y / size;

		let v;
		if (x >= 0 && x < columns && y >= 0 && y < rows) {
			v = field[Math.floor(x)][Math.floor(y)];
		}
		p.move(v, config.particleSpeed);
		p.wrap(w, h);

		if (!colorGroups.has(p.col)) {
			colorGroups.set(p.col, []);
		}
		colorGroups.get(p.col).push(p);
	}

	colorGroups.forEach((group, color) => {
		ctx.beginPath();
		ctx.strokeStyle = color;
		for (let i = 0; i < group.length; i++) {
			const p = group[i];
			ctx.moveTo(p.prevPos.x, p.prevPos.y);
			ctx.lineTo(p.pos.x, p.pos.y);
		}
		ctx.stroke();
	});
}

function darkenBackground() {
	darkenCounter++;
	if (darkenCounter > DARKEN_INTERVAL) {
		ctx.fillStyle = `rgba(0, 0, 0, ${DARKEN_ALPHA})`;
		ctx.fillRect(0, 0, w, h);
		darkenCounter = 0;
	}
}

function cleanupDarkPixels() {
	cleanupCounter++;
	if (cleanupCounter < CLEANUP_INTERVAL) return;
	cleanupCounter = 0;
	const imageData = ctx.getImageData(0, 0, w, h);
	const data = imageData.data;
	for (let i = 0; i < data.length; i += 4) {
		if (
			data[i] < CLEANUP_THRESHOLD &&
			data[i + 1] < CLEANUP_THRESHOLD &&
			data[i + 2] < CLEANUP_THRESHOLD
		) {
			data[i] = 0;
			data[i + 1] = 0;
			data[i + 2] = 0;
			data[i + 3] = 0;
		}
	}
	ctx.putImageData(imageData, 0, 0);
}

function draw() {
	animationId = requestAnimationFrame(draw);
	let t0, t1, t2, t3;
	if (DEBUG) t0 = performance.now();
	fieldFrame++;
	if (fieldFrame % FIELD_UPDATE_INTERVAL === 0) {
		requestFieldUpdate();
	}
	if (DEBUG) t1 = performance.now();
	drawParticles();
	if (DEBUG) t2 = performance.now();
	noiseZ += config.noiseSpeed;
	darkenBackground();
	cleanupDarkPixels();
	particles[particleIndex] = genParticle();
	particleIndex = (particleIndex + 1) % particles.length;
	if (DEBUG) {
		t3 = performance.now();
		fpsCounter.updateDetailed(t1 - t0, t2 - t1, t3 - t2);
	}
}

setup();
