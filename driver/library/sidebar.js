// ALL THAT MAKEFILE WORK JUST SO I FEEL ORGANIZED ENOUGH TO EXPAND.


// need to improve file list
//   need to render a list of widgets for section collapsing
// tables of contents should sort by entity type and alphabetically or locationally
//   need (depth, title, sort-key)
// entity list should group map entities in separate
//   .map files then use build system and a few transoforms
//   to compile .bsp
// unzip .zip files automatically and list contents in tree
// TODO: add alternate image views so same control can be used for
//   listing textures later
// decode Makefile and highlight the file with the commands being run
// file list always shows sized, especially on folders

// TODO: probably some game engine display



function anyParentsCollapsed(segments) {
	if(!ACE.filescollapsed) {
		return
	}
	return segments.slice(0, -1)
		.reduce(function (p, s, i) { 
			return p + ACE.filescollapsed[
				segments.slice(0, i + 1).join('/')]
		}, 0)
}


function simplifyMilliseconds(milli) {
	let secs = milli / 1000.0
	let mins = secs / 60.0
	let hours = mins / 60.0
	let days = hours / 24.0
	if(days > 1) {
		return Math.round(days, 1) + 'd'
	} else
	if(hours > 1) {
		return Math.round(hours, 1) + 'h'
	}
	else
	if(mins > 1) {
		return Math.round(hours, 1) + 'm'
	}
	else
	if(secs > 1) {
		return Math.round(hours, 1) + 's'
	} else {
		return milli + 'ms'
	}
}


function listFiles() {
	let newFiles = Object.keys(FS.virtual)
	let startLength = newFiles.length

	// put folder collapse hidden at top
	for(let i = 0; i < startLength; i++) {
		let segments = newFiles[i].split('/')
			.map(function (seg, i, arr) {
				return arr.slice(0, i + 1).join('/') 
			})
		// ADD MISSING PATHS FROM ENGINE TO FILE 
		//   LIST SO WE DON'T LOSE FILES IN DATABASE
		//   FROM MISSING LINKS. TODO: FSCHKDSK TOOL, WTF?
		newFiles.push.apply(newFiles, segments)
	}

	// sort and unique
	newFiles = newFiles.sort().filter(function (f, i, arr) { 
		return f && arr.indexOf(f) == i
	})
	return newFiles
}


function callStack() {
	let newFiles = []
	if(!ACE.callStack) {
		return newFiles
	}
	return newFiles.concat(ACE.callStack)
}


function cookieList() {
	if(!ACE.cookiesList) {
		return []
	}
	return Object.keys(ACE.cookiesList)
		.map(function (key) {
			return key + ': ' + ACE.cookiesList[key]
		})
}


const FILE_WIDGETS = [
	['Local Storage', listFiles, renderFile],
	['Call Stack', callStack, renderFunc],
	['Cookies', cookieList, renderCookie],
	['Threads', threadPool, renderThread],
	['Interactions', interactionsList, renderInteractions],
]


function renderInteractions(link, item, path) {
	let dialogs = document.getElementsByClassName('dialog')
	for(let i = 0; i < dialogs.length; i++) {
		if(dialogs[i].getAttribute('aria-id') == path) {
			let title = dialogs[i].getElementsByTagName('h2')[0]
			item.className = 'interaction'
			if(title) {
				if(link.innerText != title.innerText)
					link.innerText = title.innerText
			} else {
				if(link.innerText != dialogs[i].innerText.substr(0, 100))
					link.innerText = dialogs[i].innerText.substr(0, 100)
			}
			if(dialogs[i].parentElement !== item) {
				item.appendChild(dialogs[i])
			}
			break
		}
	}
}


function interactionsList() {
	if(!ACE.interactions) {
		return []
	}
	return ACE.interactions
		.map(function (dialog) {
			return dialog.getAttribute('aria-id')
		})
}


function threadPool() {
	if(!ACE.threadPool) {
		return []
	}
	return ACE.threadPool
		.map(function (thread) {
			return simplifyMilliseconds(Date.now() - thread[1]) + ': ' + thread[0]
		})
}


