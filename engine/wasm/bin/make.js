
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

module.exports = formatForVFS