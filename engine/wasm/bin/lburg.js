// ZERO DEPENDENCY BARE-BONES JAVASCRIPT FILE-SYSTEM FOR 
//   POSIX WEB-ASSEMBLY
// remove these references for web and emulate
const fs = require('fs')
const path = require('path')

const ENOENT = 9968

let Q3e = {
	sharedCounter: 0,
	sharedMemory: 0,
}

Object.assign(Q3e, {
	wasi_snapshot_preview1: Q3e,
	env: Q3e,
})

// here's the thing, I know for a fact that all the callers copy this stuff
//   so I don't need to increase my temporary storage because by the time it's
//   overwritten the data won't be needed, should only keep shared storage around
//   for events and stuff that might take more than 1 frame
function stringsToMemory(list, length) {
	// add list length so we can return addresses like char **
	let start = Q3e.sharedMemory + Q3e.sharedCounter
	let posInSeries = start + list.length * 4
	for (let i = 0; i < list.length; i++) {
		HEAPU32[(start+i*4)>>2] = posInSeries // save the starting address in the list
		stringToAddress(list[i], posInSeries)
		posInSeries += list[i].length + 1
	}
	if(length) HEAPU32[length >> 2] = posInSeries - start
	Q3e.sharedCounter = posInSeries - Q3e.sharedMemory
	Q3e.sharedCounter += 4 - (Q3e.sharedCounter % 4)
	if(Q3e.sharedCounter > 1024 * 512) {
		Q3e.sharedCounter = 0
	}
	return start
}

let HEAPU8
let HEAPU32

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
	let start = Q3e.sharedMemory + Q3e.sharedCounter
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
		Q3e.sharedCounter += str.length + 3
		Q3e.sharedCounter += 4 - (Q3e.sharedCounter % 4)
		if(Q3e.sharedCounter > 1024 * 512) {
			Q3e.sharedCounter = 0
		}
	}
	return start
}

var WASI_ESUCCESS = 0;
var WASI_EBADF = 8;
var WASI_EINVAL = 28;
var WASI_ENOSYS = 52;

var WASI_STDOUT_FILENO = 1;
var WASI_STDERR_FILENO = 2;

function getModuleMemoryDataView() {
	// call this any time you'll be reading or writing to a module's memory 
	// the returned DataView tends to be dissaociated with the module's memory buffer at the will of the WebAssembly engine 
	// cache the returned DataView at your own peril!!

	return new DataView(Q3e.memory.buffer);
}

function fd_prestat_get(fd, bufPtr) {
	debugger
	return WASI_EBADF;
}

function fd_prestat_dir_name(fd, pathPtr, pathLen) {
	debugger
	return WASI_EINVAL;
}

function environ_sizes_get(environCount, environBufSize) {
	debugger
	var view = getModuleMemoryDataView();

	view.setUint32(environCount, 0, !0);
	view.setUint32(environBufSize, 0, !0);

	return WASI_ESUCCESS;
}

function environ_get(environ, environBuf) {
	debugger
	return WASI_ESUCCESS;
}

function args_sizes_get(argc, argvBufSize) {
	debugger
	var view = getModuleMemoryDataView();

	view.setUint32(argc, 0, !0);
	view.setUint32(argvBufSize, 0, !0);

	return WASI_ESUCCESS;
}

function args_get(argv, argvBuf) {
	debugger
	return WASI_ESUCCESS;
}

function fd_fdstat_get(fd, bufPtr) {
	var view = getModuleMemoryDataView();

	view.setUint8(bufPtr, fd);
	view.setUint16(bufPtr + 2, 0, !0);
	view.setUint16(bufPtr + 4, 0, !0);

	function setBigUint64(byteOffset, value, littleEndian) {

			var lowWord = value;
			var highWord = 0;

			view.setUint32(littleEndian ? 0 : 4, lowWord, littleEndian);
			view.setUint32(littleEndian ? 4 : 0, highWord, littleEndian);
	}

	setBigUint64(bufPtr + 8, 0, !0);
	setBigUint64(bufPtr + 8 + 8, 0, !0);

	return WASI_ESUCCESS;
}

function fd_write(fd, iovs, iovsLen, nwritten) {
	var view = getModuleMemoryDataView();
	var written = 0;
	var bufferBytes = [];                   

	function getiovs(iovs, iovsLen) {
		// iovs* -> [iov, iov, ...]
		// __wasi_ciovec_t {
		//   void* buf,
		//   size_t buf_len,
		// }
		var buffers = Array.from({ length: iovsLen }, function (_, i) {
			var ptr = iovs + i * 8;
			var buf = view.getUint32(ptr, !0);
			var bufLen = view.getUint32(ptr + 4, !0);

			return new Uint8Array(Q3e.memory.buffer, buf, bufLen);
		});

		return buffers;
	}

	var buffers = getiovs(iovs, iovsLen);
	function writev(iov) {
		for (var b = 0; b < iov.byteLength; b++) {
			bufferBytes.push(iov[b]);
		}

		written += b;
	}

	buffers.forEach(writev);

	if (fd === WASI_STDOUT_FILENO) 
		console.log(String.fromCharCode.apply(null, bufferBytes));                            
	if (fd === WASI_STDERR_FILENO) 
		console.error(String.fromCharCode.apply(null, bufferBytes));                            
	else {
		throw new Error('wtf')
	}
	view.setUint32(nwritten, written, !0);

	return WASI_ESUCCESS;
}

