const fs = require('fs');
const path = require('path');
const { start } = require('repl');


const GAME_DIRECTORY = 'multigame'
const WEB_DIRECTORY = path.resolve(__dirname + '/../http')
const ASSETS_DIRECTORY = path.resolve(__dirname + '/../../../games/multigame/assets/')
const BUILD_DIRECTORY = path.resolve(__dirname + '/../../../build/')
const ALLOWED_DIRECTORIES = [
  WEB_DIRECTORY,
  ASSETS_DIRECTORY,
  BUILD_DIRECTORY
]

const BUILD_ORDER = [
  'release-wasm-js',
  'debug-wasm-js',
  'release-js-js',
  'debug-js-js',
  'release-darwin-x86_64',
  'debug-darwin-x86_64'
]

// TODO: if trying to load menu path, return the index page
const MENU_PATHS = [
  'MAINMENU',
  'SETUP',
  'MULTIPLAYER',
  'CHOOSELEVEL',
  'ARENASERVERS',
  'DIFFICULTY',
  'PLAYERMODEL',
  'PLAYERSETTINGS',
]

var fileTimeout
var latestMtime = new Date()

function findFile(filename) {
  // layer the file system, so no matter what we're building, the browser loads something
  for(let i = 0; i < BUILD_ORDER.length; i++) {
    let newPath = path.join(BUILD_DIRECTORY, BUILD_ORDER[i], filename)
    if(fs.existsSync(path.resolve(newPath))) {
      return newPath
    }
  }

  if(filename.startsWith(GAME_DIRECTORY)) {
    let newPath = path.join(ASSETS_DIRECTORY, filename.substring(GAME_DIRECTORY.length))
    if(fs.existsSync(path.resolve(newPath))) {
      return newPath
    }

    if(newPath.includes('.pk3dir')) {
      let pk3 = path.join(BUILD_DIRECTORY, filename.substring(GAME_DIRECTORY.length))
      if(fs.existsSync(path.resolve(pk3))) {
        return pk3
      }
    }
  }

  let newPath = path.join(WEB_DIRECTORY, filename)
  if(fs.existsSync(path.resolve(newPath))) {
    return newPath
  }

  // TODO: more alternatives?
}


// okay this function is apparently a little idiotic and triggers on accesses
//   this is not how native notify works, but maybes it's the best they could make the same
function fileChanged(prefix, eventType, filename) {
  if(filename.includes('version.json')) {
    return // this would be redundant
  }
  if(!fs.existsSync(path.join(ASSETS_DIRECTORY, prefix, filename))) {
    // must have been deleted
    latestMtime = new Date()
  } else {
    let newMtime = fs.statSync(path.join(ASSETS_DIRECTORY, prefix, filename)).mtime
    if(newMtime > latestMtime) {
      latestMtime = newMtime
    }
  }
  writeVersionFile(latestMtime)
}


function startFileWatcher() {
  // TODO: enable file watchers in live reload mode
  //for(let i = 0; i < directories.length; i++) {
  //  fs.watch(path.join(ASSETS_DIRECTORY, directories[i]), 
  //    fileChanged.bind(null, directories[i]))
  //}

}


function findAltImage(localName) {
  // what makes this clever is it only converts when requested
  let ext = path.extname(localName)
  let strippedName = localName
  if(ext) {
    strippedName = strippedName.substring(0, localName.length - ext.length)
  }
  let file
  if((file = findFile(strippedName + '.tga'))) {
    return file
  }
  if((file = findFile(strippedName + '.pcx'))) {
    return file
  }
}


function findAltAudio(localName) {
  // what makes this clever is it only converts when requested
  let ext = path.extname(localName)
  let strippedName = localName
  if(ext) {
    strippedName = strippedName.substring(0, localName.length - ext.length)
  }
  let file
  if((file = findFile(strippedName + '.wav'))) {
    return file
  }
  if((file = findFile(strippedName + '.mp3'))) {
    return file
  }
}

