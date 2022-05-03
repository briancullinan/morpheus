
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

function normalEmbedAll(indexFile, directory, pathMatch, pathReplace) {
	const { 
    readdirSync: rds,
    statSync: sts,
  } = require('fs')
  let scripts = rds(directory).map(f => path.join(directory, f)) // TODO: BUILD SUB-DIRS
  // INTERESTING LEAF, KEEP THE SAME CODE BECAUSE IT'S PRETTY SIMPLE, LEFT VARIABLE NAMES THE SAME
  //   SOMETHING FOR CODE REVIEWS, LOTS OF NEW VARIABLE NAMES, OR REOCCURING VARIABLE NAMES?
  // GOD, CAN SOURCETREE NOT REFRESH CONSTANTLY IN THE BACKGROUND? ONCE WHEN I SWITCH TO THE WINDOW
  //   MAYBE ONCE AGAIN IF IT THINKS A BUILD SCRIPT WAS RUNNING? WONDER IF GITKRAKEN DOES THIS,
  //   I ALREADY HAVE PROBLEMS WITH GITKRAKEN SHOWING THE CORRECT CODE. NO ONE CARES.
  for(let i = 0; i < scripts.length; i++) {
    if(sts(scripts[i]).isDirectory()) {
      normalEmbedAll(indexFile, scripts[i], pathMatch, pathReplace)
    } else {
      normalReplace(indexFile, formatForVFS(scripts[i], scripts[i].replace(pathMatch, pathReplace)))
    }
  }
}

function normalBase64(indexFile, embedFile, pathInVFS) {
  normalReplace(indexFile, formatForVFS(embedFile, pathInVFS))
}

function normalBootstrap(indexFile, embedFile) {
  const { readFileSync: rfs } = require('fs')
  let jsFile = rfs(embedFile).toString('utf-8')
  normalReplace(indexFile, jsFile)
}

// I SUPPOSE IN A WAY THIS SINGLE REPLACEMENT IS WHAT I ASKED FOR
//   THIS IS BASICALLY THE SAME THING ANGULAR DOES
function normalReplace(indexFile, embedString) {
  const { 
    readFileSync: rfs, 
    writeFileSync: wfs,
  } = require('fs')
  let index = rfs(indexFile).toString('utf-8')
  let replacements = [/<\/html>/, '<script async type="application/javascript">' 
    + embedString + '</script></html>']
  let matchString = index.match(replacements[0])
  index = index.substring(0, matchString.index)
    + replacements[1] + index.substring(matchString.index
    + matchString[0].length, index.length)
  wfs(indexFile, index)
}


module.exports = {
  formatForVFS,
  normalReplace,
  normalEmbedAll,
  normalBase64,
  normalBootstrap
}