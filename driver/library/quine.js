// emit self in a cloud-compatible way.
// SELF EXTRACTOR LIKE BUSYBOX
// quines have a life-expectancy, we should be up-front with 
//   them about that so they don't come back to kill us like Roy.

// convert makefile to jupyter notebook for storage in collab / download.
//   does jupyter support encryption?

// CODE REVIEW: I'VE COMBINED DEPENDENCY INJECTION FROM MY MAKEFILE
//   WITH EXPRESS STYLE MIDDLEWARES FOR FEATURE SPECIFICS.

// THIS IS KIND OF FUNNY, FOR CODE REVEIW, I TOOK THIS CLIENT FUNCTION
//   AND MAKE IT WORK REMOTELY IN ANY WINDOW SO BOTH CLIENT AND SCRIPT
//   CAN CALL IT. MULTISOURCE FUNCTIONS AS CODE-LEAVES? FORCE DEPENDENCY 
//   INJECTION ON MODULES THAT AREN'T NECESSARILY DESIGNED FOR DI?
// TODO: MAKE IT LOOK LIKE DOWNLOAD REQUEST CAME FROM REMOTE, NOT CONTROL
//   THIS IS COOL BECAUSE THEN WHEN I RUN GET createLibrary() I CAN SEND
//   LIBRARY CODE TO ANY CLIENT WINDOW FOR COMMANDEERING.
function emitDownload(fileName, fileData, contentType) {
	//if(typeof fileData == 'string') {
	//	fileData = fileData.split('').map(function (c) { return c.charCodeAt(0) })
	//}
	//let file = FS.virtual['morph-plugin.crx'].contents
	if(typeof ACE != 'undefined') {
		ACE.downloaded = true
	}
	if(!fileName) {
		return
	}
	let blob = new Blob([fileData], {type: contentType})
	let exportUrl = URL.createObjectURL(blob);
	const tempLink = document.createElement('A');
	tempLink.style.display = 'none';
	tempLink.href = exportUrl;
	tempLink.setAttribute('download', fileName);
	document.body.appendChild(tempLink);
	tempLink.click();
	URL.revokeObjectURL(exportUrl);

}

// TODO: NEARLY TO THE POINT OF EMITTING TO THE CLOUD,
//   ALSO EMIT A RELOADER EXTENSION DURING DEVELOPMENT
//   https://github.com/arikw/chrome-extensions-reloader/blob/master/background.js
// INSTALL, RELOAD OUR OWN, UNINSTALL RELOADER
//   IF I DO THIS FROM LIBRARY/ THEN IT'S RECURSIVE.

// TODO: do this thing where the notebooks export to seperate files
//   and then convert seperate files and comments back into notebooks
//   then wind it up as an RPC service.

if(typeof module != 'undefined') {
	module.exports = {
		... {
			emitCLI,
		} = require('./stacks.cli'),
		emitWeb,
		emitService,

	}
}

function emitPlugin() {
	// MAKE PLUGIN
}

function emitWeb() {
	// MAKE PLUGIN
}

function emitService() {
	// MAKE PLUGIN
}

function emitBuild() {
	// MAKE PLUGIN
}


// https://github.com/briancullinan/c2make-babel-transpiler
function emitMakefile() {
	// okay, cmake, certainly I can make an index.html file with
	//   less than 100 LOC? if I'm going to cmake, why not use
	//   gulp? or maybe i'll switch to the beloved automake?
	//   maybe I can link my whole project together from seperate
	//   NPM modules. bored of babel, sick of looking a JavaScript
	//   and having 6 other steps to use the code. I need one
	//   function to consume it all, so I can build all the parts
	//   in their most naturally accepted form (i.e. source-fork)
	//   and not have to append the structure of the program.
	//   TODO: Optimally, how can I manage my appended workflow, 
	//   on top of Q3e directly.
	//   TODO: without adding complexity I should code and learn about
	//   cool 3D on Discord in the same window.

}

// TODO: single entry point for Makefile into the quine system, output
//   programs own output in various configurations to get it to run
//   in a multitude of environments.

/*
# basically, the above line is there until I can write a simple make/prolog parser
#   like this stupid failing dry-run.txt file I keep seeing, or add some other
#   obvious build process to the browser, so game files can be recompiled live.

# LOL, kind of a funny solution, build these into service_worker.js to serve
#   individual files from cache, just so that I can keep packaging my page
#   but can also debug the code, chrome debugger refuses to load large files.
#   they must not have seen guys talk making fun of microsoft's poor console
#   rendering speed.
*/

// TODO: then prove the concept by not "re-inventing" but rather,
//   re-displaying, download Google docs from Github source for all
//   cloud services, put 3 different code types to the right, all
//   RPC, CLI controls to the left in a forms panel, and 3D execution
//   graph in the engine with path nodes leading to browser web pages/
//   console logs for booting services/ programs and services needed for build
//   should only need to swap out documentation source.



// TODO: prove concept for a "browser-stack" style service
// TODO: same concept for https://stackshare.io/ - show entire CI for connect parts
// TODO: operator overloading with classes
//   i.e. Service(express) + Service(aws) + REPL(node)
// https://stackoverflow.com/questions/44761748/compiling-python-to-webassembly
//            + WWW(scss) + WWW(python)  
// https://webdriver.io/
//            + Test(unit) + Test(browser)
// https://pages.github.com/ + some hosted service? functions?
//            + Deploy(github) + Deploy(https)


// SHORTER LIST OF DEPENDENCIES THAN EMSCRIPTEN?
const MIDDLEWARE_DEPENDENCIES = [
	'getRunId',
	'generateRunId',
	'asyncTriggerMiddleware',
	'encryptedResponseMiddleware',
	'installEncryptedAsyncMiddleware',
]


if(typeof module != 'undefined') {
	module.exports = {
		emitDownload,
	}
}

