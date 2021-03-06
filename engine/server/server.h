/*
===========================================================================
Copyright (C) 1999-2005 Id Software, Inc.

This file is part of Quake III Arena source code.

Quake III Arena source code is free software; you can redistribute it
and/or modify it under the terms of the GNU General Public License as
published by the Free Software Foundation; either version 2 of the License,
or (at your option) any later version.

Quake III Arena source code is distributed in the hope that it will be
useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Quake III Arena source code; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
===========================================================================
*/
// server.h

#include "../qcommon/q_shared.h"
#include "../qcommon/qcommon.h"
#include "../qcommon/vm_local.h"
#include "../game/g_public.h"
#include "../game/bg_public.h"

#ifdef USE_PRINT_CONSOLE
#undef Com_Printf
#undef Com_DPrintf
#define Com_Printf SV_Printf
#define Com_DPrintf SV_DPrintf
#endif

#ifdef USE_CURL
#include "../client/cl_curl.h"
//#define	USE_LNBITS	1
#else
#ifdef __WASM__
//#define	USE_LNBITS	1
#else
#ifdef USE_LNBITS
#undef USE_LNBITS
#endif
#endif
#endif


//=============================================================================

#define	PERS_SCORE				0		// !!! MUST NOT CHANGE, SERVER AND
										// GAME BOTH REFERENCE !!!

#define	MAX_ENT_CLUSTERS	16

typedef struct svEntity_s {
	struct worldSector_s *worldSector;
	struct svEntity_s *nextEntityInWorldSector;
	
	entityState_t	baseline;		// for delta compression of initial sighting
	int			numClusters;		// if -1, use headnode instead
	int			clusternums[MAX_ENT_CLUSTERS];
	int			lastCluster;		// if all the clusters don't fit in clusternums
	int			areanum, areanum2;
	int			snapshotCounter;	// used to prevent double adding from portal views
} svEntity_t;

typedef enum {
	SS_DEAD,			// no map loaded
	SS_LOADING,			// spawning level entities
	SS_GAME				// actively running
} serverState_t;

// we might not use all MAX_GENTITIES every frame
// so leave more room for slow-snaps clients etc.
#ifdef USE_MULTIVM_SERVER
#define NUM_SNAPSHOT_FRAMES (PACKET_BACKUP*4*MAX_NUM_VMS)
#else
#define NUM_SNAPSHOT_FRAMES (PACKET_BACKUP*4)
#endif

typedef struct snapshotFrame_s {
	entityState_t *ents[ MAX_GENTITIES ];
	int	frameNum;
	int start;
	int count;
} snapshotFrame_t;

typedef struct {
	serverState_t	state;
	qboolean		restarting;			// if true, send configstring changes during SS_LOADING
	int				serverId;			// changes each server start
	int				restartedServerId;	// serverId before a map_restart
	int				checksumFeed;		// the feed key that we use to compute the pure checksum strings
	// https://zerowing.idsoftware.com/bugzilla/show_bug.cgi?id=475
	// the serverId associated with the current checksumFeed (always <= serverId)
	int				checksumFeedServerId;
	int				snapshotCounter;	// incremented for each snapshot built
	int				timeResidual;		// <= 1000 / sv_frame->value
	int				nextFrameTime;		// when time > nextFrameTime, process world
#ifdef USE_MULTIVM_SERVER
  int       currentWorld;
  char		 *configstrings[MAX_NUM_VMS][MAX_CONFIGSTRINGS];
#define configstrings configstrings[gvmi]
	svEntity_t		svEntities[MAX_NUM_VMS][MAX_GENTITIES];
#define svEntities svEntities[gvmi]
	const char		*entityParsePoint; // TODO: need parse points in case loading 2 at the same time?
	sharedEntity_t	*gentitiesWorlds[MAX_NUM_VMS];
	int				gentitySizes[MAX_NUM_VMS];
//#define gentitySize gentitySizes[gvmi]
	int				num_entitiesWorlds[MAX_NUM_VMS];
	playerState_t	*gameClientWorlds[MAX_NUM_VMS];
#define gameClients gameClientWorlds[gvmi] // these are all just pointers with players join so it's OK to duplicate
	int				gameClientSizes[MAX_NUM_VMS];
#define gameClientSize gameClientSizes[gvmi]
	int				restartTime;
	int				time; // TODO: keep track of times seperately?
	byte			baselineUsed[MAX_NUM_VMS][ MAX_GENTITIES ];
#define baselineUsed baselineUsed[gvmi]
#else
  char			*configstrings[MAX_CONFIGSTRINGS];
  svEntity_t		svEntities[MAX_GENTITIES];

  const char		*entityParsePoint;	// used during game VM init

  // the game virtual machine will update these on init and changes
  sharedEntity_t	*gentities;
  int				gentitySize;
  int				num_entities;		// current number, <= MAX_GENTITIES

  playerState_t	*gameClients;
  int				gameClientSize;		// will be > sizeof(playerState_t) due to game private data

  int				restartTime;
  int				time;

  byte			baselineUsed[ MAX_GENTITIES ];
#endif

#ifdef USE_DEMO_SERVER
	// serverside demo recording
	fileHandle_t		demoFile;
	demoState_t	demoState;
	char			demoName[MAX_QPATH];

	// serverside demo recording - previous frame for delta compression
	sharedEntity_t	demoEntities[MAX_GENTITIES];
	playerState_t	demoPlayerStates[MAX_CLIENTS];
#endif

#ifdef USE_REFEREE_CMDS
  qboolean isMultiGame;
#endif
} server_t;

