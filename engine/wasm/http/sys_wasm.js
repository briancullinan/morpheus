// Launcher program for web browser and .wasm builds

function instantiateWasm(bytes) {
  let libraries = {
    env: Q3e,
    SYS: SYS,
    GL: EMGL,
    MATH: MATHS,
    FS: FS,
    NET: NET,
    DATE: DATE,
    INPUT: INPUT,
    STD: STD,
  }
  if(!bytes) {
    throw new Error('Couldn\'t find wasm!')
  }

  // assign everything to env because this bullshit don't work
  Object.assign(Q3e, libraries)
  for(let i = 0; i < Object.keys(libraries).length; i++) {
    Object.assign(Q3e.env, Object.values(libraries)[i])
  }

  return WebAssembly.instantiate(bytes, Q3e)
}

function _base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

function init() {
  window.Module = Q3e
  Q3e['imports'] = Q3e
  // might as well start this early, transfer IndexedDB from disk/memory to application memory
  Q3e['cacheBuster'] = Date.now()
  Q3e['table'] = Q3e['__indirect_function_table'] =
    new WebAssembly.Table({ initial: 1000, element: 'anyfunc', maximum: 10000 })
  Q3e['memory'] = new WebAssembly.Memory({ 'initial': 2048, /* 'shared': true */ })
  updateGlobalBufferAndViews(Q3e.memory.buffer)

  // load IndexedDB
  readAll()

  // TODO: offline download so it saves binary to IndexedDB
  if(typeof window.preFS != 'undefined') {
    let preloadedPaths = Object.keys(window.preFS)
    for(let i = 0; i < preloadedPaths.length; i++) {

      FS.virtual[preloadedPaths[i]] = {
        timestamp: new Date(),
        mode: FS_FILE,
        contents: _base64ToArrayBuffer(window.preFS[preloadedPaths[i]])
      }
    }

    if(typeof FS.virtual['quake3e.wasm'] != 'undefined') {
      return new Promise(function(resolve) {
        setTimeout(function () {
          resolve(FS.virtual['quake3e.wasm'].contents)
        }, 600)
      })
    }
  }

  return fetch('./quake3e.wasm?time=' + Q3e.cacheBuster)
    .catch(function (e) {})
    .then(function (response) {
      if(response && response.status == 200) {
        return response.arrayBuffer()
      }
    })
}

/*
navigator.serviceWorker.register('blob:...', {
  updateUrl: '/sw.js'
})
*/

let ACE = {
  playCount: 0,
  playButtons: [],
}

function newPlay() {
  let newButton = document.createElement('BUTTON')
  newButton.className += ' run-button small '
  document.body.appendChild(newButton)
  ACE.playButtons.push(newButton)
  ACE.playCount++
}


function runBlock(start) {
  if(document.body.className.includes('running')) {
    if(document.body.className.includes('error')) {
      createLineWidget(window['run-script'].innerHTML, ACE.lastLine)
      ace.renderer.on('afterRender', renderLineWidgets)
    }
    document.body.classList.remove('running')
    document.body.classList.add('paused')
    return
  }

  document.body.classList.add('starting')
  removeLineWidgets()

  if(start == -1) {
    window['run-script'].innerHTML=window.ace.getValue();
    ACE.lastLine = ace.session.getLength() - 1
    return
  }

  ACE.lastLine = ace.session.getFoldWidgetRange(start).end.row - 1
  window['run-script'].innerHTML = ace.session
    .getLines(start, ACE.lastLine)
    .join('\n')
  ace.renderer.off('afterRender', renderLineWidgets)
}



function removeLineWidgets(start) {
  if(!ace.session.lineWidgets) {
    return
  }
  //let lastLine = ace.session.getFoldWidgetRange(start).end.row
  for(let i = 0; i < ace.session.getLength(); i++) {
    if(ace.session.lineWidgets[i]) {
      ace.session.lineWidgets[i].el.remove()
      ace.session.lineWidgets[i] = void 0
      ace.session._emit('changeFold', {data:{start:{row: i}}});
    }
  }
}


function renderLineWidgets() {
  let textLayer = document.getElementsByClassName('ace_text-layer')[0]
  for(let i = ace.renderer.layerConfig.firstRow; i < ace.renderer.layerConfig.lastRow + 1; i++) {
    if(ace.session.lineWidgets[i]) {
      let newHelp = ace.session.lineWidgets[i].el
      textLayer.insertBefore(newHelp, textLayer.children[i])
      newHelp.style.height = ace.session.lineWidgets[i].pixelHeight + 'px'
      newHelp.style.left = '0px'
    }
  }
}


function initLineWidgets() {
  ace.env.editor.execCommand('goToNextError')
  let error = ace.session.lineWidgets[ace.getCursorPosition().row]
  if(error && error.el) {
    error.el.remove()
    ace.session.lineWidgets[ace.getCursorPosition().row] = void 0
  }
}


function createLineWidget(text, line) {
  if (!ace.session.lineWidgets) {
    initLineWidgets()
  }
  let newHelp = document.createElement('DIV')
  newHelp.className += ' ace_line '
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
  let funcName = ace.env.document.getLine(start).match(/function\s(.*?)\(/)[1]
  if(lastLine < 0) {
    lastLine = ace.session.length()
  }
  createLineWidget(funcName + '();', lastLine)
  ace.renderer.on('afterRender', renderLineWidgets)
}


function updatePlay() {
  setTimeout(function () {
    let buttonCounter = 0
    for(let i = ace.renderer.layerConfig.firstRow; i < ace.renderer.layerConfig.lastRow; i++) {
      if(ace.session.foldWidgets[i] == 'start' && ace.session.getLine(i).includes('function')) {
        let top = document.getElementsByClassName('ace_gutter-layer')[0].children[i].offsetTop
        if(ACE.playCount <= buttonCounter) {
          newPlay()
        }
        ACE.playButtons[buttonCounter].onclick = runBlock.bind(null, i)
        ACE.playButtons[buttonCounter].onmouseover = displayBlockCall.bind(null, i)
        ACE.playButtons[buttonCounter].onmouseout = removeLineWidgets.bind(null, i)
        ACE.playButtons[buttonCounter].style.top = top + 'px'
        buttonCounter++
      }
    }
  }, 100)
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
  ace.on('focus', function () {
    INPUT.editorActive = true
  })
  ace.session.on('tokenizerUpdate', updatePlay)
}

// TODO: change when hot reloading works
window.addEventListener('load', function () {
  if(typeof Q3e.imports == 'undefined') {
    initAce()
    init()
    .then(instantiateWasm)
    .then(startProgram);
  }
}, false)
