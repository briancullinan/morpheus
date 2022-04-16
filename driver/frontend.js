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

function runAccessor() {
  if(awaitingAccessor) {
    awaitingAccessor = false
    if(runScript.value) {
      accessorResult = JSON.parse(runScript.value)
    } else {
      accessorResult = null
    }
    return
  } else {
    throw new Error('Accessor isn\'t waiting!')
  }

}


function runScript() {
  let runScript = document.getElementById("run-script")
  if(!document.body.className.includes('starting')) {
    throw new Error('Document isn\'t starting')
  }

  try {
    let runId = getRunId(20)
    if(!runScript.value.length) {
      throw new Error('No script!')
    }
    chrome.runtime.sendMessage({ 
      script: runScript.value,
      runId: runId,
    }, processResponse)
    runScript.value = ''
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
  return
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

