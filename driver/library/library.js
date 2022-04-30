// Library functions for web-driver
function screenshot() {
  let png = await chrome.tabs.captureVisibleTab({format: 'png'})
  await chrome.tabs.sendMessage({
    name: 'screenshot.png', 
    download: png, 
    type: 'image/png'
  })
}


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