function poll_oneoff(sin, sout, nsubscriptions, nevents) {
	debugger
	return WASI_ENOSYS;
}

function proc_exit(rval) {
	debugger
	return WASI_ENOSYS;
}

function fd_close(fd) {
	debugger
	return WASI_ENOSYS;
}

function fd_seek(fd, offset, whence, newOffsetPtr) {
	debugger
}

function fd_close(fd) {
	debugger
	return WASI_ENOSYS;
}


function Sys_FOpen(filename, mode) {
	// now we don't have to do the indexing crap here because it's built into the engine already
	let fileStr = addressToString(filename)
	let modeStr = addressToString(mode)
	let localName = fileStr
	if(localName.startsWith('/base')
		|| localName.startsWith('/home'))
		localName = localName.substring('/base'.length)
	if(localName[0] == '/')
		localName = localName.substring(1)


	let createFP = function (name) {
		FS.filePointer++
		FS.pointers[FS.filePointer] = [
			0, // seek/tell
			modeStr,
			FS.virtual[name],
			localName
		]
		return FS.filePointer // not zero
	}

	// check if parent directory has been created, TODO: POSIX errno?
	let parentDirectory = localName.substring(0, localName.lastIndexOf('/'))
	// TODO: check mode?
	if(typeof FS.virtual[localName] != 'undefined') {
		// open the file successfully
		return createFP(localName)
	} else if (modeStr.includes('w')
		&& ((parentDirectory = localName.substring(0, localName.lastIndexOf('/')))
		&& typeof FS.virtual[parentDirectory] != 'undefined')
	) {
		// create the file for write because the parent directory exists
		FS.virtual[localName] = {
			timestamp: new Date(),
			mode: 33206,
			contents: new Uint8Array(0)
		}
		return createFP(localName)
	} else {
		return 0 // POSIX
	}
}

function Sys_Mkdir(filename) {
	let fileStr = addressToString(filename)
	let localName = fileStr
	if(localName.startsWith('/base')
		|| localName.startsWith('/home'))
		localName = localName.substring('/base'.length)
	if(localName[0] == '/')
		localName = localName.substring(1)
	// check if parent directory has been created, TODO: POSIX errno?
	let parentDirectory = localName.substring(0, localName.lastIndexOf('/'))
	if(parentDirectory && !FS.virtual[parentDirectory]) {
		throw new Error('ENOENT')
	}
	FS.virtual[localName] = {
		timestamp: new Date(),
		mode: 16895,
	}
	
}


function Sys_stat(filename) {
	let fileStr = addressToString(filename)
	let localName = fileStr
	if(localName.startsWith('/base')
		|| localName.startsWith('/home'))
		localName = localName.substring('/base'.length)
	if(localName[0] == '/')
		localName = localName.substring(1)
	//if(typeof FS.virtual[localName] != 'undefined') {
	//  localName = localName
	//}
	if(typeof FS.virtual[localName] != 'undefined') {
		HEAPU32[(stat >> 2)+0] = FS.virtual[localName].mode
		HEAPU32[(stat >> 2)+1] = (FS.virtual[localName].contents || []).length
		HEAPU32[(stat >> 2)+2] = FS.virtual[localName].timestamp.getTime()
		HEAPU32[(stat >> 2)+3] = FS.virtual[localName].timestamp.getTime()
		HEAPU32[(stat >> 2)+4] = FS.virtual[localName].timestamp.getTime()
		return 0
	} else {
		HEAPU32[(stat >> 2)+0] = 0
		HEAPU32[(stat >> 2)+1] = 0
		HEAPU32[(stat >> 2)+2] = 0
		HEAPU32[(stat >> 2)+3] = 0
		HEAPU32[(stat >> 2)+4] = 0
		return 1
	}
}


function Sys_Mkdirp(path) {
	let localName = addressToString(path)
	try {
		if(localName.startsWith('/base')
			|| localName.startsWith('/home'))
			localName = localName.substring('/base'.length)
		if(localName[0] == '/')
			localName = localName.substring(1)
		Sys_Mkdir(path, 16895);
	} catch (e) {
		// make the subdirectory and then retry
		if (e.message === 'ENOENT') {
			let parentDirectory = localName.substring(0, localName.lastIndexOf('/'))
			if(!parentDirectory) {
				throw e
			}
			Sys_Mkdirp(stringToAddress(parentDirectory));
			Sys_Mkdir(path);
			return;
		}

		// if we got any other error, let's see if the directory already exists
		if(Sys_stat(p)) {
			throw e
		}
	}
}

