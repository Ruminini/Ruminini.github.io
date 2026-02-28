/*
  Johan Karlsson (DonKarlssonSan)
  https://github.com/DonKarlssonSan/vectory
*/

export class Vector {
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
		const angle = this.getAngle();
		this.x = Math.cos(angle) * length;
		this.y = Math.sin(angle) * length;
	}

	getAngle() {
		return Math.atan2(this.y, this.x);
	}

	getLength() {
		return Math.hypot(this.x, this.y);
	}

	clampLength(max) {
		const len = this.getLength();
		if (len > max) {
			const scale = max / len;
			this.x *= scale;
			this.y *= scale;
		}
	}
}