typedef struct {
	int				areabytes;
	byte			areabits[MAX_MAP_AREA_BYTES];		// portalarea visibility bits
	playerState_t	ps;
	int				num_entities;
#if 0
	int				first_entity;		// into the circular sv_packet_entities[]
										// the entities MUST be in increasing state number
										// order, otherwise the delta compression will fail
#endif
#ifdef USE_MV
	qboolean		multiview;
	int				version;
	int				mergeMask;
	int				first_psf;				// first playerState index
	int				num_psf;				// number of playerStates to send
	byte			psMask[MAX_CLIENTS/8];	// playerState mask
#endif
#ifdef  USE_MULTIVM_SERVER
	int       world;
#endif

	int				messageSent;		// time the message was transmitted
	int				messageAcked;		// time the message was acked
	int				messageSize;		// used to rate drop packets

	int				frameNum;			// from snapshot storage to compare with last valid
#ifdef USE_MV
	entityState_t	*ents[ MAX_GENTITIES ];
#else
	entityState_t	*ents[ MAX_SNAPSHOT_ENTITIES ];
#endif

} clientSnapshot_t;


#ifdef USE_MV

#define MAX_MV_FILES 4096 // for directory caching

typedef byte entMask_t[ MAX_GENTITIES / 8 ];

typedef struct psFrame_s {
	int				clientSlot;
	int				areabytes;
	byte			areabits[ MAX_MAP_AREA_BYTES ]; // portalarea visibility bits
	playerState_t	ps;
	entMask_t		entMask;
} psFrame_t;

#endif // USE_MV


typedef enum {
	CS_FREE = 0,	// can be reused for a new connection
	CS_ZOMBIE,		// client has been disconnected, but don't reuse
					// connection for a couple seconds
	CS_CONNECTED,	// has been assigned to a client_t, but no gamestate yet
	CS_PRIMED,		// gamestate has been sent, but client hasn't sent a usercmd
	CS_ACTIVE		// client is fully in game
} clientState_t;

typedef struct netchan_buffer_s {
	msg_t           msg;
	byte            msgBuffer[MAX_MSGLEN];
	char		clientCommandString[MAX_STRING_CHARS];	// valid command string for SV_Netchan_Encode
	struct netchan_buffer_s *next;
} netchan_buffer_t;

typedef struct rateLimit_s {
	int			lastTime;
	int			burst;
} rateLimit_t;

typedef struct leakyBucket_s leakyBucket_t;
struct leakyBucket_s {
	netadrtype_t	type;

	union {
		byte	_4[4];
		byte	_6[16];
	} ipv;

	rateLimit_t rate;

	int			hash;
	int			toxic;

	leakyBucket_t *prev, *next;
};


