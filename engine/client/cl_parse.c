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
// cl_parse.c  -- parse a message received from the server

#include "client.h"

static const char *svc_strings[256] = {
	"svc_bad",

	"svc_nop",
	"svc_gamestate",
	"svc_configstring",
	"svc_baseline",	
	"svc_serverCommand",
	"svc_download",
	"svc_snapshot",
	"svc_EOF",
	"svc_voipSpeex", // ioq3 extension
	"svc_voipOpus",  // ioq3 extension
#ifdef USE_MV
	NULL, // 11
	NULL, // 12
	NULL, // 13
	NULL, // 14
	NULL, // 15
	"svc_multiview",  // 1.32e multiview extension
#ifdef USE_MV_ZCMD
	"svc_zcmd",       // LZ-compressed version of svc_serverCommand
#endif
#endif
};

void SHOWNET( msg_t *msg, const char *s ) {
	if ( cl_shownet->integer >= 2) {
		Com_Printf ("%3i:%s\n", msg->readcount-1, s);
	}
}


/*
=========================================================================

MESSAGE PARSING

=========================================================================
*/

/*
==================
CL_DeltaEntity

Parses deltas from the given base and adds the resulting entity
to the current frame
==================
*/
#ifdef USE_MULTIVM_CLIENT
static void CL_DeltaEntity( msg_t *msg, clSnapshot_t *frame, int newnum, const entityState_t *old, qboolean unchanged, int igs) 
#else
static void CL_DeltaEntity( msg_t *msg, clSnapshot_t *frame, int newnum, const entityState_t *old, qboolean unchanged) 
#endif
{
	entityState_t	*state;

	// save the parsed entity state into the big circular buffer so
	// it can be used as the source for a later delta
#ifdef USE_MULTIVM_CLIENT
  state = &cl.parseEntities[cl.parseEntitiesNumWorlds[igs] & (MAX_PARSE_ENTITIES-1)];
#else  
	state = &cl.parseEntities[cl.parseEntitiesNum & (MAX_PARSE_ENTITIES-1)];
#endif

	if ( unchanged ) {
		*state = *old;
	} else {
		MSG_ReadDeltaEntity( msg, old, state, newnum );
	}

	if ( state->number == (MAX_GENTITIES-1) ) {
		return;		// entity was delta removed
	}
#ifdef USE_MULTIVM_CLIENT
	cl.parseEntitiesNumWorlds[igs]++;
#else
  cl.parseEntitiesNum++;
#endif
	frame->numEntities++;
}


/*
==================
CL_ParsePacketEntities
==================
*/
#ifdef USE_MULTIVM_CLIENT
static void CL_ParsePacketEntities( msg_t *msg, const clSnapshot_t *oldframe, clSnapshot_t *newframe, int igs ) 
#else
static void CL_ParsePacketEntities( msg_t *msg, const clSnapshot_t *oldframe, clSnapshot_t *newframe ) 
#endif
{
	const entityState_t	*oldstate;
	int	newnum;
	int	oldindex, oldnum;

#ifdef USE_MULTIVM_CLIENT
  newframe->parseEntitiesNum = cl.parseEntitiesNumWorlds[igs];
#else
	newframe->parseEntitiesNum = cl.parseEntitiesNum;
#endif
	newframe->numEntities = 0;

	// delta from the entities present in oldframe
	oldindex = 0;
	oldstate = NULL;
	if ( !oldframe ) {
		oldnum = MAX_GENTITIES+1;
	} else {
		if ( oldindex >= oldframe->numEntities ) {
			oldnum = MAX_GENTITIES+1;
		} else {
			oldstate = &cl.parseEntities[
				(oldframe->parseEntitiesNum + oldindex) & (MAX_PARSE_ENTITIES-1)];
			oldnum = oldstate->number;
		}
	}

	while ( 1 ) {
		// read the entity index number
		newnum = MSG_ReadBits( msg, GENTITYNUM_BITS );

		if ( newnum == (MAX_GENTITIES-1) ) {
			break;
		}

		if ( msg->readcount > msg->cursize ) {
			Com_Error (ERR_DROP,"CL_ParsePacketEntities: end of message");
		}

		while ( oldnum < newnum ) {
			// one or more entities from the old packet are unchanged
			if ( cl_shownet->integer == 3 ) {
				Com_Printf ("%3i:  unchanged: %i\n", msg->readcount, oldnum);
			}
#ifdef USE_MULTIVM_CLIENT
			CL_DeltaEntity( msg, newframe, oldnum, oldstate, qtrue, igs );
#else
			CL_DeltaEntity( msg, newframe, oldnum, oldstate, qtrue);
#endif

			oldindex++;

			if ( oldindex >= oldframe->numEntities ) {
				oldnum = MAX_GENTITIES+1;
			} else {
				oldstate = &cl.parseEntities[
					(oldframe->parseEntitiesNum + oldindex) & (MAX_PARSE_ENTITIES-1)];
				oldnum = oldstate->number;
			}
		}
		if (oldnum == newnum) {
			// delta from previous state
			if ( cl_shownet->integer == 3 ) {
				Com_Printf ("%3i:  delta: %i\n", msg->readcount, newnum);
			}
#ifdef USE_MULTIVM_CLIENT
			CL_DeltaEntity( msg, newframe, newnum, oldstate, qfalse, igs );
#else
			CL_DeltaEntity( msg, newframe, newnum, oldstate, qfalse );
#endif

			oldindex++;

			if ( oldindex >= oldframe->numEntities ) {
				oldnum = MAX_GENTITIES+1;
			} else {
				oldstate = &cl.parseEntities[
					(oldframe->parseEntitiesNum + oldindex) & (MAX_PARSE_ENTITIES-1)];
				oldnum = oldstate->number;
			}
			continue;
		}

		if ( oldnum > newnum ) {
			// delta from baseline
			if ( cl_shownet->integer == 3 ) {
				Com_Printf ("%3i:  baseline: %i\n", msg->readcount, newnum);
			}
#ifdef USE_MULTIVM_CLIENT
			CL_DeltaEntity( msg, newframe, newnum, &cl.entityBaselines[newnum], qfalse, igs );
#else
			CL_DeltaEntity( msg, newframe, newnum, &cl.entityBaselines[newnum], qfalse );
#endif
			continue;
		}

	}

	// any remaining entities in the old frame are copied over
	while ( oldnum != MAX_GENTITIES+1 ) {
		// one or more entities from the old packet are unchanged
		if ( cl_shownet->integer == 3 ) {
			Com_Printf ("%3i:  unchanged: %i\n", msg->readcount, oldnum);
		}
#ifdef USE_MULTIVM_CLIENT
		CL_DeltaEntity( msg, newframe, oldnum, oldstate, qtrue, igs );
#else
		CL_DeltaEntity( msg, newframe, oldnum, oldstate, qtrue );
#endif

		oldindex++;

		if ( oldindex >= oldframe->numEntities ) {
			oldnum = MAX_GENTITIES+1;
		} else {
			oldstate = &cl.parseEntities[
				(oldframe->parseEntitiesNum + oldindex) & (MAX_PARSE_ENTITIES-1)];
			oldnum = oldstate->number;
		}
	}
}

