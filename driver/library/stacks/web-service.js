// WHO KNEW THERE ARE SO MANY DIFFERENT TYPES OF WEB WORKERS?




function serviceMessageResponseMiddleware() {

	// TODO: THIS WOULD BE COOL TO GENERATE PALETTE.SHADER FILES ON
	//   AHEAD OF TIME, OR GIVE USERS INSTANT OFFLINE ACCESS TO 
	//   "PREVIEW" ROUTES LIKE /?EDIT-ANYWHERE/GOOGLE.COM/INDEX.HTM,
	//   SHOW VERSIONED OUTPUT FROM "LIVE" EDIT MODE, WHERE PUSHHISTORY()
	//   CHANGES THE PAGE AND USER CAN REFRESH TO SEE CORRECT VERSION
	//   GENERATED IN LOCAL CACHE BY MAKEFILE-URL. USE CACHE-URLS AS 
	//   MAKE TARGETS?
	self.addEventListener('install', function(event) {
	})

	self.addEventListener('activate', function(event) {
	})

	self.addEventListener('fetch', function(event) {
		// TODO: fetch curious URLs in order to communicate, 
		//   pregenerate stuff to save in cache?
	})

}

