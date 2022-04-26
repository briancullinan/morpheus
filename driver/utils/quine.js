// emit self in a cloud-compatible way.
// SELF EXTRACTOR LIKE BUSYBOX



async function emitDownload() {
	if(!document.body.className.includes('starting')) {
		return 
	}

	// maybe we don't have the plugin
	if(!ACE.downloaded) {
		let file = FS.virtual['morph-plugin.crx'].contents
		let blob = new Blob([file], {type: 'application/x-chrome-extension'})
		let exportUrl = URL.createObjectURL(blob);
		const tempLink = document.createElement('A');
		tempLink.style.display = 'none';
		tempLink.href = exportUrl;
		tempLink.setAttribute('download', 'morph-plugin.zip');
		document.body.appendChild(tempLink);
		tempLink.click();
		ACE.downloaded = true
		URL.revokeObjectURL(exportUrl);
	}

	if(ACE.downloaded) {
		onError({line: -1, error: 'Error connecting to DevTools service.'})
		document.body.classList.remove('starting')
		document.body.classList.add('running')
		document.body.classList.add('error')
		runBlock(-1)
	}

}