typedef struct client_s {
	clientState_t	state;
	char			userinfo[MAX_INFO_STRING];		// name, etc

	char			reliableCommands[MAX_RELIABLE_COMMANDS][MAX_STRING_CHARS];
	int				reliableSequence;		// last added reliable message, not necessarily sent or acknowledged yet
	int				reliableAcknowledge;	// last acknowledged reliable message
	int				messageAcknowledge;

	int				gamestateMessageNum;	// netchan->outgoingSequence of gamestate
	int				challenge;

#ifdef USE_MULTIVM_SERVER
	usercmd_t		lastUsercmds[MAX_NUM_VMS];
#define lastUsercmd lastUsercmds[gvmi]
#else
  usercmd_t		lastUsercmd;
#endif
	int				lastMessageNum;		// for delta compression
	int				lastClientCommand;	// reliable client message sequence
	char			lastClientCommandString[MAX_STRING_CHARS];
	sharedEntity_t	*gentity;			// SV_GentityNum(clientnum)
	char			name[MAX_NAME_LENGTH];			// extracted from userinfo, high bits masked

#ifdef USE_DEMO_SERVER
	// serverside demo information
	qboolean  demoClient; // is this a demoClient?
 	char		  demoName[MAX_QPATH];
#endif
#ifdef USE_DEMO_CLIENTS
 	qboolean	demorecording;
 	qboolean	demowaiting;	// don't record until a non-delta message is received
 	fileHandle_t	demofile;
 	qboolean	savedemo; // qtrue iff the demo should be saved in any case (qfalse and sv_autorecord 1 --> the score decides)
#endif

	// downloading
	char			downloadName[MAX_QPATH]; // if not empty string, we are downloading
	fileHandle_t	download;			// file being downloaded
 	int				downloadSize;		// total bytes (can't use EOF because of paks)
 	int				downloadCount;		// bytes sent
	int				downloadClientBlock;	// last block we sent to the client, awaiting ack
	int				downloadCurrentBlock;	// current block number
	int				downloadXmitBlock;	// last block we xmited
	unsigned char	*downloadBlocks[MAX_DOWNLOAD_WINDOW];	// the buffers for the download blocks
	int				downloadBlockSize[MAX_DOWNLOAD_WINDOW];
	qboolean		downloadEOF;		// We have sent the EOF block
	int				downloadSendTime;	// time we last got an ack from the client

#ifdef USE_MULTIVM_SERVER
	int				deltaMessages[MAX_NUM_VMS];		// frame last client usercmd message
#define deltaMessage deltaMessages[gvmi]
#else
	int				deltaMessage;		// frame last client usercmd message
#endif
	int				lastPacketTime;		// svs.time when packet was last received
	int				lastConnectTime;	// svs.time when connection started
	int				lastDisconnectTime;
	int				lastSnapshotTime;	// svs.time of last sent snapshot
	qboolean		rateDelayed;		// true if nextSnapshotTime was set based on rate instead of snapshotMsec
	int				timeoutCount;		// must timeout a few frames in a row so debugging doesn't break
#ifdef USE_MULTIVM_SERVER
  clientSnapshot_t	frames[MAX_NUM_VMS][PACKET_BACKUP];	// updates can be delta'd from here
#else
	clientSnapshot_t	frames[PACKET_BACKUP];	// updates can be delta'd from here
#endif
	int				ping;
	int				rate;				// bytes / second, 0 - unlimited
	int				snapshotMsec;		// requests a snapshot every snapshotMsec unless rate choked
	qboolean		pureAuthentic;
	qboolean		gotCP;				// TTimo - additional flag to distinguish between a bad pure checksum, and no cp command at all
	netchan_t		netchan;
	// TTimo
	// queuing outgoing fragmented messages to send them properly, without udp packet bursts
	// in case large fragmented messages are stacking up
	// buffer them into this queue, and hand them out to netchan as needed
	netchan_buffer_t *netchan_start_queue;
	netchan_buffer_t **netchan_end_queue;

	int				oldServerTime;
	qboolean		csUpdated[MAX_CONFIGSTRINGS];
	qboolean		compat;

	// flood protection
	rateLimit_t		cmd_rate;
	rateLimit_t		info_rate;
	rateLimit_t		gamestate_rate;

	// client can decode long strings
	qboolean		longstr;

	qboolean		justConnected;

	char			tld[3]; // "XX\0"
	const char		*country;

#ifdef USE_MV
	struct {
		int				protocol;

		int				scoreQueryTime;
		int				lastRecvTime; // any received command
		int				lastSentTime; // any sent command
#ifdef USE_MV_ZCMD
		//  command compression
		struct			{
			int			deltaSeq;
			lzctx_t		ctx;
			lzstream_t	stream[ MAX_RELIABLE_COMMANDS ];
		} z;
#endif
		qboolean		recorder;
		
	} multiview;
#endif // USE_MV
#ifdef USE_MV
	int gameWorld;
	int newWorld;
	int mvAck;
#endif
#ifdef USE_SERVER_ROLES
	int role;
#endif
#ifdef USE_REFEREE_CMDS
	qboolean muted;
	qboolean nofire;
  int frozen;
#endif
#ifdef USE_PERSIST_CLIENT
	int persisted;
#endif
#ifdef USE_RECENT_EVENTS
  qboolean isRecent;
  int recentMessageNum;
#endif
} client_t;

//=============================================================================