function updateFilelist(filepath) {
	if(typeof ACE == 'undefined') {
		window.ACE = {}

	}
	if(!ACE.fileList) {
		ACE.fileList = document.getElementById('file-list')
	}
	ACE.filestimer = null
	if(!ACE.fileList) {
		return
	}
	if(!ACE.filetypes) {
		ACE.filetypes = {}
	}
	// SLIGHTLY MORE EXPANDABLE
	ACE.filelistWidgets = []
	ACE.filelistWidgetRows = []
	let newFiles = []
	for(let i = 0; i < FILE_WIDGETS.length; i++) {
		// TODO: if(!filepath) continue
		ACE.filelistWidgets[newFiles.length] = FILE_WIDGETS[i]
		ACE.filelistWidgetRows.push(newFiles.length)
		newFiles.push(FILE_WIDGETS[i][0])
		newFiles = newFiles.concat(FILE_WIDGETS[i][1]())
	}
	ACE.filelistWidgetRows.sort()

	if(ACE.fileslist) {
		let prevCollapse = ACE.filescollapsed
		// save expand/collapse state even if files are added or removed
		ACE.filescollapsed = newFiles.reduce(function (obj, i) {
			let isTopLevel = i.split('/').length == 1
			if(prevCollapse.hasOwnProperty(i)) {
				obj[i] = prevCollapse[i]
			} else {
				obj[i] = i.split('/').length > 1 ? 0 : 1
			}
			// MAINTAIN THIS VISIBILITY INDEX SO USER 
			//   INTERACTION CAN BE VERY SPECIFIC AND FAST
			ACE.filesvisible[i] = isTopLevel
					|| !anyParentsCollapsed(i.split('/'))
			return obj
		}, {})
	} else {
		ACE.filesvisible = {} // I CAN DO THIS ALL DAY
		//   TODO: CHECK V8 USES HASH TABLES OR IF PHP IS FASTER
		ACE.filescollapsed = newFiles.reduce(
			function (obj, i) {
				let isTopLevel = i.split('/').length == 1
				obj[i] = isTopLevel ? 1 : 0
				ACE.filesvisible[i] = isTopLevel
				return obj
			}, {})
	}

	ACE.fileslist = newFiles
	ACE.filescount = Object.values(ACE.filesvisible)
			.reduce(function (p, i) { return p + i }, 0)
	ACE.filesmoved = true
}

function isDirectory(i) {
	// only folder paths and directories are collapsible,
	//   missing paths added seperately above
	//   HENCE THE CHECK FOR !FS.virtual[files[j]]
	return !FS.virtual[i] || FS.virtual[i].mode == FS_DIR
}





function toggleCollapse(row, dataRow) {
	if(!ACE.filescollapsed) {
		return
	}
	let collapse = !ACE.filescollapsed[dataRow]
	ACE.filescollapsed[dataRow] = collapse
	for(let i = row; i < ACE.fileslist.length; i++) {
		if(ACE.fileslist[i].substring(0, dataRow.length)
			.localeCompare(dataRow)) {
			break // no more files under this sorted folder
		}
		// don't make the row we clicked on invisible
		if(ACE.fileslist[i].localeCompare(dataRow) !== 0) {
			ACE.filesvisible[ACE.fileslist[i]] = !anyParentsCollapsed(ACE.fileslist[i].split('/'))
		} else {
			continue // don't count self?
		}
		if(!collapse) {
			ACE.filescount++
		} else {
			ACE.filescount--
		}
	}
	ACE.filesmoved = true
}



function doFileClick(evt) {
	if(!evt.target) {
		return
	}
  let gamedir = addressToString(FS_GetCurrentGameDir())
	let row = evt.target.getAttribute('aria-id') // WTF?
	let dataRow = ACE.fileslist[row]
	if(FS.virtual[dataRow]
		&& FS.virtual[dataRow].mode != FS_DIR) {
		Cbuf_AddText(stringToAddress(
				'edit "' + dataRow.replace(gamedir + '/', '') + '"\n'))
		return
	}
	toggleCollapse(row, dataRow)
}


function getWidgetAtRow(row) {
	let count = 0
	do {
		if(ACE.filelistWidgetRows[count] == row) {
			return ACE.filelistWidgets[row]
		}
		count++
	} while (count < ACE.filelistWidgetRows.length
		&& ACE.filelistWidgetRows[count] <= row)
}