void CL_AddLagometerSnapshotInfo(clSnapshot_t *snapshot);

/*
================
CL_ParseSnapshot

If the snapshot is parsed properly, it will be copied to
cl.snap and saved in cl.snapshots[].  If the snapshot is invalid
for any reason, no changes to the state will be made at all.
================
*/
#ifdef USE_MULTIVM_CLIENT
void CL_ParseSnapshot( msg_t *msg, int multiview ) 
#else
#ifdef USE_MV
void CL_ParseSnapshot( msg_t *msg, qboolean multiview )
#else
void CL_ParseSnapshot( msg_t *msg )
#endif
#endif
{
	const clSnapshot_t *old;
	clSnapshot_t	newSnap;
	int			deltaNum;
	int			oldMessageNum;
	int			i, n, packetNum;
	int			commandTime;
#ifdef USE_MV
	int			clientNum;
	entityState_t	*es;
	const playerState_t *oldPs;

	int firstIndex;
	int lastIndex;
#endif // USE_MV
#ifdef USE_MULTIVM_CLIENT
	int igs;
	if(multiview == -1)
		igs = clientGames[clc.currentView];
	else
		igs = multiview;
	newSnap.world = igs;
#endif

	// get the reliable sequence acknowledge number
	// NOTE: now sent with all server to client messages
	//clc.reliableAcknowledge = MSG_ReadLong( msg );

	// read in the new snapshot to a temporary buffer
	// we will only copy to cl.snap if it is valid
	Com_Memset (&newSnap, 0, sizeof(newSnap));

	// we will have read any new server commands in this
	// message before we got to svc_snapshot
	newSnap.serverCommandNum = clc.serverCommandSequence;

	newSnap.serverTime = MSG_ReadLong( msg ) - serverShift;

	// if we were just unpaused, we can only *now* really let the
	// change come into effect or the client hangs.
	cl_paused->modified = qfalse;

	newSnap.messageNum = clc.serverMessageSequence;

	deltaNum = MSG_ReadByte( msg );
	if ( !deltaNum ) {
		newSnap.deltaNum = -1;
	} else {
		newSnap.deltaNum = newSnap.messageNum - deltaNum;
	}
	newSnap.snapFlags = MSG_ReadByte( msg );

	// If the frame is delta compressed from data that we
	// no longer have available, we must suck up the rest of
	// the frame, but not use it, then ask for a non-compressed
	// message 
	if ( newSnap.deltaNum <= 0 ) {
		newSnap.valid = qtrue;		// uncompressed frame
		old = NULL;
		clc.demowaiting = qfalse;	// we can start recording now
	} else {
#ifndef USE_MULTIVM_CLIENT
		old = &cl.snapshots[newSnap.deltaNum & PACKET_MASK];
#else
    old = &cl.snapshotWorlds[igs][newSnap.deltaNum & PACKET_MASK];
		if ( igs == -1 )
#endif
    {
			if ( !old->valid ) {
				// should never happen
				Com_Printf ("Delta from invalid frame (not supposed to happen!).\n");
			} else if ( old->messageNum != newSnap.deltaNum ) {
				// The frame that the server did the delta from
				// is too old, so we can't reconstruct it properly.
				Com_Printf ("Delta frame too old.\n");
#ifdef USE_MULTIVM_CLIENT
      } else if ( cl.parseEntitiesNumWorlds[igs] - old->parseEntitiesNum > MAX_PARSE_ENTITIES - MAX_SNAPSHOT_ENTITIES ) {
#else
      } else if ( cl.parseEntitiesNum - old->parseEntitiesNum > MAX_PARSE_ENTITIES - MAX_SNAPSHOT_ENTITIES ) {
#endif
				Com_Printf ("Delta parseEntitiesNum too old.\n");
			} else {
				newSnap.valid = qtrue;	// valid delta parse
			}
		}

		if(clc.demoplaying) {
			newSnap.valid = qtrue;
		}
	}

#ifdef USE_MV
#ifdef USE_MULTIVM_CLIENT
	if ( multiview > -1 ) 
#else
	if ( multiview ) 
#endif
	{
		if ( !clc.demoplaying && clc.recordfile != FS_INVALID_HANDLE )
			clc.dm68compat = qfalse;

		newSnap.multiview = qtrue;
		newSnap.snapFlags |= SNAPFLAG_MULTIVIEW; // to inform CGAME module in runtime

		commandTime = 0;

		if ( old && old->multiview ) {
			Com_Memcpy( newSnap.clientMask, old->clientMask, sizeof( newSnap.clientMask ) );
			newSnap.mergeMask = old->mergeMask;
			newSnap.version = old->version;
		} else {
			// already zeroed as new snapshot
		}

		SHOWNET( msg, "version" );
		if ( MSG_ReadBits( msg, 1 ) ) {
			newSnap.version = MSG_ReadByte( msg );
			newSnap.valid = qtrue;
			old = NULL;
		}

#ifdef USE_MULTIVM_CLIENT
		if ( newSnap.deltaNum <= 0 ) {
			newSnap.valid = qtrue;
			old = NULL;
		} else {
			//newSnap.deltaNum = cl.snap.messageNum - deltaNum;
			old = &cl.snapshots[newSnap.deltaNum & PACKET_MASK];
			if ( !old->valid ) {
				// should never happen
				Com_Printf ("Delta from invalid frame (not supposed to happen!): %i -> %i.\n", igs, newSnap.deltaNum);
			} else if ( old->messageNum != newSnap.deltaNum ) {
				// The frame that the server did the delta from
				// is too old, so we can't reconstruct it properly.
				Com_Printf ("Delta frame too old: %i -> %i != %i != %i.\n", igs, newSnap.deltaNum, old->messageNum, cl.snapshots[newSnap.deltaNum + 1 & PACKET_MASK].messageNum);
			} else if ( cl.parseEntitiesNumWorlds[igs] - old->parseEntitiesNum > MAX_PARSE_ENTITIES - MAX_SNAPSHOT_ENTITIES ) {
				Com_Printf ("Delta parseEntitiesNum too old.\n");
			} else {
				if(old && old->multiview) {
					if(old->valid) {
						newSnap.valid = qtrue;
					}
					Com_Memcpy( newSnap.clientMask, old->clientMask, sizeof( newSnap.clientMask ) );
					newSnap.mergeMask = old->mergeMask;
					newSnap.version = old->version;
				}
			}
		}
//printf("Parsing world: %i (%i -> %i -> %i)\n", igs, deltaNum, newSnap.messageNum, clc.reliableAcknowledge);
#endif

		// from here we can start version-dependent snapshot parsing
		if ( newSnap.version != MV_PROTOCOL_VERSION ) {
			Com_Error( ERR_DROP, "CL_ParseSnapshot(): unknown multiview protocol version %i",
				newSnap.version );
		}

		// playerState to entityState merge mask
		SHOWNET( msg, "mergemask" );
		if ( MSG_ReadBits( msg, 1 ) ) {
			newSnap.mergeMask = MSG_ReadBits( msg, SM_BITS );
		}

		// playerstate mask
		SHOWNET( msg, "psMask" );
		while ( MSG_ReadBits( msg, 1 ) ) {
			firstIndex = MSG_ReadBits( msg, 3 ); // 0..7
			lastIndex = MSG_ReadBits( msg, 3 );  // 0..7
			//for ( i = firstIndex; i < lastIndex + 1; i++ ) {
			for ( ; firstIndex < lastIndex + 1; firstIndex++ ) {
			//	newSnap.clientMask[ firstIndex ] = MSG_ReadByte( msg ); // direct mask
				newSnap.clientMask[ firstIndex ] ^= MSG_ReadByte( msg ); // delta-xor mask
			}
		}
		
		// read playerstates
		for ( clientNum = 0; clientNum < MAX_CLIENTS; clientNum++ ) {

			if ( !GET_ABIT( newSnap.clientMask, clientNum ) )
				continue; // not masked, skip
	
			// areamask
			SHOWNET( msg, "areamask" );
			newSnap.clps[ clientNum ].areabytes = MSG_ReadBits( msg, 6 ); // was MSG_ReadByte( msg );
			if ( newSnap.clps[ clientNum ].areabytes > sizeof( newSnap.clps[ clientNum ].areamask ) ) {
				Com_Error( ERR_DROP,"CL_ParseSnapshot: Invalid size %d for areamask in clps#%d",
					newSnap.clps[ clientNum ].areabytes, clientNum );
				return;
			}
			MSG_ReadData( msg, &newSnap.clps[ clientNum ].areamask, newSnap.clps[ clientNum ].areabytes );
		
			// playerstate
			SHOWNET( msg, "playerstate" );
			if ( old ) {
				if ( !old->multiview && clientNum == clc.clientNum ) {
					// transition to multiview?
					oldPs = &old->ps;
				} else if ( old->clps[ clientNum ].valid ) {
					Com_Memcpy( newSnap.clps[ clientNum ].entMask, old->clps[ clientNum ].entMask, sizeof( newSnap.clps[ clientNum ].entMask ) );
					oldPs = &old->clps[ clientNum ].ps;
				} else {
					oldPs = NULL;
				}
			} else {
				oldPs = NULL;
			}

			MSG_ReadDeltaPlayerstate( msg, oldPs, &newSnap.clps[ clientNum ].ps );

			// spectated (pramary?) playerstate ping
			//if ( clientNum == clientWorlds[0] ) // clc.clientNum?
			//	commandTime = newSnap.clps[ clientNum ].ps.commandTime;

			// entity mask
			SHOWNET( msg, "entity mask" );
#if 1
			while ( MSG_ReadBits( msg, 1 ) ) {
				firstIndex = MSG_ReadBits( msg, 7 ); // 0..127
				lastIndex = MSG_ReadBits( msg, 7 );  // 0..127
				for ( i = firstIndex; i < lastIndex + 1; i++ ) {
					//newSnap.clps[ clientNum ].entMask[ i ] = MSG_ReadByte( msg ); // direct mask
					newSnap.clps[ clientNum ].entMask[ i ] ^= MSG_ReadByte( msg ); // delta-xor mask
				}
			}
#else
			MSG_ReadData( msg, &newSnap.clps[ clientNum ].entMask, sizeof( newSnap.clps[ clientNum ].entMask ) );
#endif
			newSnap.clps[ clientNum ].valid = qtrue;

#ifdef USE_MULTIVM_CLIENT
			if ( clientNum == clientWorlds[igs] /* clc.clientNum */ ) 
#else
			if ( clientNum == clc.clientNum ) 
#endif
			{
				// copy data to primary playerstate
				Com_Memcpy( &newSnap.areamask, &newSnap.clps[ clientNum ].areamask, sizeof( newSnap.areamask ) );
				Com_Memcpy( &newSnap.ps, &newSnap.clps[ clientNum ].ps, sizeof( newSnap.ps ) );
			}
		} // for [all clients]

		commandTime = newSnap.ps.commandTime;

		// read packet entities
		SHOWNET( msg, "packet entities" );
#ifdef USE_MULTIVM_CLIENT
		CL_ParsePacketEntities( msg, old, &newSnap, igs );
#else
		CL_ParsePacketEntities( msg, old, &newSnap );
#endif

		// apply skipmask to player entities
		if ( newSnap.mergeMask ) {
			for ( i = 0; i < newSnap.numEntities; i++ ) {
				es = &cl.parseEntities[ (newSnap.parseEntitiesNum + i) & (MAX_PARSE_ENTITIES-1)];
				if ( es->number >= MAX_CLIENTS )
					break;
				if ( newSnap.clps[ es->number ].valid ) {
					//es->eFlags |= EF_TELEPORT_BIT;
					MSG_PlayerStateToEntityState( &newSnap.clps[ es->number ].ps, es, qtrue, newSnap.mergeMask );
				}
			}
		}
	}
	else // !multiview
#endif // USE_MV
	{
#ifdef USE_MV
		// detect transition to non-multiview
		if ( cl.snap.multiview ) {
			if ( old ) {
				// invalidate state
				memset( (void *)&old->clps, 0, sizeof( old->clps ) );
				Com_DPrintf( S_COLOR_CYAN "transition from multiview to legacy stream\n" );
			}
		}
#endif

		// read areamask
		newSnap.areabytes = MSG_ReadByte( msg );
		
		if ( newSnap.areabytes > sizeof(newSnap.areamask) )
		{
			Com_Error( ERR_DROP,"CL_ParseSnapshot: Invalid size %d for areamask", newSnap.areabytes );
			return;
		}
		
		MSG_ReadData( msg, &newSnap.areamask, newSnap.areabytes );

		// read playerinfo
		SHOWNET( msg, "playerstate" );
		if ( old ) {
			MSG_ReadDeltaPlayerstate( msg, &old->ps, &newSnap.ps );
		} else {
			MSG_ReadDeltaPlayerstate( msg, NULL, &newSnap.ps );
		}

		commandTime = newSnap.ps.commandTime;

		// read packet entities
		SHOWNET( msg, "packet entities" );
#ifdef USE_MULTIVM_CLIENT
		CL_ParsePacketEntities( msg, old, &newSnap, igs );
#else
		CL_ParsePacketEntities( msg, old, &newSnap );
#endif

	} // USE_MV !extended snapshot

	// if not valid, dump the entire thing now that it has
	// been properly read
	if ( !newSnap.valid ) {
    CL_AddLagometerSnapshotInfo(NULL);
		return;
	}

	// clear the valid flags of any snapshots between the last
	// received and this one, so if there was a dropped packet
	// it won't look like something valid to delta from next
	// time we wrap around in the buffer
  oldMessageNum = cl.snap.messageNum + 1;

	if ( newSnap.messageNum - oldMessageNum >= PACKET_BACKUP ) {
		oldMessageNum = newSnap.messageNum - ( PACKET_BACKUP - 1 );
	}

	for ( i = 0, n = newSnap.messageNum - oldMessageNum; i < n; i++ ) {
		cl.snapshots[ ( oldMessageNum + i ) & PACKET_MASK ].valid = qfalse;
	}

	// copy to the current good spot
	cl.snap = newSnap;
	cl.snap.ping = 999;
	// calculate ping time
	for ( i = 0 ; i < PACKET_BACKUP ; i++ ) {
		packetNum = ( clc.netchan.outgoingSequence - 1 - i ) & PACKET_MASK;
		if ( cl.snap.ps.commandTime - cl.outPackets[packetNum].p_serverTime >= 0 ) {
			cl.snap.ping = cls.realtime - cl.outPackets[ packetNum ].p_realtime;
			break;
		}
	}
	// save the frame off in the backup array for later delta comparisons
	cl.snapshots[cl.snap.messageNum & PACKET_MASK] = cl.snap;

	if (cl_shownet->integer == 3) {
		Com_Printf( "   snapshot:%i  delta:%i  ping:%i\n", cl.snap.messageNum,
		cl.snap.deltaNum, cl.snap.ping );
	}

	cl.newSnapshots = qtrue;

	clc.eventMask |= EM_SNAPSHOT;

  CL_AddLagometerSnapshotInfo(&cl.snap);
}


