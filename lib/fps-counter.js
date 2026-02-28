export class FpsCounter {
	constructor() {
		this.frames = 0;
		this.lastTime = performance.now();
		this.fps = 0;
		this.element = null;
	}

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
	}

	update() {
		this.frames++;
		const now = performance.now();
		const delta = now - this.lastTime;
		if (delta >= 1000) {
			this.fps = Math.round((this.frames * 1000) / delta);
			this.frames = 0;
			this.lastTime = now;
			this.element.textContent = `FPS: ${this.fps}`;
		}
	}

	updateDetailed(fieldTime, particleTime, otherTime) {
		this.frames++;
		const now = performance.now();
		const delta = now - this.lastTime;
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
	}

	destroy() {
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
	}
}