// this structure will be cleared only when the game dll changes
typedef struct {
	qboolean	initialized;				// sv_init has completed

	int			time;						// will be strictly increasing across level changes
	int			msgTime;					// will be used as precise sent time

	int			snapFlagServerBit;			// ^= SNAPFLAG_SERVERCOUNT every SV_SpawnServer()

	client_t	*clients;					// [sv_maxclients->integer];
	int			numSnapshotEntities;		// PACKET_BACKUP*MAX_SNAPSHOT_ENTITIES
	entityState_t	*snapshotEntities;		// [numSnapshotEntities]
	int			nextHeartbeatTime;

	netadr_t	authorizeAddress;			// for rcon return messages
	int			masterResolveTime[MAX_MASTER_SERVERS]; // next svs.time that server should do dns lookup for master server

	// common snapshot storage
	int			freeStorageEntities;
	int			currentStoragePosition;	// next snapshotEntities to use
	int			snapshotFrame;			// incremented with each common snapshot built
	int			currentSnapshotFrame;	// for initializing empty frames
	int			lastValidFrame;			// updated with each snapshot built
	snapshotFrame_t	snapFrames[ NUM_SNAPSHOT_FRAMES ];
#ifdef USE_MULTIVM_SERVER
  snapshotFrame_t	*currFrameWorlds[MAX_NUM_VMS]; // current frame that clients can refer
#define currFrame  currFrameWorlds[gvmi]
#else
	snapshotFrame_t	*currFrame; // current frame that clients can refer
#endif

#ifdef USE_MV	
	int			numSnapshotPSF;				// sv_democlients->integer*PACKET_BACKUP*MAX_CLIENTS
	int			nextSnapshotPSF;			// next snapshotPS to use
	int			modSnapshotPSF;				// clamp value
	psFrame_t	*snapshotPSF;				// [numSnapshotPS]
	qboolean	emptyFrame;					// true if no game logic run during SV_Frame()
#endif // USE_MV

} serverStatic_t;

#ifdef USE_BANS
#define SERVER_MAXBANS	1024
// Structure for managing bans
typedef struct
{
	netadr_t ip;
	// For a CIDR-Notation type suffix
	int subnet;
	
	qboolean isexception;
} serverBan_t;
#endif

//=============================================================================

extern	serverStatic_t	svs;				// persistant server info across maps
extern	server_t		sv;					// cleared each map
extern  int    gameWorlds[MAX_NUM_VMS];

#ifdef USE_RECENT_EVENTS
extern int  recentI;
extern char recentEvents[1024][MAX_INFO_STRING+400];
#define MAX_RECENT_EVENTS 1024
extern	cvar_t	*sv_recentPassword;
typedef enum {
	SV_EVENT_MAPCHANGE,
	SV_EVENT_CLIENTSAY,
	SV_EVENT_MATCHEND,
	SV_EVENT_CALLADMIN,
	SV_EVENT_CLIENTDIED,
	SV_EVENT_CLIENTWEAPON,
	SV_EVENT_CLIENTRESPAWN,
	SV_EVENT_CLIENTAWARD, // event for all awards
	SV_EVENT_GETSTATUS, // from clients checking for events
	SV_EVENT_SERVERINFO,
	SV_EVENT_CONNECTED,
	SV_EVENT_DISCONNECT,
} recentEvent_t;
#define RECENT_TEMPLATE_STR "{\"timestamp\":%i,\"type\":%i,\"value\":\"%s\"}"
#define RECENT_TEMPLATE "{\"timestamp\":%i,\"type\":%i,\"value\":%s}"
void SV_RecentEvent(const char *json);
void SV_RecentStatus(recentEvent_t type);
const char *SV_EscapeStr(const char *str, int len);
#endif

extern  cvar_t  *sv_gamedir;
extern	cvar_t	*sv_fps;
extern	cvar_t	*sv_timeout;
extern	cvar_t	*sv_zombietime;
extern	cvar_t	*sv_rconPassword;
extern	cvar_t	*sv_privatePassword;
extern	cvar_t	*sv_allowDownload;
extern	cvar_t	*sv_maxclients;
extern	cvar_t	*sv_maxclientsPerIP;
extern	cvar_t	*sv_clientTLD;

#ifdef USE_MV
extern	fileHandle_t	sv_demoFile;
extern	char	sv_demoFileName[ MAX_OSPATH ];
extern	char	sv_demoFileNameLast[ MAX_OSPATH ];

extern	int		sv_demoClientID;
extern	int		sv_lastAck;
extern	int		sv_lastClientSeq;

extern	cvar_t	*sv_mvClients;
extern	cvar_t	*sv_mvPassword;
extern	cvar_t	*sv_demoFlags;
extern	cvar_t	*sv_mvAutoRecord;

extern	cvar_t	*sv_mvFileCount;
extern	cvar_t	*sv_mvFolderSize;