function hasAlpha(otherFormatName) {
  const { execSync } = require('child_process');
  try {
    let alphaCmd = execSync(`identify -format '%[opaque]' "${path
      .resolve(otherFormatName)}"`, {stdio : 'pipe'}).toString('utf-8')
    // if it is alpha
    if(/* true || TODO: allAlpha? */ alphaCmd.match(/true/ig)) {
      return false
    }
  } catch (e) {
    console.error(e.message, (e.output || '').toString('utf-8').substr(0, 1000))
  }
  return true
}


function layeredDir(filename) {
  let list = []

  for(let i = 0; i < BUILD_ORDER.length; i++) {
    let newPath = path.join(BUILD_DIRECTORY, BUILD_ORDER[i], filename)
    if(fs.existsSync(path.resolve(newPath))
      && fs.statSync(path.resolve(newPath)).isDirectory()) {
      list.push.apply(list, fs.readdirSync(path.resolve(newPath))
        .filter(file => file == GAME_DIRECTORY || file == 'vm' 
          || path.extname(file) == '.wasm' || path.extname(file) == '.qvm'))
    }
  }

  if(filename.startsWith(GAME_DIRECTORY)) {
    let newPath = path.join(ASSETS_DIRECTORY, filename.substring(GAME_DIRECTORY.length))
    if(fs.existsSync(path.resolve(newPath))
      && fs.statSync(path.resolve(newPath)).isDirectory()) {
      list.push.apply(list, fs.readdirSync(path.resolve(newPath)))
    }

    if(filename.endsWith('.pk3dir/scripts')) {
      let maps = filename.substring(GAME_DIRECTORY.length, filename.indexOf('.pk3dir') + 7)
      let newPath = path.join(ASSETS_DIRECTORY, maps, 'maps')
      let bsps = fs.readdirSync(path.resolve(newPath))
        .filter(dir => dir.endsWith('.bsp'))
        .map(dir => dir.replace('.bsp', '.shader'))
      list.push.apply(list, bsps)
    }

    if(filename.includes('.pk3dir')) {
      let newPath = path.join(BUILD_DIRECTORY, filename.substring(GAME_DIRECTORY.length))
      if(fs.existsSync(path.resolve(newPath))
        && fs.statSync(path.resolve(newPath)).isDirectory()) {
        list.push.apply(list, fs.readdirSync(path.resolve(newPath)))
      }
    }
  }

  let newPath = path.join(WEB_DIRECTORY, filename)
  if(fs.existsSync(path.resolve(newPath))
    && fs.statSync(path.resolve(newPath)).isDirectory()) {
    list.push.apply(list, fs.readdirSync(path.resolve(newPath)))
  }

  if(layeredDir == GAME_DIRECTORY) {
    list.push('version.json')
  }

  return list.reduce((list, i) => {
    if(i.endsWith('.pcx') || i.endsWith('.tga')) {
      if(!findFile(path.join(filename, i.replace(path.extname(i), '.png')))
        && !findFile(path.join(filename, i.replace(path.extname(i), '.jpg')))) {
        list.push(i.replace(path.extname(i), '.png'))
        list.push(i.replace(path.extname(i), '.jpg'))
      }
    } else if (i.endsWith('.wav') || i.endsWith('.mp3')) {
      if(!findFile(path.join(filename, i.replace(path.extname(i), '.ogg')))) {
        list.push(i.replace(path.extname(i), '.ogg'))
      }
    } else {
      list.push(i)
    }
    return list
  }, []).filter((p, i, l) => p[0] != '.' && l.indexOf(p) == i)
}


function makeDirectoryHtml(localName, list) {
  let filelist = list.map(node => 
    `<li><a href="${path.join(localName, node)}">${node}</a></li>`).join('\n')
  let title = localName.endsWith('/') ? localName.substring(0, localName.length - 1) : localName
  let breadcrumbs = ('/' + localName).split('/').filter((b, i) => i == 0 || b)
  let pathlinks = breadcrumbs.map((crumb, i) => 
    `<a href="${breadcrumbs.slice(0, i + 1).join('/')}">${i == 0 ? 'home' : crumb}</a>`).join(' / \n')
  return `
<!DOCTYPE html>
<html>
<head>
<title>${title}</title>
<style>ol{list-style:none;padding:0;}</style>
<base href="/" target="_self">
</head>
<body>
<h1>${pathlinks}</h1>
<ol>
${filelist}
</ol>
</body>
</html>
`
}


