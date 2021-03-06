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
// cl_cgame.c  -- client system interaction with client game

#include "client.h"

#ifdef USE_PRINT_CONSOLE
#undef Com_Printf
#undef Com_DPrintf
#define Com_Printf CG_Printf
#define Com_DPrintf CG_DPrintf
#endif

#include "../botlib/botlib.h"

extern	botlib_export_t	*botlib_export;

extern qboolean loadCamera(const char *name);
extern void startCamera(int camNum, int time);
extern qboolean getCameraInfo(int camNum, int time, vec3_t *origin, vec3_t *angles, float *fov);
extern void stopCamera(int camNum);

// connect virtual machines to the correct cm_* map
int clientMaps[MAX_NUM_VMS] = {
  0
#ifdef USE_MULTIVM_CLIENT
	,0,0,0,0,0,0,0,0,0
#endif
};

// connect VMs to the correct ri.LoadWorld() map
int worldMaps[MAX_NUM_VMS] = {
  -1
#ifdef USE_MULTIVM_CLIENT
	,-1,-1,-1,-1,-1,-1,-1,-1,-1
#endif
};

// connect a specific virtual machine to a gamestate/world from server 0-9
int clientGames[MAX_NUM_VMS] = {
	0
#ifdef USE_MULTIVM_CLIENT
	,-1,-1,-1,-1,-1,-1,-1,-1,-1
#endif
};

// connect a specific screen to a player/client inside a game
int clientWorlds[MAX_NUM_VMS] = {
	-1
#ifdef USE_MULTIVM_CLIENT
	,-1,-1,-1,-1,-1,-1,-1,-1,-1
#endif
};
// default cameras to an entity viewpoint instead of same location
vec3_t clientCameras[MAX_NUM_VMS];

#ifdef USE_MULTIVM_CLIENT
extern refdef_t views[MAX_NUM_VMS];
#endif

/*
====================
CL_GetGameState
====================
*/
static void CL_GetGameState( gameState_t *gs ) {
#ifdef USE_MULTIVM_CLIENT
	int igs = clientGames[cgvmi];
#endif
	*gs = cl.gameState;
}


/*
====================
CL_GetGlconfig
====================
*/
static void CL_GetGlconfig( glconfig_t *glconfig ) {
	*glconfig = cls.glconfig;
}


/*
====================
CL_GetUserCmd
====================
*/
static qboolean CL_GetUserCmd( int cmdNumber, usercmd_t *ucmd ) {
#ifdef USE_MULTIVM_CLIENT
  int igvm = cgvmi;
#endif
	// cmds[cmdNumber] is the last properly generated command

	// can't return anything that we haven't created yet
	if ( cl.cmdNumber - cmdNumber < 0 ) {
		Com_Error( ERR_DROP, "%s: %i >= %i", __func__, cmdNumber, cl.cmdNumber );
	}

	// the usercmd has been overwritten in the wrapping
	// buffer because it is too far out of date
	if ( cl.cmdNumber - cmdNumber >= CMD_BACKUP ) {
		return qfalse;
	}

	*ucmd = cl.cmds[ cmdNumber & CMD_MASK ];

	return qtrue;
}


/*
====================
CL_GetCurrentCmdNumber
====================
*/
static int CL_GetCurrentCmdNumber( void ) {
#ifdef USE_MULTIVM_CLIENT
  int igvm = cgvmi;
  return cl.clCmdNumbers[igvm];
#else
  return cl.cmdNumber;
#endif
}


/*
====================
CL_GetCurrentSnapshotNumber
====================
*/
static void CL_GetCurrentSnapshotNumber( int *snapshotNumber, int *serverTime ) {
#ifdef USE_MULTIVM_CLIENT
	int igs = clientGames[cgvmi];
#endif
	*snapshotNumber = cl.snap.messageNum;
	*serverTime = cl.snap.serverTime;
}


#ifdef USE_MV
/*
====================
CL_GetParsedEntityIndexByID
====================
*/
static int CL_GetParsedEntityIndexByID( const clSnapshot_t *clSnap, int entityID, int startIndex, int *parsedIndex, int igs ) {
	int index, n;
	for ( index = startIndex; index < clSnap->numEntities; ++index ) {
		n = ( clSnap->parseEntitiesNum + index ) & (MAX_PARSE_ENTITIES-1);
		if ( cl.parseEntities[ n ].number == entityID ) {
			*parsedIndex = n;
			return index;
		}
	}
	return -1;
}
#endif // USE_MV


#ifdef USE_XDAMAGE
void X_DMG_DrawDamage(const refdef_t* fd);
//void X_DMG_PushDamageForDirectHit(int clientNum, vec3_t origin);
//void X_DMG_UpdateClientOrigin(refEntity_t* ref);
void X_DMG_ParseSnapshotDamage( void );
#endif

