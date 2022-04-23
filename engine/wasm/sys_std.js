
/*
function get_string(memory, addr) {
	let buffer = new Uint8Array(memory.buffer, addr, memory.buffer.byteLength - addr);
	let term = buffer.indexOf(0);

	return new TextDecoder().decode(buffer.subarray(0, term));
}
*/


function addressToString(addr, length) {
	let newString = ''
	if(!addr) return newString
	if(!length) length = 1024
	for(let i = 0; i < length; i++) {
		if(HEAPU8[addr + i] == 0) {
			break;
		}
		newString += String.fromCharCode(HEAPU8[addr + i])
	}

	return newString
}

function stringToAddress(str, addr) {
  if(!STD.sharedMemory 
    || typeof STD.sharedCounter != 'number'
    || isNaN(STD.sharedCounter)) {
      debugger
      throw new Error('Memory not setup!')
  }
	let start = STD.sharedMemory + STD.sharedCounter
	if(typeof str != 'string') {
		str = str + ''
	}
	if(addr) start = addr
	for(let j = 0; j < str.length; j++) {
		HEAPU8[start+j] = str.charCodeAt(j)
	}
	HEAPU8[start+str.length] = 0
	HEAPU8[start+str.length+1] = 0
	HEAPU8[start+str.length+2] = 0
	if(!addr) {
		STD.sharedCounter += str.length + 3
		STD.sharedCounter += 4 - (STD.sharedCounter % 4)
		if(STD.sharedCounter > 1024 * 512) {
			STD.sharedCounter = 0
		}
	}
  if(isNaN(STD.sharedCounter)) {
    debugger
    throw new Error('Memory not setup!')
  }
	return start
}


// here's the thing, I know for a fact that all the callers copy this stuff
//   so I don't need to increase my temporary storage because by the time it's
//   overwritten the data won't be needed, should only keep shared storage around
//   for events and stuff that might take more than 1 frame
function stringsToMemory(list, length) {
  if(!STD.sharedMemory || typeof STD.sharedCounter != 'number') {
    debugger
    throw new Error('Memory not setup!')
  }
	// add list length so we can return addresses like char **
	let start = STD.sharedMemory + STD.sharedCounter
	let posInSeries = start + list.length * 4
	for (let i = 0; i < list.length; i++) {
		HEAPU32[(start+i*4)>>2] = posInSeries // save the starting address in the list
		stringToAddress(list[i], posInSeries)
		posInSeries += list[i].length + 1
	}
	if(length) HEAPU32[length >> 2] = posInSeries - start
	STD.sharedCounter = posInSeries - STD.sharedMemory
	STD.sharedCounter += 4 - (STD.sharedCounter % 4)
	if(STD.sharedCounter > 1024 * 512) {
		STD.sharedCounter = 0
	}
  if(isNaN(STD.sharedCounter)) {
    debugger
    throw new Error('Memory not setup!')
  }
	return start
}


function Sys_Microseconds() {
	if (window.performance.now) {
		return parseInt(window.performance.now(), 10);
	} else if (window.performance.webkitNow) {
		return parseInt(window.performance.webkitNow(), 10);
	}

	STD.sharedCounter += 8
	return STD.sharedMemory + STD.sharedCounter - 8
}

function Sys_Milliseconds() {
	if (!DATE.timeBase) {
		// javascript times are bigger, so start at zero
		//   pretend like we've been alive for at least a few seconds
		//   I actually had to do this because files it checking times and this caused a delay
		DATE.timeBase = Date.now() - 5000;
	}

	//if (window.performance.now) {
	//  return parseInt(window.performance.now(), 10);
	//} else if (window.performance.webkitNow) {
	//  return parseInt(window.performance.webkitNow(), 10);
	//} else {
	return Date.now() - DATE.timeBase;
	//}
}

function Sys_RandomBytes (string, len) {
	if(typeof crypto != 'undefined') {
		crypto.getRandomValues(HEAP8.subarray(string, string+(len / 4)))
	} else {
		for(let i = 0; i < (len / 4); i++) {
			HEAP8[string] = Math.random() * 255
		}
	}
	return true;
}

