let socket1

function socketOpen(evt) {
}

function socketMessage(evt) {
}

function socketError(evt) {
}


document.addEventListener('DOMContentLoaded', () => {

  document.addEventListener('click', function (evt) {
    if(!evt.target || !evt.target.className.includes('run-button')
      || !document.body.className.includes('starting')) {
      return true
    }
    let runScript = document.getElementById("run-script")
    document.body.classList.remove('starting')
    setTimeout(function () {
      try {
        chrome.runtime.sendMessage({ script: runScript.innerHTML }, function (response) {
          if(typeof response.started != 'undefined') {
            document.body.classList.add('running')
            evt.target.classList.remove('paused')
          }
          return true
        })
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

chrome.runtime.onMessage.addListener(
  function(request, sender, reply) {
    let runScript = document.getElementById("run-script")
    let runButton = document.getElementById("run-button")
    if(typeof request.error != 'undefined') {
      document.body.classList.add('error')
      runScript.innerHTML = request.error
      runButton.click()
    } else
    if(typeof request.console != 'undefined') {
      document.body.classList.add('console')
      runScript.innerHTML = request.console
      runButton.click()
      document.body.classList.add('running')
    }
    reply()
    return false
  })
//const s = document.createElement('div');
//(document.body || document.documentElement).appendChild(s);
/*
const s = document.createElement('script');
s.setAttribute('type', 'text/javascript');
s.innerHTML = `
  `;
(document.head || document.documentElement).appendChild(s);
*/

