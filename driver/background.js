
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

chrome.runtime.onMessage.addListener(async (request, sender, reply) => {
  let windowId = null
  let tabs = await chrome.tabs.query({currentWindow: true})
  console.log(sender.tab.title)
  console.log(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );
  await new Promise(function (resolve) {
    chrome.debugger.attach({tabId: sender.tab.id}, '1.0', function () {
      debugger
    })
  })
  chrome.debugger.sendMessage('Page.navigate', {url: 'https://google.com/'})

  if (request.greeting == "hello") reply({ farewell: "goodbye" });

  return true;
});

self.addEventListener('install', function () {
  /*
  if (name === 'BrowserService.prototype.chrome') {
    let current = chrome;
    let command = domain.split('.');
    for (const d of command) {
        current = current[d];
    }
    if (typeof current === 'function') {
        return current.apply(chrome, [...options, (...args) => {
            client.emit.apply(client, [
                'result',
                'BrowserService.prototype.chrome',
                typeof chrome.extension.lastError !== 'undefined'
                    ? chrome.extension.lastError.message
                    : null,
                JSON.stringify(args)]);
        }]);
    }
  }
  */
});