/*
====================
CL_GetSnapshot
====================
*/
static qboolean CL_GetSnapshot( int snapshotNumber, snapshot_t *snapshot ) {
	clSnapshot_t	*clSnap;
	int				i, count;
#ifdef USE_MV
#ifdef USE_MULTIVM_CLIENT
	int igs = clientGames[cgvmi];
#else
  int igs = 0;
  int cgvmi = 0;
#endif
#endif

	if ( cl.snap.messageNum - snapshotNumber < 0 ) {
		Com_Error( ERR_DROP, "%s: snapshotNumber > cl.snapshot.messageNum", __func__ );
	}

	// if the frame has fallen out of the circular buffer, we can't return it
	if ( cl.snap.messageNum - snapshotNumber >= PACKET_BACKUP ) {
		return qfalse;
	}

	// if the frame is not valid, we can't return it
	clSnap = &cl.snapshots[snapshotNumber & PACKET_MASK];
	if ( !clSnap->valid ) {
#ifdef USE_MULTIVM_CLIENT
		for(int i = snapshotNumber+1; i <= cl.snap.messageNum; i++)  {
			clSnap = &cl.snapshots[i & PACKET_MASK];
			if(!clSnap->valid || clSnap->serverTime < cl.snapshots[snapshotNumber & PACKET_MASK].serverTime) {
        return qfalse;
			} else {
				break;
			}
		}
#else
		return qfalse;
#endif
	}

	// if the entities in the frame have fallen out of their
	// circular buffer, we can't return it
#ifdef USE_MULTIVM_CLIENT
	if ( cl.parseEntitiesNumWorlds[igs] - clSnap->parseEntitiesNum >= MAX_PARSE_ENTITIES ) {
		return qfalse;
	}
#else
	if ( cl.parseEntitiesNum - clSnap->parseEntitiesNum >= MAX_PARSE_ENTITIES ) {
		return qfalse;
	}
#endif

	// write the snapshot
	snapshot->snapFlags = clSnap->snapFlags;
	snapshot->serverCommandSequence = clSnap->serverCommandNum;
	snapshot->ping = clSnap->ping;
	snapshot->serverTime = clSnap->serverTime;

#ifdef USE_MV
	if ( clSnap->multiview ) {
		int		entityNum;
		int		startIndex;
		int		parsedIndex;
		byte	*entMask;
		int cv = clientWorlds[cgvmi];

		if ( clSnap->clps[ cv ].valid ) {
		} else {
			// we need to select another POV
			if ( clSnap->clps[ clc.clientNum ].valid ) {
				Com_DPrintf( S_COLOR_CYAN "multiview: switch POV back from %d to %d\n", clientWorlds[cgvmi], clc.clientNum );
				cv = clientWorlds[cgvmi] = clc.clientNum; // fixup to avoid glitches
			} else { 
				// invalid primary id? search for any valid
				for ( i = 0; i < MAX_CLIENTS; i++ ) {
					if ( clSnap->clps[ i ].valid ) {
						cv = clc.clientNum = clientWorlds[cgvmi] = i;
						Com_Printf( S_COLOR_CYAN "multiview: set primary client id %d\n", clc.clientNum );
						break;
					}
				}
				if ( i == MAX_CLIENTS ) {
					if ( !( snapshot->snapFlags & SNAPFLAG_NOT_ACTIVE ) ) {
						Com_Error( ERR_DROP, "Unable to find any playerState in multiview" );
						return qfalse;
					}
				}
			}
		}
		Com_Memcpy( snapshot->areamask, clSnap->clps[ cv ].areamask, sizeof( snapshot->areamask ) );
		snapshot->ps = clSnap->clps[ cv ].ps;
		entMask = clSnap->clps[ cv ].entMask;
		if(cv != clc.clientNum) {
#define PMF_FOLLOW			4096	// spectate following another player
			snapshot->ps.pm_flags |= PMF_FOLLOW;
		}

		count = 0;
		startIndex = 0;
		for ( entityNum = 0; entityNum < MAX_GENTITIES-1; entityNum++ ) {
			if ( GET_ABIT( entMask, entityNum ) ) {
				// skip own and spectated entity
				if ( entityNum != cv && entityNum != snapshot->ps.clientNum )
				{
					startIndex = CL_GetParsedEntityIndexByID( clSnap, entityNum, startIndex, &parsedIndex, igs );
					if ( startIndex >= 0 ) {
						// should never happen but anyway:
						if ( count >= MAX_ENTITIES_IN_SNAPSHOT ) {
							Com_Error( ERR_DROP, "snapshot entities count overflow for %i", cv );
							break;
						}
						snapshot->entities[ count++ ] = cl.parseEntities[ parsedIndex ];
					} else {
//#ifndef USE_MULTIVM_CLIENT
						// TODO: not sure why multiview crashes here, because you can't follow a spectated entity? Should transfer people's own multiview entity regardless.
						Com_Error( ERR_DROP, "packet entity not found in snapshot: %i (%i)", entityNum, igs );
//#endif
						break;
					}
				}
			}
		}
		snapshot->numEntities = count;

#ifdef USE_XDAMAGE
    X_DMG_ParseSnapshotDamage();
#endif

		return qtrue;
	}
#endif // USE_MV

#ifdef USE_LAZY_LOAD
//PM_NORMAL,		// can accelerate and turn
//	PM_NOCLIP,		// noclip movement
#define PM_SPECTATOR 2	// still run into walls
#define PM_DEAD 3		// no acceleration or turning, but free falling
//	PM_FREEZE,		// stuck in place with no control
#define PM_INTERMISSION 5	// no movement or status bar
#define PM_SPINTERMISSION	 6 // no movement or status bar
  if(clSnap->ps.pm_type == PM_SPECTATOR
    || clSnap->ps.pm_type == PM_SPINTERMISSION
    || clSnap->ps.pm_type == PM_INTERMISSION
    || clSnap->ps.pm_type == PM_DEAD) {
    cls.lazyLoading = qtrue;
  } else {
    cls.lazyLoading = qfalse;
  }
#endif

#if 0
	// check for a use_item event and don't print in renderer
	// TODO: using game VM hack instead
	for ( i = clSnap->ps.eventSequence - MAX_PS_EVENTS ; i < clSnap->ps.eventSequence ; i++ ) {
		if ( i >= snapshot->ps.eventSequence ) {
			int event = clSnap->ps.events[ i & (MAX_PS_EVENTS-1) ] & ~EV_EVENT_BITS;
			if(event >= EV_USE_ITEM0 && event <= EV_USE_ITEM15) {
	//				re.ResetBannerSpy();
	//				break;
			}
			if(event == EV_CHANGE_WEAPON) {
#ifdef USE_MULTIVM_CLIENT
	Com_Printf( "Weapon change event\n" );
#endif
			}
		}
	}
#endif

	Com_Memcpy( snapshot->areamask, clSnap->areamask, sizeof( snapshot->areamask ) );
	snapshot->ps = clSnap->ps;
	count = clSnap->numEntities;
	if ( count > MAX_ENTITIES_IN_SNAPSHOT ) {
		Com_DPrintf( "%s: truncated %i entities to %i\n", __func__, count, MAX_ENTITIES_IN_SNAPSHOT );
		count = MAX_ENTITIES_IN_SNAPSHOT;
	}
	snapshot->numEntities = count;
	for ( i = 0 ; i < count ; i++ ) {
		snapshot->entities[i] =
			cl.parseEntities[ ( clSnap->parseEntitiesNum + i ) & (MAX_PARSE_ENTITIES-1) ];
	}

	// FIXME: configstring changes and server commands!!!
#ifdef USE_XDAMAGE
	X_DMG_ParseSnapshotDamage();
#endif

	return qtrue;
}


/*
=====================
CL_SetUserCmdValue
=====================
*/
static void CL_SetUserCmdValue( int userCmdValue, float sensitivityScale ) {
#ifdef USE_MULTIVM_CLIENT
  int igvm = cgvmi;
#endif
	cl.cgameUserCmdValue = userCmdValue;
	cl.cgameSensitivity = sensitivityScale;
}


/*
=====================
CL_AddCgameCommand
=====================
*/
static void CL_AddCgameCommand( const char *cmdName ) {
	Cmd_AddCommand( cmdName, NULL );
}


#ifdef USE_LOCAL_DED
void CL_ParseServerInfo( int igs );
#endif

/*
=====================
CL_ConfigstringModified
=====================
*/
static void CL_ConfigstringModified( void ) {
	const char	*old, *s;
	int			i, index;
	const char	*dup;
	gameState_t	oldGs;
	int			len;

	index = atoi( Cmd_Argv(1) );
	if ( (unsigned) index >= MAX_CONFIGSTRINGS ) {
		Com_Error( ERR_DROP, "%s: bad configstring index %i", __func__, index );
	}
	// get everything after "cs <num>"
	s = Cmd_ArgsFrom(2);

#ifdef USE_MULTIVM_CLIENT
	int igs = clientGames[cgvmi];
#else
  int igs = 0;
#endif
	old = cl.gameState.stringData + cl.gameState.stringOffsets[ index ];
	if ( !strcmp( old, s ) ) {
		return;		// unchanged
	}

	// build the new gameState_t
	oldGs = cl.gameState;

	Com_Memset( &cl.gameState, 0, sizeof( cl.gameState ) );

	// leave the first 0 for uninitialized strings
	cl.gameState.dataCount = 1;

	for ( i = 0 ; i < MAX_CONFIGSTRINGS ; i++ ) {
		if ( i == index ) {
			dup = s;
		} else {
			dup = oldGs.stringData + oldGs.stringOffsets[ i ];
		}
		if ( !dup[0] ) {
			continue;		// leave with the default empty string
		}

		len = strlen( dup );

		if ( len + 1 + cl.gameState.dataCount > MAX_GAMESTATE_CHARS ) {
			Com_Error( ERR_DROP, "MAX_GAMESTATE_CHARS exceeded" );
		}

		// append it to the gameState string buffer
		cl.gameState.stringOffsets[ i ] = cl.gameState.dataCount;
		Com_Memcpy( cl.gameState.stringData + cl.gameState.dataCount, dup, len + 1 );
		cl.gameState.dataCount += len + 1;
	}

	if ( index == CS_SYSTEMINFO ) {
		// parse serverId and other cvars
		CL_SystemInfoChanged( qfalse, igs );
	}
#ifdef USE_LOCAL_DED
	else if (index == CS_SERVERINFO) {
		CL_ParseServerInfo(igs);
	}
#endif
}


