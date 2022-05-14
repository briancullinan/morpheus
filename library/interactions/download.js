
// THIS IS KIND OF FUNNY, FOR CODE REVEIW, I TOOK THIS CLIENT FUNCTION
//   AND MAKE IT WORK REMOTELY IN ANY WINDOW SO BOTH CLIENT AND SCRIPT
//   CAN CALL IT. MULTISOURCE FUNCTIONS AS CODE-LEAVES? FORCE DEPENDENCY 
//   INJECTION ON MODULES THAT AREN'T NECESSARILY DESIGNED FOR DI?
// TODO: MAKE IT LOOK LIKE DOWNLOAD REQUEST CAME FROM REMOTE, NOT CONTROL
//   THIS IS COOL BECAUSE THEN WHEN I RUN GET createLibrary() I CAN SEND
//   LIBRARY CODE TO ANY CLIENT WINDOW FOR COMMANDEERING.
function emitDownload(fileName, fileData, contentType) {
	//if(typeof fileData == 'string') {
	//	fileData = fileData.split('').map(function (c) { return c.charCodeAt(0) })
	//}
	//let file = FS.virtual['morph-plugin.crx'].contents
	if(typeof ACE != 'undefined') {
		ACE.downloaded = true
	}
	if(!fileName) {
		return
	}
	let blob = new Blob([fileData], {type: contentType})
	let exportUrl = URL.createObjectURL(blob);
	const tempLink = document.createElement('A');
	tempLink.style.display = 'none';
	tempLink.href = exportUrl;
	tempLink.setAttribute('download', fileName);
	document.body.appendChild(tempLink);
	tempLink.click();
	URL.revokeObjectURL(exportUrl);

}


