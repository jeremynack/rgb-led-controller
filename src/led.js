var ws281x = require('rpi-ws281x-native');

const NUM_LEDS = 600
let pixelData = new Uint32Array(NUM_LEDS);
let framerate = 30;
let offset = 0;

let animLoop = undefined;
let animation = (pixelData, offset) => {return {pixelData, offset};}

let ledMapping = 0;

let rgb2Int = (r, g, b) => { return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff); }
let int2Rgb = (num) => { return {r: (0xff0000 & num) >> 16, g: (0x00ff00 & num) >> 8, b: (0x0000ff & num)}; }
let hsv2Rgb = (h, s, v) => {
    h /= 360
  v = Math.round(v * 255)

  var i = Math.floor(h * 6)
  var f = h * 6 - i
  var p = Math.round(v * (1 - s))
  var q = Math.round(v * (1 - f * s))
  var t = Math.round(v * (1 - (1 - f) * s))

  switch (i % 6) {
    case 0:
      return [v, t, p]
    case 1:
      return [q, v, p]
    case 2:
      return [p, v, t]
    case 3:
      return [p, q, v]
    case 4:
      return [t, p, q]
    case 5:
      return [v, p, q]
  }
}

function remapLed(mapping) {
	let display = [...pixelData];
	for(let i = 0; i < NUM_LEDS; i++) {
		let color = int2Rgb(display[i]);
		let output = {r: 0, g: 0, b: 0};

		switch(mapping) {
			case 4:
				output = {r: color['g'], g: color['r'], b: color['b']};
				break;
			default:
				output = color;
				break;
		}

		display[i] = rgb2Int(output.r, output.g, output.b);
	}
	
	return display;
}

const intervalFunc = function() {
	({pixelData, offset} = animation(pixelData, offset));

	let disp = remapLed(ledMapping);

	ws281x.render(disp);
	//console.log(animLoop);
}

module.exports = {
	init: (options = {framerate, ledMapping}) => {

		ws281x.init(NUM_LEDS);
		framerate = options.framerate;
		ledMapping = options.ledMapping;

		animLoop = setInterval(intervalFunc, 1000 / options.framerate);
	},
	setAnimation: (animationFunction = (pixelData, offset) => {return {pixelData, offset};}, options = {framerate,}) => {
		animation = animationFunction;
		framerate = options.framerate;
	},
	setSpeed: (speed = 30) => {
		framerate = speed;
		console.log("clear");
		clearInterval(animLoop);
		animLoop = setInterval(intervalFunc, 1000 / framerate);
	},
	setBrightness: (brightness) => {
		ws281x.setBrightness(brightness);
	},
	reset: () => {
		ws281x.reset();
	},

	// Conversion
	rgb2Int,
	int2Rgb,
	hsv2Rgb,

	// Getters
	getLedCount: () => { return NUM_LEDS; },

	// LED Mappings
	RGB: 0,
	RBG: 1,
	BRG: 2,
	BGR: 3,
	GRB: 4,
	GBR: 5,
}