/*
===================
CL_GetServerCommand

Set up argc/argv for the given command
===================
*/
static qboolean CL_GetServerCommand( int serverCommandNumber ) {
	const char *s;
	const char *cmd;
	static char bigConfigString[BIG_INFO_STRING];
	int argc, index;
#ifdef USE_MULTIVM_CLIENT
  int igvm = cgvmi;
#endif

	// if we have irretrievably lost a reliable command, drop the connection
	if ( serverCommandNumber <= clc.serverCommandSequence - MAX_RELIABLE_COMMANDS ) {
		// when a demo record was started after the client got a whole bunch of
		// reliable commands then the client never got those first reliable commands
		if ( clc.demoplaying ) {
			Cmd_Clear();
			return qfalse;
		}
		Com_Error( ERR_DROP, "%s: a reliable command was cycled out", __func__ );
		return qfalse;
	}

	if ( serverCommandNumber > clc.serverCommandSequence ) {
		Com_Error( ERR_DROP, "%s: requested a command not received", __func__ );
		return qfalse;
	}

	index = serverCommandNumber & ( MAX_RELIABLE_COMMANDS - 1 );
	s = clc.serverCommands[ index ];
	clc.lastExecutedServerCommand = serverCommandNumber;

#ifdef USE_MULTIVM_CLIENT
	Com_DPrintf( "serverCommand [%i]: %i : %s\n", cgvmi, serverCommandNumber, s );
#else
	Com_DPrintf( "serverCommand: %i : %s\n", serverCommandNumber, s );
#endif

	if ( clc.serverCommandsIgnore[ index ] ) {
		Cmd_Clear();
		return qfalse;
	}

rescan:
	Cmd_TokenizeString( s );
	cmd = Cmd_Argv(0);
	argc = Cmd_Argc();

	if ( !strcmp( cmd, "disconnect" ) ) {
		// https://zerowing.idsoftware.com/bugzilla/show_bug.cgi?id=552
		// allow server to indicate why they were disconnected
		if ( argc >= 2 )
			Com_Error( ERR_SERVERDISCONNECT, "Server disconnected - %s", Cmd_Argv( 1 ) );
		else
			Com_Error( ERR_SERVERDISCONNECT, "Server disconnected" );
	}

	if ( !strcmp( cmd, "bcs0" ) ) {
		Com_sprintf( bigConfigString, BIG_INFO_STRING, "cs %s \"%s", Cmd_Argv(1), Cmd_Argv(2) );
		return qfalse;
	}

	if ( !strcmp( cmd, "bcs1" ) ) {
		s = Cmd_Argv(2);
		if( strlen(bigConfigString) + strlen(s) >= BIG_INFO_STRING ) {
			Com_Error( ERR_DROP, "bcs exceeded BIG_INFO_STRING" );
		}
		strcat( bigConfigString, s );
		return qfalse;
	}

	if ( !strcmp( cmd, "bcs2" ) ) {
		s = Cmd_Argv(2);
		if( strlen(bigConfigString) + strlen(s) + 1 >= BIG_INFO_STRING ) {
			Com_Error( ERR_DROP, "bcs exceeded BIG_INFO_STRING" );
		}
		strcat( bigConfigString, s );
		strcat( bigConfigString, "\"" );
		s = bigConfigString;
		goto rescan;
	}

	if ( !strcmp( cmd, "cs" ) ) {
		CL_ConfigstringModified();
		// reparse the string, because CL_ConfigstringModified may have done another Cmd_TokenizeString()
		Cmd_TokenizeString( s );
		return qtrue;
	}

	if ( !strcmp( cmd, "map_restart" ) ) {
		// clear notify lines and outgoing commands before passing
		// the restart to the cgame
#ifndef USE_NO_CONSOLE
		Con_ClearNotify();
#endif
		// reparse the string, because Con_ClearNotify() may have done another Cmd_TokenizeString()
		Cmd_TokenizeString( s );
		Com_Memset( cl.cmds, 0, sizeof( cl.cmds ) );
		cls.lastVidRestart = Sys_Milliseconds(); // hack for OSP mod
		return qtrue;
	}

	// the clientLevelShot command is used during development
	// to generate 128*128 screenshots from the intermission
	// point of levels for the menu system to use
	// we pass it along to the cgame to make appropriate adjustments,
	// but we also clear the console and notify lines here
	if ( !strcmp( cmd, "clientLevelShot" ) ) {
		// don't do it if we aren't running the server locally,
		// otherwise malicious remote servers could overwrite
		// the existing thumbnails
		if ( !com_sv_running->integer ) {
			return qfalse;
		}
#ifndef USE_NO_CONSOLE
		// close the console
		Con_Close();
#endif

		// take a special screenshot next frame
		Cbuf_AddText( "wait ; wait ; wait ; wait ; screenshot levelshot\n" );
		return qtrue;
	}


#ifdef USE_MULTIVM_CLIENT
	if ( !strcmp( cmd, "world" ) ) {
		// prevent multiple VMs from processing this command
		clc.serverCommandsIgnore[ index ] = qtrue;
		cls.lastVidRestart = Sys_Milliseconds();
		cvar_modifiedFlags |= CVAR_USERINFO;
		Cbuf_ExecuteText(EXEC_INSERT, va("wait ; world %s\n", Cmd_ArgsFrom(1)));
		Cmd_Clear();
		return qfalse;
	}
#endif

	if(Q_stristr(cmd, "screenshot")) {
		// ignore because cheating is meh
		Cmd_Clear();
		return qfalse;
	}

#if defined(USE_LOCAL_DED) || defined(USE_LNBITS)
	if( !strcmp( cmd, "reconnect" ) ) {
		Cbuf_AddText("reconnect\n");
		Cmd_Clear();
		return qfalse;
	}
#endif

#ifdef USE_LOCAL_DED
	if ( !strcmp( cmd, "postgame" ) ) {
		cls.postgame = qtrue;
	}
#endif

#ifdef USE_CMD_CONNECTOR
	// if it came from the server it was meant for cgame
	if( Q_stristr(cmd, "print") ) {
		return qtrue;
	}

	// pass server commands through to client like postgame
  // skip sending to server since that where it came from
	if(Cmd_ExecuteString(s, qfalse)) {
		Cmd_Clear();
		return qfalse;
	}
#endif

	// we may want to put a "connect to other server" command here

	// cgame can now act on the command
	return qtrue;
}


void tc_vis_init(void);
void tc_vis_render(void);

/*
====================
CL_CM_LoadMap

Just adds default parameters that cgame doesn't need to know about
====================
*/
static void CL_CM_LoadMap( const char *mapname ) {
	int		checksum;
#ifdef USE_MULTIVM_CLIENT
  clientMaps[cgvmi] = CM_LoadMap( mapname, qtrue, &checksum );
#else
	clientMaps[0] = CM_LoadMap( mapname, qtrue, &checksum );
#endif
#ifdef USE_XDAMAGE
  tc_vis_init();
#endif
}


static void CL_RE_LoadMap( const char *mapname ) {
#ifdef USE_MULTIVM_CLIENT
	worldMaps[cgvmi] = re.LoadWorld( mapname );
#else
	worldMaps[0] = re.LoadWorld( mapname );
#endif
}


