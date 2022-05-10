function virtualReadDir(pathname) {
	let directory = []
	let virtual = Object.keys(FS.virtual)
	// SANDBOX?
	if(pathname.startsWith('/')) {
		pathname = pathname.substring(1)
	}
	let insensitiveFS = pathname
			.toLocaleLowerCase() + '/'
	for(let i = 0; i < libraryFiles.length; i++) {
		let left = virtual[i].toLocaleLowerCase()
		if(!left.substring(0, insensitiveFS.length)
				.startsWith(insensitiveFS)) {
			continue
		}
		directory.push(virtual[i]
				.substring(insensitiveFS.length))
	}
	return directory
}

function virtualReadFile(filename) {
	if(typeof FS.virtual[filename] == 'undefined') {
		throw new Error('File not found: ' + filename)
	}
	return Array.from(FS.virtual[filename].contents)
	.map(function (c) { return String.fromCharCode(c) })
	.join('')
}

function readDir(pathname, recursive) {
	let readdirFunction
	if(typeof process != 'undefined') {
		let fs = require('fs')
		readdirFunction = fs.readdirSync
	} else if (typeof FS != 'undefined') {
		readdirFunction = virtualReadDir
	}
	console.log(pathname)
	let directory = readdirFunction(pathname)
	let result = []
	for(let i = 0; i < directory.length; i++) {
		if(directory[i].startsWith('.')) {
			continue
		}
		// TODO: CODE REVIEW, DIRECTORY_SEPERATOR ?
		let fullpath = pathname + '/' + directory[i]
		result.push(fullpath)
		if(statFile(fullpath).isDirectory()) {
			let subdir = readDir(fullpath, recursive)
			result.push.apply(result, subdir)
		}
	}
	return result
}

function virtualFileStat(filename) {
	if(typeof FS != 'undefined') {
		if(filename.startsWith('/')) {
			filename = filename.substring(1)
		}	
		if(typeof FS.virtual[filename] == 'undefined') {
			throw new Error('File not found.')
		} else {
			return {
				mtime: FS.virtual[filename].timestamp
			}
		}
	} else {
		throw new Error('Not implemented!')
	}
}

// TODO: export as a connector for WASMFS POSIX-STDIO
if(typeof FS != 'undefined') {
	Object.assign(FS, {
		existsSync: function () {
			return typeof FS.virtual[localName] != 'undefined'
		},
		readDir: readDir,
		readFile: virtualReadFile,
		statFile: virtualFileStat,
	})
} else

// TODO: STDIN REPL, this will be neat because when antlr is
//   added, I an instantly turn any language into a REPL 
//   similar to `node -e "code..."` or bash, but any language, even MATLAB
// Connecting R to fuse-fs would be weird. Or using MATLAB's interface
//   for validating 3D scenes, or picking something out demo-files?

// CODE REVIEW, decent format for combining APIs between languages?
if(typeof process != 'undefined') {
	try { 
		let { 
			existsSync, readFileSync, statSync
		} = require('fs') // stdioMiddleware
		let { cwd: getCwd } = require('process')
		module.exports = {
			existsSync, getCwd,
			readDir: readDir, // only adds recursive readdirSync
			readFile: readFileSync,
			statFile: statSync,
		}
		Object.assign(globalThis, module.exports)
	} catch (e) {
		if(!e.message.includes('find module')) {
			throw e
		}
	}
}




/* // CODE REVIEW, wishful thinking?
function node(directory) {

}

function node(file) {
	
}
*/
