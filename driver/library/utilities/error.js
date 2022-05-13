

// cool this works


const BOOTSTRAP_UNWINDER = 'unwind module scope'
process.once('uncaughtException', 
function nodeErrorHandler(ex) {
  if(ex.message == BOOTSTRAP_UNWINDER) {
    // we're fully inited!
  } else
  if(ex.message.includes('emitCLI')) {
    // WE'RE LOADED!

    // TODO: cache function names and call again
    // TODO: INTERESTING IDEA, REPLACE GLOBALTHIS WITH 
    //   PLACEHOLDER FUNCTIONS FOR EVERYTHING IN THE LIBRARY,
    //   THE FIRST TIME THE FUNCTION IS USED, BOOT UP A CLOUD
    //   SERVICE TO HOST IT, REPLACE THE CALL IN GLOBALTHIS WITH
    //   THE NEW `RENDERED` FUNCTION.
    // this would be cool because then I never have to
    //   think about what file a function is in because
    //   all the other functions will be automatically
    //   injected within each component context.
    // this is also cool because no matter where the code
    //   ends up, I can always see the correct filename and
    //   line number because modules have awareness of that
    //   prior to being compiled individually.

    throw ex
  } else {

  }
})