function getWidgetBeforeRow(row) {
	let count = 0
	let widget
	do {
		if(ACE.filelistWidgetRows[count] <= row) {
			widget = ACE.filelistWidgets[row]
		}
		count++
	} while (count < ACE.filelistWidgetRows.length
		&& ACE.filelistWidgetRows[count] <= row)
	return widget
}


function renderFile(link, item, path) {
	let segments = path.split('/')
	if(link.innerText != segments.slice(-1)[0]) {
	 	link.innerText = segments.slice(-1)[0]
	}
	link.style.backgroundPosition = ((segments.length - 1) * 20 + 10) + 'px 50%'
	if(item.classList.contains('filelist-widget'))
		item.classList.remove('filelist-widget')
	link.style.paddingLeft = (segments.length * 20 + 20) + 'px'
	if(isDirectory(path)) {
		if(!item.classList.contains('folder'))
			item.classList.add('folder')
		if(!ACE.filescollapsed[path] && !item.classList.contains('open'))
			item.classList.add('open')
		if(ACE.filescollapsed[path] && item.classList.contains('open'))
			item.classList.remove('open')
		if(item.classList.contains('file'))
			item.classList.remove('file')
	} else {
		if(item.className != 'file')
			item.className = 'file'
		if(item.classList.contains('folder'))
			item.classList.remove('folder')
	}

}


function renderWidget(link, item, path) {
	if(link.innerText != path) { // otherwise annoying flash in element page
		link.innerText = path
	}
	link.style.paddingLeft = '10px'
	if(!item.classList.contains('filelist-widget'))
		item.classList.add('filelist-widget')
	if(!ACE.filescollapsed[path] && !item.classList.contains('open'))
		item.classList.add('open')
	if(ACE.filescollapsed[path] && item.classList.contains('open'))
		item.classList.remove('open')
	if(item.classList.contains('folder'))
		item.classList.remove('folder')
	if(item.classList.contains('file'))
		item.classList.remove('file')

}


function renderFunc(link, item, path) {
	if(link.innerText != path) { // otherwise annoying flash in element page
		link.style.paddingLeft = '10px'
		link.style.backgroundPosition = '10px 50%'
		link.innerText = path
	}
	item.className = ''
}


function renderCookie(link, item, path) {
	if(link.innerText != path) { // otherwise annoying flash in element page
		link.style.paddingLeft = '10px'
		link.style.backgroundPosition = '10px 50%'
		link.innerText = path
	}
	item.className = ''
}


function renderThread(link, item, path) {
	if(link.innerText != path) { // otherwise annoying flash in element page
		link.style.paddingLeft = '10px'
		link.style.backgroundPosition = '10px 50%'
		link.innerText = path
	}
	item.className = ''
}