//=====================================================================

int cl_connectedToPureServer;
int cl_connectedToCheatServer;

/*
==================
CL_SystemInfoChanged

The systeminfo configstring has been changed, so parse
new information out of it.  This will happen at every
gamestate, and possibly during gameplay.
==================
*/
void CL_SystemInfoChanged( qboolean onlyGame, int igs ) {
	const char		*systemInfo;
	const char		*s, *t;
	char			key[BIG_INFO_KEY];
	char			value[BIG_INFO_VALUE];
	if(igs == -1) {
		// called from common.c
#ifdef USE_MULTIVM_CLIENT  
		igs = clientGames[clc.currentView];
#else
    igs = 0;
#endif
	}

	systemInfo = cl.gameState.stringData + cl.gameState.stringOffsets[ CS_SYSTEMINFO ];
	// NOTE TTimo:
	// when the serverId changes, any further messages we send to the server will use this new serverId
	// https://zerowing.idsoftware.com/bugzilla/show_bug.cgi?id=475
	// in some cases, outdated cp commands might get sent with this news serverId
	cl.serverId = atoi( Info_ValueForKey( systemInfo, "sv_serverid" ) );

	// don't set any vars when playing a demo
	if ( clc.demoplaying ) {
		return;
	}

	s = Info_ValueForKey( systemInfo, "sv_pure" );
	cl_connectedToPureServer = atoi( s );

	// parse/update fs_game in first place
	s = Info_ValueForKey( systemInfo, "fs_game" );

	if ( FS_InvalidGameDir( s ) ) {
		Com_Printf( S_COLOR_YELLOW "WARNING: Server sent invalid fs_game value %s\n", s );
	} else {
		Cvar_Set( "fs_game", s );
	}

	// if game folder should not be set and it is set at the client side
	if ( *s == '\0' && *Cvar_VariableString( "fs_game" ) != '\0' ) {
		Cvar_Set( "fs_game", "" );
	}

	if ( onlyGame && Cvar_Flags( "fs_game" ) & CVAR_MODIFIED ) {
		// game directory change is needed
		// return early to avoid systeminfo-cvar pollution in current fs_game
		return;
	}

	if ( CL_GameSwitch() ) {
		// we just restored fs_game from saved systeminfo
		// reset modified flag to avoid unwanted side-effecfs
		Cvar_SetModified( "fs_game", qfalse );
	}

	s = Info_ValueForKey( systemInfo, "sv_cheats" );
	cl_connectedToCheatServer = atoi( s );
	if ( !cl_connectedToCheatServer ) {
		Cvar_SetCheatState();
	}

#ifndef USE_LOCAL_DED // allow file restrictions locally
	if ( com_sv_running->integer ) {
		// no filesystem restrictions for localhost
		FS_PureServerSetLoadedPaks( "", "" );
		FS_PureServerSetReferencedPaks( "", "" );
	} else
#endif
	{
		// check pure server string
		s = Info_ValueForKey( systemInfo, "sv_paks" );
		t = Info_ValueForKey( systemInfo, "sv_pakNames" );
		FS_PureServerSetLoadedPaks( s, t );
Com_Printf("Loaded: %s (%s)\n", s, t);

		s = Info_ValueForKey( systemInfo, "sv_referencedPaks" );
		t = Info_ValueForKey( systemInfo, "sv_referencedPakNames" );
		FS_PureServerSetReferencedPaks( s, t );
Com_Printf("Referenced: %s (%s)\n", s, t);
	}

	// scan through all the variables in the systeminfo and locally set cvars to match
	s = systemInfo;
	do {
		int cvar_flags;
		
		s = Info_NextPair( s, key, value );
		if ( key[0] == '\0' ) {
			break;
		}

		if(!Q_stricmp( key, "sv_fps" )) {
			if(value[0] != '0') {
				Cvar_Set("snaps", va("%i", atoi(value)));
			}
		}

		// we don't really need any of these server cvars to be set on client-side
		if ( !Q_stricmp( key, "sv_pure" ) || !Q_stricmp( key, "sv_serverid" ) ) {
			continue;
		}
		if ( !Q_stricmp( key, "sv_paks" ) || !Q_stricmp( key, "sv_pakNames" ) ) {
			continue;
		}
		if ( !Q_stricmp( key, "sv_referencedPaks" ) || !Q_stricmp( key, "sv_referencedPakNames" ) ) {
			continue;
		}
		
		if ( !Q_stricmp( key, "fs_game" ) ) {
			continue; // already processed
		}
    
    if( !Q_stricmp( key, "g_synchronousClients" ) ) {
      cls.synchronousClients = qtrue;
    }

		if((cvar_flags = Cvar_Flags(key)) == CVAR_NONEXISTENT)
			Cvar_Get(key, value, CVAR_SERVER_CREATED | CVAR_ROM);
		else
		{
			// If this cvar may not be modified by a server discard the value.
			if(!(cvar_flags & (CVAR_SYSTEMINFO | CVAR_SERVER_CREATED | CVAR_USER_CREATED)))
			{
#ifndef STANDALONE
				if ( Q_stricmp( key, "g_synchronousClients" ) && Q_stricmp( key, "pmove_fixed" ) && Q_stricmp( key, "pmove_msec" ) )
#endif
				{
					Com_Printf(S_COLOR_YELLOW "WARNING: server is not allowed to set %s=%s\n", key, value);
					continue;
				}
			}

			Cvar_SetSafe(key, value);
		}
	}
	while ( *s != '\0' );
}