/*
====================
CL_ShutdonwCGame

====================
*/
void CL_ShutdownCGame( void ) {

	Key_SetCatcher( Key_GetCatcher( ) & ~KEYCATCH_CGAME );
	cls.cgameStarted = qfalse;

	for(int i = 0; i < MAX_NUM_VMS; i++) {
		clientScreens[i][0] =
		clientScreens[i][1] =
		clientScreens[i][2] =
		clientScreens[i][3] = -1;
#ifdef USE_MULTIVM_CLIENT
		cgvmi = i;
#endif
	if ( !cgvm ) {
		continue;
	}

#ifdef USE_ASYNCHRONOUS
	while (VM_IsSuspended(cgvm)) {
		VM_Resume(cgvm);
	}
#endif

	re.VertexLighting( qfalse );

	VM_Call( cgvm, 0, CG_SHUTDOWN );
	VM_Free( cgvm );
	cgvm = NULL;
	}
#ifdef USE_MULTIVM_CLIENT
	cgvmi = 0;
  clientScreens[cgvmi][0] = 
	clientScreens[cgvmi][1] = 0;
	clientScreens[cgvmi][2] = 
	clientScreens[cgvmi][3] = 1;
#endif
	FS_VM_CloseFiles( H_CGAME );

}



static int FloatAsInt( float f ) {
	floatint_t fi;
	fi.f = f;
	return fi.i;
}


#ifndef BUILD_GAME_STATIC
static void *VM_ArgPtr( intptr_t intValue ) {

	if ( !intValue || cgvm == NULL )
	  return NULL;

	if ( cgvm->entryPoint )
		return (void *)(intValue);
	else
		return (void *)(cgvm->dataBase + (intValue & cgvm->dataMask));
}
#endif


static qboolean CL_GetValue( char* value, int valueSize, const char* key ) {

	if ( !Q_stricmp( key, "trap_R_AddRefEntityToScene2" ) ) {
		Com_sprintf( value, valueSize, "%i", CG_R_ADDREFENTITYTOSCENE2 );
		return qtrue;
	}

	if ( !Q_stricmp( key, "trap_R_ForceFixedDLights" ) ) {
		Com_sprintf( value, valueSize, "%i", CG_R_FORCEFIXEDDLIGHTS );
		return qtrue;
	}

	if ( !Q_stricmp( key, "trap_R_AddLinearLightToScene_Q3E" ) && re.AddLinearLightToScene ) {
		Com_sprintf( value, valueSize, "%i", CG_R_ADDLINEARLIGHTTOSCENE );
		return qtrue;
	}

	if ( !Q_stricmp( key, "trap_IsRecordingDemo" ) ) {
		Com_sprintf( value, valueSize, "%i", CG_IS_RECORDING_DEMO );
		return qtrue;
	}

	return qfalse;
}


static void CL_ForceFixedDlights( void ) {
	cvar_t *cv;

	cv = Cvar_Get( "r_dlightMode", "1", 0 );
	if ( cv ) {
		Cvar_CheckRange( cv, "1", "2", CV_INTEGER );
	}
}


/*
====================
CL_CgameSystemCalls

The cgame module is making a system call
====================
*/
static intptr_t CL_CgameSystemCalls( intptr_t *args ) {
	switch( args[0] ) {
	case CG_PRINT:
		Com_Printf( "%s", (const char*)VMA(1) );
		return 0;
	case CG_ERROR:
#ifdef USE_MULTIVM_CLIENT
		Com_Error( ERR_DROP, "[%i]: %s", cgvmi, (const char*)VMA(1) );
#else
		Com_Error( ERR_DROP, "%s", (const char*)VMA(1) );
#endif
		return 0;
	case CG_MILLISECONDS:
		return Sys_Milliseconds();
	case CG_CVAR_REGISTER:
	{
		Cvar_Register( VMA(1), VMA(2), VMA(3), args[4], cgvm->privateFlag );
		return 0;
	}
	case CG_CVAR_UPDATE:
		Cvar_Update( VMA(1), cgvm->privateFlag );
		return 0;
	case CG_CVAR_SET:
		Cvar_SetSafe( VMA(1), VMA(2) );
		return 0;
	case CG_CVAR_VARIABLESTRINGBUFFER:
		VM_CHECKBOUNDS( cgvm, args[2], args[3] );
		Cvar_VariableStringBufferSafe( VMA(1), VMA(2), args[3], CVAR_PRIVATE );
		return 0;
	case CG_ARGC:
		return Cmd_Argc();
	case CG_ARGV:
		VM_CHECKBOUNDS( cgvm, args[2], args[3] );
		Cmd_ArgvBuffer( args[1], VMA(2), args[3] );
		return 0;
	case CG_ARGS:
		VM_CHECKBOUNDS( cgvm, args[1], args[2] );
		Cmd_ArgsBuffer( VMA(1), args[2] );
		return 0;

	case CG_FS_FOPENFILE:
		return FS_VM_OpenFile( VMA(1), VMA(2), args[3], H_CGAME );
	case CG_FS_READ:
		VM_CHECKBOUNDS( cgvm, args[1], args[2] );
		FS_VM_ReadFile( VMA(1), args[2], args[3], H_CGAME );
		return 0;
	case CG_FS_WRITE:
		VM_CHECKBOUNDS( cgvm, args[1], args[2] );
		FS_VM_WriteFile( VMA(1), args[2], args[3], H_CGAME );
		return 0;
	case CG_FS_FCLOSEFILE:
		FS_VM_CloseFile( args[1], H_CGAME );
		return 0;
	case CG_FS_SEEK:
		return FS_VM_SeekFile( args[1], args[2], args[3], H_CGAME );

	case CG_SENDCONSOLECOMMAND:
#ifdef USE_MULTIVM_CLIENT
			Cbuf_ExecuteTagged( EXEC_APPEND, VMA(1), -1 );
#else
      Cbuf_AddText( VMA(1) );
#endif
		return 0;
	case CG_ADDCOMMAND:
		CL_AddCgameCommand( VMA(1) );
		return 0;
	case CG_REMOVECOMMAND:
		Cmd_RemoveCommandSafe( VMA(1) );
		return 0;
	case CG_SENDCLIENTCOMMAND:
		CL_AddReliableCommand( VMA(1), qfalse );
		return 0;
	case CG_UPDATESCREEN:
		// this is used during lengthy level loading, so pump message loop
		// Com_EventLoop();	// FIXME: if a server restarts here, BAD THINGS HAPPEN!
		// We can't call Com_EventLoop here, a restart will crash and this _does_ happen
		// if there is a map change while we are downloading at pk3.
		// ZOID
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		SCR_UpdateScreen( qtrue );
		return 0;
	case CG_CM_LOADMAP:
		CL_CM_LoadMap( VMA(1) );
		return 0;
	case CG_CM_NUMINLINEMODELS:
		return CM_NumInlineModels();
	case CG_CM_INLINEMODEL:
#ifdef USE_MULTIVM_CLIENT
		return CM_InlineModel( args[1], 1, cgvmi );
#else
    return CM_InlineModel( args[1] );
#endif
	case CG_CM_TEMPBOXMODEL:
		return CM_TempBoxModel( VMA(1), VMA(2), /*int capsule*/ qfalse );
	case CG_CM_TEMPCAPSULEMODEL:
		return CM_TempBoxModel( VMA(1), VMA(2), /*int capsule*/ qtrue );
	case CG_CM_POINTCONTENTS:
		return CM_PointContents( VMA(1), args[2] );
	case CG_CM_TRANSFORMEDPOINTCONTENTS:
		return CM_TransformedPointContents( VMA(1), args[2], VMA(3), VMA(4) );
	case CG_CM_BOXTRACE:
		CM_BoxTrace( VMA(1), VMA(2), VMA(3), VMA(4), VMA(5), args[6], args[7], /*int capsule*/ qfalse );
		return 0;
	case CG_CM_CAPSULETRACE:
		CM_BoxTrace( VMA(1), VMA(2), VMA(3), VMA(4), VMA(5), args[6], args[7], /*int capsule*/ qtrue );
		return 0;
	case CG_CM_TRANSFORMEDBOXTRACE:
		CM_TransformedBoxTrace( VMA(1), VMA(2), VMA(3), VMA(4), VMA(5), args[6], args[7], VMA(8), VMA(9), /*int capsule*/ qfalse );
		return 0;
	case CG_CM_TRANSFORMEDCAPSULETRACE:
		CM_TransformedBoxTrace( VMA(1), VMA(2), VMA(3), VMA(4), VMA(5), args[6], args[7], VMA(8), VMA(9), /*int capsule*/ qtrue );
		return 0;
	case CG_CM_MARKFRAGMENTS:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		return re.MarkFragments( args[1], VMA(2), VMA(3), args[4], VMA(5), args[6], VMA(7) );
	case CG_S_STARTSOUND:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		S_StartSound( VMA(1), args[2], args[3], args[4] );
		return 0;
	case CG_S_STARTLOCALSOUND:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		S_StartLocalSound( args[1], args[2] );
		return 0;
	case CG_S_CLEARLOOPINGSOUNDS:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		S_ClearLoopingSounds(args[1]);
		return 0;
	case CG_S_ADDLOOPINGSOUND:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		S_AddLoopingSound( args[1], VMA(2), VMA(3), args[4] );
		return 0;
	case CG_S_ADDREALLOOPINGSOUND:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		S_AddRealLoopingSound( args[1], VMA(2), VMA(3), args[4] );
		return 0;
	case CG_S_STOPLOOPINGSOUND:
		S_StopLoopingSound( args[1] );
		return 0;
	case CG_S_UPDATEENTITYPOSITION:
		S_UpdateEntityPosition( args[1], VMA(2) );
#ifdef USE_XDAMAGE
    //if(args[1] >= 0 && args[1] < MAX_CLIENTS)
    //  X_DMG_PushDamageForDirectHit( args[1], VMA(2) );
#endif
		return 0;
	case CG_S_RESPATIALIZE:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		S_Respatialize( args[1], VMA(2), VMA(3), args[4] );
		return 0;
	case CG_S_REGISTERSOUND:
		return S_RegisterSound( VMA(1), args[2] );
	case CG_S_STARTBACKGROUNDTRACK:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		S_StartBackgroundTrack( VMA(1), VMA(2) );
		return 0;
	case CG_R_LOADWORLDMAP:
		CL_RE_LoadMap( VMA(1) );
		return 0;
	case CG_R_REGISTERMODEL:
		return re.RegisterModel( VMA(1) );
	case CG_R_REGISTERSKIN:
		return re.RegisterSkin( VMA(1) );
	case CG_R_REGISTERSHADER:
		return re.RegisterShader( VMA(1) );
	case CG_R_REGISTERSHADERNOMIP:
		return re.RegisterShaderNoMip( VMA(1) );
	case CG_R_REGISTERFONT:
		re.RegisterFont( VMA(1), args[2], VMA(3));
		return 0;
	case CG_R_CLEARSCENE:
		re.ClearScene();
		return 0;
	case CG_R_ADDREFENTITYTOSCENE:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		re.AddRefEntityToScene( VMA(1), qfalse );
#ifdef USE_XDAMAGE
    //X_DMG_UpdateClientOrigin((refEntity_t*)VMA(1));
#endif
		return 0;
	case CG_R_ADDPOLYTOSCENE:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		re.AddPolyToScene( args[1], args[2], VMA(3), 1 );
		return 0;
	case CG_R_ADDPOLYSTOSCENE:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		re.AddPolyToScene( args[1], args[2], VMA(3), args[4] );
		return 0;

	case CG_R_ADDPOLYBUFFERTOSCENE:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		re.AddPolyBufferToScene( VMA( 1 ) );
		break;

	case CG_R_LIGHTFORPOINT:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] == -1)
      return qfalse;
    else
