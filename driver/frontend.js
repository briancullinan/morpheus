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


document.addEventListener('DOMContentLoaded', (sender) => {
  /*
  */

  document.addEventListener('keypress', function (evt) {
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
  })

  // don't bother other tabs for now
  if(!document.getElementById("run-script")) {
    return
  }

  restoreRunner()

  document.addEventListener('click', function (evt) {
    let runScript = document.getElementById("run-script")
    if(awaitingAccessor) {
      awaitingAccessor = false
      if(runScript.innerHTML) {
        accessorResult = JSON.parse(runScript.innerHTML)
      } else {
        accessorResult = null
      }
      return
    }
    if(!evt.target || !evt.target.className.includes('run-button')
      || !document.body.className.includes('starting')) {
      return true
    }
    try {
      let runId = getRunId(20)
      chrome.runtime.sendMessage({ 
        script: runScript.innerHTML,
        runId: runId,
      }, processResponse)
      runScript.innerHTML = ''
    } catch (e) {
      // reload the page!
      if(e.message.includes('context invalidated')) {
        document.location = document.location 
        //  + (document.location.includes('?') ? '&' : '?')
        //  + 'tzrl=' + Date.now()
        return
      }
      throw e
    }
  })
})


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

  let typeKey
  if(typeof request.started != 'undefined') {
    if(runnerTimer) {
      clearInterval(runnerTimer)
    }
    runnerTimer = setInterval(checkOnRunner.bind(null, request.started), 1000)
    typeKey = 'started'
  } else
  if(typeof request.error != 'undefined') {
    typeKey = 'error'
  } else
  if(typeof request.console != 'undefined') {
    typeKey = 'console'
  } else
  if(typeof request.async != 'undefined') {
    typeKey = 'async'
  } else
  if(typeof request.assign != 'undefined') {
    typeKey = 'assign'
  } else
  if(typeof request.console != 'undefined') {
    typeKey = 'result'
  } else
  if(typeof request.warning != 'undefined') {
    typeKey = 'warning'
  } else
  if(typeof request.status != 'undefined') {
    typeKey = 'status'
  } else {
    throw new Error('Not implemented!')
  }

  let newMessage = {
    line: request.line,
    type: typeKey,
  }
  newMessage[typeKey] = request[typeKey] + '\n'
  window.postMessage(newMessage)
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
    window.postMessage({accessor: request.accessor})
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
  } else {
    // basic client status message
    processResponse(request)
    return reply()
  }
})


setTimeout(function () {
  if(!document.getElementById("run-script")) {
    return
  }
  restoreRunner()
}, 1000)

