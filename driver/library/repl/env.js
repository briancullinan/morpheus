// TODO: export as a connector for WASMFS POSIX-STDIO
const MIDDLEWARE_WEBFS = [
  virtualReadDir,
  virtualReadFile,
]



function stdioMiddleware(env) {
	let fs
	// TODO: do this with @attributes
	if(typeof FS != 'undefined') {
		fs = {
      existsSync: function () {
				return typeof FS.virtual[localName] != 'undefined'
			},
			readDir: virtualReadDir,
			readFile: virtualReadFile,
		}
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
        existsSync, readFileSync
      } = require('fs') // stdioMiddleware
			let { cwd: getCwd } = require('process')
			fs = {
        existsSync, getCwd,
        readDir: nodeReadDir, // only adds recursive readdirSync
        readFile: readFileSync
      }
		} catch (e) {
			if(!e.message.includes('find module')) {
				throw e
			}
		}
	}

	// TODO: memFS

  // TODO: do this with an attribute?
  if(typeof globalThis != 'undefined') {
    Object.assign(globalThis, fs)
  } else
  if(typeof window != 'undefined') {
    Object.assign(window, fs)
  }

	return fs
}




function virtualReadDir(pathname, recursive) {
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
		if(recursive 
				|| left.substring(insensitiveFS.length)
						.indexOf('/') > -1) {
			continue // TODO: return subdirs?
		}
		if(recursive) {
			directory.push(virtual[i])
		} else {
			directory.push(virtual[i]
					.substring(insensitiveFS.length))
		}
	}
	return directory
}


function nodeReadDir(pathname, recursive) {
	let path = require('path')
	let fs = require('fs')
	// SANDBOX?
	if(pathname.startsWith('/')) {
		pathname = pathname.substring(1)
	}
	if(recursive) {
		let result = []
		let directory = fs.readdirSync(pathname)
		for(let i = 0; i < directory.length; i++) {
			if(directory[i].startsWith('.')) {
				continue
			}
			let fullpath = path.join(pathname, directory[i])
			result.push(fullpath)
			if(fs.statSync(fullpath).isDirectory()) {
				let subdir = nodeReadDir(fullpath, recursive)
				result.push.apply(result, subdir)
			}
		}
		return result
	} else {
		return fs.readdirSync(pathname)
	}
}



function virtualReadFile(filename) {
	if(typeof FS.virtual[filename] == 'undefined') {
		throw new Error('File not found: ' + filename)
	}
	return Array.from(FS.virtual[filename].contents)
	.map(function (c) { return String.fromCharCode(c) })
	.join('')
}

if(typeof module != 'undefined') {
  module.exports = {
    nodeReadDir,
  }


}


