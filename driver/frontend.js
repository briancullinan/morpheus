let socket1

function socketOpen(evt) {
}

function socketMessage(evt) {
}

function socketError(evt) {
}

let runnerTimer

document.addEventListener('DOMContentLoaded', (sender) => {

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

  document.addEventListener('click', function (evt) {
    if(!evt.target || !evt.target.className.includes('run-button')
      || !document.body.className.includes('starting')) {
      return true
    }
    let runScript = document.getElementById("run-script")
    setTimeout(function () {
      try {
        let runId = getRunId(20)
        chrome.runtime.sendMessage({ 
          script: runScript.innerHTML,
          runId: runId,
        }, function (response) {
          if(typeof response.started != 'undefined') {
            document.body.classList.remove('starting')
            document.body.classList.add('running')
            evt.target.classList.remove('running')
            if(runnerTimer) {
              clearInterval(runnerTimer)
            }
            runnerTimer = setInterval(checkOnRunner.bind(null, runId), 1000)
          }
          return true
        })
        runScript.innerHTML = ''
      } catch (e) {
        if(e.message.includes('context invalidated')) {
          document.location = document.location 
          //  + (document.location.includes('?') ? '&' : '?')
          //  + 'tzrl=' + Date.now()
        }
        throw e
      }
    }, 100)
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


function checkOnRunner(runId) {
  let runScript = document.getElementById("run-script")
  let runButton = document.getElementById("run-button")
  try {
    chrome.runtime.sendMessage({ 
      runId: runId,
    }, function (response) {
      processResponse(response, true)
    })
  } catch (e) {
    document.body.classList.add('error')
    runScript.innerHTML += e.message + '\n'
    runButton.click()
  }

}


function processResponse(request, trim) {
  let runScript = document.getElementById("run-script")
  let runButton = document.getElementById("run-button")

  // clear status timer if an end result is received
  if(typeof request.error != 'undefined'
    || typeof request.result != 'undefined') {
    if(runnerTimer) {
      clearInterval(runnerTimer)
    }
  }

  if(typeof request.error != 'undefined') {
    document.body.classList.add('error')
    runScript.innerHTML += request.error + '\n'
    if(request.line > 0) {
      runScript.innerHTML += ' on ' + request.line
    }
    runButton.click()
  } else
  if(typeof request.console != 'undefined') {
    document.body.classList.add('console')
    runScript.innerHTML += request.console == '.' ? '.' : (request.console + '\n')
    runButton.click()
  } else    
  if(typeof request.result != 'undefined') {
    document.body.classList.add('result')
    runScript.innerHTML += request.result + '\n'
    runButton.click()
  } else {
    throw new Error('Not implemented!')
  }
}



chrome.runtime.onMessage.addListener(
  function(request, sender, reply) {
    processResponse(request)
    reply()
    return false
  })


