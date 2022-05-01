"use strict";
var window = {}
if(typeof global != 'undefined')
  global.window = window
var serverWorker = self
window.serverWorker = self

// TODO:
// 2 - Make with ES interpreter, dedicated WASM
// 1 - SV_Download
// 8 - Pull lvlworld.json and iterate to fix map loader FS_FileNeeded() API
// 2 - Drag drop to call SV_Tracemaps()
// 2 - D3/three.js iterative graph layout -> convert to brushes/3D text
// 1 - Pull q3map2.wasm from frontend
// 4 - SV_MemoryMaps() and dynamic compile
// 2 - Sys_execv() from sys_cli.js


self.onmessage = function(e) {
  debugger
}
