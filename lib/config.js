export const DEBUG = false;

export const PARTICLE_COUNT = 3000;
export const DARKEN_INTERVAL = 20;
export const DARKEN_ALPHA = 0.002;
export const CLEANUP_INTERVAL = 300;
export const CLEANUP_THRESHOLD = 0.01;
export const FIELD_SCALE = 8;
export const FIELD_UPDATE_INTERVAL = 8;

export const colorConfig = {
	particleOpacity: 0.1,
	baseHue: 135,
	hueRange: 50,
	lightnessVariance: 40,
	colorSaturation: 100,
};

export function createDynamicConfig(scale = 1) {
	return {
		zoom: Math.round(50 * scale),
		noiseSpeed: 0.007 * scale,
		particleSpeed: 0.3 * scale,
		fieldForce: Math.round(50 * scale),
		randomForce: Math.round(6 * scale),
		size: Math.round(5 * scale),
	};
}