/*
==================
CL_GameSwitch
==================
*/
qboolean CL_GameSwitch( void )
{
	return (cls.gameSwitch && !com_errorEntered);
}


/*
==================
CL_ParseServerInfo
==================
*/
#ifndef USE_LOCAL_DED
static 
#endif
void CL_ParseServerInfo( int igs )
{
  gameState_t	oldGs;
	const char *serverInfo;
	size_t	len;

  serverInfo = cl.gameState.stringData + cl.gameState.stringOffsets[ CS_SERVERINFO ];
	Com_Printf("Gamestate (%i): %.*s\n", igs, (int)strlen(serverInfo), serverInfo);

  if(clc.demoplaying) {
    qboolean serverOverride = qfalse;
    char	infostring[MAX_INFO_STRING+160]; // add some space for challenge string
    char	sysinfostring[BIG_INFO_STRING]; // add some space for challenge string
    if(cl_demoOverrideGame->string[0] != '\0') {
      Q_strncpyz( infostring, serverInfo, sizeof( infostring ) );
      Info_SetValueForKey( infostring, "gamename", cl_demoOverrideGame->string );
      Q_strncpyz( sysinfostring, cl.gameState.stringData
    		+ cl.gameState.stringOffsets[ CS_SYSTEMINFO ], sizeof( sysinfostring ) );
      Info_SetValueForKey_s( sysinfostring, BIG_INFO_STRING, "fs_game", cl_demoOverrideGame->string );
    }
    oldGs = cl.gameState;
    // do the same thing CL_ConfigstringModified() in cl_cgame.c does
    //   except check for negative numbers, that will give us the override index
    // overrides should be in the same format and server command, 
    //  e.g. `cs 20 "string"`
    
    // build the new gamestate
    Com_Memset( &cl.gameState, 0, sizeof( cl.gameState ) );

    for(int cs = 0; cs < 100; cs++) {
      if(cl_demoOverrideCS[cs]->string[0] != '\0') {
        int index;
        Cmd_TokenizeString( cl_demoOverrideCS[cs]->string );
        index = atoi( Cmd_Argv(1) );
        if ( index < 0 || index >= MAX_CONFIGSTRINGS )
          continue;
        if(index == 0) serverOverride = qtrue;
        if(index == 1) serverOverride = qtrue;
        cl.gameState.stringOffsets[index] = -(cs + 1); // to compensate for zeros
      }
    }

    //int max = atoi(Info_ValueForKey( serverInfo, "sv_maxclients" ));
    for ( int i = 0 ; i < MAX_CONFIGSTRINGS ; i++ ) {
      const char	*dup;
      int len, index;

      //if ( i > CS_PLAYERS && i < CS_PLAYERS + max ) {
        // TODO: fix missing models before demo loads automatically
        // TODO: or demoPlayerCS0-100 to replace player settings
        //Com_Printf("Config: %s\n", oldGs.stringData + oldGs.stringOffsets[ i ]);
      //}

      // override game separately if not already set
      if(i < 2 && !serverOverride && cl_demoOverrideGame->string[0] != '\0') {
        if(i == 0)
          dup = infostring;
        if(i == 1)
          dup = sysinfostring;
      } else if ( cl.gameState.stringOffsets[i] < 0 ) {
        index = -(cl.gameState.stringOffsets[i] + 1);
        Cmd_TokenizeString( cl_demoOverrideCS[index]->string );
  			dup = Cmd_ArgsFrom(2);
        Com_Printf("Config Modified: %i %s\n", i, dup);
  		} else {
  			dup = oldGs.stringData + oldGs.stringOffsets[ i ];
  		}

      len = strlen( dup );
      // append it to the gameState string buffer
  		cl.gameState.stringOffsets[ i ] = cl.gameState.dataCount;
  		Com_Memcpy( cl.gameState.stringData + cl.gameState.dataCount, dup, len + 1 );
  		cl.gameState.dataCount += len + 1;
      
      //Com_Printf("Config (%i): %s\n", i, cl.gameState.stringData + cl.gameState.stringOffsets[ i ]);
    }
  }

	clc.sv_allowDownload = atoi(Info_ValueForKey(serverInfo,
		"sv_allowDownload"));
	Q_strncpyz(clc.sv_dlURL,
		Info_ValueForKey(serverInfo, "sv_dlURL"),
		sizeof(clc.sv_dlURL));

  clc.isMultiGame = strcmp(Info_ValueForKey(serverInfo, "gamename"), "multigame") == 0;
#ifdef USE_MULTIVM_CLIENT
  clc.sv_mvWorld = strcmp(Info_ValueForKey(serverInfo, "sv_mvWorld"), "1") == 0;
  clc.sv_mvOmnipresent = strcmp(Info_ValueForKey(serverInfo, "sv_mvOmnipresent"), "1") == 0;
#endif

	/* remove ending slash in URLs */
	len = strlen( clc.sv_dlURL );
	if ( len > 0 &&  clc.sv_dlURL[len-1] == '/' )
		clc.sv_dlURL[len-1] = '\0';
}