#endif // USE_MV
#ifdef USE_MULTIVM_SERVER
#define SV_PlayerPresent(x) ( SV_GentityNum(x)->s.eType >= ET_PLAYER && sv.configstrings[CS_PLAYERS + (int)(x)][0] != '\0' )
extern  cvar_t  *sv_mvWorld;
extern  cvar_t  *sv_mvSyncPS;
extern  cvar_t  *sv_mvSyncXYZ;
extern  cvar_t  *sv_mvSyncMove;
extern  cvar_t  *sv_mvOmnipresent;
#endif

extern	cvar_t	*sv_privateClients;
extern	cvar_t	*sv_hostname;
extern	cvar_t	*sv_master[MAX_MASTER_SERVERS];
#ifdef USE_SERVER_ROLES
extern	cvar_t	*sv_roles;
extern	cvar_t	*sv_clientRoles[MAX_CLIENT_ROLES];
extern	cvar_t	*sv_role[MAX_CLIENT_ROLES];
extern	cvar_t	*sv_rolePassword[MAX_CLIENT_ROLES];
#endif
extern  cvar_t  *sv_activeAction;
#ifdef USE_REFEREE_CMDS
extern  cvar_t	*sv_lock[2];
extern  cvar_t  *sv_frozen;
#endif
extern	cvar_t	*sv_reconnectlimit;
extern	cvar_t	*sv_padPackets;
extern	cvar_t	*sv_killserver;
extern	cvar_t	*sv_mapname;
extern	cvar_t	*sv_mapChecksum;
extern	cvar_t	*sv_referencedPakNames;
extern	cvar_t	*sv_serverid;
extern	cvar_t	*sv_minRate;
extern	cvar_t	*sv_maxRate;
extern	cvar_t	*sv_dlRate;
extern	cvar_t	*sv_gametype;
extern	cvar_t	*sv_pure;
extern	cvar_t	*sv_floodProtect;
extern	cvar_t	*sv_lanForceRate;

extern	cvar_t *sv_levelTimeReset;
extern	cvar_t *sv_filter;

#ifdef USE_BANS
extern	cvar_t	*sv_banFile;
extern	serverBan_t serverBans[SERVER_MAXBANS];
extern	int serverBansCount;
#endif

extern	cvar_t	*sv_demoState;
extern	cvar_t	*sv_autoDemo;
extern  cvar_t  *sv_autoRecord;
extern  cvar_t  *sv_autoRecordThreshold;
extern	cvar_t	*cl_freezeDemo;
extern	cvar_t	*sv_demoTolerant;
extern	cvar_t	*sv_democlients; // number of democlients: this should always be set to 0, and will be automatically adjusted when needed by the demo facility. ATTENTION: if sv_maxclients = sv_democlients then server will be full! sv_democlients consume clients slots even if there are no democlients recorded nor replaying for this slot!

#ifdef USE_LNBITS
extern	cvar_t  *sv_lnMatchPrice;
extern	cvar_t  *sv_lnMatchCut;
extern	cvar_t  *sv_lnMatchReward;
extern	cvar_t  *sv_lnWallet;
extern	cvar_t  *sv_lnKey;
extern	cvar_t  *sv_lnAPI;
extern	cvar_t  *sv_lnWithdraw;
#endif

#ifdef USE_REFEREE_CMDS
extern  cvar_t  *sv_thawTime;
#endif

#ifdef USE_CVAR_UNCHEAT
extern  cvar_t  *sv_banCheats;
extern  char    *svUncheats[128];
void SV_InitBanCheats( void );
#endif

#ifdef USE_MEMORY_MAPS
extern  cvar_t *sv_memoryMaps;
extern  cvar_t *sv_bspLight;
extern  cvar_t *sv_bspMinimap;
extern  cvar_t *sv_bspAAS;
extern  cvar_t *sv_bspRebuild;
extern  cvar_t *sv_bspMap;
extern  cvar_t *sv_bspSplice;
extern  cvar_t *sv_bspMiniSize;
extern  cvar_t *sv_bspMiniGrid;
#endif


#ifdef USE_PERSIST_CLIENT
extern  cvar_t  *sv_clSessions;
#endif


//===========================================================
#ifdef USE_CURL
#ifdef DEDICATED
typedef struct {
	fileHandle_t download;
	char		downloadTempName[MAX_OSPATH];
	char		downloadName[MAX_OSPATH];
	int			downloadCount;	// how many bytes we got
	int			downloadSize;	// how many bytes we got
	qboolean	downloadRestart;	// if true, we need to do another FS_Restart because we downloaded a pak
	qboolean	cURLEnabled;
	qboolean	cURLUsed;
	qboolean	cURLDisconnected;
	char		downloadURL[MAX_OSPATH];
	CURL		*downloadCURL;
	CURLM		*downloadCURLM;
} clientConnection_t;

