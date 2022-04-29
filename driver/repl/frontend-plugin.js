
let socket1

function socketOpen(evt) {
}

function socketMessage(evt) {
}

function socketError(evt) {
}



function generateRunId() {
  let runId = getRunId(20)
  return function addRunIdInjection(request) {
    request.runId = runId
    return request
  }
}



let lastRunId


function runScript() {
  let runScriptTextarea = document.getElementById("run-script")

  if(document.body.className.includes('running')
    || document.body.className.includes('paused')) {
    chrome.runtime.sendMessage(lastRunId({ 
      pause: !document.body.className.includes('paused'),
    }), window.postMessage)
    return
  }

  if(!document.body.className.includes('starting')) {
    restoreRunner()
    return
  }

  try {
    lastRunId = generateRunId()
    if(!runScriptTextarea.value.length) {
      throw new Error('No script!')
    }
    chrome.runtime.sendMessage(lastRunId({ 
      script: runScriptTextarea.value,
    }), window.postMessage)
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


let awaitingAccessor = false
let awaitingResponse = {}



function runAccessor() {
  let runScriptTextarea = document.getElementById("run-script")
  if(runScriptTextarea.length < 1) {
    return
  }
  let responseData = JSON.parse(runScriptTextarea.value)
  if(responseData && responseData.responseId) {
    if(awaitingResponse.hasOwnProperty(responseData.responseId)) {
      awaitingResponse[responseData.responseId](responseData)
    } else {
      //throw new Error('Accessor isn\'t waiting!')
    }
  }
}


// HAVING SOME TROUBLE ALIGNING RESPONSES WITH PLACES IN THE SCRIPT
//   THIS WILL BECOME EVEN MORE CONFUSING IN THE FUTURE IF I ADD
//   MULTIPLE PROCESSES AT ONCE.
chrome.runtime.onMessage.addListener(processResponse)


function processResponse(request, sender, reply) {
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
   return
  }

  // access a client variable they've shared from code
  // basic client status message
  let responseEventId = getRunId(20)
  awaitingResponse[responseEventId] = (function (responseTimer) {
    if(typeof request == 'object' && request) {
      request.responseId = responseEventId
    }
    window.postMessage(request)
    return function (response) {
      clearTimeout(responseTimer)
      reply(response)
      delete awaitingResponse[responseEventId]
    }
  })(setTimeout(function () {
    awaitingResponse[responseEventId]()
    delete awaitingResponse[responseEventId]
  }, 3000))
  return true

}