/*
==================
CL_ParseGamestate
==================
*/
static void CL_ParseGamestate( msg_t *msg ) {
	int				i;
	entityState_t	*es;
	int				newnum;
	entityState_t	nullstate;
	int				cmd;
	const char		*s;
	char			oldGame[ MAX_QPATH ];
	qboolean		gamedirModified;

#ifndef USE_NO_CONSOLE
	Con_Close();
#endif

	clc.connectPacketCount = 0;

	Com_Memset( &nullstate, 0, sizeof( nullstate ) );

	// clear old error message
	Cvar_Set( "com_errorMessage", "" );

	// wipe local client state
#ifndef USE_MULTIVM_CLIENT
  int igs = 0;
	CL_ClearState();
#else
  int igs = clc.currentView = clientGames[0] = 0;
	if(igs == 0 && !cgvm) {
		CL_ClearState();
		memset(&cl.snapWorlds[igs], 0, sizeof(cl.snapWorlds[igs]));
		memset(cl.snapshotWorlds[igs], 0, sizeof(cl.snapshotWorlds[igs]));
		cl.gameState.dataCount = 1;
	}
#endif

	// all configstring updates received before new gamestate must be discarded
	for ( i = 0; i < MAX_RELIABLE_COMMANDS; i++ ) {
		s = clc.serverCommands[ i ];
		if ( !strncmp( s, "cs ", 3 ) || !strncmp( s, "bcs0 ", 5 ) || !strncmp( s, "bcs1 ", 5 ) || !strncmp( s, "bcs2 ", 5 ) ) {
			clc.serverCommandsIgnore[ i ] = qtrue;
		}
	}

	// a gamestate always marks a server command sequence
	clc.serverCommandSequence = MSG_ReadLong( msg );

	// parse all the configstrings and baselines
#ifndef USE_MULTIVM_SERVER
	cl.gameState.dataCount = 1;	// leave a 0 at the beginning for uninitialized configstrings
#endif
	while ( 1 ) {
		cmd = MSG_ReadByte( msg );

		if ( cmd == svc_EOF ) {
			break;
		}

#ifdef USE_MULTIVM_CLIENT
		if ( cmd == svc_mvWorld ) {
			igs = MSG_ReadByte( msg );
			cgvmi = clc.currentView = igs;
			clientGames[igs] = clc.currentView;
			memset(&cl.snapWorlds[igs], 0, sizeof(cl.snapWorlds[igs]));
			memset(cl.snapshotWorlds[igs], 0, sizeof(cl.snapshotWorlds[igs]));
			cl.gameState.dataCount = 1;
			Com_Printf("Received new gamestate: %i\n", igs); 
		} else
#endif

		if ( cmd == svc_configstring ) {
			int		len;

			i = MSG_ReadShort( msg );
			if ( i < 0 || i >= MAX_CONFIGSTRINGS ) {
				Com_Error( ERR_DROP, "configstring > MAX_CONFIGSTRINGS" );
			}

			s = MSG_ReadBigString( msg );
			len = strlen( s );

			if ( len + 1 + cl.gameState.dataCount > MAX_GAMESTATE_CHARS ) {
				Com_Error( ERR_DROP, "MAX_GAMESTATE_CHARS exceeded: %i", 
					len + 1 + cl.gameState.dataCount );
			}

			// append it to the gameState string buffer
			cl.gameState.stringOffsets[ i ] = cl.gameState.dataCount;
			Com_Memcpy( cl.gameState.stringData + cl.gameState.dataCount, s, len + 1 );
			cl.gameState.dataCount += len + 1;
		} else if ( cmd == svc_baseline ) {
			newnum = MSG_ReadBits( msg, GENTITYNUM_BITS );
			if ( newnum < 0 || newnum >= MAX_GENTITIES ) {
				Com_Error( ERR_DROP, "Baseline number out of range: %i", newnum );
			}
			es = &cl.entityBaselines[ newnum ];
			MSG_ReadDeltaEntity( msg, &nullstate, es, newnum );
			cl.baselineUsed[ newnum ] = 1;
		} else {
			Com_Error( ERR_DROP, "CL_ParseGamestate: bad command byte %i\n", cmd );
		}
	}

	clc.eventMask |= EM_GAMESTATE;

	clc.clientNum = MSG_ReadLong(msg);

#ifdef USE_MULTIVM_CLIENT
	clientWorlds[igs] = clc.clientNum;
#endif
#ifdef USE_MV
	clc.zexpectDeltaSeq = 0; // that will reset compression context
#endif

	// read the checksum feed
	clc.checksumFeed = MSG_ReadLong( msg );

	// save old gamedir
	Cvar_VariableStringBuffer( "fs_game", oldGame, sizeof( oldGame ) );

	// parse useful values out of CS_SERVERINFO
	CL_ParseServerInfo(igs);

#ifdef USE_LNBITS
	Cvar_Set("cl_lnInvoice", "");
	cls.qrCodeShader = 0;
#endif

	// parse serverId and other cvars
	CL_SystemInfoChanged( qtrue, igs );

	// stop recording now so the demo won't have an unnecessary level load at the end.
	if ( cl_autoRecordDemo->integer && clc.demorecording ) {
		if ( !clc.demoplaying ) {
			CL_StopRecord_f();
		}
	}

	gamedirModified = ( Cvar_Flags( "fs_game" ) & CVAR_MODIFIED ) ? qtrue : qfalse;
	
	if ( !cl_oldGameSet && gamedirModified ) {
		cl_oldGameSet = qtrue;
		Q_strncpyz( cl_oldGame, oldGame, sizeof( cl_oldGame ) );
	}

	// try to keep gamestate and connection state during game switch
	cls.gameSwitch = gamedirModified;

	// reinitialize the filesystem if the game directory has changed
	FS_ConditionalRestart( clc.checksumFeed, gamedirModified, igs );

	cls.gameSwitch = qfalse;

	// This used to call CL_StartHunkUsers, but now we enter the download state before loading the
	// cgame
	CL_InitDownloads();

	// make sure the game starts
	Cvar_Set( "cl_paused", "0" );
}


