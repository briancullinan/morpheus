
let socket1

function socketOpen(evt) {
}

function socketMessage(evt) {
}

function socketError(evt) {
}

let runnerTimer
let accessorResult = null


async function restoreRunner(sender) {
  try {
    if(awaitingAccessor) {
      return
    }
    // try to restore runner status
    window.postMessage({
      frontend: 'Worker service started\n'
    })
    awaitingAccessor = true
    accessorResult = null
    await setDelay(function () { return !awaitingAccessor }, 1000)
    if(awaitingAccessor) {
      awaitingAccessor = false
    } else {
      chrome.runtime.sendMessage({ 
        frontend: accessorResult,
      }, processResponse)
    }
  } catch (e) {
    
  }
}

function runAccessor() {
  let runScriptTextarea = document.getElementById("run-script")
  if(awaitingAccessor) {
    awaitingAccessor = false
    if(runScriptTextarea.value) {
      accessorResult = JSON.parse(runScriptTextarea.value)
    } else {
      accessorResult = null
    }
    return
  } else {
    throw new Error('Accessor isn\'t waiting!')
  }

}


function runScript() {
  let runScriptTextarea = document.getElementById("run-script")

  if(document.body.className.includes('running')
    || document.body.className.includes('paused')) {
    chrome.runtime.sendMessage({ 
      pause: !document.body.className.includes('paused'),
      runId: JSON.parse(runScriptTextarea.value),
    }, processResponse)
    return
  }

  if(!document.body.className.includes('starting')) {
    restoreRunner()
    return
  }

  try {
    let runId = getRunId(20)
    if(!runScriptTextarea.value.length) {
      throw new Error('No script!')
    }
    chrome.runtime.sendMessage({ 
      script: runScriptTextarea.value,
      runId: runId,
    }, processResponse)
    runScriptTextarea.value = ''
  } catch (e) {
    // reload the page!
    if(e.message.includes('context invalidated')) {
      document.location = document.location 
      //  + (document.location.includes('?') ? '&' : '?')
      //  + 'tzrl=' + Date.now()
      return
    }
  }
}


document.addEventListener('DOMContentLoaded', (sender) => {

  // THIS IS FOR MAKING AN ELEMENT EYE-DROPPER TOOL, NOT STEALING PASSWORDS
  document.addEventListener('keypress', function (evt) {
    runKeypress()
  })

  // don't bother other tabs for now
  if(!document.getElementById("run-script")) {
    return
  }

  if(restoreTimer) {
    clearInterval(restoreTimer)
  }
  restoreRunner()

  document.addEventListener('click', function (evt) {
    if(!evt.target) {
      return true
    }

    if(evt.target.className.includes('run-button')) {
      runScript()
    } else if(evt.target.className.includes('run-accessor')) {
      runAccessor()
    }

  })
})


function runKeypress() {
  // add magnanimus class-name uniquifier selection tool to every page
  //const s = document.createElement('div');
  //(document.body || document.documentElement).appendChild(s);
  /*
  const s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.innerHTML = `
    `;
  (document.head || document.documentElement).appendChild(s);
  */
}


function getRunId(length) {
  let output = []
  let uint8array = crypto.getRandomValues(new Uint8Array(20))
  for (var i = 0, length = uint8array.length; i < length; i++) {
    output.push(String.fromCharCode(uint8array[i]));
  }
  return btoa(output.join(''));
}


async function checkOnRunner(runId) {
  try {
    chrome.runtime.sendMessage({ 
      runId: runId,
    }, function (response) {
      if(!response) {
        return
      }
      processResponse(response)
    })
  } catch (e) {
    if(runnerTimer) {
      clearInterval(runnerTimer)
    }
    // reload the page!
    if(e.message.includes('context invalidated')) {
      document.location = document.location 
      return
    }
    window.postMessage({
      error: e.message + '\n'
    }, function () {
      debugger
    })
  }

}

let awaitingAccessor = false

function processResponse(request) {
  // clear status timer if an end result is received
  if(typeof request.error != 'undefined'
    || typeof request.result != 'undefined') {
    if(runnerTimer) {
      clearInterval(runnerTimer)
    }
  }

  if(typeof request.started != 'undefined') {
    if(runnerTimer) {
      clearInterval(runnerTimer)
    }
    runnerTimer = setInterval(checkOnRunner.bind(null, request.started), 1000)
  }

  window.postMessage(request)
}


async function setDelay(callback, msecs) {
  await new Promise(resolve => {
    let newTimer
    let safety = 0
    newTimer = setInterval(function () {
      if(callback()) {
        clearInterval(newTimer)
        resolve()
      } else if(safety >= msecs / 100) {
        resolve()
      } else {
        safety++
      }
    }, 100)
  })
}

chrome.runtime.onMessage.addListener(function(request, sender, reply) {
  // access a client variable they've shared from code
  if(typeof request.accessor != 'undefined') {
    awaitingAccessor = true
    accessorResult = null
    window.postMessage(request)
    setDelay(function () { return !awaitingAccessor }, 3000)
      .then(function () {
        if(awaitingAccessor) {
          awaitingAccessor = false
          return reply({fail: true})
        } else {
          return reply({result: accessorResult})
        }
      })
    return true
  } else 
  if(request.headers) {
    debugger
    /*
    await chrome.declarativeNetRequest.updateDynamicRules({
      options: {
        addRules: [
    
        ]
      }
    })
    */
  } else 
  if(request.cookie) {
    debugger
    /*
    await chrome.declarativeNetRequest.updateDynamicRules({
      options: {
        addRules: [
    
        ]
      }
    })
    */
  } else {
  }
  // basic client status message
  processResponse(request)
  return reply()
})


let restoreTimer = setTimeout(function () {
  if(!document.getElementById("run-script")) {
    return
  }
  restoreRunner()
}, 1000)