function writeVersionFile(time) {
  console.log('Updating working directory...')
  // debounce file changes for a second in case there is a copy process going on
  if(fileTimeout) {
    clearTimeout(fileTimeout)
  }
  fileTimeout = setTimeout(function () {
    try {
      if(!time) time = new Date()
      // refresh any connected clients
      require('fs').writeFileSync(
        path.join(ASSETS_DIRECTORY, 'version.json'), 
        JSON.stringify([time, time]))
      //fs.watchFile(file, function(curr, prev) {
      //});
    } catch(e) {
      console.log(e)
    }
  }, 1000)

}

var MATCH_PALETTE = /palette\s"(.*?)"\s([0-9]+(,[0-9]+)*)/ig

function makePaletteShader(localName, response) {
  const { execSync } = require('child_process');
  const { findTypes, imageTypes } = require('./repack-whitelist');
  let pk3dir = localName
  if(localName.startsWith(GAME_DIRECTORY)) {
    pk3dir = localName.substring(GAME_DIRECTORY.length)
  }
  pk3dir = pk3dir.substr(0, pk3dir.indexOf('.pk3dir') + 7)
  let shaderPath = localName
  if(localName.startsWith(GAME_DIRECTORY)) {
    shaderPath = localName.substring(GAME_DIRECTORY.length)
  }
  if(!fs.existsSync(pk3dir)) {
    console.log('wtf', pk3dir)
    pk3dir = path.join(ASSETS_DIRECTORY, pk3dir)
    shaderPath = path.join(ASSETS_DIRECTORY, shaderPath)
  }
  let images = findTypes(imageTypes, pk3dir)
  let palette = {}
  let existingPalette = ''
  if(fs.existsSync(shaderPath)) {
    let m
    existingPalette = fs.readFileSync(shaderPath).toString('utf-8')
    while((m = (MATCH_PALETTE).exec(existingPalette)) !== null) {
      palette[m[1]] = m[2]
    }
    existingPalette = existingPalette.replace(/palettes\/.*?\n*\{[\s\S]*?\}\n*/ig, '')
  }

  for(let i = 0; i < images.length; i++) {
    let newPath = path.join(GAME_DIRECTORY, images[i].substring(ASSETS_DIRECTORY.length))
    if(typeof palette[newPath] == 'undefined') {
      // get average image color for palette
      try {
        colorCmd = execSync(`convert "${images[i]}" -resize 1x1\! -format "%[fx:int(255*a+.5)],%[fx:int(255*r+.5)],%[fx:int(255*g+.5)],%[fx:int(255*b+.5)]" info:-`, {stdio : 'pipe'}).toString('utf-8')
        palette[newPath] = colorCmd
      } catch (e) {
        console.error(e.message, (e.output || '').toString('utf-8').substr(0, 1000))
      }
    }
  }

  // save palette to shader file
  let imagePixels = Object.keys(palette)
    .map(k => `  palette "${k}" ${palette[k]}`).join('\n')
  existingPalette = `palettes\/${pk3dir.substr(1, pk3dir.length - 8)}\n{\n${imagePixels}\n}\n` + existingPalette
  fs.writeFileSync(shaderPath, existingPalette)
  if(response)
    return response.send(existingPalette)
}


function sendCompressed(file, res, acceptEncoding) {
  const zlib = require('zlib')
  const mime = require('mime')
  let readStream = fs.createReadStream(file)
  res.setHeader('cache-control', 'public, max-age=31557600')
  res.setHeader('content-type', mime.getType(file))
  // if compressed version already exists, send it directly
  if(acceptEncoding.includes('br')) {
    res.append('content-encoding', 'br')
    if(fs.existsSync(file + '.br')) {
      res.append('content-length', fs.statSync(file + '.br').size)
      readStream = fs.createReadStream(file + '.br')
    } else {
      readStream = readStream.pipe(zlib.createBrotliCompress())
    }
  } else if(acceptEncoding.includes('gzip')) {
    res.append('content-encoding', 'gzip')
    if(fs.existsSync(file + '.gz')) {
      res.append('content-length', fs.statSync(file + '.gz').size)
      readStream = fs.createReadStream(file + '.gz')
    } else {
      readStream = readStream.pipe(zlib.createGzip())
    }
  } else if(acceptEncoding.includes('deflate')) {
    res.append('content-encoding', 'deflate')
    if(fs.existsSync(file + '.df')) {
      res.append('content-length', fs.statSync(file + '.df').size)
      readStream = fs.createReadStream(file + '.df')
    } else {
      readStream = readStream.pipe(zlib.createDeflate())
    }
  } else {
    res.append('content-length', fs.statSync(file).size)
  }
  
  readStream.pipe(res)
}

