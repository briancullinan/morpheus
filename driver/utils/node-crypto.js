const { generateKeyPair } = require('crypto');
generateKeyPair('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: 'top secret'
  }
}, (err, publicKey, privateKey) => {
  // Handle errors and use the generated key pair.
})

generateKeyPair('rsa', {
  modulusLength: 530,    // options
  publicExponent: 0x10101,
  publicKeyEncoding: {
    type: 'pkcs1',
    format: 'der'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'der',
    cipher: 'aes-192-cbc',
    passphrase: 'GeeksforGeeks is a CS-Portal!'
  }
}, (err, publicKey, privateKey) => { // Callback function
      if(!err)
      {
        // Prints new asymmetric key pair
        console.log("Public Key is : ", publicKey);
        console.log();
        console.log("Private Key is: ", privateKey);
      }
      else
      {
        // Prints error
        console.log("Errr is: ", err);
      }
        
})
