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
    let runScript = document.getElementById("run-script").innerHTML
    document.body.classList.remove('starting')
    setTimeout(function () {
      chrome.runtime.sendMessage({ script: runScript }, function (response) {
        if(typeof response.started != 'undefined') {
          document.body.classList.add('running')
          evt.target.classList.remove('paused')
        }
        return true
      })
    }, 100)
  })

})

chrome.runtime.onMessage.addListener(
  function(request, sender, reply) {
    let runButton = document.getElementById("run-button")
    if(typeof request.error != 'undefined') {
      document.body.classList.add('error')
      runButton.click()
    }
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