function Com_RealTime(tm) {
	// locale time is really complicated
	//   use simple Q3 time structure
	let now = new Date()
	let t = now / 1000
  if(tm) {
    HEAP32[(tm >> 2) + 5] = now.getFullYear() - 1900
    HEAP32[(tm >> 2) + 4] = now.getMonth() // already subtracted by 1
    HEAP32[(tm >> 2) + 3] = now.getDate() 
    HEAP32[(tm >> 2) + 2] = (t / 60 / 60) % 24
    HEAP32[(tm >> 2) + 1] = (t / 60) % 60
    HEAP32[(tm >> 2) + 0] = t % 60
  }
	return t
}



function clock_gettime(clk_id, tp) {
	var now;
	if (clk_id === 0) {
			now = Date.now()
	} else if ((clk_id === 1 || clk_id === 4) && _emscripten_get_now_is_monotonic) {
			now = _emscripten_get_now()
	} else {
			HEAPU32[errno >> 2] = 28
			return -1
	}
	HEAP32[tp >> 2] = now / 1e3 | 0;
	HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
	return 0
}

function Sys_time(tm) {
	// locale time is really complicated
	//   use simple Q3 time structure
}

var DATE = {
  mktime: function (tm) {
    return new Date(
      HEAP32[(tm >> 2) + 5] + 1900, 
      HEAP32[(tm >> 2) + 4] /* month is already subtracted for mtime */, 
      HEAP32[(tm >> 2) + 3], 
      HEAP32[(tm >> 2) + 2], 
      HEAP32[(tm >> 2) + 1], 
      HEAP32[(tm >> 2) + 0]).getTime() / 1000
  },
  asctime: function () {
    // Don't really care what time it is because this is what the engine does
    //   right above this call
    return stringToAddress(new Date().toLocaleString())
  },
  time: function () {
    // The pointer returned by localtime (and some other functions) are actually pointers to statically allocated memory.
    // perfect.
    debugger
  },
  localtime: function (t) {
    // TODO: only uses this for like file names, so doesn't have to be fast
    debugger
    let s = STD.sharedMemory + STD.sharedCounter
    HEAP32[(s + 4 * 1) >> 2] = floor(t / 60)
    HEAP32[(s + 4 * 1) >> 2] = floor(t / 60 / 60)
    HEAP32[(s + 4 * 1) >> 2] = floor(t / 60 / 60)
    /*
typedef struct qtime_s {
	int tm_sec;     /* seconds after the minute - [0,59]
	int tm_min;     /* minutes after the hour - [0,59]
	int tm_hour;    /* hours since midnight - [0,23]
	int tm_mday;    /* day of the month - [1,31]
	int tm_mon;     /* months since January - [0,11]
	int tm_year;    /* years since 1900
	int tm_wday;    /* days since Sunday - [0,6]
	int tm_yday;    /* days since January 1 - [0,365]
	int tm_isdst;   /* daylight savings time flag 
} qtime_t;
*/

  },
  ctime: function (t) {
    return stringToAddress(new Date(t).toString())
  },
  Com_RealTime: Com_RealTime,
  Sys_time: Com_RealTime,
  Sys_RandomBytes: Sys_RandomBytes,
  Sys_Milliseconds: Sys_Milliseconds,
  Sys_Microseconds: Sys_Microseconds,
  clock_time_get: function () { debugger },
	clock_res_get: function () { debugger },
	clock_gettime: clock_gettime,
}

const DEFAULT_OUTPUT_DEVNAME = "System audio output device"

/*
function Sys_getenv(varname) {
  let envar = addressToString(varname)
  if(envar == 'SDL_AUDIO_DEVICE_NAME') {
    return stringToAddress(DEFAULT_OUTPUT_DEVNAME)
  }
  return stringToAddress('')
}
*/

function Sys_exec() {
  // try to find and execute wasm in same context like INSECURE DLLs in Windows
  // we only have inmemory FS and specific system functions, there isn't much
  //   anyone can do from here on native to break out of nodejs sandbox

  // TODO: in browser, try to download wasm like normal only from host address
  //   or from cl_dlurl address, localStorage or IndexedDB could be vulnerable.
  // THATS WHY ITS ENCRYPTED AGAIN.
  debugger
}



