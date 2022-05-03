
function doLibraryLookup(functionName) {
	let libraryFiles = Object.keys(FS.virtual)
		.filter(function (p) { return p.includes('/library/') })
	for(let i = 0; i < libraryFiles.length; i++) {
		let libraryCode = Array.from(FS.virtual[libraryFiles[i]].contents)
			.map(function (c) { return String.fromCharCode(c) })
			.join('')
		// TODO: make these tokens instead of function for cross language support
		if(libraryCode.includes('function ' + functionName)) {
			return {
				library: libraryCode,
				name: libraryFiles[i],
				// TODO: a hash value?
			}
		} else {
			let currentSession = window.ace.getValue()
			if (currentSession.includes('function ' + functionName)) {
				return {
					library: currentSession,
					name: '<eval>',
					// TODO: a hash value?
				}
			}
		}
	}
}

module.exports = {
  documentTitle,
  newWindow,
  sleep,
  doKeyDialog,
  doSystemLogin,
}
