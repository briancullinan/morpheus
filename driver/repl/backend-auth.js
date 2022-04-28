

let morpheusPassTime
let temporaryDecrypter
let temporaryEncrypter
let temporaryUser

async function doMorpheusPass(required) {
	if(!required && temporaryEncrypter
		&& Date.now() - morpheusPassTime < 30 * 1000) {
		return temporaryUser
	}

	let result = await chrome.storage.sync.get('_morpheusKey')
	// USED FOR CHROME.PROFILES.LIST() FAKE API CALL IN LIBRARY
	if(!result._morpheusKey) {
		morphKey = []
	} else {
		morphKey = JSON.parse(result._morpheusKey)
	}
	let loginFunction = await getRemoteCall('doSystemLogin', currentContext)
	let response = await loginFunction()
	currentContext.returned = false // because fuck-arounds above, ^
	if(await shouldBubbleOut(currentContext)) {
		return
	}
	if(!response || !response.result) {
		throw new Error('Needs Morpheus password.')
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
	})(JSON.parse(decrypt(currentContext.runId, response.result)))

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
	})(JSON.parse(decrypt(currentContext.runId, response.result)))

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

	return user
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
	return JSON.parse(decrypt(currentContext.runId, response.result))
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


let morphKey = false
chrome.storage.sync.get('_morpheusKey', async function(data) {
	try {
		if(data._morpheusKey) {
			morphKey = JSON.parse(data._morpheusKey)
		} else {
			await chrome.storage.sync.set({
				'_morpheusKey': JSON.stringify([])
			})
		}
	} catch (e) {
		try {
			await chrome.storage.sync.set({
				'_morpheusKey': JSON.stringify([])
			})
		} catch (e) {
			debugger
		}
	}
})

