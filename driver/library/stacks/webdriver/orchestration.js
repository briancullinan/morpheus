

// @After(_makeWindowAccessor)
async function newWindow() {
  let win = await chrome.windows.create({
    url: 'http://www.google.com',
    //alwaysOnTop: true,
    //type: 'panel',
  })
  sleep(1)
  let newWin = Object.assign(win, {
    moveTo: makeMoveTo(win.id, win.tabs),
    resizeTo: makeResizeTo(win.id, win.tabs),
  })
  newWin.moveTo(
		window.screenLeft 
		+ window.outerWidth / 2, 
		window.screenTop)
	newWin.resizeTo(
		window.outerWidth / 2, 
		window.outerHeight)
  return newWin
}


function navigateTo(url, wait) {
  // hint to the content filter where we are going
	navigationURL = url
	window.location = url
	// wait for network to settle, or duck out
  if(typeof wait == 'undefined' || wait !== false) {
		networkSettled()
  }
}

// TODO
function sendCommand() {
	// copy function body to Runtime.evaluate
}


// TODO: same as last time but no FS access, use sessionIDs stored in the 
//   page's context to figure out what windows are meant to be automated.
async function recoverWindows() {

}



// TODO: write a function that injects other library functions into the page
//   that way I can slowly migrate all the frontend and backend logic to 
//   be self hosted.



async function setWindowBounds(windowId, tabs, x, y, w, h) {
	try {
		/*
		let targetTabs = await chrome.tabs.query({windowId: windowId})
		if(!targetTabs) {
			throw new Error('Window closed or doesn\'t exist')
		}
		let targetId = targetTabs[0].id
		*/
		let targetId = tabs[0].id
		let targets = (await chrome.debugger.getTargets())
			.filter(function (t) { 
				// TODO: fix this need for check when contexts are fixed
				return typeof t.tabId != 'undefined' && t.tabId == targetId
			})
		if(targets[0] && !targets[0].attached) {
			await attachDebugger(targetId)
		}
		if(typeof x != 'undefined' && typeof y != 'undefined') {
			await chrome.windows.update(windowId, {
				left: Math.round(x),
				top: Math.round(y),
			})
		}

		if(typeof w != 'undefined' && typeof h != 'undefined') {
			await chrome.windows.update(windowId, {
				height: Math.round(h),
				width: Math.round(w),
			})
		}
		//let processId = await chrome.processes.getProcessIdForTab(targetId)

		return await chrome.windows.get(windowId)
	} catch (e) {
		console.log(e)
		throw new Error('Protocol error: setWindowBounds(...)')
	}
}

