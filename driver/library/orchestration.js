

// @After(_makeWindowAccessor)
async function newWindow() {
  let win = await chrome.windows.create({
    url: 'http://www.google.com',
    //alwaysOnTop: true,
    //type: 'panel',
  })
  tabId = win.tabs[0].id
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