//var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

function respondRequest(request, response) {
  const { execSync } = require('child_process');
  let localName = path.join(request.baseUrl, request.path)
  if(localName[0] == '/')
    localName = localName.substring(1)
  // remove MAINMENU from path
  let menuDir = localName.substring(localName.lastIndexOf('/'))
  if(MENU_PATHS.includes(menuDir.toUpperCase())) {
    localName = localName.substring(0, localName.length - menuDir.length)
  }
  if(localName.endsWith('/')) {
    localName = localName.substring(0, localName.length - 1)
  }
  //if(localName.startsWith(GAME_DIRECTORY))
  //  localName = localName.substring(GAME_DIRECTORY.length)
  //if(localName[0] == '/')
  //  localName = localName.substring(1)

  // list palette images for pk3dirs
  if(localName.includes('.pk3dir/scripts/')
    && localName.endsWith('.shader')) {
    let mapName = path.basename(localName.substring(0, localName.length - 7))
    let newPath = path.join(ASSETS_DIRECTORY, 
      localName.substring(GAME_DIRECTORY.length), '../../maps/', mapName + '.bsp')
    if(fs.existsSync(newPath)) {
      return makePaletteShader(localName, response)
    }
  }


  let file
  // send files that exist in the layered file-system
  if((file = findFile(localName))) {
    // TODO: if loading a directory return a formatted file index HTML directory listing
    if(fs.statSync(file).isDirectory()) {
      if((file = findFile(path.join(localName, 'index.html')))) {
        return response.sendFile(path.resolve(file))
      } else {
        let list = layeredDir(localName)
        return response.send(makeDirectoryHtml(localName, list))
      }
    } else if(request.headers['accept-encoding']) {
      return sendCompressed(path.resolve(file), response, request.headers['accept-encoding'])
    } else {
      return response.sendFile(path.resolve(file))
    }
  }


// TODO: convert paths like *.pk3dir and *.pk3 to their zip counterparts and stream
// TODO: if loading a path out of a .pk3 file, return it as a directory


  // always make a version file in live-reload mode
  if(localName.match('version.json')) {
    let newPath = path.join(ASSETS_DIRECTORY, 'version.json')
    if(!fs.existsSync(newPath)) {
      writeVersionFile(latestMtime)
    }
    response.sendFile(path.resolve(newPath));
  }

  // if loading an image in a different format convert it
  if((file = findAltImage(localName))) {
    let newPath = path.join(ASSETS_DIRECTORY, localName.substring(GAME_DIRECTORY.length))
    let alpha = hasAlpha(file)
    if((!alpha && localName.includes('.jpeg'))
      || (alpha && localName.includes('.png'))) {
      execSync(`convert -strip -interlace Plane -sampling-factor 4:2:0 -quality 20% -auto-orient "${file}" "${path.resolve(newPath)}"`, {stdio : 'pipe'})
    }
    if(fs.existsSync(newPath)) {
      if(request.headers['accept-encoding']) {
        return sendCompressed(path.resolve(file), response, request.headers['accept-encoding'])
      } else {
        return response.sendFile(path.resolve(newPath))
      }
    }
  }

  // if loading audio in a different format
  if((file = findAltAudio(localName))) {
    let newPath = path.join(ASSETS_DIRECTORY, localName.substring(GAME_DIRECTORY.length))
    if(file.includes('.mp3')) {
      execSync(`ffmpeg -i "${file}" -c:a libvorbis -q:a 4 "${path.resolve(newPath)}"`, {stdio : 'pipe'})
    } if (localName.includes('.ogg') || file.includes('.wav')) {
      execSync(`oggenc -q 7 --downmix --resample 11025 --quiet "${file}" -n "${path.resolve(newPath)}"`, {stdio : 'pipe'})
    }
    if(fs.existsSync(newPath)) {
      if(request.headers['accept-encoding']) {
        return sendCompressed(path.resolve(file), response, request.headers['accept-encoding'])
      } else {
        return response.sendFile(path.resolve(newPath))
      }
    }
  }


  if((file = findFile('index.html'))) {
    // if loading a missing path return the index page
    if(localName.length < 2) { // index page?
      return response.sendFile(path.resolve(file))
    } else {
      return response.status(404).send() //.sendFile(path.resolve(file))
    }
  }

}