typedef struct {
	int			realtime;			// ignores pause	
} clientStatic_t;

extern	clientStatic_t		cls;
extern	clientConnection_t clc;
extern	cvar_t	*cl_dlDirectory;
extern	cvar_t	*cl_cURLLib;
#endif

extern		download_t	svDownload;
qboolean	Com_DL_Perform( download_t *dl );
void		  Com_DL_Cleanup( download_t *dl );
qboolean	Com_DL_Begin( download_t *dl, const char *localName, const char *remoteURL, qboolean autoDownload );
qboolean	Com_DL_BeginPost( download_t *dl, const char *localName, const char *remoteURL);
qboolean	Com_DL_InProgress( const download_t *dl );
qboolean	Com_DL_ValidFileName( const char *fileName );

#endif

#ifdef USE_LNBITS
typedef struct {
	char     guid[64];
	char     checkingId[64];
	char     invoice[512];
	char     reward[512];
	int      lastTime;
	int      price; // price at time of invoicing for scriptability
	qboolean paid;
	client_t *cl;
} invoice_t;
extern invoice_t *maxInvoices;
extern int       numInvoices;
extern int       oldestInvoiceTime;
extern invoice_t *oldestInvoiceClient;
void      SV_CheckInvoicesAndPayments(void);
#endif

//
// sv_main.c
//
extern netadr_t redirectAddress;
qboolean SVC_RateLimit( rateLimit_t *bucket, int burst, int period );
qboolean SVC_RateLimitAddress( const netadr_t *from, int burst, int period );
void SVC_RateRestoreBurstAddress( const netadr_t *from, int burst, int period );
void SVC_RateRestoreToxicAddress( const netadr_t *from, int burst, int period );
void SVC_RateDropAddress( const netadr_t *from, int burst, int period );

void SV_FinalMessage( const char *message );
void QDECL SV_SendServerCommand( client_t *cl, const char *fmt, ...) __attribute__ ((format (printf, 2, 3)));

void SV_AddOperatorCommands( void );
void SV_RemoveOperatorCommands( void );

void SV_MasterShutdown( void );
int SV_RateMsec( const client_t *client );
void SV_FlushRedirect( const char *outputbuf );


//
// sv_init.c
//
#ifdef USE_SERVER_ROLES
void SV_InitUserRoles (void);
#endif
void SV_SetConfigstring( int index, const char *val );
void SV_GetConfigstring( int index, char *buffer, int bufferSize );
void SV_UpdateConfigstrings( client_t *client );

void SV_SetUserinfo( int index, const char *val );
void SV_GetUserinfo( int index, char *buffer, int bufferSize );

void SV_ChangeMaxClients( void );
void SV_SpawnServer( const char *mapname, qboolean killBots );
void SV_CreateBaseline( void );
void SV_BoundMaxClients( int minimum );
void SV_SetSnapshotParams( void );



//
// sv_client.c
//
void SV_GetChallenge( const netadr_t *from );
void SV_InitChallenger( void );

void SV_DirectConnect( const netadr_t *from );

void SV_ExecuteClientMessage( client_t *cl, msg_t *msg );
void SV_UserinfoChanged( client_t *cl, qboolean updateUserinfo, qboolean runFilter );

void SV_ClientEnterWorld( client_t *client, usercmd_t *cmd );
void SV_FreeClient( client_t *client );
void SV_DropClient( client_t *drop, const char *reason );

qboolean SV_ExecuteClientCommand( client_t *cl, const char *s );
void SV_ClientThink( client_t *cl, usercmd_t *cmd );
void SV_UpdateUserinfo_f( client_t *cl );

int SV_SendDownloadMessages( void );
int SV_SendQueuedMessages( void );

void SV_FreeIP4DB( void );
void SV_PrintLocations_f( client_t *client );
void SV_LoadVM( client_t *client );

//
// sv_ccmds.c
//
void SV_Heartbeat_f( void );
client_t *SV_GetPlayerByHandle( void );
client_t *SV_GetPlayerByNum( void );

#ifdef USE_MV
//
// sv_multiview.c
//
#define	SCORE_RECORDER 1
#define	SCORE_CLIENT   2
#define SCORE_PERIOD   10000

void SV_TrackDisconnect( int clientNum );
void SV_ForwardServerCommands( client_t *recorder /*, const client_t *client */ );
void SV_MultiViewStopRecord_f( void );
int SV_FindActiveClient( qboolean checkCommands, int skipClientNum, int minActive );
void SV_SetTargetClient( int clientNum );
void SV_LoadRecordCache( void );
void SV_SaveRecordCache( void );
void SV_MultiViewRecord_f( void );
void SV_MultiView_f( client_t *client );
void SV_MV_BoundMaxClients( void );
void SV_MV_SetSnapshotParams( void );
int SV_GetMergeMaskEntities( clientSnapshot_t *snap );
void SV_EmitPlayerStates( int baseClientID, const clientSnapshot_t *from, const clientSnapshot_t *to, msg_t *msg, skip_mask sm );
void SV_QueryClientScore( client_t *client );
#endif

