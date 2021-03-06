/* -------------------------------------------------------------------------------

   Copyright (C) 1999-2007 id Software, Inc. and contributors.
   For a list of contributors, see the accompanying CONTRIBUTORS file.

   This file is part of GtkRadiant.

   GtkRadiant is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 2 of the License, or
   (at your option) any later version.

   GtkRadiant is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with GtkRadiant; if not, write to the Free Software
   Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

   -------------------------------------------------------------------------------

   This code has been altered significantly from its original form, to support
   several games based on the Quake III Arena engine, in the form of "Q3Map2."

   ------------------------------------------------------------------------------- */



/* marker */
#define MAIN_C



/* dependencies */
#include "q3map2.h"
#include "autopk3.h"



/*
   ExitQ3Map()
   cleanup routine
 */

static void ExitQ3Map( void ){
	/* flush xml send buffer, shut down connection */
	Broadcast_Shutdown();
	BSPFilesCleanup();
	if(mapDrawSurfs)
		free( mapDrawSurfs );
}

extern "C" {

/*
   main()
   q3map mojo...
 */
#ifdef LINKABLE
extern int (*Com_Error)(const char *error);

Q_EXPORT int Q3MAP2Main( int argc, char **argv )
#else
int main( int argc, char **argv )
#endif
{
	int i, r;
	double start, end;

#ifdef WIN32
	_setmaxstdio(2048);
#endif

	/* we want consistent 'randomness' */
	srand( 0 );

	/* start timer */
	start = I_FloatTime();

	/* this was changed to emit version number over the network */
	printf( Q3MAP_VERSION "\n" );

#ifndef LINKABLE
	/* set exit call */
	atexit( ExitQ3Map );
#else
	BSPFilesCleanup();
#endif

	/* read general options first */
	for ( i = 1; i < argc; i++ )
	{
		/* -help */
		if ( striEqual( argv[ i ], "-h" ) || striEqual( argv[ i ], "--help" )
		     || striEqual( argv[ i ], "-help" ) ) {
			HelpMain( ( i + 1 < argc ) ? argv[ i + 1 ] : NULL );
			return 0;
		}

		/* -connect */
		if ( striEqual( argv[ i ], "-connect" ) ) {
			if ( ++i >= argc || !argv[ i ] ) {
				Error( "Out of arguments: No address specified after %s", argv[ i - 1 ] );
			}
			argv[ i - 1 ] = NULL;
			Broadcast_Setup( argv[ i ] );
			argv[ i ] = NULL;
		}

		/* verbose */
		else if ( striEqual( argv[ i ], "-v" ) ) {
			if ( !verbose ) {
				verbose = true;
				argv[ i ] = NULL;
			}
		}

#ifdef LINKABLE
		else if( striEqual( argv[ i ], "-error" ) )
		{
			if ( ++i >= argc || !argv[ i ] ) {
				Error( "Out of arguments: No address specified after %s", argv[ i - 1 ] );
			}
			argv[ i - 1 ] = NULL;
			Com_Error = reinterpret_cast<int (*)(const char *error)>(argv[ i ]);
			argv[ i ] = NULL;
		}
#endif

		/* force */
		else if ( striEqual( argv[ i ], "-force" ) ) {
			force = true;
			argv[ i ] = NULL;
		}

		/* patch subdivisions */
		else if ( striEqual( argv[ i ], "-subdivisions" ) ) {
			if ( ++i >= argc || !argv[ i ] ) {
				Error( "Out of arguments: No value specified after %s", argv[ i - 1 ] );
			}
			argv[ i - 1 ] = NULL;
			patchSubdivisions = atoi( argv[ i ] );
			argv[ i ] = NULL;
			if ( patchSubdivisions <= 0 ) {
				patchSubdivisions = 1;
			}
		}

		/* threads */
		else if ( striEqual( argv[ i ], "-threads" ) ) {
			if ( ++i >= argc || !argv[ i ] ) {
				Error( "Out of arguments: No value specified after %s", argv[ i - 1 ] );
			}
			argv[ i - 1 ] = NULL;
			numthreads = atoi( argv[ i ] );
			argv[ i ] = NULL;
		}

		else if( striEqual( argv[ i ], "-nocmdline" ) )
		{
			Sys_Printf( "noCmdLine\n" );
			nocmdline = true;
			argv[ i ] = NULL;
		}

	}

	/* init model library */
	PicoInit();
	PicoSetMallocFunc( malloc );
	PicoSetFreeFunc( free );
	PicoSetPrintFunc( PicoPrintFunc );
	PicoSetLoadFileFunc( PicoLoadFileFunc );
	PicoSetFreeFileFunc( free );

	/* set number of threads */
	ThreadSetDefault();

	/* generate sinusoid jitter table */
	for ( i = 0; i < MAX_JITTERS; i++ )
	{
		jitters[ i ] = sin( i * 139.54152147 );
		//%	Sys_Printf( "Jitter %4d: %f\n", i, jitters[ i ] );
	}

	/* we print out two versions, q3map's main version (since it evolves a bit out of GtkRadiant)
	   and we put the GtkRadiant version to make it easy to track with what version of Radiant it was built with */

	Sys_Printf( "Q3Map         - v1.0r (c) 1999 Id Software Inc.\n" );
	Sys_Printf( "Q3Map (ydnar) - v" Q3MAP_VERSION "\n" );
	Sys_Printf( "NetRadiant    - v" RADIANT_VERSION " " __DATE__ " " __TIME__ "\n" );
	Sys_Printf( "%s\n", Q3MAP_MOTD );
	Sys_Printf( "%s\n", argv[0] );

	strcpy( g_q3map2path, argv[0] ); // fuer autopk3 functions

	/* ydnar: new path initialization */
	InitPaths( &argc, argv );

	/* set game options */
	if ( !patchSubdivisions ) {
		patchSubdivisions = game->patchSubdivisions;
	}

	/* check if we have enough options left to attempt something */
	if ( argc < 2 ) {
		Error( "Usage: %s [general options] [options] mapfile\n%s -help for help", argv[ 0 ], argv[ 0 ] );
	}

	/* fixaas */
	if ( striEqual( argv[ 1 ], "-fixaas" ) ) {
		r = FixAAS( argc - 1, argv + 1 );
	}

	/* analyze */
	else if ( striEqual( argv[ 1 ], "-analyze" ) ) {
		r = AnalyzeBSP( argc - 1, argv + 1 );
	}

	/* info */
	else if ( striEqual( argv[ 1 ], "-info" ) ) {
		r = BSPInfo( argc - 2, argv + 2 );
	}

	/* vis */
	else if ( striEqual( argv[ 1 ], "-vis" ) ) {
		r = VisMain( argc - 1, argv + 1 );
	}

	/* light */
	else if ( striEqual( argv[ 1 ], "-light" ) ) {
		r = LightMain( argc - 1, argv + 1 );
	}

	/* vlight */
	else if ( striEqual( argv[ 1 ], "-vlight" ) ) {
		Sys_Warning( "VLight is no longer supported, defaulting to -light -fast instead\n\n" );
		r = LightMain( argc, argv );
	}

	/* QBall: export entities */
	else if ( striEqual( argv[ 1 ], "-exportents" ) ) {
		r = ExportEntitiesMain( argc - 1, argv + 1 );
	}

	/* ydnar: lightmap export */
	else if ( striEqual( argv[ 1 ], "-export" ) ) {
		r = ExportLightmapsMain( argc - 1, argv + 1 );
	}

	/* ydnar: lightmap import */
	else if ( striEqual( argv[ 1 ], "-import" ) ) {
		r = ImportLightmapsMain( argc - 1, argv + 1 );
	}

	/* ydnar: bsp scaling */
	else if ( striEqual( argv[ 1 ], "-scale" ) ) {
		r = ScaleBSPMain( argc - 1, argv + 1 );
	}

	/* bsp shifting */
	else if ( striEqual( argv[ 1 ], "-shift" ) ) {
		r = ShiftBSPMain( argc - 1, argv + 1 );
	}

	/* autopacking */
	else if ( striEqual( argv[ 1 ], "-pk3" ) ) {
		r = pk3BSPMain( argc - 1, argv + 1 );
	}

	/* repacker */
	else if ( striEqual( argv[ 1 ], "-repack" ) ) {
		r = repackBSPMain( argc - 1, argv + 1 );
	}

	/* ydnar: bsp conversion */
	else if ( striEqual( argv[ 1 ], "-convert" ) ) {
		r = ConvertBSPMain( argc - 1, argv + 1 );
	}

	/* div0: minimap */
	else if ( striEqual( argv[ 1 ], "-minimap" ) ) {
		r = MiniMapBSPMain( argc - 1, argv + 1 );
	}

	/* ydnar: otherwise create a bsp */
	else{
		r = BSPMain( argc, argv );
	}

	/* emit time */
	end = I_FloatTime();
	Sys_Printf( "%9.0f seconds elapsed\n", end - start );

	/* return any error code */
	return r;
}

}
