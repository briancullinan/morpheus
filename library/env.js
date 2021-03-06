

// virtual file system has a couple of path options?
function findFile(filename) {
	const VIRTUAL_PATHS = [ 
		'.' , getCwd() , __dirname
		// TODO: add game dirs
 	]
	for(let i = 0; i < VIRTUAL_PATHS.length; i++) {
		let fullpath = VIRTUAL_PATHS[i] + '/' + filename
		if(existsSync(fullpath)) {
			return fullpath
		}
	}
	throw new Error(`Could not find: "${filename}".`)
}
// TODO: move to generalized version of sys_fs.js
function virtualReadFile(filename) {
	if(typeof FS.virtual[filename] == 'undefined') {
		throw new Error('File not found: ' + filename)
	}
	return Array.from(FS.virtual[filename].contents)
    .map(function (c) { return String.fromCharCode(c) })
    .join('')
}

function virtualFileStat(filename) {
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
}


// TODO: export as a connector for WASMFS POSIX-STDIO
if(typeof FS != 'undefined') {
	Object.assign(FS, {
		existsSync: function () {
			return typeof FS.virtual[localName] != 'undefined'
		},
		readDir: virtualReadDir,
		readFile: virtualReadFile,
		statFile: virtualFileStat,
		findFile: findFile,
		getCwd: getCwd,
		//getArguments: getWebQuery,
	})
} else

// CODE REVIEW, decent format for combining APIs between languages?
if(typeof module != 'undefined') {
	try { 
		let { 
			readdirSync, existsSync, readFileSync, statSync
		} = require('fs') // stdioMiddleware
		let { cwd } = require('process')
		module.exports = {
			existsSync, 
			getCwd: cwd,
			readDir: readdirSync,
			readFile: readFileSync,
			statFile: statSync,
			findFile: findFile,
			//getArguments: getNativeQuery,
		}
		Object.assign(globalThis, module.exports)
	} catch (e) {
		if(!e.message.includes('find module')) {
			throw e
		}
	}
}

// TODO: STDIN REPL, this will be neat because when antlr is
//   added, I an instantly turn any language into a REPL 
//   similar to `node -e "code..."` or bash, but any language, even MATLAB
// Connecting R to fuse-fs would be weird. Or using MATLAB's interface
//   for validating 3D scenes, or picking something out demo-files?
if(typeof __library != 'undefined') {
	VIRTUAL_PATHS.push(__library)
}
// TODO: 
if(typeof Cvar_Get != 'undefined') {
	VIRTUAL_PATHS.push(FS_GetCurrentGameDir())
}




/* // CODE REVIEW, wishful thinking?
function node(directory) {

}

function node(file) {
	
}
*/