let noFS = false
let runServer = false
let forwardIP = ''
for(let i = 0; i < process.argv.length; i++) {
  let a = process.argv[i]
  if(a.match(__filename)) {
    runServer = true
  } else if (a == '--proxy-ip') {
    console.log('Forwarding ip address: ', process.argv[i+1])
    forwardIP = process.argv[i+1]
    i++
  } else if (a == '--no-fs') {
    console.log('Turning off file-system access.')
    noFS = true
  }
}

if(runServer) {
  const WebSocketServer = require('ws').Server
  const {Server} = require('../lib/socks.server.js')
  const express = require('express')
  const app = express()
  const http = require('http')
  const master = require('./master.js')
  master(27950)
  app.enable('etag')
  app.set('etag', 'strong')
  if(!noFS) {
    app.use(respondRequest)
  }
  express.static.mime.types['wasm'] = 'application/wasm'
  express.static.mime.types['pk3'] = 'application/octet-stream'
  express.static.mime.types['bsp'] = 'application/octet-stream'

  let socks = new Server({forwardIP})
  let httpServer = http.createServer(app)
  httpServer.listen(8080, console.log.bind(null, `Server is running on 8080` ))
  let wss = new WebSocketServer({server: httpServer})
  wss.on('connection', socks._onConnection.bind(socks))

  startFileWatcher()
}



function file2Base64(filename) {
  let fs = require('fs');
  let base64 = fs.readFileSync(filename, 'base64');
  return base64
}

function formatForVFS() {
  let output = `
if(typeof window.preFS == 'undefined') {
  window.preFS={};
}
`
  let fs = require('fs');
  for(let i = 0; i < process.argv.length; i++) {
    let a = process.argv[i]
    if(fs.existsSync(a)) {
      let ftime = fs.statSync(a).mtime.getTime()
      output += `
window.preFS['$3_timestamp']=${ftime};
window.preFS['$3']='${file2Base64(a)}';
`
    }
  }
}

let Q3e = {
  sharedCounter: 0,
  sharedMemory: 0,
}

// here's the thing, I know for a fact that all the callers copy this stuff
//   so I don't need to increase my temporary storage because by the time it's
//   overwritten the data won't be needed, should only keep shared storage around
//   for events and stuff that might take more than 1 frame
function stringsToMemory(list, length) {
	// add list length so we can return addresses like char **
	let start = Q3e.sharedMemory + Q3e.sharedCounter
	let posInSeries = start + list.length * 4
	for (let i = 0; i < list.length; i++) {
		HEAPU32[(start+i*4)>>2] = posInSeries // save the starting address in the list
		stringToAddress(list[i], posInSeries)
		posInSeries += list[i].length + 1
	}
	if(length) HEAPU32[length >> 2] = posInSeries - start
	Q3e.sharedCounter = posInSeries - Q3e.sharedMemory
	Q3e.sharedCounter += 4 - (Q3e.sharedCounter % 4)
	if(Q3e.sharedCounter > 1024 * 512) {
		Q3e.sharedCounter = 0
	}
	return start
}

let HEAPU8
let HEAPU32

function addressToString(addr, length) {
	let newString = ''
	if(!addr) return newString
	if(!length) length = 1024
	for(let i = 0; i < length; i++) {
		if(HEAPU8[addr + i] == 0) {
			break;
		}
		newString += String.fromCharCode(HEAPU8[addr + i])
	}

	return newString
}

