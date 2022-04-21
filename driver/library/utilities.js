
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
