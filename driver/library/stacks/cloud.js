// THESE ARE ACTUALLY PRETTY SMALL (< 200 LOC FOR 
//   ALL OF THEM) BUT RIGHT NOW
//   I PUT THEM ALL IN SEPERATE JUPYTER NOTEBOOKS,
//   WOULD BE BETTER TO PUT THEM ALL IN THE SAME PLACE
//   WITH A TUTORIAL ON HOW IT WORKS


// emit tooling for making web.js work
function expressMessageResponseMiddleware() {

}


// emit tooling for making web.js work
function websocketMessageResponseMiddleware() {

}


// NO NEED TO REINVENT THE WHEEL, NODEJS ALREADY PROVIDES
//   HTTP INTERFACES. WHAT PROGRAM NEEDS DIRECT HTTP ACCESS?
//   AN HTTP MONITORING PROGRAM CAN PROVIDE IT'S OWN MIDDLEWARE.
//   THESE ARE ONLY FOR CONNECTING TO THE SERVICE WE NEED TO SELF-HOST.
//function expressMessageResponseMiddleware() {}

// TODO: copy from jupyter notebook but remove even the 
//   notebook part and just handle the request data
function googleMessageResponseMiddleware() {
	function sendMessage() {

	}

	function onMessage() {

	}

}

// TODO: copy from amazon
function amazonMessageResponseMiddleware() {

}

const MIDDLEWARE_REPL = [
	'replEvalMiddleware',
	'readPreFS',
	'_base64ToArrayBuffer',
]

// TODO: wire up express back to ourselves own REPL service
// REPL? function rpcMessageResponseMiddleware() {}

// TODO: wire up status, execute, meta kernel to same frontend
function jupyterMessageResponseMiddleware() {

}

// TODO: collabMessageResponseMiddleware() {}