// DO THE SAME KIND OF VIRTUAL RENDERING TECHNIQUE ACE USES ON CODE,
//   AND APPLY IT TO THE FILE LIST IN CASE THERE'S EVER LIKE, 10,000
//   THAT MIGHT BE TOO MUCH FOR A PAGE. BOOKMARKS, FOR EXAMPLE?
// TODO: FANCY STUFF LIKE VS CODE EXTENSIONS LIST, GITHUB ACTIONS LEFT HAND LIST,
//   SHOW FILE-GHOST TARGETS BEFORE MAKEFILE CREATES THEM USING SYNTAX ANALYSIS
//   LIKE MACOS DOES IN FINDER WHEN YOU GO TO COPY A FILE OR SOMETHING IS 
//   UPLOADING TO ICLOUD.
function renderFilelist() {
	if(!ACE.fileList) {
		updateFilelist()
		if(!ACE.fileList) {
			return
		}
	}

	// GENERATE THIS LIST ON BACKEND USING VIRTUAL DOM, CSS CONTROL OVER LIST WILL
	//   LOOK THE SAME
	let actualList = ACE.fileList.getElementsByTagName('ol')[0]
	if(!actualList) {
		return
	}
	let newHeight = ACE.filescount * ace.renderer.lineHeight
	if(actualList.clientHeight != newHeight)
		actualList.style.height = newHeight + 'px'

	let virtualLineCount = Math.min(Math.ceil(
		ACE.fileList.clientHeight / ace.renderer.lineHeight)
				, ACE.filescount) // min, updated on interaction

	// THIS IS WRONG, STARTING ON VISIBLE LINES LIST
	//   NOT ALL OF FILES. BUT WAIT, IF THEY SCROLLED IT
	//   CERTAINLY CAN'T DISPLAY LINES BEFORE THEIR SCROLL
	//   EVEN IF THEY ARE COLLAPSED OR NOT.
	let startLine = Math.floor(
		ACE.fileList.scrollTop / ace.renderer.lineHeight)
	let displayCount = 0

	let renderFunction = getWidgetBeforeRow(startLine)[2]
	let widget

	for(
		let j = startLine; // small efficiency gain?
		displayCount < virtualLineCount && j < ACE.fileslist.length;
		j++
	) {
		if(!ACE.filesvisible[ACE.fileslist[j]]) {
			continue
		}
		// SWITCHING BETWEEN IDE AND SOURCE TREE TO COPY SHIT CODE I 
		//   WROTE LAST NIGHT. I REALIZED VS CODE DOES THIS BLAME FEATURE
		//   BUT IT'S DISTRACTING, BOTH VIEWS OF CHANGES ARE SMALL AND 
		//   INCONVENIENT, BEYOND COMPARE IS BEYOND COMPARE. WHAT IF THERE
		//   WAS A TAB AT THE TOP I COULD SWITCH TO, TO SEE SOURCE COMPARE?
		let item
		let link

		if(displayCount == actualList.children.length) {
			item = document.createElement('LI')
			actualList.appendChild(item)
			link = document.createElement('A')
			link.onclick = doFileClick
			item.appendChild(link)
		} else {
			item = actualList.children[displayCount]
			link = item.children[0]
		}
		// TODO: SHOW SEPERATED DIRECTORIES IN ONE LINE LIKE VISUAL STUDIO CODE DOES
		//   GITHUB ALSO DOES IT FOR FOLDERS THAT ONLY HAVE 1 PATH
		if(ACE.filesmoved) {
			link.setAttribute('aria-id', j) // WTF WAS THIS CRAP???
			if((widget = getWidgetAtRow(j))) {
				renderFunction = widget[2]
				renderWidget(link, item, ACE.fileslist[j])
			} else {
				renderFunction(link, item, ACE.fileslist[j])
			}
			item.style.display = 'block'
		}
		displayCount++
	}
	if(ACE.filesmoved) {
		for(let i = displayCount; i < actualList.children.length; i++) {
			actualList.children[i].style.display = 'none'
		}
	}
	ACE.filesmoved = false
}


/*

	// extract basename from zip path
	basename = strrchr( zipfile, PATH_SEP );
	if ( basename == NULL ) {
		basename = zipfile;
	} else {
		basename++;
	}

	fileNameLen = (int) strlen( zipfile ) + 1;
	baseNameLen = (int) strlen( basename ) + 1;

	uf = unzOpen( zipfile );
	err = unzGetGlobalInfo( uf, &gi );

	if ( err != UNZ_OK ) {
		return NULL;
	}

	namelen = 0;
	filecount = 0;
	unzGoToFirstFile( uf );
	for (i = 0; i < gi.number_entry; i++)
	{
		err = unzGetCurrentFileInfo(uf, &file_info, filename_inzip, sizeof(filename_inzip), NULL, 0, NULL, 0);
		filename_inzip[sizeof(filename_inzip)-1] = '\0';
		if (err != UNZ_OK) {
			break;
		}
		// Z_DEFLATED
		if ( file_info.compression_method != 0 && file_info.compression_method != 8  ) {
			Com_Printf( S_COLOR_YELLOW "%s|%s: unsupported compression method %i\n", basename, filename_inzip, (int)file_info.compression_method );
			unzGoToNextFile( uf );
			continue;
		}
		namelen += strlen( filename_inzip ) + 1;
		unzGoToNextFile( uf );
		filecount++;
	}

	if ( filecount == 0 ) {
		unzClose( uf );
		return NULL;
	}
*/