#endif
		return re.LightForPoint( VMA(1), VMA(2), VMA(3), VMA(4) );
	case CG_R_ADDLIGHTTOSCENE:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		re.AddLightToScene( VMA(1), VMF(2), VMF(3), VMF(4), VMF(5) );
		return 0;
	case CG_R_ADDADDITIVELIGHTTOSCENE:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		re.AddAdditiveLightToScene( VMA(1), VMF(2), VMF(3), VMF(4), VMF(5) );
		return 0;
	case CG_R_RENDERSCENE:
#if 0
    if(views[cgvmi].fov_x == 0) {
      memcpy(&views[cgvmi], VMA(1), sizeof(refdef_t));
      Com_Printf(
        "fov_x: %f, fov_y: %f\n"
        "x: %i, y: %i\n"
        "originX: %f, originY: %f, originZ: %f\n"
        "axisX: %f, axisY: %f, axisZ: %f\n"
        "axisX: %f, axisY: %f, axisZ: %f\n"
        "axisX: %f, axisY: %f, axisZ: %f\n"
        "width: %i, height: %i\n"
        "time: %i\n", 
        views[cgvmi].fov_x, views[cgvmi].fov_y,
        views[cgvmi].x, views[cgvmi].y,
        views[cgvmi].vieworg[0], views[cgvmi].vieworg[1], views[cgvmi].vieworg[2],
        views[cgvmi].viewaxis[0][0], views[cgvmi].viewaxis[0][1], views[cgvmi].viewaxis[0][2],
        views[cgvmi].viewaxis[1][0], views[cgvmi].viewaxis[1][1], views[cgvmi].viewaxis[1][2],
        views[cgvmi].viewaxis[2][0], views[cgvmi].viewaxis[2][1], views[cgvmi].viewaxis[2][2],
        views[cgvmi].width, views[cgvmi].height,
        views[cgvmi].time);
    }
#endif
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] == -1)
			return 0;
#endif
    //X_DMG_DrawDamage((refdef_t*)VMA(1));
    //tc_vis_render();
		re.RenderScene( VMA(1) );
		return 0;
	case CG_R_SETCOLOR:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		re.SetColor( VMA(1) );
		return 0;
	case CG_R_DRAWSTRETCHPIC:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		re.DrawStretchPic( VMF(1), VMF(2), VMF(3), VMF(4), VMF(5), VMF(6), VMF(7), VMF(8), args[9] );
		return 0;
	case CG_R_MODELBOUNDS:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		re.ModelBounds( args[1], VMA(2), VMA(3) );
		return 0;
	case CG_R_LERPTAG:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] == -1)
      return qfalse;
    else