function stringToAddress(str, addr) {
	let start = Q3e.sharedMemory + Q3e.sharedCounter
	if(typeof str != 'string') {
		str = str + ''
	}
	if(addr) start = addr
	for(let j = 0; j < str.length; j++) {
		HEAPU8[start+j] = str.charCodeAt(j)
	}
	HEAPU8[start+str.length] = 0
	HEAPU8[start+str.length+1] = 0
	HEAPU8[start+str.length+2] = 0
	if(!addr) {
		Q3e.sharedCounter += str.length + 3
		Q3e.sharedCounter += 4 - (Q3e.sharedCounter % 4)
		if(Q3e.sharedCounter > 1024 * 512) {
			Q3e.sharedCounter = 0
		}
	}
	return start
}

var WASI_ESUCCESS = 0;
var WASI_EBADF = 8;
var WASI_EINVAL = 28;
var WASI_ENOSYS = 52;

var WASI_STDOUT_FILENO = 1;
var WASI_STDERR_FILENO = 2;

function getModuleMemoryDataView() {
  // call this any time you'll be reading or writing to a module's memory 
  // the returned DataView tends to be dissaociated with the module's memory buffer at the will of the WebAssembly engine 
  // cache the returned DataView at your own peril!!

  return new DataView(Q3e.memory.buffer);
}

function fd_prestat_get(fd, bufPtr) {
  debugger
  return WASI_EBADF;
}

function fd_prestat_dir_name(fd, pathPtr, pathLen) {
  debugger
  return WASI_EINVAL;
}

function environ_sizes_get(environCount, environBufSize) {
  debugger
  var view = getModuleMemoryDataView();

  view.setUint32(environCount, 0, !0);
  view.setUint32(environBufSize, 0, !0);

  return WASI_ESUCCESS;
}

function environ_get(environ, environBuf) {
  debugger
  return WASI_ESUCCESS;
}

function args_sizes_get(argc, argvBufSize) {
  debugger
  var view = getModuleMemoryDataView();

  view.setUint32(argc, 0, !0);
  view.setUint32(argvBufSize, 0, !0);

  return WASI_ESUCCESS;
}

function args_get(argv, argvBuf) {
  debugger
  return WASI_ESUCCESS;
}

function fd_fdstat_get(fd, bufPtr) {
  debugger
  var view = getModuleMemoryDataView();

  view.setUint8(bufPtr, fd);
  view.setUint16(bufPtr + 2, 0, !0);
  view.setUint16(bufPtr + 4, 0, !0);

  function setBigUint64(byteOffset, value, littleEndian) {

      var lowWord = value;
      var highWord = 0;

      view.setUint32(littleEndian ? 0 : 4, lowWord, littleEndian);
      view.setUint32(littleEndian ? 4 : 0, highWord, littleEndian);
  }

  setBigUint64(bufPtr + 8, 0, !0);
  setBigUint64(bufPtr + 8 + 8, 0, !0);

  return WASI_ESUCCESS;
}

function fd_write(fd, iovs, iovsLen, nwritten) {
  var view = getModuleMemoryDataView();
  debugger
  var written = 0;
  var bufferBytes = [];                   

  function getiovs(iovs, iovsLen) {
    // iovs* -> [iov, iov, ...]
    // __wasi_ciovec_t {
    //   void* buf,
    //   size_t buf_len,
    // }
    var buffers = Array.from({ length: iovsLen }, function (_, i) {
      var ptr = iovs + i * 8;
      var buf = view.getUint32(ptr, !0);
      var bufLen = view.getUint32(ptr + 4, !0);

      return new Uint8Array(Q3e.memory.buffer, buf, bufLen);
    });

    return buffers;
  }

  var buffers = getiovs(iovs, iovsLen);
  function writev(iov) {
    for (var b = 0; b < iov.byteLength; b++) {
      bufferBytes.push(iov[b]);
    }

    written += b;
  }

  buffers.forEach(writev);

  if (fd === WASI_STDOUT_FILENO) console.log(String.fromCharCode.apply(null, bufferBytes));                            
  if (fd === WASI_STDERR_FILENO) console.error(String.fromCharCode.apply(null, bufferBytes));                            

  view.setUint32(nwritten, written, !0);

  return WASI_ESUCCESS;
}

