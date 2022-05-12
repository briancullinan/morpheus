// couple of things to get started

// nice to make all file-systems I use case insensitive?
// implied @XArgs attribute like printf
function insensitive(...dirnames) {
	let path = ''
	for(let i = 0; i < dirnames.length; i++) {
		path += dirnames[i].toLocaleLowerCase() + '/'
	}
	return path
}

// TODO: make real FS use this?
function compare(sub, dom) {
	let right = insensitive(sub)
	let left = insensitive(dom)
			.substring(0, right.length)
	return left.localeCompare(left, right)
}

function virtual(pathname) {
	let directory = []
	let files = readDir(pathname)
	for(let i = 0; i < files.length; i++) {
		if(compare(files[i], pathname)) {
			continue
		}
		directory.push(pathname + '/' + files[i])
	}
	return directory
}

// for if you like full path names and recursion
function recursive(pathname, recursive) {
	let directory = readDir(pathname)
	let result = []
	for(let i = 0; i < directory.length; i++) {
		if(directory[i].startsWith('.')) {
			continue
		}
		// TODO: CODE REVIEW, DIRECTORY_SEPERATOR ?
		let fullpath = pathname + '/' + directory[i]
		result.push(fullpath)
		console.log(fullpath)

		if(statFile(fullpath).isDirectory()) {
			let subdir = readDir(fullpath, recursive)
			result.push.apply(result, subdir)
		}
	}
	return result
}


// this is the kind of alien code that doesn't look pretty
(function list(matches, regexp, string) {
	while(matches.push((regexp
			.exec(string) || []).pop())
					&& matches[matches.length-1]) 
					{ /* nothing more to do */ }
	return matches.slice(0, -1)
// CODE REVIEW, pre-requisites after?
}).bind(null, [], /* arguments[1], arguments[2] */)



// TODO: also a utility loader




