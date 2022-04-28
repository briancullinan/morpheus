

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

async function navigateTo(url, wait) {
	let targets = (await chrome.debugger.getTargets())
  // weird this doesn't work with promises
	//	.filter(t =>
  //    && t.tabId == tabId)
  for(let i = 0; i < targets.length; i++) {
    if(typeof targets[i].tabId != 'undefined'
      && targets[i].tabId == tabId
    ) {
      if(!targets[i].attached) {
        await attachDebugger(tabId)
      }
      break
    }
  }
  // hint to the content filter where we are going
	navigationURL = url
	let dom = await chrome.debugger.sendCommand('Runtime.evaluate', {
		expression: 'window.location = "' + url + '";'
	})
	// wait for network to settle, or duck out
  if(typeof wait == 'undefined' || wait !== false) {
    await networkSettled()
  }
}