function Sys_FRead(bufferAddress, byteSize, count, pointer) {
  if(typeof FS.pointers[pointer] == 'undefined') {
    throw new Error('File IO Error') // TODO: POSIX
  }
  let i = 0
  for(; i < count * byteSize; i++ ) {
    if(FS.pointers[pointer][0] >= FS.pointers[pointer][2].contents.length) {
      break
    }
    HEAPU8[bufferAddress + i] = FS.pointers[pointer][2].contents[FS.pointers[pointer][0]]
    FS.pointers[pointer][0]++
  }
  return (i - (i % byteSize)) / byteSize
}

function Sys_fgetc(fp) {
	let c = stringToAddress('DEADBEEF')
	if(Sys_fgets(c, 1, fp) != 1) {
		return -1
	}
	return HEAPU32[c>>2]
}


function Sys_fgets(buf, size, fp) {
  if(typeof FS.pointers[fp] == 'undefined') {
    throw new Error('File IO Error') // TODO: POSIX
  }
	let dataView = FS.pointers[fp][2].contents
			.slice(FS.pointers[fp][0], FS.pointers[fp][0] + size)
	let line = dataView.indexOf('\n'.charCodeAt(0))
	let length
	if(line < 0) {
		length = Sys_FRead(buf, 1, size - 1, fp)
		HEAPU8[buf + length] = 0
		return length ? buf : 0
	} else {
		length = Sys_FRead(buf, 1, line + 1, fp)
		HEAPU8[buf + length] = 0
		return length ? buf : 0
	}
}


function Sys_FWrite(buf, size, nmemb, pointer) {
  if(typeof FS.pointers[pointer] == 'undefined') {
    throw new Error('File IO Error') // TODO: POSIX
  }
  let tmp = FS.pointers[pointer][2].contents
  if(FS.pointers[pointer][0] + size * nmemb > FS.pointers[pointer][2].contents.length) {
    tmp = new Uint8Array(FS.pointers[pointer][2].contents.length + size * nmemb);
    tmp.set(FS.pointers[pointer][2].contents, 0);
  }
  tmp.set(HEAPU8.slice(buf, buf + size * nmemb), FS.pointers[pointer][0]);
  FS.pointers[pointer][0] += size * nmemb
  FS.pointers[pointer][2].contents = tmp
  return nmemb // k==size*nmemb ? nmemb : k/size;
}


// WHY ADD THIS INSTEAD OF FWRITE DIRECTLY? 
//   TO MAKE IT EASIER TO DROP INFRONT OF WASI BS.
function Sys_fputs(s, f) {
	let l = addressToString(s).length;
	return Sys_FWrite(s, 1, l, f) == l ? 0 : -1;
}

function Sys_fputc(c, f) {
	let s = stringToAddress(String.fromCharCode(c))
	return Sys_FWrite(s, 1, 1, f) == 1 ? 0 : -1;
}

function Sys_fprintf(fp, fmt, args) {
	let formatted = stringToAddress('DEADBEEF')
	let length = sprintf(formatted, fmt, args)
	let formatString
	if(length < 1 || !HEAPU32[formatted>>2]) {
		formatString = addressToString(fmt)
	} else {
		formatString = addressToString(formatted)
	}
	if(fp == HEAPU32[stderr>>2]) {
		console.error(formatString)
	} else if (fp == HEAPU32[stdout>>2]) {
		console.log(formatString)
	} else {
		Sys_fputs(formatted, fp)
	}
}

function Sys_time(t) {
	// locate time is really complicated
	//   use simple Q3 time structure
}



function Sys_feof(fp) {
  if(typeof FS.pointers[fp] == 'undefined') {
    return 1
  }
	if(FS.pointers[fp][0] >= FS.pointers[fp][2].contents.length) {
		return 1
	}
	return 0
}


var FS = {
	modeToStr: ['r', 'w', 'rw'],
	pointers: {},
	filePointer: 0,
	virtual: {}, // temporarily store items as they go in and out of memory
	Sys_FOpen: Sys_FOpen,
	Sys_Mkdir: Sys_Mkdir,
	Sys_fgets: Sys_fgets,
	Sys_fputs: Sys_fputs,
	Sys_vfprintf: Sys_fprintf,
	Sys_fprintf: Sys_fprintf,
	Sys_fputc: Sys_fputc,
	Sys_putc: Sys_fputc,
	Sys_getc: Sys_fgetc,
	Sys_fgetc: Sys_fgetc,
	Sys_time: Sys_time,
	Sys_feof: Sys_feof,
	DebugBreak: function () { debugger },
}

