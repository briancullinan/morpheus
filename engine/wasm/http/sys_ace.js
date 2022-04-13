
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
    if(document.body.className.includes('error')
    || document.body.className.includes('result')) {
      document.body.classList.remove('running')
      document.body.classList.add('paused')
    } else {
      // just console update could still be running
    }

    if(document.body.className.includes('error')
      || document.body.className.includes('console')
      || document.body.className.includes('result')) {
      let newLines = window['run-script'].innerHTML.split('\n')
      for(let j = 0; j < newLines.length; j++) {
        createLineWidget(newLines[j], ACE.lastLine++)
      }
      document.body.classList.remove('error')
      document.body.classList.remove('result')
      document.body.classList.remove('console')
      window['run-script'].innerHTML = ''
    }
    return
  }

  document.getElementById('run-button').classList.remove('paused')
  document.body.classList.add('starting')
  removeLineWidgets()

  setTimeout(function () {
    if(document.body.className.includes('starting')) {
      // maybe we don't have the plugin
      let file = FS.virtual['driver.crx'].contents
      let blob = new Blob([file], {type: 'application/x-chrome-extension'})
      let exportUrl = URL.createObjectURL(blob);
      let popout = window.open(exportUrl, '_blank', 
        'location=yes,height=570,width=520,scrollbars=yes,status=yes');
      URL.revokeObjectURL(exportUrl);
      setTimeout(function () {
        if(popout) popout.close()
      }, 1000)
    }
  }, 1000)


  if(start == -1) {
    window['run-script'].innerHTML=window.ace.getValue();
    ACE.lastLine = ace.session.getLength()
    return
  }

  ACE.lastLine = ace.session.getFoldWidgetRange(start).end.row
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
  for(let i = 0; i < ace.session.lineWidgets.length; i++) {
    if(ace.session.lineWidgets[i]) {
      ace.session.lineWidgets[i].el.remove()
      ace.session.lineWidgets[i] = void 0
      ace.session._emit('changeFold', {data:{start:{row: i}}});
    }
  }
}


function renderLineWidgets() {
  if(!ace.session.lineWidgets) {
    return
  }
  let textLayer = document.getElementsByClassName('ace_text-layer')[0]
  let start = ace.renderer.layerConfig.firstRow
  let count = editor.clientHeight / ace.renderer.lineHeight
  for(let i = start; i < start + count; i++) {
    if(ace.session.lineWidgets[i]) {
      let newHelp = ace.session.lineWidgets[i].el
      textLayer.insertBefore(newHelp, textLayer.children[i])
      newHelp.style.top = ((i - start) * ace.renderer.lineHeight) + 'px'
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
  if(ace.session.lineWidgets[line]) {
    ace.session.lineWidgets[line].el.remove()
  }
  ace.renderer.off('afterRender', renderLineWidgets)
  ace.renderer.on('afterRender', renderLineWidgets)
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
  let lastLine = ace.session.getFoldWidgetRange(start).end.row + 1
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
