(function(window, undefined){
	'use strict';
	var
		document = window['document'],
		Object   = window['Object'],
		Math     = window['Math'],
		PI       = Math['PI'],
		TAU      = PI + PI,
		isNaN = window['isNaN'],
		isFinite = window['isFinite'],
		hasOwn = function(a,b){
			return a ? a['hasOwnProperty'](b) : false;
		},
		eitherHas = function(a,b,c){
			return (a && b)
				? (hasOwn(a,c)
					? a[c]
					: hasOwn(b,c)
						? b[c]
						: false)
				: false;
		},
		extend = function(a,b){
			a.prototype = new b;
			a.prototype['constructor'] = a;
		},
		range    = function(min, max, val){
			return Math['max'](min,
				Math['min'](max,
					((isNaN(val) || !isFinite(val)) ? min : val)
				)
			);
		},
		rangeHasOwn = function(objA, objB, prop, min, max, defaultVal){
			defaultVal = defaultVal != undefined ? defaultVal : min;
			return range(
				min,
				max,
				hasOwn(objA, prop)
					? parseFloat(objA[prop])
					: (
						hasOwn(objB, prop)
							? parseFloat(objB[prop])
							: defaultVal
					)
			);
		}
	;

	function mapgen(options){
		this.opts = {};
		this.cache = {};
		this['options'](options);
	}
	mapgen.prototype['options'] = function(newOpts){
		var
			cache = this.cache,
			opts = this.opts,
			roadR = rangeHasOwn(newOpts, opts,
				'roadR', 0x00|0, 0xff|0, 0xff|0)|0,
			roadG = rangeHasOwn(newOpts, opts,
				'roadG', 0x00|0, 0xff|0, 0xff|0)|0,
			roadB = rangeHasOwn(newOpts, opts,
				'roadB', 0x00|0, 0xff|0, 0xff|0)|0,
			roadA = +rangeHasOwn(newOpts, opts,
				'roadA', +0    , +1    , +0    )
		;
		opts['renderWidth']   = rangeHasOwn(newOpts, opts,
			'renderWidth'  , 100|0 , 65536|0 , 400|0 )|0;
		opts['renderHeight']  = rangeHasOwn(newOpts, opts,
			'renderHeight' , 100|0 , 65536|0 , 300|0 )|0;
		opts['roadWidth']     = rangeHasOwn(newOpts, opts,
			'roadWidth'    , 4|0   , 128|0   , 16|0  )|0;
		opts['polyWidth']     = rangeHasOwn(newOpts, opts,
			'polyWidth'    , 0x10|0, 0x1000|0, 0x40|0)|0;
		opts['polyWidthMul']  = rangeHasOwn(newOpts, opts,
			'polyWidthMul' , 1|0   , 32|0    , 4|0   )|0;
		opts['polyHeight']    = rangeHasOwn(newOpts, opts,
			'polyHeight'    , 0x10|0, 0x1000|0, 0x80|0)|0;
		opts['polyHeightMul'] = rangeHasOwn(newOpts, opts,
			'polyHeightMul', 1|0   , 32|0    , 4|0   )|0;
		opts['failLimit']     = rangeHasOwn(newOpts, opts,
			'failLimit'    , 1|0   , 1000|0  , 4|0   )|0;
		[
			'radius',
			'lineWidth',
			'fillR',
			'fillG',
			'fillB',
			'fillA',
			'lineR',
			'lineG',
			'lineB',
			'lineA'
		].forEach(function(e){
			if(hasOwn(newOpts, e)){
				opts[e] = newOpts[e]
			}
		});
		cache.roadColor = 'rgba('
			+ roadR.toString(10|0) + ','
			+ roadG.toString(10|0) + ','
			+ roadB.toString(10|0) + ','
			+ roadA.toString(10|0) + ')'
		;
		if(cache['poly']){
			for(var i in cache['poly']){
				if(hasOwn(cache['poly'], i)){
					for(var j in cache['poly'][i]){
						if(hasOwn(cache['poly'][i],j)){
							cache['poly'][i][j]['options'](opts);
						}
					}
				}
			}
		}
	}
	mapgen.prototype['draw'] = mapgen.prototype.draw = function(force){
		var
			opts        = this.opts,
			cache       = this.cache,
			render      = document.createElement('canvas'),
			randomCache = {},
			polyCache   = (cache['poly'] = cache['poly'] || {})
		;
		if(force){
			randomCache = {};
			polyCache = {};
			cache.blocks = undefined;
		}
		render.width = opts['renderWidth'];
		render.height = opts['renderHeight'];
		function randomDraw(){
			var
				randomWidth  = (Math.floor(Math.random() * opts['polyWidthMul' ]) + 1|0),
				randomHeight = (Math.floor(Math.random() * opts['polyHeightMul']) + 1|0),
				width = (opts['polyWidth' ] * randomWidth) + ((randomWidth - 1) * (opts['roadWidth'] * 1.5)),
				height = (opts['polyHeight'] * randomHeight) + ((randomHeight - 1) * (opts['roadWidth'] * 1.5))
			;
			if(!hasOwn(randomCache, width)){
				randomCache[width] = {};
			}
			if(!hasOwn(randomCache[width][height])){
				randomCache[width][height] = new mapgen.roundedCornerPoly({
					width     : width,
					height    : height
				});
			}
			randomCache[width][height]['options']({
					radius    : opts['radius'],
					lineWidth : opts['lineWidth'],
					fillR     : opts['fillR'],
					fillG     : opts['fillG'],
					fillB     : opts['fillB'],
					fillA     : opts['fillA'],
					lineR     : opts['lineR'],
					lineG     : opts['lineG'],
					lineB     : opts['lineB'],
					lineA     : opts['lineA']
			});
			return randomCache[width][height];
		}
		var
			ctx = render.getContext('2d'),
			draw,
			found,
			i = 0,
			packer = new Packer(render.width, render.height),
			failCount = 0,
			block
		;
		if(!cache.blocks){
			var
				blocks = []
			;
			while(failCount < opts['failLimit']){
				var
					random = randomDraw(),
					draw   = random.draw()
				;
				block = {
					w : draw.width + opts['roadWidth'],
					h : draw.height + opts['roadWidth']
				};
				packer.fit([block]);
				while(block.fit){
					failCount = 0;
					blocks.push({
						x : block.fit.x,
						y : block.fit.y,
						width : draw.width,
						height: draw.height
					});
					random = randomDraw();
					draw   = random.draw(true);
					if(!hasOwn(polyCache, draw.width)){
						polyCache[draw.width] = {};
					}
					polyCache[draw.width][draw.height] = random;
					block = {
						w : draw.width + opts['roadWidth'],
						h : draw.height + opts['roadWidth']
					};
					packer.fit([block]);
				}
				++failCount;
			}
			cache.blocks = blocks;
		}
		ctx.clearRect(0, 0, render.width, render.height);
		ctx.fillStyle = cache.roadColor;
		ctx.fillRect(0, 0, render.width, render.height);
		ctx.save();
		ctx.translate(opts['roadWidth'] / +2, opts['roadWidth'] / +2);
		cache.blocks.forEach(function(e){
			var
				draw = polyCache[e.width][e.height].draw(true)
			;
			ctx.drawImage(
				draw,
				e.x, e.y
			);
		});
		ctx.restore();

		return render;
	}

	function roundedCornerPoly(opts){
		this.opts = {};
		this.cache = {};
		this['options'](opts);
	}

	roundedCornerPoly.prototype['options'] = function(newOpts){
		var
			opts      = this.opts,
			width     = rangeHasOwn(newOpts, opts,
				'width'    , 0x10|0   , 0x10000|0, 0x80|0)|0,
			height    = rangeHasOwn(newOpts, opts,
				'height'   , 0x10|0   , 0x10000|0, 0x80|0)|0,
			radius    = rangeHasOwn(newOpts, opts,
				'radius'   , 0|0   , 0x100|0  , 0|0   )|0,
			lineWidth = rangeHasOwn(newOpts, opts,
				'lineWidth', 2|0   , 0x100|0, 2|0     )|0,
			lineR     = rangeHasOwn(newOpts, opts,
				'lineR'    , 0x00|0, 0xff|0   , 0x00|0)|0,
			lineG     = rangeHasOwn(newOpts, opts,
				'lineG'    , 0x00|0, 0xff|0   , 0x00|0)|0,
			lineB     = rangeHasOwn(newOpts, opts,
				'lineB'    , 0x00|0, 0xff|0   , 0x00|0)|0,
			lineA     = +rangeHasOwn(newOpts, opts,
				'lineA'    , +0    , +1    , +1),
			fillR     = rangeHasOwn(newOpts, opts,
				'fillR'    , 0x00|0, 0xff|0   , 0xff|0)|0,
			fillG     = rangeHasOwn(newOpts, opts,
				'fillG'    , 0x00|0, 0xff|0   , 0xff|0)|0,
			fillB     = rangeHasOwn(newOpts, opts,
				'fillB'    , 0x00|0, 0xff|0   , 0xff|0)|0,
			fillA     = +rangeHasOwn(newOpts, opts,
				'fillA'    , +0    , +1    , +1),
			lineColor = 'rgba('
				+ lineR.toString(10|0) + ','
				+ lineG.toString(10|0) + ','
				+ lineB.toString(10|0) + ','
				+ lineA.toString(10|0) + ')',
			fillColor = 'rgba('
				+ fillR.toString(10|0) + ','
				+ fillG.toString(10|0) + ','
				+ fillB.toString(10|0) + ','
				+ fillA.toString(10|0) + ')'
		;
		opts['width']     = width    ;
		opts['height']    = height   ;
		opts['radius']    = radius   ;
		opts['lineWidth'] = lineWidth;
		opts['lineR']     = lineR    ;
		opts['lineG']     = lineG    ;
		opts['lineB']     = lineB    ;
		opts['lineA']     = lineA    ;
		this.cache.lineColor = lineColor;
		this.cache.fillColor = fillColor;
		this.cache.drawWidth = lineWidth + width;
		this.cache.drawHeight = lineWidth + height;
	}

	roundedCornerPoly.prototype['draw'] =
	roundedCornerPoly.prototype.draw = function(force){
		force = force || this.cache.draw == undefined;
		if(force){
			var
				opts      = this.opts,
				cache     = this.cache,
				width     = opts['width'],
				height    = opts['height'],
				radius    = Math['min'](Math['min'](width / (2|0), height / (2|0)), opts['radius']),
				lineWidth = Math['min'](radius, opts['lineWidth']),
				newDraw   = (cache.draw
					&& cache.draw.width != cache.drawWidth
					&& cache.draw.height != cache.drawHeight
				),
				render    = (newDraw
					? cache.draw
					: document.createElement('canvas')
				),
				ctx
			;
			render.width = cache.drawWidth;
			render.height = cache.drawHeight;
			ctx = render.getContext('2d');
			ctx.clearRect(0|0, 0|0, cache.drawWidth, cache.drawHeight);
			ctx.save();
			ctx.beginPath();
			ctx.arc(
				radius + (lineWidth / +2),
				radius + (lineWidth / +2),
				radius,
				PI,
				PI / -2
			);
			ctx.arc(
				(lineWidth / 2) + width - radius,
				radius + (lineWidth / +2),
				radius,
				PI / -2,
				0
			);
			ctx.arc(
				(lineWidth / 2) + width - radius,
				(lineWidth / 2) + height - radius,
				radius,
				0,
				PI / +2
			);
			ctx.arc(
				radius + (lineWidth / +2),
				(lineWidth / 2) + height - radius,
				radius,
				PI / +2,
				PI
			);
			ctx.closePath();
			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = cache.lineColor;
			ctx.fillStyle = cache.fillColor;
			ctx.lineJoin = 'round';
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			cache.draw = render;
		}
		return this.cache.draw;
	}

	mapgen['roundedCornerPoly'] = roundedCornerPoly;

	window['mapgen'] = mapgen;
})(window);
