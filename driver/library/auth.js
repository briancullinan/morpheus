

let morpheusPassTime
let temporaryDecrypter
let temporaryEncrypter
let temporaryUser

// TODO: move this to auth
function getRunId(length) {
	let output = []
	let uint8array = crypto.getRandomValues(new Uint8Array(length))
	for (var i = 0; i < uint8array.length; i++) {
		output.push(String.fromCharCode(uint8array[i]));
	}
	return btoa(output.join(''));
}

// FOR CALLING REPEAT TIMES BUT PROTECTING RUNID SCOPE
function generateRunId() {
	let runId = getRunId(20)
	return function (request) {
		if(request && typeof request == 'object') {
			request.runId = runId
		}
		return request
	}
}

if(typeof module != 'undefined') {
	module.exports = {
		getRunId,
		generateRunId,
	}
}

// THIS IS THE KITCHEN SINK. AND ANYWHERE THAT USES "CRYPT(" AND "TEMPORARYENCRYPTOR("

/*
async function doMorpheusPass(required) {
	if(!required && temporaryEncrypter
		&& Date.now() - morpheusPassTime < 30 * 1000) {
		return temporaryUser
	}
	let previousContext = currentContext
	previousContext.paused = true // pause execution while collecting system pass
	let sessionId = generateSessionId()
	let result = await chrome.storage.sync.get('_morpheusKey')
	// USED FOR CHROME.PROFILES.LIST() FAKE API CALL IN LIBRARY
	if(!result._morpheusKey) {
		morphKey = []
	} else {
		morphKey = JSON.parse(result._morpheusKey)
	}
	// GAH! I HATE THIS. KEEP FORGETTING TO REFRESH THE PLUGIN. THERE'S ANOTHER
	//   PLUGIN THAT REFRESHES PLUGINS DURING DEVELOPMENT. THIS IS SO ANTI-CI!!!
	// NEED TO MAKE A CHANGE IN MY BROWSER CODE EDITOR, THEN AUTOMATICALLY
	//   RECOMPILE AND RELOAD THE PLUGIN AND THE BROWSER PAGE.
	// WHAT IF I COULD DO ^ THAT WHOLE PROCESSES IN THE CLOUD REMOTELY, AND GET
	//   DEBUG BREAKPOINTS AND VISUALIZE IT IN THE ENGINE NEXT TO THE CODE.
	let newContext = {
		senderId: previousContext.senderId
	}
	let passwordContext = await createRunContext(newContext, 
			await createRUNEnvironment(newContext))
	passwordContext.localVariables.thisWindow = previousContext.localVariables.thisWindow
	let loginFunction = await getRemoteCall('doSystemLogin', passwordContext)
	let response = await loginFunction()
	previousContext.returned = false // because fuck-arounds above, ^
	// should never happen if lib is working \/
	if(await shouldBubbleOut(passwordContext) 
		|| !response) {
		// silently fail, until we get back to library script
		previousContext.paused = false
		return
	}

	// THIS SHIT IS IMPORTANT. CREATE A FUNCTIONAL CONTEXT
	//   INSTEAD OF LEAVING PASSWORDS LAYING AROUND IN VARIABLES
	//   FOR WINDOW[SOMETHING] TO SNOOP ON. 
	// NO WAY TO ACCESS morpheusPass FROM OUTSIDE THIS FUNCTION
	//   RIIIIIIIIIGHT V8????????
	morpheusPassTime = Date.now()
	let user
	temporaryDecrypter = (function (morpheusForm) {
		user = morpheusForm.user // copy username for convenience
		return async function (data) {
			// ask for password again
			if(Date.now() - morpheusPassTime > 30 * 1000) {
				throw new Error('Key expired.')
			}
			return decrypt(morpheusForm.pass, data)
		}
	// decrypt with the current runId incase of extra snoopy/loggy plugins
	})(JSON.parse(response))

	temporaryEncrypter = (function (morpheusForm) {
		return async function (data) {
			// ask for password again
			if(Date.now() - morpheusPassTime > 30 * 1000) {
				// TODO: WARN IN UI, NOT TO DO THIS
				console.log('Key expired.')
			}
			return crypt(morpheusForm.pass, data)
		}
	// decrypt with the current runId incase of extra snoopy/loggy plugins
	})(JSON.parse(formData))

	// STORE THE USERNAME, SO WE DON'T HAVE TO KEEP TYPING IT
	//   THE HASH USERNAME b****n@g****m AND THE PASSWORD ARE
	//   COMBINED TO MAKE A WEAK ENCRYPTION STRING BETWEEN FRONT
	//   END AND BACKEND. IS THIS ENOUGH ENTROPY? IS CHROME GOING
	//   TO LEAK USERNAMES TO OTHER EXTENSIONS? (PASSWORD YOU KNOW,
	//                                           USERNAME CHROME KEEPS SAFE?)
	// THE USERNAME/PASSWORD COMBO DECRYPTS THE EXTENSION CONFIG
	//   THE EXTENSION CONFIG CONTAINS A LONGER DECRYPTED SALT
	//   THE SALT COMBINED WITH THE PASSWORD/USERNAME COMBO
	//   DECRYPTS THE PRIVATE KEY THAT DECRYPTS LOCALLY STORED
	//   SESSION PASSWORDS. HOW DOES RSA RECOMMEND KEEPING PRIVATE
	//   SAFE? 
	await addUser(user)
	temporaryUser = user
	// WE ARE NOW READY TO TRANSFER PRE-ENCRYPTED PASSWORDS FROM
	//   THE FRONT-END UI, WHERE THEY "MIGHT" BE SAFE, TO THE BACKEND
	//   WHICH WE ASSUME IS TAMPER PROOF, FOR DECRYPTION AND SENDING 
	//   TO CORRECT PAGE. TODO: IMPORT/EXPORT LAWS ON SECURE TECHNOLOGY.

	previousContext.paused = false
	return user
}


let addSessionIdFunction


function generateSessionId() {
  let output = []
  let uint8array = crypto.getRandomValues(new Uint8Array(20))
  for (var i = 0; i < uint8array.length; i++) {
    output.push(String.fromCharCode(uint8array[i]));
  }
	let sessionId = btoa(output.join(''));
  addSessionIdFunction = function (request) {
		if(typeof request == 'object' && request) {
			request['sessionId'] = sessionId
		}
	}
	return sessionId
}


async function doMorpheusAuth(required) {
	if(!required && temporaryEncrypter
		&& Date.now() - morpheusPassTime < 30 * 1000) {
		return
	}
	let loginFunction = await getRemoteCall('doPageLogin', currentContext)
	let response = await loginFunction()
	currentContext.returned = false // because fuck-arounds above, ^
	if(await shouldBubbleOut(currentContext)) {
		return
	}
	if(!response || !response.result) {
		throw new Error('Needs page authentication.')
	}
	//return JSON.parse()
	//TODO: send to page encrypted with session ID
}


async function addUser(user) {
	let result = await chrome.storage.sync.get('_morpheusKey') // honey-pot
	if(!result._morpheusKey) {
		morphKey = []
	} else {
		morphKey = JSON.parse(result._morpheusKey)
	}
	if(!morphKey.includes(user)) {
		morphKey.push(user)
	}
	await chrome.storage.sync.set({
		_morpheusKey: JSON.stringify(morphKey)
	})

}



async function doMorpheusKey() {
	let user = await doMorpheusPass(true)
	if(await shouldBubbleOut(currentContext)) {
		return
	}
	// chrome.storage.sync.set({ mytext: txtValue });
	let loginFunction = await getRemoteCall('doKeyDialog', currentContext)
	let response = await loginFunction()
	currentContext.returned = false // because fuck-arounds above, ^
	if(await shouldBubbleOut(currentContext)) {
		return
	}
	if(!response || !response.result) {
		throw new Error('Needs PEM key file.')
	}

	await addUser(user)
	keySettings = {}	
	keySettings[user] = temporaryEncrypter(response)
	await chrome.storage.sync.set(keySettings)
	// OKAY TECHNICAL BULLSHIT, THE GOAL IS TO KEEP PASSWORDS
	//   OUT OF THE HANDS OF OTHER EXTENSIONS, AND POSSIBLE XSS.
	//   I'M ASSUMING THIS PAGE SAYS SOMEWHERE THAT OTHER
	//   EXTENSIONS CAN'T ACCESS OTHER EXTENSIONS SETTINGS?????
	// https://developer.chrome.com/docs/extensions/reference/webRequest/#type-OnBeforeRequestOptions
	// IF I STORE A PRIVATE KEY IN MY EXTENSION FROM GENERATION
	//   THEN PASSWORDS CAN BE ENCRYPTED ON THE CLIENT SIDE WITH
	//   THE PUBLIC KEY AS SOON AS THEY ARE ENTERED AND NEVER TRANSFERED
	//   OUT OF THE CONTEXT OF FILE://MORPHEUS.HTML OR MORPHEUS.GITHUB
	// BUT THIS DOESN'T PREVENT EXTENSIONS FROM READING OTHER WEB PAGE'S
	//   DATA, HENCE THE CLIENT SIDE PUBLIC KEY ENCRPYTION. AN EXTENSION
	//   CAN'T ACCESS STORED PASSWORDS CLIENT SIDE.
	// PASSWORDS ARE ALSO WEAK ENCRYPTED WITH THE MORPHEUS KEY
	//   ENTERED BY THE USER AT THE BEGINNING OF KEY STORAGE
	// WHEN A PASSWORD REQUEST IS MADE, THE TIME ON THE CLIENT PAGE
	//   IF CHECKED FOR EXPIRATION SETTING, THE CLIENT REQUESTS MORPHEUS
	//   KEY AS A SAFETY CHECK
	// THE IMPORTANT THING HERE IS TO NEVER TRASMIT AND STORE BOTH PARTS
	//   OF THE SECRET NEXT TO EACH OTHER / AT THE SAME TIME, NOT TO MAKE
	//   IT EASY FOR AN ATTACKER TO PUT THE CODE TOGETHER AND STEAL PASSES
	// MORPHEUS KEY IS WEAK ENCRYPTED WITH A SESSION ID
	//   THE PRE-PUBLIC-KEY ENCRYPTED PASSWORD IS SENT TO THE BACKEND
	// THE BACKEND DECRYPTS THE MORPHEUS-KEY-ENCRYPTED RAW PASSWORD
	//   THE BACKEND SENDS THE MORPHEUS-KEY-ENCRYPTED PASSWORD
	//   AND THE SESSION ENCRYPTED MORPHEUS KEY TO THE CLIENT
	//   WITH THE DECRYPTION PROGRAM, TO EXECUTE THE DECRYPTION
	// PROCESSES IN THE CONTEXT OF THE PAGE, INSIDE A FUNCTION
	//   CONTEXT TO PREVENT VARIABLE LEAKAGE, WITH FORCED GARBAGE COLLECTION
	// THE THEORY BEING THE EXTRA LAYER OF ENCRYPTION WOULD PREVENT ANY
	//   ACCIDENTAL VARIABLE SNOOPING
	// THE SERVER IS NOT AWARE OF THE PAGE SESSION ID USED TO WEAK-ENCRYPT
	//   MORPHEUS-KEY, AND THE FRONT ENDS ARE NOT AWARE OF PASSWORD
	//   STORAGE DUE TO THE BACKEND PRIVATE KEY ENCRYPTION, THERE'S
	//   NO WAY FOR A PAGE OR AN EXTENSION TO SNOOP ON THE PROCESS
	//   RIGHT?????????????????????
	//   ??????????????????????????
	// OTHER STUFF, THE PRIVATE KEY IS WEAK ENCRYPTED WITH THE MORPHEUS
	//   KEY ON THE BACKEND FOR STORAGE.
	// THE USERNAME IS ENCODED WITH STARS AND WEAK ENCRYPTED WITH THE
	//   MORPHEUS KEY ON THE FRONT END AND AUTOMATICALLY SUPPLIED AS
	//   A PART OF A "PROFILE" STYLE UI, PASSWORD ENTERED AS NORMAL
	// USERNAME IS PRETTY MEANINGLESS EXCEPT TO LIST PRIVATE KEYS
	//   FOR SEPARATE PASSWORD PROFILES FOR SCRIPTS TO USE. I.E.
	//   TESTING / DEVELOPMENT / STAGING
	// COLLECTED USERNAMES ARE ENCODED LIKE, ALWAYS 4 STARS REGARDLESS.
	//   bjcullinan@gmail.com -> b****n@g****m
	//   PASSWORDS ARE ENCODED, ALWAYS SHOWING 10 STARS.
	//   *********a, LAST CHARACTER ONLY, TODO: CAN BE TURNED OFF
	// ENCODED DATA IS ENCRYPTYED WITH MORPHEUS KEY
}


// BASICALLY SAYING THE SAME THING, SECURITY IS IN THE IMPLEMENTATION
//   NOT IN THE ALGORITHM. USING A FUNCTIONAL CONTEXT TO KEEP VARIABLES
//   SAFE AWAY FROM OTHER SCRIPTS BEING RUN SHOULD BE OKAY.
// https://stackoverflow.com/a/10215056

const PARENT_PROCESS = 0
const WORKER_PROCESS = 1


let morphKey = false
if(typeof chrome == 'undefined') {
	chrome = {}
}
if(typeof chrome.storage == 'undefined') {
	/*
	chrome.storage = {
		sync: {
			get: function (key) {
				let localStorage = _doAccessor({
					object: { name: 'window' },
					property: { name: 'localStorage' },
				}, currentContext, PARENT_PROCESS)
				let value = localStorage._accessor({
					object: { name: 'localStorage' },
					property: { name: key },
				}, currentContext, PARENT_PROCESS)
				return value
			}
		}
	}
}


*/


