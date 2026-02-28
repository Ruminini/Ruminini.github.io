import { Vector } from "./Vector.js";

export class Particle {
	constructor(x, y, colorConfig) {
		this.pos = new Vector(x, y);
		this.prevPos = new Vector(x, y);
		this.vel = new Vector(Math.random() - 0.5, Math.random() - 0.5);
		this.acc = new Vector(0, 0);

		const hue =
			Math.round(
				(Math.random() * colorConfig.hueRange + colorConfig.baseHue) / 5,
			) * 5;
		const lightness =
			Math.round(
				(Math.random() * colorConfig.lightnessVariance +
					50 -
					colorConfig.lightnessVariance) /
					5,
			) * 5;
		this.col = `hsla(${hue},${colorConfig.colorSaturation}%,${lightness}%,${colorConfig.particleOpacity})`;
	}

	move(acc, maxSpeed) {
		this.prevPos.x = this.pos.x;
		this.prevPos.y = this.pos.y;
		if (acc) {
			this.vel.addTo(acc);
		}
		this.pos.addTo(this.vel);
		this.vel.clampLength(maxSpeed);
	}

	wrap(w, h) {
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
