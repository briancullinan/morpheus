// Launcher program for web browser and .wasm builds
let isStreaming = false

const STDLIBS = {
	MATH: MATHS,
	FS: FS,
	NET: NET,
	STD: STD,
	DATE: DATE,
}

const ENGINE = {
	env: Q3e,
	SYS: SYS,
	GL: EMGL,
	INPUT: INPUT,
}

function updateGlobalBufferAndViews(buf) {
	Q3e["HEAP8"] = window.HEAP8 = new Int8Array(buf);
	Q3e["HEAPU8"] = window.HEAPU8 = new Uint8Array(buf);
	Q3e["HEAP16"] = window.HEAP16 = new Int16Array(buf);
	Q3e["HEAPU16"] = window.HEAPU16 = new Uint16Array(buf);
	Q3e["HEAP32"] = window.HEAP32 = new Int32Array(buf);
	Q3e["HEAPU32"] = window.HEAPU32 = new Uint32Array(buf);
	Q3e["HEAPF32"] = window.HEAPF32 = new Float32Array(buf);
	Q3e["HEAPF64"] = window.HEAPF64 = new Float64Array(buf);
}


function initEnvironment() {
	Object.assign(Q3e, STDLIBS, ENGINE)
	// assign everything to env because this __attribute(import) BS don't work
	let startKeys = Object.keys(Q3e)
	let startValues = Object.values(Q3e)
	for(let i = 0; i < startKeys.length; i++) {
		Object.assign(Q3e.env, startValues[i])
	}
	Q3e['imports'] = Q3e
	Q3e['cacheBuster'] = Date.now()
	Q3e['table'] = Q3e['__indirect_function_table'] =
		new WebAssembly.Table({ 
			initial: 2000, 
			element: 'anyfunc', 
			maximum: 10000 
		})
	Q3e['memory'] = new WebAssembly.Memory({ 
		initial: 2048, 
		/* 'shared': true */ 
	})
	updateGlobalBufferAndViews(Q3e.memory.buffer)
	return Q3e
}

// write it non-async just in case wasm is support but not es6?
function initWasm(bytes, env) {
	if(isStreaming) {
		return WebAssembly.instantiateStreaming(bytes, env)
	} else {
		return WebAssembly.instantiate(bytes, env)
	}
}

function updateEnvironment(program) {
	// share the game with window for hackers
	if(!program) {
		throw new Error("no program!")
	}
	Q3e['program'] = program || {}
	Q3e['instance'] = Q3e['program'].instance || {}
	Q3e['exports'] = Q3e['instance'].exports || {}

	// reserve some memory at the beginning for passing shit back and forth with JS
	//   not to use a complex HEAP, just loop around on bytes[b % 128] and if 
	//   something isn't cleared out, crash
	// store some strings and crap
	STD['sharedMemory'] = malloc(1024 * 1024) 
	Q3e['exited'] = false
	let newMethods = Object.keys(Q3e['exports'])
	if(typeof window != 'undefined') {
		for(let i = 0; i < newMethods.length; i++) {
			window[newMethods[i]] = Q3e['exports'][newMethods[i]] //.apply(Q3e['exports'])
		}
		Object.assign(window, Q3e['exports'])
	} else if (typeof global != 'undefined') {
		for(let i = 0; i < newMethods.length; i++) {
			global[newMethods[i]] = Q3e['exports'][newMethods[i]] //.apply(Q3e['exports'])
		}
		Object.assign(global, Q3e['exports'])
	}

	return program
}


function initEngine() {
	try {
		if(typeof window['Z_Malloc'] == 'undefined') {
			window.Z_Malloc = window['Z_MallocDebug']
		}
		// Startup args is expecting a char **
		let startup = getQueryCommands()
		RunGame(startup.length, stringsToMemory(startup))
		HEAPU32[fs_loading >> 2] = Q3e.fs_loading
		// should have Cvar system by now
		INPUT.fpsUnfocused = Cvar_VariableIntegerValue(stringToAddress('com_maxfpsUnfocused'));
		INPUT.fps = Cvar_VariableIntegerValue(stringToAddress('com_maxfps'))
		// this might help prevent this thing that krunker.io does where it lags when it first starts up
		Q3e.frameInterval = setInterval(Sys_Frame, 
			1000 / (HEAP32[gw_active >> 2] ? INPUT.fps : INPUT.fpsUnfocused));
	} catch (e) {
		console.log(e)
		Sys_Exit(1)
		throw e
	}
}


function initBrowser() {
	// set window module because of LEGACY SDL audio
	const viewport = document.getElementById('viewport-frame')
	Q3e['canvas'] = viewport.getElementsByTagName('CANVAS')[0]

	const Q3e = initEnvironment()

	const initFilesystem = new Promise(function (resolve) {
		setTimeout(function () {
			// might as well start this early, transfer 
			//    IndexedDB from disk/memory to application memory
			readAll()
			resolve()
		}, 200)
	})

	// slight delay to let window settle from big wasm data
	const initPreload = new Promise(function (resolve) {
		setTimeout(function () {
			resolve(FS.virtual['quake3e.wasm'].contents)
		}, 200)
	})

	// no delay on remote loads
	const initStreaming = fetch('./quake3e.wasm?time=' + Q3e.cacheBuster)
		.catch(function (e) { console.error(e) })
		.then(function (response) {
			if(response && response.status == 200) {
				if(isStreaming) {
					return response
				} else {
					return response.arrayBuffer()
				}
			}
		})

	if(typeof FS.virtual['quake3e.wasm'] != 'undefined') {
		isStreaming = false
		return initFilesystem
			.then(initPreload)
			.then(initWasm)
			.then(initEngine)
			.then(updateEnvironment)
	} else {
		isStreaming = true
		return initFilesystem
			.then(initStreaming)
			.then(initWasm)
			.then(initEngine)
			.then(updateEnvironment)
	}

}

if(typeof window != 'undefined') {
	window.Module = Q3e 
	// TODO: change when hot reloading works
	window.addEventListener('load', function () {
		if(!typeof window.initAce != 'undefined') {
			initAce()
		}

		if(typeof Q3e.imports == 'undefined') {
			initBrowser()
		}
	}, false)

} else if (typeof module != 'undefined') {
	module.exports = {
		initEnvironment,
		initWasm,
		updateEnvironment,
	}

}



/*
if(!bytes) {
	if(Q3e.canvas) {
		Q3e.canvas.transferControlToOffscreen()
	}
	// try it in a service worker
	if((window.location.protocol == 'http:' 
		|| window.location.protocol == 'https:'
		|| window.location.protocol == 'chrome-extension:')
		&& 'serviceWorker' in navigator) {
		navigator.serviceWorker.register('quake3e.js', { scope: '/' })
			.then(function (registration) {
				if(typeof SYS != 'undefined') SYS.servicable = true
			})
			.catch(function (err) {
				if(typeof SYS != 'undefined') SYS.servicable = false
				console.log('Service Worker registration failed: ', err)
			})
	}
	document.body.classList.add('no-gl')
	throw new Error('Couldn\'t find wasm!')
}
*/
