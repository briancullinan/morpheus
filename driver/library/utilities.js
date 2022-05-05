
async function sleep(secs) {
  return await new Promise(resolve => setTimeout(resolve, secs * 1000))
}


async function documentTitle(tabId) {
  let tab = await chrome.tabs.get(tabId)
  return tab.title
}

function makeMoveTo(id, tabs) {
  return function (x, y) {
    return setWindowBounds(id, tabs, x, y)
  }
}

function makeResizeTo(id, tabs) {
  return function (w, h) {
    return setWindowBounds(id, tabs, void 0, void 0, w, h)
  }
}

// TODO: cool, almost done, force this to load worker side
//   or move it somewhere only the backend will access, dom.js
//   is imported into frontend.
function loadDocumentation() {
	let docs = []
	let libraryFiles = Object.keys(FS.virtual)
	// doesn't work with promises
	// .filter(function (p) { return p.startsWith('library/') })
	for(let i = 0; i < libraryFiles.length; i++) {
		if(libraryFiles[i].startsWith('library/')
			&& libraryFiles[i].endsWith('.md')) {
			docs.push(libraryFiles[i])
		}
	}
	if(typeof ACE != 'undefined') {
		ACE.documentation = docs
	} else {
		console.log(docs)
	}
	return docs
}


