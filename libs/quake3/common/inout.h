/*
   Copyright (C) 1999-2006 Id Software, Inc. and contributors.
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
 */

#ifndef __INOUT__
#define __INOUT__

// inout is the only stuff relying on xml, include the headers there
#ifndef __WASM__
#include "libxml/tree.h"
#endif

template<typename Element> class BasicVector3;
typedef BasicVector3<float> Vector3;

#ifndef __WASM__

// some useful xml routines
xmlNodePtr xml_NodeForVec( const Vector3& v );
void xml_SendNode( xmlNodePtr node );
// print a message in q3map output and send the corresponding select information down the xml stream
// bError: do we end with an error on this one or do we go ahead?
void xml_Select( const char *msg, int entitynum, int brushnum, bool bError );
// end q3map with an error message and send a point information in the xml stream
// note: we might want to add a boolean to use this as a warning or an error thing..
void xml_Winding( const char *msg, const Vector3 p[], int numpoints, bool die );
void xml_Point( const char *msg, const Vector3& pt );

#endif

void Broadcast_Setup( const char *dest );
void Broadcast_Shutdown();

#define SYS_VRBflag 8 // verbose support (on/off) //internal only, not for sending!
#define SYS_NOXMLflag 16 // don't send that down the XML stream //internal only, not for sending!

//#define SYS_VRB 0 // verbose support (on/off)
#define SYS_STD 1 // standard print level
#define SYS_WRN 2 // warnings
#define SYS_ERR 3 // error
//#define SYS_NOXML 4 // don't send that down the XML stream

#define SYS_VRB SYS_STD | SYS_VRBflag // verbose support (on/off) //a shortcut, not for sending!

extern bool verbose;
void Sys_Printf( const char *text, ... );
void Sys_FPrintf( int flag, const char *text, ... );
void Sys_Warning( const char *format, ... );

#ifdef _DEBUG
#define DBG_XML 1
#endif

#ifdef DBG_XML
void DumpXML();
#endif

#endif
