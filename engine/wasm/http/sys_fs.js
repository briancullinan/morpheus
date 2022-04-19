
var DB_STORE_NAME = 'FILE_DATA';

function openDatabase(noWait) {
  if(FS.database) {
    return Promise.resolve(FS.database)
  }
  if(!FS.database && (!FS.open || Date.now() - FS.openTime > 3000)) {
    FS.openTime = Date.now()
    // TODO: make a separate /home store for content to upload submissions to NPM-style packaging system
    // TODO: synchronize saved game states and config files out of /home database
    // TODO: on Native /base is manually configured, manually downloaded, /home is auto-downloaded
    //   on web /base is auto-downloaded and home is manually configured/drag-drop, fix this
    return new Promise(function (resolve) {
      FS.open = indexedDB.open('/base', 22)
      FS.open.onsuccess = function (evt) {
        FS.database = evt.target.result
        resolve(FS.database)
        //if(!Array.from(FS.database.objectStoreNames).includes(DB_STORE_NAME)) {
        //  FS.database.createObjectStore(DB_STORE_NAME)
        //}
      }
      FS.open.onupgradeneeded = function () {
        let fileStore = FS.open.result.createObjectStore(DB_STORE_NAME)
        if (!fileStore.indexNames.contains('timestamp')) {
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      }
      FS.open.onerror = function (error) {
        console.error(error)
        resolve(error)
      }
    })
  } else if (!noWait) {
    return new Promise(function (resolve) { 
      let count = 0
      let interval
      interval = setInterval(function () {
        if(FS.database || count == 10) {
          clearInterval(interval)
          openDatabase(true).then(resolve)
        } else {
          count++
        }
      }, 300)
    })
  } else {
    throw new Error('no database')
  }
}

const VFS_NOW = 3
const ST_FILE = 8
const ST_DIR = 4

// 438 = 0o666
const FS_DEFAULT = (6 << 3) + (6 << 6) + (6) 
const FS_FILE = (ST_FILE << 12) + FS_DEFAULT
const FS_DIR = (ST_DIR << 12) + FS_DEFAULT

// (33206 & (((1 << 3) - 1) << 3) >> 3 = 6
const S_IRGRP = ((1 << 3) - 1) << 3
const S_IRUSR = ((1 << 3) - 1) << 6
const S_IROTH = ((1 << 3) - 1) << 0

function readAll() {
  let hadDefault = false
  let startTime = Date.now()
  Q3e.fs_loading = 1
  // FIX FOR "QKEY could not open" ERROR
  FS.virtual['home'] = {
    timestamp: new Date(),
    mode: FS_DIR,
  }
  if(typeof window.fs_loading != 'undefined') {
    HEAPU32[fs_loading >> 2] = Q3e.fs_loading
  }
  console.log('sync started at ', new Date())
  return openDatabase()
  .then(function(db) {
    let transaction = db.transaction([DB_STORE_NAME], 'readonly')
    let objStore = transaction.objectStore(DB_STORE_NAME)
    let tranCursor = objStore.openCursor()
    return new Promise(function (resolve) {
      tranCursor.onsuccess = function loadItems(event) {
        let cursor = event.target.result
        if(!cursor) {
          return resolve()
        }
        if(cursor.key.endsWith('default.cfg')) {
          hadDefault = cursor.key
        }
        FS.virtual[cursor.key] = {
          timestamp: cursor.value.timestamp,
          mode: cursor.value.mode,
          contents: cursor.value.contents
        }
        return cursor.continue()
      }
      tranCursor.onerror = function (error) {
        console.error(error)
        resolve(error)
      }
    }).then(function () { 
      transaction.commit()
      let tookTime = Date.now() - startTime
      console.log('sync completed', new Date())
      console.log('sync took', 
        (tookTime > 60 * 1000 ? (Math.floor(tookTime / 1000 / 60) + ' minutes, ') : '')
        + Math.floor(tookTime / 1000) % 60 + ' seconds, '
        + (tookTime % 1000) + ' milliseconds')
      Q3e.fs_loading = 0
      if(typeof window.fs_loading != 'undefined') {
        HEAPU32[fs_loading >> 2] = 0
        if(hadDefault) {
          HEAPU32[com_fullyInitialized >> 2] = 1
          setTimeout(function () {
            Sys_FileReady(stringToAddress('default.cfg'), stringToAddress(hadDefault))
          }, 100)
        }
      }
      if(typeof window.initFilelist != 'undefined') {
        initFilelist()
      }
    })
  })
  .catch(function (e) {
    console.log(e)
    debugger
  })
  
  
}


function readStore(key) {
  return openDatabase()
  .then(function (db) {
    let transaction = db.transaction([DB_STORE_NAME], 'readwrite');
    let objStore = transaction.objectStore(DB_STORE_NAME);
    return new Promise(function (resolve) {
      let tranCursor = objStore.get(key)
      tranCursor.onsuccess = function (event) {
        resolve(event.target.result)
      }
      tranCursor.onerror = function (error) {
        console.error(error)
        resolve(error)
      }
      transaction.commit()
    })
  })
  .catch(function (e) {})
}

function writeStore(value, key) {
  return openDatabase()
  .then(function (db) {
    let transaction = db.transaction([DB_STORE_NAME], 'readwrite');
    let objStore = transaction.objectStore(DB_STORE_NAME);
    return new Promise(function (resolve) {
      let storeValue  
      if(value === false) {
        storeValue = objStore.delete(key)
      } else {
        storeValue = objStore.put(value, key)
      }
      storeValue.onsuccess = function () {}
      transaction.oncomplete = function (event) {
        resolve(event.target.result)
        //FS.database.close()
        //FS.database = null
        //FS.open = null
      }
      storeValue.onerror = function (error) {
        console.error(error, value, key)
      }
      transaction.commit()
    })
  })
  .catch(function (e) {})
}


function Sys_Mkdir(filename) {
  let fileStr = addressToString(filename)
  let localName = fileStr
  if(localName.startsWith('/base')
    || localName.startsWith('/home'))
    localName = localName.substring('/base'.length)
  if(localName[0] == '/')
    localName = localName.substring(1)
  FS.virtual[localName] = {
    timestamp: new Date(),
    mode: FS_DIR,
  }
  // async to filesystem
  // does it REALLY matter if it makes it? wont it just redownload?
  openDatabase().then(function (db) {
    writeStore(FS.virtual[localName], localName)
  })
  // TODO: ADD FILESYSTEM WATCHERS API
  if(typeof window.updateFilelist != 'undefined') {
    updateFilelist(fileStr)
  }
}

function Sys_GetFileStats( filename, size, mtime, ctime ) {
  let fileStr = addressToString(filename)
  let localName = fileStr
  if(localName.startsWith('/base')
    || localName.startsWith('/home'))
    localName = localName.substring('/base'.length)
  if(localName[0] == '/')
    localName = localName.substring(1)
  if(typeof FS.virtual[localName] != 'undefined') {
    HEAP32[size >> 2] = (FS.virtual[localName].contents || []).length
    HEAP32[mtime >> 2] = FS.virtual[localName].timestamp.getTime()
    HEAP32[ctime >> 2] = FS.virtual[localName].timestamp.getTime()
    return 1
  } else {
    HEAP32[size >> 2] = 0
    HEAP32[mtime >> 2] = 0
    HEAP32[ctime >> 2] = 0
    return 0
  }
}

function Sys_FOpen(filename, mode) {
  // now we don't have to do the indexing crap here because it's built into the engine already
  let fileStr = addressToString(filename)
  let modeStr = addressToString(mode)
  let localName = fileStr
  if(localName.startsWith('/base')
    || localName.startsWith('/home'))
    localName = localName.substring('/base'.length)
  if(localName[0] == '/')
    localName = localName.substring(1)

  let createFP = function () {
    FS.filePointer++
    FS.pointers[FS.filePointer] = [
      0, // seek/tell
      modeStr,
      FS.virtual[localName],
      localName
    ]
    // TODO: ADD FILESYSTEM WATCHERS API
    if(typeof window.updateFilelist != 'undefined') {
      updateFilelist(FS.pointers[FS.filePointer][3])
    }
    return FS.filePointer // not zero
  }

  // check if parent directory has been created, TODO: POSIX errno?
  let parentDirectory = localName.substring(0, localName.lastIndexOf('/'))
  // TODO: check mode?
  if(typeof FS.virtual[localName] != 'undefined'
    && (FS.virtual[localName].mode >> 12) == ST_FILE) {
    // open the file successfully
    return createFP()
  } else 
  // only write+ files after they have all been loaded, so we don't accidentally overwrite
  if (/* !Q3e.fs_loading && */ modeStr.includes('w')
    && (typeof FS.virtual[parentDirectory] != 'undefined'
    // allow writing to root path
    || parentDirectory.length == 0)
  ) {
    // create the file for write because the parent directory exists
    FS.virtual[localName] = {
      timestamp: new Date(),
      mode: FS_FILE,
      contents: new Uint8Array(0)
    }
    return createFP()
  } else {
    return 0 // POSIX
  }
}

function Sys_FTell(pointer) {
  if(typeof FS.pointers[pointer] == 'undefined') {
    throw new Error('File IO Error') // TODO: POSIX
  }
  return FS.pointers[pointer][0]
}

function Sys_FSeek(pointer, position, mode) {
  if(typeof FS.pointers[pointer] == 'undefined') {
    throw new Error('File IO Error') // TODO: POSIX
  }
  if(mode == 0 /* SEEK_SET */) {
    FS.pointers[pointer][0] = position
  } else if (mode == 1 /* SEEK_CUR */) {
    FS.pointers[pointer][0] += position
  } else if (mode == 2 /* SEEK_END */) {
    FS.pointers[pointer][0] = FS.pointers[pointer][2].contents.length + position
  } else {
    return -1 // POSIX?
  }
  return 0
}

function Sys_FClose(pointer) {
  if(typeof FS.pointers[pointer] == 'undefined') {
    throw new Error('File IO Error') // TODO: POSIX
  }
  writeStore(FS.pointers[pointer][2], FS.pointers[pointer][3])
  // TODO: ADD FILESYSTEM WATCHERS API
  if(typeof window.updateFilelist != 'undefined') {
    updateFilelist(FS.pointers[pointer][3])
  }
  FS.pointers[pointer] = void 0
}

function Sys_FWrite(buf, count, size, pointer) {
  if(typeof FS.pointers[pointer] == 'undefined') {
    throw new Error('File IO Error') // TODO: POSIX
  }
  let tmp = FS.pointers[pointer][2].contents
  if(FS.pointers[pointer][0] + count * size > FS.pointers[pointer][2].contents.length) {
    tmp = new Uint8Array(FS.pointers[pointer][2].contents.length + count * size);
    tmp.set(new Uint8Array(FS.pointers[pointer][2].contents), 0);
  }
  tmp.set(new Uint8Array(HEAP8.slice(buf, buf + count * size)), FS.pointers[pointer][0]);
  FS.pointers[pointer][0] += count * size
  FS.pointers[pointer][2].contents = tmp
  return count * size
}

function Sys_FFlush(pointer) {
  if(typeof FS.pointers[pointer] == 'undefined') {
    throw new Error('File IO Error') // TODO: POSIX
  }
  writeStore(FS.pointers[pointer][2], FS.pointers[pointer][3])
}

function Sys_FRead(bufferAddress, byteSize, count, pointer) {
  if(typeof FS.pointers[pointer] == 'undefined') {
    throw new Error('File IO Error') // TODO: POSIX
  }
  let i = 0
  for(; i < count * byteSize; i++ ) {
    if(FS.pointers[pointer][0] >= FS.pointers[pointer][2].contents.length) {
      break
    }
    HEAP8[bufferAddress + i] = FS.pointers[pointer][2].contents[FS.pointers[pointer][0]]
    FS.pointers[pointer][0]++
  }
  return (i - (i % byteSize)) / byteSize
}

function Sys_Remove(file) {
  let fileStr = addressToString(file)
  let localName = fileStr
  if(localName.startsWith('/base')
    || localName.startsWith('/home'))
    localName = localName.substring('/base'.length)
  if(localName[0] == '/')
    localName = localName.substring(1)
  if(typeof FS.virtual[localName] != 'undefined') {
    delete FS.virtual[localName]
    // remove from IDB
    writeStore(false, localName)
  }
}

function Sys_Rename(src, dest) {
  let strStr = addressToString(src)
  let srcName = strStr
  if(srcName.startsWith('/base')
    || srcName.startsWith('/home'))
    srcName = srcName.substring('/base'.length)
  if(srcName[0] == '/')
    srcName = srcName.substring(1)
  let fileStr = addressToString(dest)
  let destName = fileStr
  if(destName.startsWith('/base')
    || destName.startsWith('/home'))
    destName = destName.substring('/base'.length)
  if(destName[0] == '/')
    destName = destName.substring(1)
  // TODO: ADD FILESYSTEM WATCHERS API
  if(typeof window.updateFilelist != 'undefined') {
    updateFilelist(srcName)
    updateFilelist(destName)
  }
}


function Sys_ListFiles (directory, extension, filter, numfiles, wantsubs) {
  let files = {
    'default.cfg': {
      mtime: 0,
      size: 1024,
    }
  }
  // TODO: don't combine /home and /base?
  let localName = addressToString(directory)
  if(localName.startsWith('/base'))
    localName = localName.substring('/base'.length)
  if(localName[0] == '/')
    localName = localName.substring(1)
  let extensionStr = addressToString(extension)
  //let matches = []
  // can't use utility because FS_* frees and moves stuff around
  let matches = Object.keys(FS.virtual).filter(function (key) { 
    return (!extensionStr || key.endsWith(extensionStr) 
      || (extensionStr == '/' && (FS.virtual[key].mode >> 12) == ST_DIR))
      // TODO: match directory 
      && (!localName || key.startsWith(localName))
      && (!wantsubs || (FS.virtual[key].mode >> 12) == ST_DIR)
  })
  // return a copy!
  let listInMemory = Z_Malloc( ( matches.length + 1 ) * 4 )
  for(let i = 0; i < matches.length; i++) {
    let relativeName = matches[i]
    if(localName && relativeName.startsWith(localName)) {
      relativeName = relativeName.substring(localName.length)
    }
    if(relativeName[0] == '/')
      relativeName = relativeName.substring(1)
    //matches.push(files[i])
    HEAPU32[(listInMemory + i*4)>>2] = FS_CopyString(stringToAddress(relativeName));
  }
  HEAP32[(listInMemory>>2)+matches.length] = 0
  HEAP32[numfiles >> 2] = matches.length
  // skip address-list because for-loop counts \0 with numfiles
  return listInMemory
}

var FS = {
  pointers: {},
  filePointer: 0,
  virtual: {}, // temporarily store items as they go in and out of memory
  Sys_ListFiles: Sys_ListFiles,
  Sys_FTell: Sys_FTell,
  Sys_FSeek: Sys_FSeek,
  Sys_FClose: Sys_FClose,
  Sys_FWrite: Sys_FWrite,
  Sys_FFlush: Sys_FFlush,
  Sys_FRead: Sys_FRead,
  Sys_FOpen: Sys_FOpen,
  Sys_Remove: Sys_Remove,
  Sys_Rename: Sys_Rename,
  Sys_GetFileStats: Sys_GetFileStats,
  Sys_Mkdir: Sys_Mkdir,
}
