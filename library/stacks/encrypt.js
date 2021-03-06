
// TODO: extrapolate complexity in the client sending the first request
//   without any session or response ids established and the server returning
//   the first session id to use for encryption
function installEncryptedAsyncMiddleware(onMessage, sendMessage) {

	let {
		encryptResults,
	} = encryptedResponseMiddleware(decryptResponseIfSession, sendMessage)

	let {
		awaitOrTimeout,
	} = asyncTriggerMiddleware(onMessage, sendMessage)

	let {
		awaitOrTimeout: encryptedAwait,
		forwardResponseById,
	} = asyncTriggerMiddleware(onMessage, encryptResults)

	let {
		decryptResponse,
	} = encryptedResponseMiddleware(forwardResponseById, encryptResultsIfSession)

	function encryptResultsIfSession (request) {
		if(request.responseId) {
			return encryptedAwait(request)
		}
		return awaitOrTimeout(request)
	}

	function decryptResponseIfSession (response) {
		// TODO: generate a new session for every runId?

		// prevent recursion
		if(response.responseId && response.type == 'encrypted') {
			// CODE REVIEW? using middleware pattern for logic isolation? seperation of concerns? 
			// TODO: now can remove these checks from encrypt/decrypt to make more generalized
			return decryptResponse(response)
		}
		return forwardResponseById(response)
	}

	return {
		encryptResultsIfSession,
		decryptResponseIfSession,
	}
}


// install encrypted middleware in all the communications
//   passed through here, this is simply to prevent and sniffy/
//   logging plugins from saving some data to disk accidentally.
// this is not meant to stop authorities.
function encryptedResponseMiddleware(onMessage, sendMessage) {

	// accessors on all ends will expect their results to be symmetrically
	//   key encrypted by a pregenerated session id. In the case of plugin
	//   front end, the encryption happens between client page and backend.
	let _temporarySessionEncryptor
	// code review, mark private visually with an _
	let _generateSessionEncryptor = function (sess) {
		_temporarySessionEncryptor = function (data) {
			return crypt(sess, data)
		}
	}
	let _generateResponseDecryptor = function (sess) {
		return function (data) {
			data.value = JSON.parse(decrypt(sess, data))
			// prevent recursion
			data.type == typeof result
			return data
		}
	}
	let _responseDecryptors = {}

	// for code reviews, always try to decrease the number of sinks.
	function encryptResults(response) {
		if(response && response.result
			// TODO: this plays on client, do we need multiple?
			//   I'd think not since clients (browsers, only allow like 3 connections at a time)
			// so even if they could all proxy out, only so many controls can proxy back in.
				&& typeof _temporarySessionEncryptor != 'undefined') {
			let encrypted = _temporarySessionEncryptor(JSON.stringify(response.result))
			return sendMessage({
				responseId: response.responseId,
				result: { type: 'encrypted', value: encrypted }
			})
		} else {

		}
		// TODO: master password detection
		return sendMessage(response)
	}


	function decryptResponse(results) {
		// sessionId is sent at a different time from the results.
		// sessionId is sent to client for use as the encryption key,
		//   generated by the server. A plugin could sniff the sessionId
		//   ealier and then decrypt the next form results.
		// SINK, encrypt form data directly to remote page, or directly to backend
		//   in case of system password collection, this gurantees the data gets to 
		//   the right page, hopefully without being logged or stolen. So it is doubly
		//   encrypted on disk by the master password. Once a password is entered, replace
		//   the generation function with doubly encryption.
		// this is a result to client end after sending an initial script request
		_generateSessionEncryptor(results.sessionId)
			_responseDecryptors[results.responseId] 
					= _generateResponseDecryptor(results.sessionId)
		// TODO: master password detection
		// if(request.accessor.includes("_password"))
		if(results && results.type && results.type == 'encrypted'
			&& typeof _responseDecryptors[result.responseId] != 'undefined'
		) {
			/* await */ return onMessage(_responseDecryptors[result.responseId](results.value))
		} else {
			throw new Error('There can be only one.')
		}
	}


	return {
		encryptResults,
		decryptResponse,
	}
}