var STD = {
  sharedCounter: 0,
  stringToAddress,
  addressToString,
  stringsToMemory,
  __assert_fail: console.assert, // TODO: convert to variadic fmt for help messages
  longjmp: function (id, code) { throw new Error('longjmp', id, code) },
  setjmp: function (id) { try {  } catch (e) { } },
  //Sys_exec: Sys_exec,
  //Sys_execv: Sys_exec,
  //Sys_getenv: Sys_getenv,
  /*
  memset: function (addr, val, count) {
    HEAP8.fill(val, addr, addr + count)
    return addr
  },
  fprintf: function (f, err, args) {
    // TODO: rewrite va_args in JS for convenience?
    console.log(addressToString(err), addressToString(HEAPU32[(args) >> 2]));
  },
  tolower: function tolower(c) { return String.fromCharCode(c).toLowerCase().charCodeAt(0) },
  atoi: function (i) { return parseInt(addressToString(i)) },
  atol: function (i) { return parseInt(addressToString(i)) },
  atof: function (f) { return parseFloat(addressToString(f)) },
  atod: function (f) { return parseFloat(addressToString(f)) },
  strtof: function (f, n) { 
    // TODO: convert this to some sort of template?
    let str = addressToString(f)
    let result = parseFloat(str)
    if(isNaN(result)) {
      if(n) HEAP32[(n) >> 2] = f
      return 0
    } else {
      if(n) HEAP32[(n) >> 2] = f + str.length
      return result
    }
  },
  strlen: function (addr) { return HEAP8.subarray(addr).indexOf(0) },
  memcpy: function (dest, source, length) {
    HEAP8.copyWithin(dest, source, source + length)
  },
  strncpy: function (dest, src, cnt) {
    stringToAddress(addressToString(src).substr(0, cnt - 1), dest)
    HEAP8[dest + cnt - 1] = 0
  },
  strcmp: function (str1, str2) {
    let i = 0
    while(i < 1024) {
      if(HEAP8[str1 + i] == HEAP8[str2 + i] == 0) {
        // are equal, keep checking
      } else if(HEAP8[str1 + i] < HEAP8[str2 + i])
        return -1
      else 
        return 1
      i++
    }
    return 0
  },
  strcat: function (dest, source) { 
    let length = HEAP8.subarray(source).indexOf(0) + 1
    let start = HEAP8.subarray(dest).indexOf(0)
    HEAP8.copyWithin(dest + start, source, source + length )
    return dest
  },
  strchr: function (str, ch) {
    let length = HEAP8.subarray(str).indexOf(0)
    let pos = HEAP8.subarray(str, str + length).indexOf(ch)
    return pos == -1 ? null : str + pos
  },
  memmove: function (dest, source, length) {
    HEAP8.copyWithin(dest, source, source + length)
  },
  strrchr: function (str, ch) {
    let length = HEAP8.subarray(str).indexOf(0)
    let pos = Uint8Array.from(HEAP8.subarray(str, str + length))
      .reverse().indexOf(ch)
    return pos == -1 ? null : str + length - pos - 1
  },
  strcpy: function (dest, source) {
    let length = HEAP8.subarray(source).indexOf(0) + 1
    HEAP8.copyWithin(dest, source, source + length)
    return dest
  },
  strncmp: function (str, cmp, cnt) {
    return addressToString(str).substr(0, cnt).localeCompare(addressToString(cmp).substr(0, cnt));
  },
  strpbrk: function () { debugger },
  strstr: function (haystack, needle) {
    let i = 0
    let offset = 0
    while(i < 1024) {
      if(HEAP8[haystack + i] == HEAP8[needle]) {
        offset = i
      } else if (HEAP8[haystack + i] == HEAP8[needle + (i - offset)]) {
        // matches
      } else {
        offset = 0
      }
      i++
    }
    return offset == 0 ? null : haystack + offset
  },
  memcmp: function () { debugger },
  qsort: function () { debugger },
  strncat: function () { debugger },
  strtod: function (str, n) { return STD.strtof(str, n) },
  */
  stringsToMemory: stringsToMemory,
  addressToString: addressToString,
  stringsToMemory: stringsToMemory,
}



var MATHS = {
  srand: function srand() {}, // TODO: highly under-appreciated game dynamic
  rand: Math.random,
  exp2: function (c) { return Math.pow(2, c) },
  exp2f: function (c) { return Math.pow(2, c) },
}
// These can be assigned automatically? but only because they deal only with numbers and not strings
//   TODO: What about converting between float, endian, and shorts?
let maths = Object.getOwnPropertyNames(Math)
for(let j = 0; j < maths.length; j++) {
  MATHS[maths[j] + 'f'] = Math[maths[j]]
  MATHS[maths[j]] = Math[maths[j]]
}

if(typeof module != 'undefined') {
  module.exports = {
    MATHS,
		STD,
		DATE,
    stringToAddress,
    addressToString,
    stringsToMemory
  }
}


