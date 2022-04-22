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



async function lburg(inFile, outFile) {
	let startArgs = [ 'lburg', inFile, outFile ]
	let bytes = new Uint8Array(
		fs.readFileSync(path.join(__dirname, 
		'../../../libs/q3lcc/build-wasm-js/lburg/lburg.wasm')))

	let ENV = initEnvironment({}) // TODO: something todo with Z_Malloc in ListFiles?
	let program = await initWasm(bytes, ENV)
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

module.exports = lburg
