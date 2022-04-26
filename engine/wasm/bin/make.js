
function file2Base64(filename) {
  let fs = require('fs');
  let base64 = fs.readFileSync(filename, 'base64');
  return base64
}

function formatForVFS(resource, path) {
  let output = `
if(typeof window.preFS == 'undefined') {
  window.preFS={};
}
`
  const fs = require('fs');
  if(fs.existsSync(resource)) {
    let ftime = fs.statSync(resource).mtime.getTime()
    output += `
window.preFS['${path}_timestamp']=${ftime};
window.preFS['${path}']='${file2Base64(resource)}';
`
  }
  return output
}

// GODDAMNIT I HATE THIS REGEX JAVASCRIPT FEATURE, I JUST WANT ONE STRING
//   REPLACEMENT THAT ISN'T EXACT FUCKING TEXT.

function normalReplace(indexFile, cssFile, scriptFile, skinFile, wasmFile) {
	const {readFileSync: rfs, writeFileSync: wfs} = require('fs');
  let index = rfs(indexFile).toString('utf-8')
  let replacements = [
    [/<link[^>]*>/, '<style>'+rfs(cssFile)+'</style>'],
    [/<script[^>]*>/, '<script>'+rfs(scriptFile)+'</script>'],
    [/<img[^>]*>/, '<img title="gfx/2d/bigchars.png" src="data:image/png;base64,'
      +rfs(skinFile, 'base64')+ '" />'],
    [/<\/html>/, '<script async type="application/javascript">' 
      + formatForVFS(wasmFile, path.basename(wasmFile)) + '</script></html>'],
    [/quake3e\.wasm/ig, path.basename(wasmFile)],
  ]
  for(let i = 0; i < replacements.length; i++) {
    let matchString = index.match(replacements[i][0])
    if(matchString.index) {
      index = index.substring(0, matchString.index)
        + replacements[i][1] + index.substring(matchString.index
        + matchString[0].length, index.length)
    } else if(matchString.length) {
      index = index.replace(replacements[i][0], replacements[i][1])
    } else {
      throw new Error('Unmatched normal expression: ' + replacements[i][0])
    }
  }
  wfs(indexFile, index)

}

module.exports = {
  formatForVFS,
  normalReplace,

}