#endif
		return re.LerpTag( VMA(1), args[2], args[3], args[4], VMF(5), VMA(6) );
	case CG_GETGLCONFIG:
		VM_CHECKBOUNDS( cgvm, args[1], sizeof( glconfig_t ) );
		CL_GetGlconfig( VMA(1) );
		return 0;
	case CG_GETGAMESTATE:
		VM_CHECKBOUNDS( cgvm, args[1], sizeof( gameState_t ) );
		CL_GetGameState( VMA(1) );
		return 0;
	case CG_GETCURRENTSNAPSHOTNUMBER:
		CL_GetCurrentSnapshotNumber( VMA(1), VMA(2) );
		return 0;
	case CG_GETSNAPSHOT:
		return CL_GetSnapshot( args[1], VMA(2) );
	case CG_GETSERVERCOMMAND:
		return CL_GetServerCommand( args[1] );
	case CG_GETCURRENTCMDNUMBER:
		return CL_GetCurrentCmdNumber();
	case CG_GETUSERCMD:
		return CL_GetUserCmd( args[1], VMA(2) );
	case CG_SETUSERCMDVALUE:
		CL_SetUserCmdValue( args[1], VMF(2) );
		return 0;
	case CG_MEMORY_REMAINING:
		return Hunk_MemoryRemaining();
	case CG_KEY_ISDOWN:
		return Key_IsDown( args[1] );
	case CG_KEY_GETCATCHER:
		// keep console use a secret from cgame because freon/e+ has fuck-arounds with it
		// TODO: move console image settings to server-side
		return Key_GetCatcher() & ~KEYCATCH_CONSOLE;
	case CG_KEY_SETCATCHER:
		// Don't allow the cgame module to close the console
		Key_SetCatcher( args[1] | ( Key_GetCatcher( ) & KEYCATCH_CONSOLE ) );
		return 0;
	case CG_KEY_GETKEY:
		return Key_GetKey( VMA(1) );

	// shared syscalls
	case TRAP_MEMSET:
		VM_CHECKBOUNDS( cgvm, args[1], args[3] );
		Com_Memset( VMA(1), args[2], args[3] );
		return args[1];
	case TRAP_MEMCPY:
		VM_CHECKBOUNDS2( cgvm, args[1], args[2], args[3] );
		Com_Memcpy( VMA(1), VMA(2), args[3] );
		return args[1];
	case TRAP_STRNCPY:
		VM_CHECKBOUNDS( cgvm, args[1], args[3] );
		strncpy( VMA(1), VMA(2), args[3] );
		return args[1];
	case TRAP_SIN:
		return FloatAsInt( sin( VMF(1) ) );
	case TRAP_COS:
		return FloatAsInt( cos( VMF(1) ) );
	case TRAP_ATAN2:
		return FloatAsInt( atan2( VMF(1), VMF(2) ) );
	case TRAP_SQRT:
		return FloatAsInt( sqrt( VMF(1) ) );

	case CG_FLOOR:
		return FloatAsInt( floor( VMF(1) ) );
	case CG_CEIL:
		return FloatAsInt( ceil( VMF(1) ) );
	case CG_TESTPRINTINT:
		return sprintf( VMA(1), "%i", (int)args[2] );
	case CG_TESTPRINTFLOAT:
		return sprintf( VMA(1), "%f", VMF(2) );
	case CG_ACOS:
		return FloatAsInt( Q_acos( VMF(1) ) );

	case CG_PC_ADD_GLOBAL_DEFINE:
		return botlib_export->PC_AddGlobalDefine( VMA(1) );
	case CG_PC_LOAD_SOURCE:
		return botlib_export->PC_LoadSourceHandle( VMA(1) );
	case CG_PC_FREE_SOURCE:
		return botlib_export->PC_FreeSourceHandle( args[1] );
	case CG_PC_READ_TOKEN:
		return botlib_export->PC_ReadTokenHandle( args[1], VMA(2) );
	case CG_PC_SOURCE_FILE_AND_LINE:
		return botlib_export->PC_SourceFileAndLine( args[1], VMA(2), VMA(3) );

	case CG_S_STOPBACKGROUNDTRACK:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		S_StopBackgroundTrack();
		return 0;

	case CG_REAL_TIME:
		return Com_RealTime( VMA(1) );
	case CG_SNAPVECTOR:
		Sys_SnapVector( VMA(1) );
		return 0;

	case CG_CIN_PLAYCINEMATIC:
		return CIN_PlayCinematic(VMA(1), args[2], args[3], args[4], args[5], args[6]);

	case CG_CIN_STOPCINEMATIC:
		return CIN_StopCinematic(args[1]);

	case CG_CIN_RUNCINEMATIC:
		return CIN_RunCinematic_Fake(args[1]);

	case CG_CIN_DRAWCINEMATIC:
		CIN_DrawCinematic(args[1]);
		return 0;

	case CG_CIN_SETEXTENTS:
		CIN_SetExtents(args[1], args[2], args[3], args[4], args[5]);
		return 0;

	case CG_R_REMAP_SHADER:
		re.RemapShader( VMA(1), VMA(2), VMA(3) );
		return 0;

	case CG_LOADCAMERA:
		return loadCamera(VMA(1));

	case CG_STARTCAMERA:
		startCamera(args[1], args[2]);
		return 0;

	case CG_GETCAMERAINFO:
		return getCameraInfo(args[1], args[2], VMA(3), VMA(4), VMA(5));

	case CG_STOPCAMERA:
		stopCamera(args[1]);
		return 0;

	case CG_GET_ENTITY_TOKEN:
		VM_CHECKBOUNDS( cgvm, args[1], args[2] );
		return re.GetEntityToken( VMA(1), args[2] );

	case CG_R_INPVS:
		return re.inPVS( VMA(1), VMA(2) );

	// engine extensions
	case CG_R_ADDREFENTITYTOSCENE2:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		re.AddRefEntityToScene( VMA(1), qtrue );
		return 0;

	case CG_R_ADDLINEARLIGHTTOSCENE:
#ifdef USE_MULTIVM_CLIENT
		if(clientScreens[cgvmi][0] > -1)
#endif
		re.AddLinearLightToScene( VMA(1), VMA(2), VMF(3), VMF(4), VMF(5), VMF(6) );
		return 0;

	case CG_R_FORCEFIXEDDLIGHTS:
		CL_ForceFixedDlights();
		return 0;

	case CG_IS_RECORDING_DEMO:
		return clc.demorecording;

	case CG_TRAP_GETVALUE:
		VM_CHECKBOUNDS( cgvm, args[1], args[2] );
		return CL_GetValue( VMA(1), args[2], VMA(3) );

	default:
		Com_Error( ERR_DROP, "Bad cgame system trap: %ld", (long int) args[0] );
	}
	return 0;
}


/*
====================
CL_DllSyscall
====================
*/
#ifndef BUILD_GAME_STATIC
static 
#endif
intptr_t QDECL CL_DllSyscall( intptr_t arg, ... ) {
#ifdef USE_MULTIVM_CLIENT
	int prev = cgvmi;
#endif
	intptr_t result;
#if !id386 || defined __clang__
	intptr_t	args[10]; // max.count for cgame
	va_list	ap;
	int i;

	args[0] = arg;
	va_start( ap, arg );
	for (i = 1; i < ARRAY_LEN( args ); i++ )
		args[ i ] = va_arg( ap, intptr_t );
	va_end( ap );

	result = CL_CgameSystemCalls( args );
	
#else
	result = CL_CgameSystemCalls( &arg );
#endif
#ifdef USE_MULTIVM_CLIENT
	if(cgvmi != prev) {
		Com_Error( ERR_DROP, "Cgame changed while in callback %i -> %i\n", prev, cgvmi );
	}
#endif
	return result;
}