//
// sv_snapshot.c
//
extern byte numDied[128];
void SV_AddServerCommand( client_t *client, const char *cmd );
void SV_UpdateServerCommandsToClient( client_t *client, msg_t *msg );
void SV_WriteFrameToClient( client_t *client, msg_t *msg );
void SV_SendMessageToClient( msg_t *msg, client_t *client );
void SV_SendClientMessages( void );
void SV_SendClientSnapshot( client_t *client );

void SV_InitSnapshotStorage( void );
void SV_IssueNewSnapshot( void );

int SV_RemainingGameState( void );

//
// sv_game.c
//
int	SV_NumForGentity( sharedEntity_t *ent );
sharedEntity_t *SV_GentityNum( int num );
playerState_t *SV_GameClientNum( int num );
svEntity_t	*SV_SvEntityForGentity( sharedEntity_t *gEnt );
sharedEntity_t *SV_GEntityForSvEntity( svEntity_t *svEnt );
void		SV_InitGameProgs ( qboolean createNew );
void		SV_ShutdownGameProgs ( void );
void		SV_RestartGameProgs( void );
qboolean	SV_inPVS (const vec3_t p1, const vec3_t p2);
void SV_GameSendServerCommand( int clientNum, const char *text );


#ifdef USE_DEMO_CLIENTS
//
// sv_demo_client.c
//
void SV_Record( client_t	*cl, char *s );
void SV_Record_f( void );
void SV_StopRecord( client_t	*cl );
void SV_StopRecord_f( void );
void SV_SaveRecord_f( void );
void SV_WriteDemoMessage (client_t *cl, msg_t *msg, int headerBytes );
#endif


#ifdef USE_DEMO_SERVER
//
// sv_demo.c
//
void SV_DemoStartRecord(void);
void SV_DemoStopRecord(void);
void SV_DemoStartPlayback(void);
void SV_DemoStopPlayback(void);
void SV_DemoAutoDemoRecord(void);
void SV_DemoRestartPlayback(void);

void SV_DemoReadFrame(void);
void SV_DemoReadClientCommand( msg_t *msg );
void SV_DemoReadServerCommand( msg_t *msg );
void SV_DemoReadGameCommand( msg_t *msg );
void SV_DemoReadConfigString( msg_t *msg );
void SV_DemoReadClientConfigString( msg_t *msg );
void SV_DemoReadClientUserinfo( msg_t *msg );
//void SV_DemoReadClientUsercmd( msg_t *msg );
void SV_DemoReadAllPlayerState( msg_t *msg );
void SV_DemoReadAllEntityState( msg_t *msg );
void SV_DemoReadAllEntityShared( msg_t *msg );
void SV_DemoReadRefreshEntities( void );

void SV_DemoWriteFrame(void);
void SV_DemoWriteClientCommand( client_t *client, const char *cmd );
void SV_DemoWriteServerCommand( const char *cmd );
void SV_DemoWriteGameCommand( int clientNum, const char *cmd );
void SV_DemoWriteConfigString( int cs_index, const char *cs_string );
void SV_DemoWriteClientConfigString( int clientNum, const char *cs_string );
void SV_DemoWriteClientUserinfo( client_t *client, const char *userinfo );
//void SV_DemoWriteClientUsercmd( client_t *cl, qboolean delta, int cmdCount, usercmd_t *cmds, int key );
void SV_DemoWriteAllPlayerState(void);
void SV_DemoWriteAllEntityState(void);
void SV_DemoWriteAllEntityShared(void);

qboolean SV_CheckClientCommand( client_t *client, const char *cmd );
qboolean SV_CheckServerCommand( const char *cmd );
qboolean SV_CheckGameCommand( const char *cmd );
qboolean SV_CheckLastCmd( const char *cmd, qboolean onlyStore );
void SV_DemoFilterClientUserinfo( const char *userinfo );
const char *SV_CleanFilename( char *str );
char *SV_CleanStrCmd( char *str );
const char *SV_GenerateDateTime(void);

void SV_DemoChangeMaxClients( void );
void SV_CompleteDemoName( char *args, int argNum );
void SV_Demo_Stop_f( void );
void SV_Demo_Play_f( void );
void SV_Demo_Record_f( void );

//
// sv_demo_ext.c
//

