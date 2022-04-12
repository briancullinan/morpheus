let socket1

function socketOpen(evt) {
}

function socketMessage(evt) {
}

function socketError(evt) {
}

document.addEventListener('DOMContentLoaded', () => {
  let runButton = document.getElementById("run-button");
  let runScript = document.getElementById("run-script");
  if(runButton) {
    runButton.addEventListener('click', function () {
      setTimeout(function () {
        chrome.runtime.sendMessage({ script: runScript.innerHTML }, function (response) {
          console.log('result:', response)
          return true
        })
      }, 100)
    }, false);
  }

});
//const s = document.createElement('div');
//(document.body || document.documentElement).appendChild(s);
/*
const s = document.createElement('script');
s.setAttribute('type', 'text/javascript');
s.innerHTML = `
  `;
(document.head || document.documentElement).appendChild(s);
*/