/*
=====================
CL_ValidPakSignature

checks for valid ZIP signature
returns qtrue for normal and empty archives
=====================
*/
qboolean CL_ValidPakSignature( const byte *data, int len ) 
{
	// maybe it is not 100% correct to check for file size here
	// because we may receive more data in future packets
	// but situation when server sends fragmented/shortened
	// zip header in first packet - looks pretty suspicious
	if ( len < 22 )
		return qfalse; // minimal ZIP file length is 22 bytes

	if ( data[0] != 'P' || data[1] != 'K' )
		return qfalse;

	if ( data[2] == 0x3 && data[3] == 0x4 )
		return qtrue; // local file header

	if ( data[2] == 0x5 && data[3] == 0x6 )
		return qtrue; // EOCD

	return qfalse;
}

//=====================================================================

/*
=====================
CL_ParseDownload

A download message has been received from the server
=====================
*/
static void CL_ParseDownload( msg_t *msg ) {
	int		size;
	unsigned char data[ MAX_MSGLEN ];
	uint16_t block;

	if (!*clc.downloadTempName) {
		Com_Printf("Server sending download, but no download was requested\n");
		// parse the rest of the download so we don't get illegible
		if(!MSG_ReadShort ( msg )) {
			MSG_ReadLong ( msg );
		}
		MSG_ReadData(msg, data, MSG_ReadShort ( msg ));
		if(!Q_stristr(clc.reliableCommands[ clc.reliableSequence & ( MAX_RELIABLE_COMMANDS - 1 ) ], "stopdl"))
			CL_AddReliableCommand( "stopdl", qfalse );
		return;
	}

	if ( clc.recordfile != FS_INVALID_HANDLE ) {
		CL_StopRecord_f();
	}

	// read the data
	block = MSG_ReadShort ( msg );

	if(!block && !clc.downloadBlock)
	{
		// block zero is special, contains file size
		clc.downloadSize = MSG_ReadLong ( msg );

		Cvar_SetIntegerValue( "cl_downloadSize", clc.downloadSize );

		if (clc.downloadSize < 0)
		{
			Com_Error( ERR_DROP, "%s", MSG_ReadString( msg ) );
			return;
		}
	}

	size = MSG_ReadShort ( msg );
	if (size < 0 || size > sizeof(data))
	{
		Com_Error(ERR_DROP, "CL_ParseDownload: Invalid size %d for download chunk", size);
		return;
	}
	
	MSG_ReadData(msg, data, size);

	if((clc.downloadBlock & 0xFFFF) != block)
	{
		Com_DPrintf( "CL_ParseDownload: Expected block %d, got %d\n", (clc.downloadBlock & 0xFFFF), block);
		return;
	}

	// open the file if not opened yet
	if ( clc.download == FS_INVALID_HANDLE ) 
	{
		if (Q_stristr(clc.downloadName, ".pk3") &&
      !CL_ValidPakSignature( data, size ) ) 
		{
			Com_Printf( S_COLOR_YELLOW "Invalid pak signature for %s\n", clc.downloadName );
			CL_AddReliableCommand( "stopdl", qfalse );
			CL_NextDownload();
			return;
		}

		clc.download = FS_SV_FOpenFileWrite( clc.downloadTempName );

		if ( clc.download == FS_INVALID_HANDLE ) 
		{
			Com_Printf( "Could not create %s\n", clc.downloadTempName );
			CL_AddReliableCommand( "stopdl", qfalse );
			CL_NextDownload();
			return;
		}
	}

	if (size)
		FS_Write( data, size, clc.download );

	CL_AddReliableCommand( va("nextdl %d", clc.downloadBlock), qfalse );
	clc.downloadBlock++;

	clc.downloadCount += size;

	// So UI gets access to it
	Cvar_SetIntegerValue( "cl_downloadCount", clc.downloadCount );

	if (!size) { // A zero length block means EOF
		if ( clc.download != FS_INVALID_HANDLE ) {
			FS_FCloseFile( clc.download );
			clc.download = FS_INVALID_HANDLE;

			// rename the file
			FS_SV_Rename( clc.downloadTempName, clc.downloadName );
		}

		// send intentions now
		// We need this because without it, we would hold the last nextdl and then start
		// loading right away.  If we take a while to load, the server is happily trying
		// to send us that last block over and over.
		// Write it twice to help make sure we acknowledge the download
		CL_WritePacket();
		CL_WritePacket();

		// get another file if needed
		CL_NextDownload();
	}
}