/*
====================
CL_InitCGame

Should only be called by CL_StartHunkUsers
====================
*/
static int				t1, t2;
void CL_InitCGame( int inVM ) {
	const char			*info;
	const char			*mapname;
	vmInterpret_t		interpret;
#ifdef USE_ASYNCHRONOUS
	unsigned result;
#endif
#ifdef USE_PRINT_CONSOLE
  Com_PrintFlags(PC_INIT);
#endif
#ifdef USE_MULTIVM_CLIENT
//  int prev = cgvmi; // must use this pattern here because of compiler template
  if(inVM == -1) {
    cgvmi = 0;
  } else {
    cgvmi = inVM;
  }
  int igs = cgvmi;
#endif

	t1 = Sys_Milliseconds();

#ifndef USE_NO_CONSOLE
	// put away the console
	Con_Close();
#endif

	// find the current mapname
	info = cl.gameState.stringData + cl.gameState.stringOffsets[ CS_SERVERINFO ];
	mapname = Info_ValueForKey( info, "mapname" );
	Com_sprintf( cl.mapname, sizeof( cl.mapname ), "maps/%s.bsp", mapname );

	// allow vertex lighting for in-game elements
	re.VertexLighting( qtrue );

	// load the dll or bytecode
	interpret = Cvar_VariableIntegerValue( "vm_cgame" );
	if ( cl_connectedToPureServer )
	{
		// if sv_pure is set we only allow qvms to be loaded
		if ( interpret != VMI_COMPILED && interpret != VMI_BYTECODE )
			interpret = VMI_COMPILED;
	}

#ifndef BUILD_GAME_STATIC
#if defined(USE_LIVE_RELOAD) || defined(USE_LAZY_MEMORY)
  if(cgvm) {
    cgvm = VM_Restart(cgvm);
  } else
#endif
#endif
		cgvm = VM_Create( VM_CGAME, CL_CgameSystemCalls, CL_DllSyscall, interpret );

	if ( !cgvm ) {
#ifdef USE_ASYNCHRONOUS
		cls.cgameStarted = qfalse;
		Com_Printf( S_COLOR_RED "VM_Create on cgame failed\n" );
		return;
#else
		Com_Error( ERR_DROP, "VM_Create on cgame failed" );
#endif
	}
	cls.state = CA_LOADING;

	// init for this gamestate
	// use the lastExecutedServerCommand instead of the serverCommandSequence
	// otherwise server commands sent just before a gamestate are dropped
#ifdef USE_ASYNCHRONOUS
	result = 
#endif
	VM_Call( cgvm, 3, CG_INIT, clc.serverMessageSequence, clc.lastExecutedServerCommand, clc.clientNum );

  // do not allow vid_restart for first time
	cls.lastVidRestart = Sys_Milliseconds();

#ifdef USE_ASYNCHRONOUS
  //cgvmi = prev; // set to previous in case this was called from a GameCommand()
  //re.SwitchWorld(cgvmi);

	// if the VM was suspended during initialization, we'll finish initialization later
	if (result == 0xDEADBEEF) {
		return;
	}

#endif

	// reset any CVAR_CHEAT cvars registered by cgame
	if ( !clc.demoplaying && !cl_connectedToCheatServer )
		Cvar_SetCheatState();

	// we will send a usercmd this frame, which
	// will cause the server to send us the first snapshot
	cls.state = CA_PRIMED;

	t2 = Sys_Milliseconds();

#ifdef USE_MULTIVM_CLIENT
	Com_Printf( "%s (%i): %5.2f seconds\n", __func__, cgvmi, (t2-t1)/1000.0 );
#else
  Com_Printf( "%s: %5.2f seconds\n", __func__, (t2-t1)/1000.0 );
#endif

	// have the renderer touch all its images, so they are present
	// on the card even if the driver does deferred loading
	re.EndRegistration();

	// make sure everything is paged in
	if (!Sys_LowPhysicalMemory()) {
		Com_TouchMemory();
	}

	// clear anything that got printed
#ifdef USE_MULTIVM_CLIENT
	if(inVM == -1)
#endif
#ifndef USE_NO_CONSOLE
	Con_ClearNotify ();
#endif

	// do not allow vid_restart for first time
	cls.lastVidRestart = Sys_Milliseconds();
//#ifdef USE_MULTIVM_CLIENT
//  cgvmi = prev; // set to previous in case this was called from a GameCommand()
//  re.SwitchWorld(cgvmi);
//#endif
#ifdef USE_PRINT_CONSOLE
  Com_PrintFlags(PC_INIT);
#endif
}


/*
====================
CL_GameCommand

See if the current console command is claimed by the cgame
====================
*/
qboolean CL_GameCommand( void ) {
#ifdef USE_MULTIVM_CLIENT
	cgvmi = clc.currentView;
  int igs = clientGames[cgvmi];
	CM_SwitchMap(clientMaps[cgvmi]);
#endif

	if ( !cgvm ) {
		return qfalse;
	}

  if ( Q_stricmp( Cmd_Argv(0), "callvote" ) == 0
    && clc.demofile != FS_INVALID_HANDLE ) {
    Com_Printf("Voting during demo playback is disabled\n");
    return qfalse;
  }

#ifdef USE_ASYNCHRONOUS
	// it's possible (and happened in Q3F) that the game executes a console command
	// before the frame has resumed the vm
	if (VM_IsSuspended(cgvm)) {
		return qfalse;
	}
#endif

	return VM_Call( cgvm, 0, CG_CONSOLE_COMMAND );
}


/*
=====================
CL_CGameRendering
=====================
*/
void CL_CGameRendering( stereoFrame_t stereo ) {
#ifdef USE_MULTIVM_CLIENT
  VM_Call( cgvm, 3, CG_DRAW_ACTIVE_FRAME, cl.serverTimes[clientGames[clc.currentView]], stereo, clc.demoplaying );
#else
  VM_Call( cgvm, 3, CG_DRAW_ACTIVE_FRAME, cl.serverTime, stereo, clc.demoplaying );
#endif
#ifdef DEBUG
	VM_Debug( 0 );
#endif
}


/*
=================
CL_AdjustTimeDelta

Adjust the clients view of server time.

We attempt to have cl.serverTime exactly equal the server's view
of time plus the timeNudge, but with variable latencies over
the internet it will often need to drift a bit to match conditions.

Our ideal time would be to have the adjusted time approach, but not pass,
the very latest snapshot.

Adjustments are only made when a new snapshot arrives with a rational
latency, which keeps the adjustment process framerate independent and
prevents massive overadjustment during times of significant packet loss
or bursted delayed packets.
=================
*/

#define	RESET_TIME	500

static void CL_AdjustTimeDelta( void ) {
	int		newDelta;
	int		deltaDelta;
#ifdef USE_MULTIVM_CLIENT
	int igs = clientGames[cgvmi];
#endif

	cl.newSnapshots = qfalse;

	// the delta never drifts when replaying a demo
	if ( clc.demoplaying ) {
		return;
	}

	newDelta = cl.snap.serverTime - cls.realtime;
	deltaDelta = abs( newDelta - cl.serverTimeDelta );

	if ( deltaDelta > RESET_TIME ) {
		cl.serverTimeDelta = newDelta;
		cl.oldServerTime = cl.snap.serverTime;	// FIXME: is this a problem for cgame?
#ifdef USE_MULTIVM_CLIENT
		cl.serverTimes[0] = cl.snap.serverTime;
#else
    cl.serverTime = cl.snap.serverTime;
#endif
		if ( cl_showTimeDelta->integer ) {
			Com_Printf( "<RESET> " );
		}
	} else if ( deltaDelta > 100 ) {
		// fast adjust, cut the difference in half
		if ( cl_showTimeDelta->integer ) {
			Com_Printf( "<FAST> " );
		}
		cl.serverTimeDelta = ( cl.serverTimeDelta + newDelta ) >> 1;
	} else {
		// slow drift adjust, only move 1 or 2 msec

		// if any of the frames between this and the previous snapshot
		// had to be extrapolated, nudge our sense of time back a little
		// the granularity of +1 / -2 is too high for timescale modified frametimes
		if ( com_timescale->value == 0 || com_timescale->value == 1 ) {
			if ( cl.extrapolatedSnapshot ) {
				cl.extrapolatedSnapshot = qfalse;
				cl.serverTimeDelta -= 2;
			} else {
				// otherwise, move our sense of time forward to minimize total latency
				cl.serverTimeDelta++;
			}
		}
	}

	if ( cl_showTimeDelta->integer ) {
		Com_Printf( "%i ", cl.serverTimeDelta );
	}
}


