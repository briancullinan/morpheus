// Library functions for web-driver


function checkForExtensionError(errCallback) {
  if (typeof(chrome.extension.lastError) != 'undefined') {
      var error = new Error(chrome.extension.lastError.message);
      errCallback(error);
      throw error;
  }
}

/**
* Captures a screenshot of the visible tab.
*
* @param {function(string)} callback The callback to invoke with the base64
*     encoded PNG.
* @param {function(!Error)} errCallback The callback to invoke for error
*     reporting.
*/
function captureScreenshot(callback, errCallback) {
  chrome.tabs.captureVisibleTab({format: 'png'}, function (dataUrl) {
      if (chrome.extension.lastError &&
          chrome.extension.lastError.message.indexOf('permission') != -1) {
          var error = new Error(chrome.extension.lastError.message);
          error.code = 103;  // kForbidden
          errCallback(error);
          return;
      }
      checkForExtensionError(errCallback);
      var base64 = ';base64,';
      callback(dataUrl.substr(dataUrl.indexOf(base64) + base64.length))
  });
}

/**
* Gets info about the current window.
*
* @param {function(*)} callback The callback to invoke with the window info.
* @param {function(!Error)} errCallback The callback to invoke for error
*     reporting.
*/
function getWindowInfo(callback, errCallback) {
  chrome.windows.getCurrent({populate: true}, function (window) {
      checkForExtensionError(errCallback);
      callback(window);
  });
}

/**
* Updates the properties of the current window.
*
* @param {Object} updateInfo Update info to pass to chrome.windows.update.
* @param {function()} callback Invoked when the updating is complete.
* @param {function(!Error)} errCallback The callback to invoke for error
*     reporting.
*/
function updateWindow(updateInfo, callback, errCallback) {
  console.log(arguments);
  chrome.windows.getCurrent({}, function (window) {
      checkForExtensionError(errCallback);
      chrome.windows.update(self.id, updateInfo, function (window) {
          checkForExtensionError(errCallback);
          callback();
      });
  });
}

/**
* Launches an app with the specified id.
*
* @param {string} id The ID of the app to launch.
* @param {function()} callback Invoked when the launch event is complete.
* @param {function(!Error)} errCallback The callback to invoke for error
*     reporting.
*/
function launchApp(id, callback, errCallback) {
  chrome.management.launchApp(id, function () {
      checkForExtensionError(errCallback);
      callback();
  });
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

async function enterPassword(url) {
  await doMorpheusKey() // init for client

}


async function enterLogin(url) {
  await doMorpheusKey() // init for client

}


async function doDialog(dialog) {

	// chrome.storage.sync.set({ mytext: txtValue });
	let tryTimes = 15
	let response
	do {
		response = await chrome.tabs.sendMessage(dialog)
		if(response && response.result) {
			break
		}
	} while(--tryTimes > 0)
  return response
}

async function doLoginDialog() {
  let morphKey = chrome.profiles.list() // LOL! WTF IS THAT? PIE IN SKY!
  let loginDialog = { 
    accessor: '_enterLogin',
    title: 'Enter a system password.',
  }
  let loginForm = {}
  for(let i = 0; i < morphKey.length; i++) {
    loginForm[morphKey[i]] = 'radio'
  }
  loginForm['user'] = 'text'
  loginForm['pass'] = 'pass'
  loginForm['Save Forever'] = 'submit'
  loginForm['Save Session'] = 'submit'
  loginDialog.form = loginForm
  return await doDialog(loginDialog)
}


async function doKeyDialog() {
  let keyCollectDialog = { 
    accessor: '_morpheusKey',
    dragDrop: true,
    text: 'Drop a PEM private/public key pair here.\n'
    + 'This will encrypt data on the backend,\n'
    + 'So it\'s extra private.\n'
    + 'openssl genrsa -des3 -out private.pem 2048\n'
    + 'openssl rsa -in private.pem -outform PEM -pubout -out public.pem\n'
  }
  return await doDialog(keyCollectDialog)
}


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

async function documentTitle(tabId) {
  let tab = await chrome.tabs.get(tabId)
  return tab.title
}

async function sleep(secs) {
  return await new Promise(resolve => setTimeout(resolve, secs * 1000))
}

module.exports = {
  documentTitle,
  newWindow,
  sleep,
  doKeyDialog,
  doLoginDialog,
}