/*
=====================
CL_ParseCommandString

Command strings are just saved off until cgame asks for them
when it transitions a snapshot
=====================
*/
static void CL_ParseCommandString( msg_t *msg ) {
	const char *s;
	int		seq;
	int		index;

	seq = MSG_ReadLong( msg );
	s = MSG_ReadString( msg );

	if ( cl_shownet->integer >= 3 )
		Com_Printf( " %3i(%3i) %s\n", seq, clc.serverCommandSequence, s );

	// see if we have already executed stored it off
	if ( clc.serverCommandSequence - seq >= 0 ) {
		return;
	}

#ifdef USE_MV
	clc.zexpectDeltaSeq = 0; // reset if we get new uncompressed command
#endif

	clc.serverCommandSequence = seq;

	index = seq & (MAX_RELIABLE_COMMANDS-1);
	Q_strncpyz( clc.serverCommands[ index ], s, sizeof( clc.serverCommands[ index ] ) );
	clc.serverCommandsIgnore[ index ] = qfalse;

#ifdef USE_CURL
	if ( !clc.cURLUsed )
#endif
	// -EC- : we may stuck on downloading because of non-working cgvm
	// or in "awaiting snapshot..." state so handle "disconnect" here
	if ( ( !cgvm && cls.state == CA_CONNECTED && clc.download != FS_INVALID_HANDLE ) || ( cgvm && cls.state == CA_PRIMED ) ) {
		const char *text;
		Cmd_TokenizeString( s );
		if ( !Q_stricmp( Cmd_Argv(0), "disconnect" ) ) {
			text = ( Cmd_Argc() > 1 ) ? va( "Server disconnected: %s", Cmd_Argv( 1 ) ) : "Server disconnected.";
			Cvar_Set( "com_errorMessage", text );
			Com_Printf( "%s\n", text );
			if ( !CL_Disconnect( qtrue, qtrue ) ) { // restart client if not done already
				CL_FlushMemory();
			}
			return;
		}
	}

	clc.eventMask |= EM_COMMAND;
}

