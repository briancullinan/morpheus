let socket1

function socketOpen(evt) {
}

function socketMessage(evt) {
}

function socketError(evt) {
}

document.addEventListener('DOMContentLoaded', () => {
  let runButton = document.getElementById("run-button");
  if(runButton) {
    runButton.addEventListener("click", () =>
      chrome.runtime.sendMessage({ greeting: "hello" }, function (response) {
        console.log(response);
      }), false);
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