function poll_oneoff(sin, sout, nsubscriptions, nevents) {
  debugger
  return WASI_ENOSYS;
}

function proc_exit(rval) {
  debugger
  return WASI_ENOSYS;
}

function fd_close(fd) {
  debugger
  return WASI_ENOSYS;
}

function fd_seek(fd, offset, whence, newOffsetPtr) {
  debugger
}

function fd_close(fd) {
  debugger
  return WASI_ENOSYS;
}


const polyfill = {
  wasi_snapshot_preview1: Q3e,
  env: Q3e,
  clock_time_get: function () { debugger },
  clock_res_get: function () { debugger },
  //setModuleInstance : setModuleInstance,
  environ_sizes_get : environ_sizes_get,
  args_sizes_get : args_sizes_get,
  fd_fdstat_set_flags: function () { debugger },
  fd_prestat_get : fd_prestat_get,
  fd_fdstat_get : fd_fdstat_get,
  fd_write : fd_write,
  fd_prestat_dir_name : fd_prestat_dir_name,
  environ_get : environ_get,
  args_get : args_get,
  poll_oneoff : poll_oneoff,
  proc_exit : proc_exit,
  Sys_FOpen: function () { debugger },
  fd_close : fd_close,
  fd_seek : fd_seek,
  fd_advise: function () { debugger },
  fd_allocate: function () { debugger },
  fd_datasync: function () { debugger },
  fd_read: function () { debugger },
  path_open: function () { debugger },
  DebugBreak: function () { debugger },
  fd_fdstat_set_rights: function () { debugger },
  fd_filestat_get: function () { debugger },
  fd_filestat_set_size: function () { debugger },
  fd_filestat_set_times: function () { debugger },
  fd_pread: function () { debugger },
  fd_pwrite: function () { debugger },
  fd_readdir: function () { debugger },
  fd_renumber: function () { debugger },
  fd_sync: function () { debugger },
  fd_tell: function () { debugger },
  path_create_directory: function () { debugger },
  path_filestat_get: function () { debugger },
  path_filestat_set_times: function () { debugger },
  path_link: function () { debugger },
  path_readlink: function () { debugger },
  path_remove_directory: function () { debugger },
  path_rename: function () { debugger },
  path_symlink: function () { debugger },
  path_unlink_file: function () { debugger },
  proc_raise: function () { debugger },
  sched_yield: function () { debugger },
  random_get: function () { debugger },
  sock_recv: function () { debugger },
  sock_send: function () { debugger },
  sock_shutdown: function () { debugger },
}

async function lburg(inFile, outFile) {
  const fs = require('fs')
  const path = require('path')
  let bytes = new Uint8Array(
    fs.readFileSync(path.join(__dirname, 
    '../../../libs/q3lcc/build--/lburg/lburg.wasm')))
  Object.assign(Q3e, polyfill)
  Q3e['table'] = Q3e['__indirect_function_table'] =
  new WebAssembly.Table({ initial: 1000, element: 'anyfunc', maximum: 10000 })
  Q3e['memory'] = new WebAssembly.Memory({ 'initial': 2048, /* 'shared': true */ })
  let wasm = await WebAssembly.instantiate(bytes, Q3e)
  let _start = wasm.instance.exports._start
  let malloc = wasm.instance.exports.malloc
  // store some strings and crap
  HEAPU8 = new Uint8Array(Q3e.memory.buffer)
	HEAPU32 = new Uint32Array(Q3e.memory.buffer)
  Q3e['sharedMemory'] = malloc(1024 * 1024) 

  let startup = [ 'lburg', inFile, outFile ]
  try {
    _start(startup.length, stringsToMemory(startup))
  } catch (e) {
    console.log(e)
    throw e
  }
}


module.exports = {
  writeVersionFile,
  respondRequest,
  makePaletteShader,
  formatForVFS,
  lburg,
}