int SV_GentityGetHealthField( sharedEntity_t * gent );
void SV_GentitySetHealthField( sharedEntity_t * gent, int value );
void SV_GentityUpdateHealthField( sharedEntity_t * gent, playerState_t *player );
#endif


//
// sv_bot.c
//
#ifdef USE_MULTIVM_SERVER
void    SV_SetAASgvm( int gvmi );
#endif
void		SV_BotFrame( int time );
int			SV_BotAllocateClient(void);
void		SV_BotFreeClient( int clientNum );

void		SV_BotInitCvars(void);
int			SV_BotLibSetup( void );
int			SV_BotLibShutdown( void );
int			SV_BotGetSnapshotEntity( int client, int ent );
int			SV_BotGetConsoleMessage( int client, char *buf, int size );

int BotImport_DebugPolygonCreate(int color, int numPoints, vec3_t *points);
void BotImport_DebugPolygonDelete(int id);

void SV_BotInitBotLib(void);

//============================================================
//
// high level object sorting to reduce interaction tests
//

void SV_ClearWorld (void);
// called after the world model has been loaded, before linking any entities

void SV_UnlinkEntity( sharedEntity_t *ent );
// call before removing an entity, and before trying to move one,
// so it doesn't clip against itself

void SV_LinkEntity( sharedEntity_t *ent );
// Needs to be called any time an entity changes origin, mins, maxs,
// or solid.  Automatically unlinks if needed.
// sets ent->r.absmin and ent->r.absmax
// sets ent->leafnums[] for pvs determination even if the entity
// is not solid


clipHandle_t SV_ClipHandleForEntity( const sharedEntity_t *ent );


void SV_SectorList_f( void );


int SV_AreaEntities( const vec3_t mins, const vec3_t maxs, int *entityList, int maxcount );
// fills in a table of entity numbers with entities that have bounding boxes
// that intersect the given area.  It is possible for a non-axial bmodel
// to be returned that doesn't actually intersect the area on an exact
// test.
// returns the number of pointers filled in
// The world entity is never returned in this list.


int SV_PointContents( const vec3_t p, int passEntityNum );
// returns the CONTENTS_* value from the world and all entities at the given point.


void SV_Trace( trace_t *results, const vec3_t start, const vec3_t mins, const vec3_t maxs, const vec3_t end, int passEntityNum, int contentmask, qboolean capsule );
// mins and maxs are relative

// if the entire move stays in a solid volume, trace.allsolid will be set,
// trace.startsolid will be set, and trace.fraction will be 0

// if the starting point is in a solid, it will be allowed to move out
// to an open area

// passEntityNum is explicitly excluded from clipping checks (normally ENTITYNUM_NONE)


void SV_ClipToEntity( trace_t *trace, const vec3_t start, const vec3_t mins, const vec3_t maxs, const vec3_t end, int entityNum, int contentmask, qboolean capsule );
// clip to a specific entity

//
// sv_net_chan.c
//
void SV_Netchan_Transmit( client_t *client, msg_t *msg);
int SV_Netchan_TransmitNextFragment( client_t *client );
qboolean SV_Netchan_Process( client_t *client, msg_t *msg );
void SV_Netchan_FreeQueue( client_t *client );

//
// sv_filter.c
//
void SV_LoadFilters( const char *filename );
const char *SV_RunFilters( const char *userinfo, const netadr_t *addr );
void SV_AddFilter_f( void );
void SV_AddFilterCmd_f( void );


#ifdef USE_MEMORY_MAPS
//
// sv_bsp*.c
//

#define  SIDE_NORTH  1
#define  SIDE_EAST   2
#define  SIDE_SOUTH  4
#define  SIDE_WEST   8
#define  SIDE_TOP    16
#define  SIDE_BOTTOM 32
#define  SIDE_ALL    63 // ?

void SV_MakeMinimap(void);
int SV_MakeMap( const char **memoryMap );
void SV_ExportMap(void);
void SV_LightMap(void);
char *SV_MakeCube(
	vec3_t p1, vec3_t p2, vec3_t p3, vec3_t p4,
	vec3_t p5, vec3_t p6, vec3_t p7, vec3_t p8);
qboolean isOverlapping(vec2_t l1, vec2_t r1, vec2_t l2, vec2_t r2);
void SV_SetStroke( const char *path );
char *SV_MakeBox( vec3_t min, vec3_t max );
char *SV_MakePortal( float radius, vec3_t min, vec3_t max, int minSegment, int maxSegment, int sides );
char *SV_MakeWall( int p1[3], int p2[3] );
extern char output[2 * 1024 * 1024];
extern int brushC;
extern char stroke[MAX_QPATH];
#endif