/*
==================
CL_FirstSnapshot
==================
*/
static void CL_FirstSnapshot( void ) {
#ifdef USE_MULTIVM_CLIENT
	int igs = clientGames[cgvmi];
#endif

	// ignore snapshots that don't have entities
	if ( cl.snap.snapFlags & SNAPFLAG_NOT_ACTIVE ) {
		return;
	}
	cls.state = CA_ACTIVE;

	// clear old game so we will not switch back to old mod on disconnect
	CL_ResetOldGame();

	// set the timedelta so we are exactly on this first frame
	cl.serverTimeDelta = cl.snap.serverTime - cls.realtime;
	cl.oldServerTime = cl.snap.serverTime;

	clc.timeDemoBaseTime = cl.snap.serverTime;

	// if this is the first frame of active play,
	// execute the contents of activeAction now
	// this is to allow scripting a timedemo to start right
	// after loading
	if ( cl_activeAction->string[0] ) {
		Cbuf_AddText( cl_activeAction->string );
		Cbuf_AddText( "\n" );
		Cvar_Set( "activeAction", "" );
	}

	Sys_BeginProfiling();
}


/*
==================
CL_AvgPing

Calculates Average Ping from snapshots in buffer. Used by AutoNudge.
==================
*/
static float CL_AvgPing( void ) {
	int ping[PACKET_BACKUP];
	int count = 0;
	int i, j, iTemp;
	float result;
#ifdef USE_MULTIVM_CLIENT
	int igs = clientGames[cgvmi];
#endif

	for ( i = 0; i < PACKET_BACKUP; i++ ) {
		if ( cl.snapshots[i].ping > 0 && cl.snapshots[i].ping < 999 ) {
			ping[count] = cl.snapshots[i].ping;
			count++;
		}
	}

	if ( count == 0 )
		return 0;

	// sort ping array
	for ( i = count - 1; i > 0; --i ) {
		for ( j = 0; j < i; ++j ) {
			if (ping[j] > ping[j + 1]) {
				iTemp = ping[j];
				ping[j] = ping[j + 1];
				ping[j + 1] = iTemp;
			}
		}
	}

	// use median average ping
	if ( (count % 2) == 0 )
		result = (ping[count / 2] + ping[(count / 2) - 1]) / 2.0f;
	else
		result = ping[count / 2];

	return result;
}


/*
==================
CL_TimeNudge

Returns either auto-nudge or cl_timeNudge value.
==================
*/
static int CL_TimeNudge( void ) {
	float autoNudge = cl_autoNudge->value;

	if ( autoNudge != 0.0f )
		return (int)((CL_AvgPing() * autoNudge) + 0.5f) * -1;
	else
		return cl_timeNudge->integer;
}


/*
==================
CL_SetCGameTime
==================
*/
void CL_SetCGameTime( void ) {
	qboolean demoFreezed;
#ifdef USE_MULTIVM_CLIENT
  int igs = clientGames[cgvmi];
	CM_SwitchMap(clientMaps[cgvmi]);
#endif

	// getting a valid frame message ends the connection process
	if ( cls.state != CA_ACTIVE ) {
		if ( cls.state != CA_PRIMED ) {
			return;
		}
		if ( clc.demoplaying ) {
			// we shouldn't get the first snapshot on the same frame
			// as the gamestate, because it causes a bad time skip
			if ( !clc.firstDemoFrameSkipped ) {
				clc.firstDemoFrameSkipped = qtrue;
				return;
			}
			CL_ReadDemoMessage();
		}
		if ( cl.newSnapshots ) {
			cl.newSnapshots = qfalse;
			CL_FirstSnapshot();
		}
		if ( cls.state != CA_ACTIVE ) {
			return;
		}
	}

	// if we have gotten to this point, cl.snap is guaranteed to be valid
	if ( !cl.snap.valid ) {
#ifdef USE_MULTIVM_CLIENT
    Com_Error( ERR_DROP, "%s: !cl.snap.valid (%i)", __func__, igs );
#else
		Com_Error( ERR_DROP, "%s: !cl.snap.valid", __func__ );
#endif
	}

	// allow pause in single player
	if ( sv_paused->integer && CL_CheckPaused() && com_sv_running->integer ) {
		// paused
		return;
	}

#ifndef USE_MULTIVM_CLIENT
	if ( cl.snap.serverTime - cl.oldFrameServerTime < 0 && !clc.demoplaying ) {
		Com_Error( ERR_DROP, "cl.snap.serverTime < cl.oldFrameServerTime" );
	}
#endif
	cl.oldFrameServerTime = cl.snap.serverTime;

	// get our current view of time
	demoFreezed = clc.demoplaying && com_timescale->value == 0.0f;
	if ( demoFreezed ) {
		// \timescale 0 is used to lock a demo in place for single frame advances
		cl.serverTimeDelta -= cls.frametime;
	} else {
		// cl_timeNudge is a user adjustable cvar that allows more
		// or less latency to be added in the interest of better
		// smoothness or better responsiveness.
#ifdef USE_MULTIVM_CLIENT
    cl.serverTimes[0] = cls.realtime + cl.serverTimeDelta - CL_TimeNudge();
		/*if(cl.serverTimes[igs] > cl.serverTimes[clientGames[clc.currentView]]) {
			Com_Printf("updating times: %i -> %i: %i\n", igs, clientGames[clc.currentView], cl.serverTimes[igs]);
			cl.oldServerTime = cl.serverTimes[clientGames[clc.currentView]] = cl.serverTimes[igs];
		}*/
		if ( cl.serverTimes[0] <= cl.snap.serverTime ) {
			cl.serverTimes[0] = cl.snap.serverTime + 2;
		}
		if ( cl.serverTimes[0] < cl.oldServerTime ) {
			cl.serverTimes[0] = cl.oldServerTime;
		}
		cl.oldServerTime = cl.serverTimes[0];
#else
		cl.serverTime = cls.realtime + cl.serverTimeDelta - CL_TimeNudge();

		// guarantee that time will never flow backwards, even if
		// serverTimeDelta made an adjustment or cl_timeNudge was changed
		if ( cl.serverTime - cl.oldServerTime < 0 ) {
			cl.serverTime = cl.oldServerTime;
		}
		cl.oldServerTime = cl.serverTime;
#endif

		// note if we are almost past the latest frame (without timeNudge),
		// so we will try and adjust back a bit when the next snapshot arrives
		//if ( cls.realtime + cl.serverTimeDelta >= cl.snap.serverTime - 5 ) {
		if ( cls.realtime + cl.serverTimeDelta - cl.snap.serverTime >= -5 ) {
			cl.extrapolatedSnapshot = qtrue;
		}
	}

	// if we have gotten new snapshots, drift serverTimeDelta
	// don't do this every frame, or a period of packet loss would
	// make a huge adjustment
	if ( cl.newSnapshots ) {
		CL_AdjustTimeDelta();
	}

	if ( !clc.demoplaying ) {
		return;
	}

	// if we are playing a demo back, we can just keep reading
	// messages from the demo file until the cgame definitely
	// has valid snapshots to interpolate between

	// a timedemo will always use a deterministic set of time samples
	// no matter what speed machine it is run on,
	// while a normal demo may have different time samples
	// each time it is played back
  if ( com_timedemo->integer ) {
    if ( !clc.timeDemoStart ) {
      clc.timeDemoStart = Sys_Milliseconds();
    }
    clc.timeDemoFrames++;
#ifdef USE_MULTIVM_CLIENT
    cl.serverTimes[0] = clc.timeDemoBaseTime + clc.timeDemoFrames * 50;
#else
    cl.serverTime = clc.timeDemoBaseTime + clc.timeDemoFrames * 50;
#endif
  }

#ifdef USE_MULTIVM_CLIENT
  while ( cl.serverTimes[0] - cl.snapWorlds[igs].serverTime >= 0 )
#else
  while ( cl.serverTime - cl.snap.serverTime >= 0 )
#endif
  {
    // feed another messag, which should change
    // the contents of cl.snap
    CL_ReadDemoMessage();
    if ( cls.state != CA_ACTIVE ) {
      return; // end of demo
    }
  }
}
