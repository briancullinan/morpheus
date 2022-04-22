// I TRIED WASM-CLI OFFICIAL AND IT WAS A HORRIBLE EXPERIENCE
//   I THINK IT MIGHT BE EXPECTING PROGRAMS BUNDLED WITH EMSCRIPTEN
//   THIS IS MUCH SHORTER CODE TO GET A WASM TO RUN THAN EMSCRIPTEN


// remove these references for web and emulate
const fs = require('fs')
const path = require('path')
const FS = require('../sys_fs.js')
const {Sys_Mkdirp} = FS
const {
	initEnvironment,
	initWasm,
	updateEnvironment
} = require('../sys_wasm.js')
const {stringToAddress} = require('../sys_std.js')

// TODO: compare to initWasm() and make match
// TODO: move to sys_cli.js?
async function readAll(inFile, outFile) {

	let localName = outFile
	if(localName.startsWith('/base')
		|| localName.startsWith('/home'))
		localName = localName.substring('/base'.length)
	if(localName[0] == '/')
		localName = localName.substring(1)
	if(!localName.length) {
		throw new Error('Input file not specified')
	}

	let sourceName = inFile
	if(sourceName.startsWith('/base')
		|| sourceName.startsWith('/home'))
		sourceName = sourceName.substring('/base'.length)
	if(sourceName[0] == '/')
		sourceName = sourceName.substring(1)

	if(!sourceName.length) {
		throw new Error('Output file not specified')
	}

	// INPUT / OUTPUT template
	Sys_Mkdirp(stringToAddress(path.dirname(inFile)))
	Sys_Mkdirp(stringToAddress(path.dirname(outFile)))

	// TODO: THIS IS THE FUNCTIONAL PART OF THE FILE SYSTEM THAT I WANT TO REWRITE 
	//   BETWEEN PLATFORMS, < 10 FUCKING LOC.
	let inFileBytes = new Uint8Array(
		fs.readFileSync(sourceName, 'binary').toString()
				.split('').map(c => c.charCodeAt(0)))
	FS.virtual[sourceName] = {
		timestamp: new Date(),
		mode: FS.FS_FILE,
		contents: inFileBytes
	}

	return localName
}


let wasmFile

async function initProgram(inFile, outFile) {
	let startArgs = [ 'wasm-cli', inFile, outFile ]
	let bytes = new Uint8Array(fs.readFileSync(wasmFile))

	let ENV = initEnvironment({}) // TODO: something todo with Z_Malloc in ListFiles?
	let program = await initWasm(bytes, ENV)
	//console.log(program.instance.exports)
	updateEnvironment(program, ENV)
	let localName = await readAll(inFile, outFile)

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


let runProgram = false
let foundFiles = []
for(let i = 0; i < process.argv.length; i++) {
  let a = process.argv[i]
  if(a.match(__filename)) {
    runProgram = true
  } else if(a == '--') {
		continue
	} else if(a == 'node' || a.endsWith('/node')) {
		continue
	} else if(a.includes('.wasm')) {
		if(fs.existsSync(a)) {
			wasmFile = a
		} else if (path.join(__dirname, '../../../build/release-wasm-js/', a)) {
			wasmFile = path.resolve(path.join(__dirname, '../../../build/release-wasm-js/', a))
		} else {
			throw new Error('Wasm not found: ' + a)
		}
	} else if (a) {
		if(fs.existsSync(a) || fs.existsSync(path.dirname(a))) {
			foundFiles.push(a)
		//} else if (path.join(process.cwd, a)) {
		//	foundFiles.push(path.join(process.cwd, a))
		} else {
			console.log('WARNING: File not found: ' + a)
		}
  }
}

if(runProgram) {
	if(!wasmFile) {
		throw new Error('Must specify a .wasm to run!')
	} else {
		initProgram(foundFiles[0], foundFiles[1])
	}
}


module.exports = initProgram