#if defined( USE_MV ) && defined( USE_MV_ZCMD )
/*
=====================
CL_ParseZCommandString
=====================
*/
void CL_ParseZCommandString( msg_t *msg ) {
	
	static lzctx_t ctx;	// compression context
	int		deltaSeq;
	int		textbits;
	int		seq_size;
	int		seq;

	deltaSeq = MSG_ReadBits( msg, 3 ); // 0..2: delta sequence
	textbits = MSG_ReadBits( msg, 1 ) + 7; // text bits - 7 or 8
	seq_size = MSG_ReadBits( msg, 2 ) + 1; // command size in bytes // TODO: OCTETS?
	seq = MSG_ReadBits( msg, seq_size * 8 ); // command sequence

	// future extension, reserved and should be 0 for now
	if ( MSG_ReadBits( msg, 1 ) != 0 ) {
		Com_Error( ERR_DROP, "zcmd: bad control bit" ); 
	}

	//Com_DPrintf( S_COLOR_CYAN "cl: delta: %i, txb: %i, size: %i, seq: %i\n",
	//	deltaSeq, textbits, seq_size, seq );

	if ( seq <= clc.serverCommandSequence ) {
		if ( deltaSeq == 0 && clc.zexpectDeltaSeq == 0 ) {
			Com_Error( ERR_DROP, "zcmd: already stored uncompressed %i", seq );
		}
		Com_DPrintf( S_COLOR_YELLOW "zcmd: already stored sequence %i\n", seq );
		LZSS_SeekEOS( msg, textbits );
		return;
	}

	if ( deltaSeq == 0 ) { 
		// decoder reset
		Com_DPrintf( S_COLOR_RED" seq %i, reset decompression context\n", seq );
		LZSS_InitContext( &ctx );
		clc.zexpectDeltaSeq = 1;
	} else 	{
		// see if we have already executed stored it off
		if ( deltaSeq != clc.zexpectDeltaSeq ) {
			Com_DPrintf( S_COLOR_YELLOW "zcmd: unexpected delta %i instead of %i\n", deltaSeq, clc.zexpectDeltaSeq );
			LZSS_SeekEOS( msg, textbits );
			return;
		}
		if ( seq != clc.serverCommandSequence + 1 ) {
			Com_DPrintf( S_COLOR_YELLOW " unexpected command sequence %i instead of %i\n", seq, clc.serverCommandSequence + 1 );
			LZSS_SeekEOS( msg, textbits );
			return;
		}

		if ( clc.zexpectDeltaSeq >= 7 )
			clc.zexpectDeltaSeq = 1;
		else
			clc.zexpectDeltaSeq++;
	}

	// store command
	LZSS_Expand( &ctx, msg, clc.serverCommands[ seq & (MAX_RELIABLE_COMMANDS-1) ], MAX_STRING_CHARS, textbits );

	clc.serverCommandSequence = seq;

	clc.eventMask |= EM_COMMAND;
}
#endif // USE_MV

/*
=====================
CL_ParseServerMessage
=====================
*/
void CL_ParseServerMessage( msg_t *msg ) {
	int			cmd;
#ifdef USE_MULTIVM_CLIENT
  int igs = clc.currentView;
#endif

	if ( cl_shownet->integer == 1 ) {
		Com_Printf ("%i ",msg->cursize);
	} else if ( cl_shownet->integer >= 2 ) {
		Com_Printf ("------------------\n");
	}

	clc.eventMask = 0;
	MSG_Bitstream( msg );

	// get the reliable sequence acknowledge number
	clc.reliableAcknowledge = MSG_ReadLong( msg );

	// 
	if ( clc.reliableAcknowledge < clc.reliableSequence - MAX_RELIABLE_COMMANDS ) {
		clc.reliableAcknowledge = clc.reliableSequence;
	}

	// parse the message
	while ( 1 ) {
		if ( msg->readcount > msg->cursize ) {
			Com_Error (ERR_DROP,"CL_ParseServerMessage: read past end of server message");
			break;
		}

		cmd = MSG_ReadByte( msg );

		if ( cmd == svc_EOF) {
			SHOWNET( msg, "END OF MESSAGE" );
			break;
		}

		if ( cl_shownet->integer >= 2 ) {
			if ( (cmd < 0) || (!svc_strings[cmd]) ) {
				Com_Printf( "%3i:BAD CMD %i\n", msg->readcount-1, cmd );
			} else {
				SHOWNET( msg, svc_strings[cmd] );
			}
		}

#ifdef USE_ASYNCHRONOUS
    if(!com_cl_running || !com_cl_running->integer) {
      if(cmd != svc_nop && cmd != svc_download) {
//        break;
      }
    }
#endif

		// other commands
		switch ( cmd ) {
		default:
			Com_Error (ERR_DROP,"CL_ParseServerMessage: Illegible server message");
			break;			
		case svc_nop:
			break;
		case svc_serverCommand:
			CL_ParseCommandString( msg );
			break;
		case svc_gamestate:
			CL_ParseGamestate( msg );
			break;
#ifdef USE_MULTIVM_CLIENT
		case svc_baseline:
			{
				entityState_t	nullstate;
				entityState_t	*es;
				int				newnum, igvm;
				qboolean firstBaseline = qtrue;
				Com_Memset( &nullstate, 0, sizeof( nullstate ) );

				if(firstBaseline) {
					igvm = MSG_ReadByte( msg );
					memset(cl.entityBaselines, 0, sizeof(cl.entityBaselines));
					memset(cl.baselineUsed, 0, sizeof(cl.baselineUsed));
					Com_Printf("------------------ ents (%i) ----------------\n", igvm);
					firstBaseline = qfalse;
				}
				// parse baselines after a world change
				newnum = MSG_ReadBits( msg, GENTITYNUM_BITS );
				if ( newnum < 0 || newnum >= MAX_GENTITIES ) {
					Com_Error( ERR_DROP, "Baseline number out of range: %i", newnum );
				}
				es = &cl.entityBaselines[ newnum ];
				MSG_ReadDeltaEntity( msg, &nullstate, es, newnum );
				cl.baselineUsed[ newnum ] = 1;
			}
			break;
#endif
#ifdef USE_MULTIVM_CLIENT
		case svc_mvWorld:
			igs = MSG_ReadByte( msg );
			break;
		case svc_snapshot:
			CL_ParseSnapshot( msg, -1 );
			break;
		case svc_multiview:
			CL_ParseSnapshot( msg, igs );
			break;
#ifdef USE_MV_ZCMD
		case svc_zcmd:
			CL_ParseZCommandString( msg );
			break;
#endif
#else
#ifdef USE_MV
		case svc_multiview:
			CL_ParseSnapshot( msg, qtrue );
			break;
		case svc_snapshot:
			CL_ParseSnapshot( msg, qfalse );
			break;
#else
		case svc_snapshot:
			CL_ParseSnapshot( msg );
			break;
#endif
#endif
		case svc_download:
			if ( clc.demofile != FS_INVALID_HANDLE )
				return;
			CL_ParseDownload( msg );
			break;
		case svc_voipSpeex: // ioq3 extension
			clc.dm68compat = qfalse;
#ifdef USE_VOIP
			CL_ParseVoip( msg, qtrue );
			break;
#else
			return;
#endif
		case svc_voipOpus: // ioq3 extension
			clc.dm68compat = qfalse;
#ifdef USE_VOIP
			CL_ParseVoip( msg, !clc.voipEnabled );
			break;
#else
			return;
#endif
		}
	}
}
