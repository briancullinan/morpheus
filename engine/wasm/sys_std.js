

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
    let s = Q3e.sharedMemory + Q3e.sharedCounter
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

var STD = {
  __assert_fail: console.assert, // TODO: convert to variadic fmt for help messages
  longjmp: function (id, code) { throw new Error('longjmp', id, code) },
  setjmp: function (id) { try {  } catch (e) { } },
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


