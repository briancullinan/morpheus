
/*
navigator.serviceWorker.register('blob:...', {
  updateUrl: '/sw.js'
})
*/

let ACE = {
  lastRunId: null,
  playCount: 0,
  playButtons: [],
  downloaded: false,
  filename: false,
  libraryCode: '',
  libraryLines: 0,
  libraryLoaded: false,
}

const NAMED_FUNCTION = /function\s+([a-z]+[ -~]*)\s*\(/
const EXTENSION_ID = 'lnglmljjcpnpahmfpnfjkgjgmjhegihd';
const EXTENSION_VERSION = '1.0'

function newPlay() {
  let newButton = document.createElement('BUTTON')
  newButton.className += ' run-button small '
  document.body.appendChild(newButton)
  ACE.playButtons.push(newButton)
  ACE.playCount++
}


function processLineNumber(lineNumber) {
  let prevLine = lineNumber
  if(!lineNumber) { // startup error message?
    return lineNumber
  }
  if(ace.gotoLine) {
    setTimeout(ace.gotoLine.bind(ace, prevLine), 100)
  }
  // if the error occurs on a line inside the library
  if(prevLine < ACE.libraryLines && !ACE.libraryLoaded) {
    ACE.libraryLoaded = true
    removeLineWidgets()
    ace.setValue(ACE.libraryCode + ace.getValue())
    prevLine--;
  } else if (!ACE.libraryLoaded) {
    // if library code is not loaded, subtract
    prevLine -= ACE.libraryLines
  } else {
    prevLine--;
  }
  return prevLine
}


function processResponse(updateText, lineNumber, error) {
  let newLines = updateText.trim().split('\n')
  let prevLine = ACE.lastLine
  // if error has a line number, insert message below that line
  if(typeof lineNumber == 'number') {
    prevLine = processLineNumber(lineNumber)
  }
  for(let j = 0; j < newLines.length; j++) {
    createLineWidget(newLines[j], prevLine++, error ? ' line_error ' : '')
  }
  // add console output to bottom of code
  if(typeof lineNumber != 'number') {
    ACE.lastLine = prevLine
  }
}




function runBlock(start) {
  if(document.body.className.includes('running')
    || document.body.className.includes('starting')) {
    return
  }

  document.body.classList.add('starting')
  removeLineWidgets(void 0, 'ace_line')
  setTimeout(emitDownload, 3000)

  if(!ACE.libraryCode) {
    initLibraries()
  }

  if(start == -1) {
    window['run-script'].innerHTML = 
      // because library inserted into page on error
      (!ACE.libraryLoaded ? ACE.libraryCode : '')
      + window.ace.getValue()
      + '\nreturn main();'
    ACE.lastLine = ACE.libraryLines + ace.session.getLength()
  } else {
    let funcName = ace.env.document.getLine(start).match(NAMED_FUNCTION)[1]
    ACE.lastLine = ACE.libraryLines + ace.session.getFoldWidgetRange(start).end.row
    window['run-script'].innerHTML = 
      (!ACE.libraryLoaded ? ACE.libraryCode : '')
      + ace.session.getLines(start, ACE.lastLine).join('\n')
      + '\nreturn ' + funcName + '();\n'
  }

  ace.renderer.off('afterRender', renderLineWidgets)
  //ace.focus()
}



async function emitDownload() {
  if(!document.body.className.includes('starting')) {
    return 
  }

  if(chrome && chrome.runtime) {
    let response = await chrome.runtime.sendMessage(EXTENSION_ID, EXTENSION_VERSION)
    if(response) {
      return
    }
  }

  // maybe we don't have the plugin
  if(!ACE.downloaded) {
    let file = FS.virtual['morph-plugin.crx'].contents
    let blob = new Blob([file], {type: 'application/x-chrome-extension'})
    let exportUrl = URL.createObjectURL(blob);
    const tempLink = document.createElement('A');
    tempLink.style.display = 'none';
    tempLink.href = exportUrl;
    tempLink.setAttribute('download', 'morph-plugin.zip');
    document.body.appendChild(tempLink);
    tempLink.click();
    ACE.downloaded = true
    URL.revokeObjectURL(exportUrl);
  }

  if(ACE.downloaded) {
    window['run-script'].innerHTML = 'Error connecting to DevTools service.'
    document.body.classList.remove('starting')
    document.body.classList.add('running')
    document.body.classList.add('error')
    runBlock(-1)
  }

}




function removeLineWidgets(start, className) {
  if(!ace.session.lineWidgets) {
    return
  }
  //let lastLine = ace.session.getFoldWidgetRange(start).end.row
  for(let i = 0; i < ace.session.lineWidgets.length; i++) {
    if(ace.session.lineWidgets[i] 
      && (!className || ace.session.lineWidgets[i].el.className.includes(className))) {
      if(ACE.statusLine == ace.session.lineWidgets[i]) {
        ACE.statusLine = null
      }
      ace.session.lineWidgets[i].el.remove()
      ace.session.lineWidgets[i] = void 0
      ace.session._emit('changeFold', {data:{start:{row: i}}});
    }
  }
}


function renderLineWidgets() {
  let numWidgets = 0

  if(!ace.session.lineWidgets) {
    return
  }

  let textLayer = document.getElementsByClassName('ace_text-layer')[0]
  let start = ace.renderer.layerConfig.firstRow
  let count = editor.clientHeight / ace.renderer.lineHeight
  for(let i = start; i < start + count; i++) {
    if(ace.session.lineWidgets[i]) {
      let newHelp = ace.session.lineWidgets[i].el
      textLayer.insertBefore(newHelp, textLayer.children[i - start])
      newHelp.style.top = ((i + 1 + numWidgets) * ace.renderer.lineHeight) + 'px'
      newHelp.style.height = ace.session.lineWidgets[i].pixelHeight + 'px'
      newHelp.style.left = '0px'
      newHelp.style.display = 'block'
      numWidgets++
    }
  }
  // TODO: static references \/
  document.getElementsByClassName('ace_content')[0]
    .height = (ace.session.getLength() + numWidgets + 2) * ace.renderer.lineHeight
}


function initLineWidgets() {
  ace.env.editor.execCommand('goToNextError')
  let error = ace.session.lineWidgets[ace.getCursorPosition().row]
  if(error && error.el) {
    error.el.remove()
    ace.session.lineWidgets[ace.getCursorPosition().row] = void 0
  }
}


function createLineWidget(text, line, classes) {
  if (!ace.session || !ace.session.lineWidgets) {
    initLineWidgets()
  }
  if(ace.session.lineWidgets[line]) {
    ace.session.lineWidgets[line].el.remove()
  }
  ace.renderer.off('afterRender', renderLineWidgets)
  ace.renderer.on('afterRender', renderLineWidgets)
  let newHelp = document.createElement('DIV')
  newHelp.className += ' ace_line ' + (classes || '')
  newHelp.style.top = ((line + 1) * ace.renderer.lineHeight) + 'px'
  let newWidget = {
    row: line,
    html: '<span class="ace_comment">' + text + '</span>',
    el: newHelp,
    pixelHeight: ace.renderer.lineHeight,
    rowCount: 1,
  }
  ace.session.lineWidgets[line] = newWidget
  newHelp.innerHTML = newWidget.html
  ace.session._emit('changeFold', {data:{start:{row: line}}});
  return newWidget
}



function displayBlockCall(start, evt) {
  let lastLine = ace.session.getFoldWidgetRange(start).end.row
  let funcName = ace.env.document.getLine(start).match(NAMED_FUNCTION)[1]
  if(lastLine < 0) {
    lastLine = ace.session.length()
  }
  createLineWidget(funcName + '();', lastLine, 'morph_hint')
  ace.renderer.on('afterRender', renderLineWidgets)
}


function updatePlay() {
  if (!ace.session.lineWidgets) {
    initLineWidgets()
  }
  let buttonCounter = 0
  let start = ace.renderer.layerConfig.firstRow
  let count = ace.renderer.layerConfig.lastRow - start
  for(let i = start; i < start + count; i++) {
    if(ace.session.foldWidgets[i] == 'start' 
      // only match functions with names
      && ace.session.getLine(i).match(NAMED_FUNCTION)
    ) {
      if(ACE.playCount <= buttonCounter) {
        newPlay()
      }
      ACE.playButtons[buttonCounter].onclick = runBlock.bind(null, i)
      ACE.playButtons[buttonCounter].onmouseover = displayBlockCall.bind(null, i)
      ACE.playButtons[buttonCounter].onmouseout = removeLineWidgets.bind(null, i, 'morph_hint')
      ACE.playButtons[buttonCounter].style.display = 'block'
      //let top = document.getElementsByClassName('ace_gutter-layer')[0].children[].offsetTop
      //   ^ uhhh, relativeTop?
      ACE.playButtons[buttonCounter].style.top = ((i - start) * ace.renderer.lineHeight) + 'px'
      buttonCounter++
    }
  }
  for(let j = buttonCounter; j < ACE.playCount; j++) {
    ACE.playButtons[j].style.display = 'none'
  }
}


function initLibraries() {
  // automatically load libraries
  let buf = stringToAddress('DEADBEEF') // pointer to pointer
  let length
  if ((length = FS_ReadFile(stringToAddress('driver/library.js'), buf)) > 0 && HEAPU32[buf >> 2] > 0) {
    let imageView = Array.from(HEAPU8.slice(HEAPU32[buf >> 2], HEAPU32[buf >> 2] + length))
    let utfEncoded = imageView.map(function (c) { return String.fromCharCode(c) }).join('')
    FS_FreeFile(HEAPU32[buf >> 2])
    ACE.libraryCode = utfEncoded
    ACE.libraryLines = utfEncoded.split('\n').length
  }

}


function initAce() {
  // TODO: on native sys_open index.html and use engine as proxy, cebsocket
  window.ace = ace.edit('editor')
  ace.setFontSize(16)
  ace.setTheme('ace/theme/monokai')
  ace.session.setTabSize(2)
  ace.session.setMode('ace/mode/javascript')
  ace.session.setUseWorker(false)
  // add play buttons to individual function blocks for ease of use
  ace.on('focus', function () { INPUT.editorActive = true })
  ace.on('blur', function () { INPUT.editorActive = false })
  ace.renderer.on('afterRender', updatePlay)

}



function onError(request) {
  if(request.error.includes('No script')) {
    document.body.classList.remove('runnning')
    document.body.classList.remove('starting')
    document.body.classList.remove('error')
    return
  }

  document.body.classList.remove('running')
  document.body.classList.add('paused')
  processResponse(request.error, request.line, true)
}


function onAccessor(request) {
  if(!document.body.className.includes('running')) {
    debugger
  }
  switch(request.accessor) {
    // safe to share?
    case 'window.screenLeft':
    case 'window.screenTop':
    case 'window.outerHeight':
    case 'window.outerWidth':
    let propertyName = request.accessor.split('.')[1]
    window['run-script'].innerHTML = window[propertyName]
    break

    default:
    debugger
  }
  window['run-button'].click()
}


function onFrontend() {
  window['run-script'].innerHTML = ACE.lastRunId
  document.body.classList.add('starting')
  window['run-button'].click()
  ACE.downloaded = true
}

function onStarted(request) {
  document.body.classList.remove('paused')
  document.body.classList.remove('starting')
  document.body.classList.add('running')
  ACE.lastRunId = request.started
  window['run-button'].classList.remove('running')
}

function onStatus(request) {
  let prevLine = request.line
  if(!ACE.libraryLoaded) {
    prevLine -= ACE.libraryLines
  } else {
    prevLine--;
  }
  // TODO: status line always out of view because sleep is in library.js
  if(prevLine < 0) {
    return // don't load status line while it's out of view
  }
  if(!ACE.statusLine) {
    createLineWidget('.', prevLine)
    ACE.statusLine = ace.session.lineWidgets[prevLine]
  }
  ACE.statusLine.el.children[0].innerText += '.'
  ace.session.lineWidgets[ACE.statusLine.row] = void 0
  ace.session._emit('changeFold', {data:{start:{row: ACE.statusLine.row}}});
  ACE.statusLine.row = prevLine // so it can keep removing itself as the program cursor moves
  ace.session.lineWidgets[prevLine] = ACE.statusLine
  ace.session._emit('changeFold', {data:{start:{row: prevLine}}});
}


window.addEventListener('message', function (message) {
  let request = message.data
  // never download if we get a response from extension
  ACE.downloaded = true 
  if(request.type) {
    document.body.classList.add(request.type)
  }

  if(typeof request.accessor != 'undefined') {
    onAccessor(request)
  } else 
  if(typeof request.service != 'undefined') {
    debugger
  } else 
  if(typeof request.frontend != 'undefined') {
    onFrontend()
  } else
  if(typeof request.started != 'undefined') {
    onStarted(request)
  } else


  // the rest of these are console messages
  if(typeof request.warning != 'undefined') {
    processResponse(request.warning, request.line, false)
  } else
  if(typeof request.console != 'undefined') {
    processResponse(request.console, request.line, false)
  } else 
  if(typeof request.error != 'undefined') {
    onError(request)
  } else 
  if(typeof request.result != 'undefined') {
    document.body.classList.remove('running')
    document.body.classList.add('paused')
    processResponse(request.result, request.line, false)
  } else 
  if(typeof request.status != 'undefined') {
    onStatus(request)
  } else {
    debugger
  }
}, false)