const polyfill = {
	clock_time_get: function () { debugger },
	clock_res_get: function () { debugger },
	//setModuleInstance : setModuleInstance,
	environ_sizes_get : environ_sizes_get,
	args_sizes_get : args_sizes_get,
	fd_fdstat_set_flags: function () { debugger },
	fd_prestat_get : fd_prestat_get,
	fd_fdstat_get : fd_fdstat_get,
	fd_write : fd_write,
	fd_prestat_dir_name : fd_prestat_dir_name,
	environ_get : environ_get,
	args_get : args_get,
	poll_oneoff : poll_oneoff,
	proc_exit : proc_exit,
	fd_close : fd_close,
	fd_seek : fd_seek,
	fd_advise: function () { debugger },
	fd_allocate: function () { debugger },
	fd_datasync: function () { debugger },
	fd_read: function () { debugger },
	path_open: function () { debugger },
	fd_fdstat_set_rights: function () { debugger },
	fd_filestat_get: function () { debugger },
	fd_filestat_set_size: function () { debugger },
	fd_filestat_set_times: function () { debugger },
	fd_pread: function () { debugger },
	fd_pwrite: function () { debugger },
	fd_readdir: function () { debugger },
	fd_renumber: function () { debugger },
	fd_sync: function () { debugger },
	fd_tell: function () { debugger },
	path_create_directory: function () { debugger },
	path_filestat_get: function () { debugger },
	path_filestat_set_times: function () { debugger },
	path_link: function () { debugger },
	path_readlink: function () { debugger },
	path_remove_directory: function () { debugger },
	path_rename: function () { debugger },
	path_symlink: function () { debugger },
	path_unlink_file: function () { debugger },
	proc_raise: function () { debugger },
	sched_yield: function () { debugger },
	random_get: function () { debugger },
	sock_recv: function () { debugger },
	sock_send: function () { debugger },
	sock_shutdown: function () { debugger },
}

// TODO: compare to initWasm() and make match

async function initWasm(bytes) {
	Object.assign(Q3e, FS, polyfill)
	Q3e['table'] = Q3e['__indirect_function_table'] =
		new WebAssembly.Table({ 
			initial: 1000, 
			element: 'anyfunc', 
			maximum: 10000 
		})
	Q3e['memory'] = new WebAssembly.Memory({ 
		initial: 2048, 
		/* 'shared': true */ 
	})
	let wasm = await WebAssembly.instantiate(bytes, Q3e)
	Object.assign(global, wasm.instance.exports)
	// store some strings and crap
	HEAPU8 = new Uint8Array(Q3e.memory.buffer)
	HEAPU32 = new Uint32Array(Q3e.memory.buffer)

	Q3e['sharedMemory'] = malloc(1024 * 1024) 

	return wasm
}



async function lburg(inFile, outFile) {
	let startArgs = [ 'lburg', inFile, outFile ]
	let bytes = new Uint8Array(
		fs.readFileSync(path.join(__dirname, 
		'../../../libs/q3lcc/build-wasm-js/lburg/lburg.wasm')))

	let localName = outFile
	if(localName.startsWith('/base')
		|| localName.startsWith('/home'))
		localName = localName.substring('/base'.length)
	if(localName[0] == '/')
		localName = localName.substring(1)

	let sourceName = inFile
	if(sourceName.startsWith('/base')
		|| sourceName.startsWith('/home'))
		sourceName = sourceName.substring('/base'.length)
	if(sourceName[0] == '/')
		sourceName = sourceName.substring(1)

	if(!localName.length) {
		throw new Error('Input file not specified')
	}
	if(!sourceName.length) {
		throw new Error('Output file not specified')
	}
	// TODO: THIS IS THE FUNCTIONAL PART OF THE FILE SYSTEM THAT I WANT TO REWRITE 
	//   BETWEEN PLATFORMS, < 10 FUCKING LOC.
	let inFileBytes = new Uint8Array(
		fs.readFileSync(sourceName, 'binary').toString()
		.split('').map(c => c.charCodeAt(0)))
	FS.virtual[sourceName] = {
		timestamp: new Date(),
		mode: 33206,
		contents: inFileBytes
	}

	await initWasm(bytes)

	// INPUT / OUTPUT template
	Sys_Mkdirp(stringToAddress(path.dirname(inFile)))
	Sys_Mkdirp(stringToAddress(path.dirname(outFile)))

	try {
		_start(startArgs.length, stringsToMemory(startArgs))
	} catch (e) {
		console.log(e)
		throw e
	}

	if(FS.virtual[localName]) {
		fs.writeFileSync(localName, FS.virtual[localName].contents)
	}

}

module.exports = lburg
