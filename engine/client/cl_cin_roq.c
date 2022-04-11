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

/*****************************************************************************
 * name:		cl_cin.c
 *
 * desc:		video and cinematic playback
 *
 * $Archive: /MissionPack/code/client/cl_cin.c $
 *
 * cl_glconfig.hwtype trtypes 3dfx/ragepro need 256x256
 *
 *****************************************************************************/

#include "client.h"
#include "snd_local.h"
#include "cl_cin.h"

#define MAXSIZE				8
#define MINSIZE				4

#define ROQ_QUAD			0x1000
#define ROQ_QUAD_INFO		0x1001
#define ROQ_CODEBOOK		0x1002
#define ROQ_QUAD_VQ			0x1011
#define ROQ_QUAD_JPEG		0x1012
#define ROQ_QUAD_HANG		0x1013
#define ROQ_PACKET			0x1030
#define ZA_SOUND_MONO		0x1020
#define ZA_SOUND_STEREO		0x1021

extern	int		s_paintedtime;


static void RoQ_init( void );

/******************************************************************************
*
* Class:		trFMV
*
* Description:	RoQ/RnR manipulation routines
*				not entirely complete for first run
*
******************************************************************************/

static	long				ROQ_YY_tab[256];
static	long				ROQ_UB_tab[256];
static	long				ROQ_UG_tab[256];
static	long				ROQ_VG_tab[256];
static	long				ROQ_VR_tab[256];
static	unsigned short		vq2[256*16*4];
static	unsigned short		vq4[256*64*4];
static	unsigned short		vq8[256*256*4];


extern cinematics_t		cin;
extern cin_cache		cinTable[MAX_VIDEO_HANDLES];
extern int				currentHandle;

extern int				CL_ScaledMilliseconds( void );


//-----------------------------------------------------------------------------
// RllSetupTable
//
// Allocates and initializes the square table.
//
// Parameters:	None
//
// Returns:		Nothing
//-----------------------------------------------------------------------------
static void RllSetupTable( void )
{
	int z;

	for (z=0;z<128;z++) {
		cin.sqrTable[z] = (short)(z*z);
		cin.sqrTable[z+128] = (short)(-cin.sqrTable[z]);
	}
}


//-----------------------------------------------------------------------------
// RllDecodeMonoToMono
//
// Decode mono source data into a mono buffer.
//
// Parameters:	from -> buffer holding encoded data
//				to ->	buffer to hold decoded data
//				size =	number of bytes of input (= # of shorts of output)
//				signedOutput = 0 for unsigned output, non-zero for signed output
//				flag = flags from asset header
//
// Returns:		Number of samples placed in output buffer
//-----------------------------------------------------------------------------
long RllDecodeMonoToMono(unsigned char *from,short *to,unsigned int size,char signedOutput ,unsigned short flag)
{
	unsigned int z;
	int prev;
	
	if (signedOutput)	
		prev =  flag - 0x8000;
	else 
		prev = flag;

	for (z=0;z<size;z++) {
		prev = to[z] = (short)(prev + cin.sqrTable[from[z]]); 
	}
	return size;	//*sizeof(short));
}


//-----------------------------------------------------------------------------
// RllDecodeMonoToStereo
//
// Decode mono source data into a stereo buffer. Output is 4 times the number
// of bytes in the input.
//
// Parameters:	from -> buffer holding encoded data
//				to ->	buffer to hold decoded data
//				size =	number of bytes of input (= 1/4 # of bytes of output)
//				signedOutput = 0 for unsigned output, non-zero for signed output
//				flag = flags from asset header
//
// Returns:		Number of samples placed in output buffer
//-----------------------------------------------------------------------------
static long RllDecodeMonoToStereo(unsigned char *from,short *to,unsigned int size,char signedOutput,unsigned short flag)
{
	unsigned int z;
	int prev;
	
	if (signedOutput)	
		prev =  flag - 0x8000;
	else 
		prev = flag;

	for (z = 0; z < size; z++) {
		prev = (short)(prev + cin.sqrTable[from[z]]);
		to[z*2+0] = to[z*2+1] = (short)(prev);
	}
	
	return size;	// * 2 * sizeof(short));
}


//-----------------------------------------------------------------------------
// RllDecodeStereoToStereo
//
// Decode stereo source data into a stereo buffer.
//
// Parameters:	from -> buffer holding encoded data
//				to ->	buffer to hold decoded data
//				size =	number of bytes of input (= 1/2 # of bytes of output)
//				signedOutput = 0 for unsigned output, non-zero for signed output
//				flag = flags from asset header
//
// Returns:		Number of samples placed in output buffer
//-----------------------------------------------------------------------------
static long RllDecodeStereoToStereo(unsigned char *from,short *to,unsigned int size,char signedOutput, unsigned short flag)
{
	unsigned int z;
	unsigned char *zz = from;
	int	prevL, prevR;

	if (signedOutput) {
		prevL = (flag & 0xff00) - 0x8000;
		prevR = ((flag & 0x00ff) << 8) - 0x8000;
	} else {
		prevL = flag & 0xff00;
		prevR = (flag & 0x00ff) << 8;
	}

	for (z=0;z<size;z+=2) {
                prevL = (short)(prevL + cin.sqrTable[*zz++]); 
                prevR = (short)(prevR + cin.sqrTable[*zz++]);
                to[z+0] = (short)(prevL);
                to[z+1] = (short)(prevR);
	}
	
	return (size>>1);	//*sizeof(short));
}


//-----------------------------------------------------------------------------
// RllDecodeStereoToMono
//
// Decode stereo source data into a mono buffer.
//
// Parameters:	from -> buffer holding encoded data
//				to ->	buffer to hold decoded data
//				size =	number of bytes of input (= # of bytes of output)
//				signedOutput = 0 for unsigned output, non-zero for signed output
//				flag = flags from asset header
//
// Returns:		Number of samples placed in output buffer
//-----------------------------------------------------------------------------
long RllDecodeStereoToMono(unsigned char *from,short *to,unsigned int size,char signedOutput, unsigned short flag)
{
	unsigned int z;
	int prevL,prevR;
	
	if (signedOutput) {
		prevL = (flag & 0xff00) - 0x8000;
		prevR = ((flag & 0x00ff) << 8) -0x8000;
	} else {
		prevL = flag & 0xff00;
		prevR = (flag & 0x00ff) << 8;
	}

	for (z=0;z<size;z+=1) {
		prevL= prevL + cin.sqrTable[from[z*2]];
		prevR = prevR + cin.sqrTable[from[z*2+1]];
		to[z] = (short)((prevL + prevR)/2);
	}

	return size;
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

static void move8_32( byte *src, byte *dst, int spl )
{
	int i;

	for(i = 0; i < 8; ++i)
	{
		memcpy(dst, src, 32);
		src += spl;
		dst += spl;
	}
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

static void move4_32( byte *src, byte *dst, int spl  )
{
	int i;

	for(i = 0; i < 4; ++i)
	{
		memcpy(dst, src, 16);
		src += spl;
		dst += spl;
	}
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

static void blit8_32( byte *src, byte *dst, int spl  )
{
	int i;

	for(i = 0; i < 8; ++i)
	{
		memcpy(dst, src, 32);
		src += 32;
		dst += spl;
	}
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/
static void blit4_32( byte *src, byte *dst, int spl  )
{
	int i;

	for(i = 0; i < 4; ++i)
	{
		memmove(dst, src, 16);
		src += 16;
		dst += spl;
	}
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

static void blit2_32( byte *src, byte *dst, int spl  )
{
	memcpy(dst, src, 8);
	memcpy(dst+spl, src+8, 8);
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

static void blitVQQuad32fs( byte **status, unsigned char *data )
{
unsigned short	newd, celdata, code;
unsigned int	index, i;
int		spl;

	newd	= 0;
	celdata = 0;
	index	= 0;
	
        spl = cinTable[currentHandle].samplesPerLine;
        
	do {
		if (!newd) { 
			newd = 7;
			celdata = data[0] + data[1]*256;
			data += 2;
		} else {
			newd--;
		}

		code = (unsigned short)(celdata&0xc000); 
		celdata <<= 2;
		
		switch (code) {
			case	0x8000:													// vq code
				blit8_32( (byte *)&vq8[(*data)*128], status[index], spl );
				data++;
				index += 5;
				break;
			case	0xc000:													// drop
				index++;													// skip 8x8
				for(i=0;i<4;i++) {
					if (!newd) { 
						newd = 7;
						celdata = data[0] + data[1]*256;
						data += 2;
					} else {
						newd--;
					}
						
					code = (unsigned short)(celdata&0xc000); celdata <<= 2; 

					switch (code) {											// code in top two bits of code
						case	0x8000:										// 4x4 vq code
							blit4_32( (byte *)&vq4[(*data)*32], status[index], spl );
							data++;
							break;
						case	0xc000:										// 2x2 vq code
							blit2_32( (byte *)&vq2[(*data)*8], status[index], spl );
							data++;
							blit2_32( (byte *)&vq2[(*data)*8], status[index]+8, spl );
							data++;
							blit2_32( (byte *)&vq2[(*data)*8], status[index]+spl*2, spl );
							data++;
							blit2_32( (byte *)&vq2[(*data)*8], status[index]+spl*2+8, spl );
							data++;
							break;
						case	0x4000:										// motion compensation
							move4_32( status[index] + cin.mcomp[(*data)], status[index], spl );
							data++;
							break;
					}
					index++;
				}
				break;
			case	0x4000:													// motion compensation
				move8_32( status[index] + cin.mcomp[(*data)], status[index], spl );
				data++;
				index += 5;
				break;
			case	0x0000:
				index += 5;
				break;
		}
	} while ( status[index] != NULL );
}

/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

void ROQ_GenYUVTables( void )
{
	float t_ub,t_vr,t_ug,t_vg;
	long i;

	t_ub = (1.77200f/2.0f) * (float)(1<<6) + 0.5f;
	t_vr = (1.40200f/2.0f) * (float)(1<<6) + 0.5f;
	t_ug = (0.34414f/2.0f) * (float)(1<<6) + 0.5f;
	t_vg = (0.71414f/2.0f) * (float)(1<<6) + 0.5f;
	for(i=0;i<256;i++) {
		float x = (float)(2 * i - 255);
	
		ROQ_UB_tab[i] = (long)( ( t_ub * x) + (1<<5));
		ROQ_VR_tab[i] = (long)( ( t_vr * x) + (1<<5));
		ROQ_UG_tab[i] = (long)( (-t_ug * x)		 );
		ROQ_VG_tab[i] = (long)( (-t_vg * x) + (1<<5));
		ROQ_YY_tab[i] = (long)( (i << 6) | (i >> 2) );
	}
}

#define VQ2TO4(a,b,c,d) { \
    	*c++ = a[0];	\
	*d++ = a[0];	\
	*d++ = a[0];	\
	*c++ = a[1];	\
	*d++ = a[1];	\
	*d++ = a[1];	\
	*c++ = b[0];	\
	*d++ = b[0];	\
	*d++ = b[0];	\
	*c++ = b[1];	\
	*d++ = b[1];	\
	*d++ = b[1];	\
	*d++ = a[0];	\
	*d++ = a[0];	\
	*d++ = a[1];	\
	*d++ = a[1];	\
	*d++ = b[0];	\
	*d++ = b[0];	\
	*d++ = b[1];	\
	*d++ = b[1];	\
	a += 2; b += 2; }
 
#define VQ2TO2(a,b,c,d) { \
	*c++ = *a;	\
	*d++ = *a;	\
	*d++ = *a;	\
	*c++ = *b;	\
	*d++ = *b;	\
	*d++ = *b;	\
	*d++ = *a;	\
	*d++ = *a;	\
	*d++ = *b;	\
	*d++ = *b;	\
	a++; b++; }

/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

static unsigned short yuv_to_rgb( long y, long u, long v )
{ 
	long r,g,b,YY = (long)(ROQ_YY_tab[(y)]);

	r = (YY + ROQ_VR_tab[v]) >> 9;
	g = (YY + ROQ_UG_tab[u] + ROQ_VG_tab[v]) >> 8;
	b = (YY + ROQ_UB_tab[u]) >> 9;
	
	if (r < 0) r = 0;
	if (g < 0) g = 0;
	if (b < 0) b = 0;
	if (r > 31) r = 31;
	if (g > 63) g = 63;
	if (b > 31) b = 31;

	return (unsigned short)((r<<11)+(g<<5)+(b));
}

/*
Frame_yuv_to_rgb24
is used by the Theora(ogm) code

  moved the convertion into one function, to reduce the number of function-calls
*/
void Frame_yuv_to_rgb24( const unsigned char* y, const unsigned char* u, const unsigned char* v,
						 int width, int height, int y_stride, int uv_stride,
						 int yWShift, int uvWShift, int yHShift, int uvHShift, unsigned int* output )
{
	int             i, j, uvI;
	long            r, g, b, YY;
	
	for( j = 0; j < height; ++j )
	{
		for( i = 0; i < width; ++i )
		{
		
			YY = ( long )( ROQ_YY_tab[( y[( i >> yWShift ) + ( j >> yHShift ) * y_stride] )] );
			uvI = ( i >> uvWShift ) + ( j >> uvHShift ) * uv_stride;
			
			r = ( YY + ROQ_VR_tab[v[uvI]] ) >> 6;
			g = ( YY + ROQ_UG_tab[u[uvI]] + ROQ_VG_tab[v[uvI]] ) >> 6;
			b = ( YY + ROQ_UB_tab[u[uvI]] ) >> 6;
			
			if( r < 0 )
			{
				r = 0;
			}
			if( g < 0 )
			{
				g = 0;
			}
			if( b < 0 )
			{
				b = 0;
			}
			if( r > 255 )
			{
				r = 255;
			}
			if( g > 255 )
			{
				g = 255;
			}
			if( b > 255 )
			{
				b = 255;
			}
			
			*output = LittleLong( ( r ) | ( g << 8 ) | ( b << 16 ) | ( 255 << 24 ) );
			++output;
		}
	}
	
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/
static unsigned int yuv_to_rgb24( long y, long u, long v )
{ 
	long r,g,b,YY = (long)(ROQ_YY_tab[(y)]);

	r = (YY + ROQ_VR_tab[v]) >> 6;
	g = (YY + ROQ_UG_tab[u] + ROQ_VG_tab[v]) >> 6;
	b = (YY + ROQ_UB_tab[u]) >> 6;
	
	if (r < 0) r = 0;
	if (g < 0) g = 0;
	if (b < 0) b = 0;
	if (r > 255) r = 255;
	if (g > 255) g = 255;
	if (b > 255) b = 255;
	
	return LittleLong ((unsigned long)((r)|(g<<8)|(b<<16))|(255UL<<24));
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

static void decodeCodeBook( byte *input, unsigned short roq_flags )
{
	long	i, j, two, four;
	unsigned short	*aptr, *bptr, *cptr, *dptr;
	long	y0,y1,y2,y3,cr,cb;
	byte	*bbptr, *baptr, *bcptr, *bdptr;
	union {
		unsigned int *i;
		unsigned short *s;
	} iaptr, ibptr, icptr, idptr;

	if (!roq_flags) {
		two = four = 256;
	} else {
		two  = roq_flags>>8;
		if (!two) two = 256;
		four = roq_flags&0xff;
	}

	four *= 2;

	bptr = (unsigned short *)vq2;

	if (!cinTable[currentHandle].half) {
		if (!cinTable[currentHandle].smootheddouble) {
//
// normal height
//
			if (cinTable[currentHandle].samplesPerPixel==2) {
				for(i=0;i<two;i++) {
					y0 = (long)*input++;
					y1 = (long)*input++;
					y2 = (long)*input++;
					y3 = (long)*input++;
					cr = (long)*input++;
					cb = (long)*input++;
					*bptr++ = yuv_to_rgb( y0, cr, cb );
					*bptr++ = yuv_to_rgb( y1, cr, cb );
					*bptr++ = yuv_to_rgb( y2, cr, cb );
					*bptr++ = yuv_to_rgb( y3, cr, cb );
				}

				cptr = (unsigned short *)vq4;
				dptr = (unsigned short *)vq8;
		
				for(i=0;i<four;i++) {
					aptr = (unsigned short *)vq2 + (*input++)*4;
					bptr = (unsigned short *)vq2 + (*input++)*4;
					for(j=0;j<2;j++)
						VQ2TO4(aptr,bptr,cptr,dptr);
				}
			} else if (cinTable[currentHandle].samplesPerPixel==4) {
				ibptr.s = bptr;
				for(i=0;i<two;i++) {
					y0 = (long)*input++;
					y1 = (long)*input++;
					y2 = (long)*input++;
					y3 = (long)*input++;
					cr = (long)*input++;
					cb = (long)*input++;
					*ibptr.i++ = yuv_to_rgb24( y0, cr, cb );
					*ibptr.i++ = yuv_to_rgb24( y1, cr, cb );
					*ibptr.i++ = yuv_to_rgb24( y2, cr, cb );
					*ibptr.i++ = yuv_to_rgb24( y3, cr, cb );
				}

				icptr.s = vq4;
				idptr.s = vq8;
	
				for(i=0;i<four;i++) {
					iaptr.s = vq2;
					iaptr.i += (*input++)*4;
					ibptr.s = vq2;
					ibptr.i += (*input++)*4;
					for(j=0;j<2;j++) 
						VQ2TO4(iaptr.i, ibptr.i, icptr.i, idptr.i);
				}
			} else if (cinTable[currentHandle].samplesPerPixel==1) {
				bbptr = (byte *)bptr;
				for(i=0;i<two;i++) {
					*bbptr++ = cinTable[currentHandle].gray[*input++];
					*bbptr++ = cinTable[currentHandle].gray[*input++];
					*bbptr++ = cinTable[currentHandle].gray[*input++];
					*bbptr++ = cinTable[currentHandle].gray[*input]; input +=3;
				}

				bcptr = (byte *)vq4;
				bdptr = (byte *)vq8;
	
				for(i=0;i<four;i++) {
					baptr = (byte *)vq2 + (*input++)*4;
					bbptr = (byte *)vq2 + (*input++)*4;
					for(j=0;j<2;j++) 
						VQ2TO4(baptr,bbptr,bcptr,bdptr);
				}
			}
		} else {
//
// double height, smoothed
//
			if (cinTable[currentHandle].samplesPerPixel==2) {
				for(i=0;i<two;i++) {
					y0 = (long)*input++;
					y1 = (long)*input++;
					y2 = (long)*input++;
					y3 = (long)*input++;
					cr = (long)*input++;
					cb = (long)*input++;
					*bptr++ = yuv_to_rgb( y0, cr, cb );
					*bptr++ = yuv_to_rgb( y1, cr, cb );
					*bptr++ = yuv_to_rgb( ((y0*3)+y2)/4, cr, cb );
					*bptr++ = yuv_to_rgb( ((y1*3)+y3)/4, cr, cb );
					*bptr++ = yuv_to_rgb( (y0+(y2*3))/4, cr, cb );
					*bptr++ = yuv_to_rgb( (y1+(y3*3))/4, cr, cb );
					*bptr++ = yuv_to_rgb( y2, cr, cb );
					*bptr++ = yuv_to_rgb( y3, cr, cb );
				}

				cptr = (unsigned short *)vq4;
				dptr = (unsigned short *)vq8;
		
				for(i=0;i<four;i++) {
					aptr = (unsigned short *)vq2 + (*input++)*8;
					bptr = (unsigned short *)vq2 + (*input++)*8;
					for(j=0;j<2;j++) {
						VQ2TO4(aptr,bptr,cptr,dptr);
						VQ2TO4(aptr,bptr,cptr,dptr);
					}
				}
			} else if (cinTable[currentHandle].samplesPerPixel==4) {
				ibptr.s = bptr;
				for(i=0;i<two;i++) {
					y0 = (long)*input++;
					y1 = (long)*input++;
					y2 = (long)*input++;
					y3 = (long)*input++;
					cr = (long)*input++;
					cb = (long)*input++;
					*ibptr.i++ = yuv_to_rgb24( y0, cr, cb );
					*ibptr.i++ = yuv_to_rgb24( y1, cr, cb );
					*ibptr.i++ = yuv_to_rgb24( ((y0*3)+y2)/4, cr, cb );
					*ibptr.i++ = yuv_to_rgb24( ((y1*3)+y3)/4, cr, cb );
					*ibptr.i++ = yuv_to_rgb24( (y0+(y2*3))/4, cr, cb );
					*ibptr.i++ = yuv_to_rgb24( (y1+(y3*3))/4, cr, cb );
					*ibptr.i++ = yuv_to_rgb24( y2, cr, cb );
					*ibptr.i++ = yuv_to_rgb24( y3, cr, cb );
				}

				icptr.s = vq4;
				idptr.s = vq8;
	
				for(i=0;i<four;i++) {
					iaptr.s = vq2;
					iaptr.i += (*input++)*8;
					ibptr.s = vq2;
					ibptr.i += (*input++)*8;
					for(j=0;j<2;j++) {
						VQ2TO4(iaptr.i, ibptr.i, icptr.i, idptr.i);
						VQ2TO4(iaptr.i, ibptr.i, icptr.i, idptr.i);
					}
				}
			} else if (cinTable[currentHandle].samplesPerPixel==1) {
				bbptr = (byte *)bptr;
				for(i=0;i<two;i++) {
					y0 = (long)*input++;
					y1 = (long)*input++;
					y2 = (long)*input++;
					y3 = (long)*input; input+= 3;
					*bbptr++ = cinTable[currentHandle].gray[y0];
					*bbptr++ = cinTable[currentHandle].gray[y1];
					*bbptr++ = cinTable[currentHandle].gray[((y0*3)+y2)/4];
					*bbptr++ = cinTable[currentHandle].gray[((y1*3)+y3)/4];
					*bbptr++ = cinTable[currentHandle].gray[(y0+(y2*3))/4];
					*bbptr++ = cinTable[currentHandle].gray[(y1+(y3*3))/4];						
					*bbptr++ = cinTable[currentHandle].gray[y2];
					*bbptr++ = cinTable[currentHandle].gray[y3];
				}

				bcptr = (byte *)vq4;
				bdptr = (byte *)vq8;
	
				for(i=0;i<four;i++) {
					baptr = (byte *)vq2 + (*input++)*8;
					bbptr = (byte *)vq2 + (*input++)*8;
					for(j=0;j<2;j++) {
						VQ2TO4(baptr,bbptr,bcptr,bdptr);
						VQ2TO4(baptr,bbptr,bcptr,bdptr);
					}
				}
			}			
		}
	} else {
//
// 1/4 screen
//
		if (cinTable[currentHandle].samplesPerPixel==2) {
			for(i=0;i<two;i++) {
				y0 = (long)*input; input+=2;
				y2 = (long)*input; input+=2;
				cr = (long)*input++;
				cb = (long)*input++;
				*bptr++ = yuv_to_rgb( y0, cr, cb );
				*bptr++ = yuv_to_rgb( y2, cr, cb );
			}

			cptr = (unsigned short *)vq4;
			dptr = (unsigned short *)vq8;
	
			for(i=0;i<four;i++) {
				aptr = (unsigned short *)vq2 + (*input++)*2;
				bptr = (unsigned short *)vq2 + (*input++)*2;
				for(j=0;j<2;j++) { 
					VQ2TO2(aptr,bptr,cptr,dptr);
				}
			}
		} else if (cinTable[currentHandle].samplesPerPixel == 1) {
			bbptr = (byte *)bptr;
				
			for(i=0;i<two;i++) {
				*bbptr++ = cinTable[currentHandle].gray[*input]; input+=2;
				*bbptr++ = cinTable[currentHandle].gray[*input]; input+=4;
			}

			bcptr = (byte *)vq4;
			bdptr = (byte *)vq8;
	
			for(i=0;i<four;i++) {
				baptr = (byte *)vq2 + (*input++)*2;
				bbptr = (byte *)vq2 + (*input++)*2;
				for(j=0;j<2;j++) { 
					VQ2TO2(baptr,bbptr,bcptr,bdptr);
				}
			}			
		} else if (cinTable[currentHandle].samplesPerPixel == 4) {
			ibptr.s = bptr;
			for(i=0;i<two;i++) {
				y0 = (long)*input; input+=2;
				y2 = (long)*input; input+=2;
				cr = (long)*input++;
				cb = (long)*input++;
				*ibptr.i++ = yuv_to_rgb24( y0, cr, cb );
				*ibptr.i++ = yuv_to_rgb24( y2, cr, cb );
			}

			icptr.s = vq4;
			idptr.s = vq8;
	
			for(i=0;i<four;i++) {
				iaptr.s = vq2;
				iaptr.i += (*input++)*2;
				ibptr.s = vq2 + (*input++)*2;
				ibptr.i += (*input++)*2;
				for(j=0;j<2;j++) { 
					VQ2TO2(iaptr.i,ibptr.i,icptr.i,idptr.i);
				}
			}
		}
	}
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

static void recurseQuad( long startX, long startY, long quadSize, long xOff, long yOff )
{
	byte *scroff;
	long bigx, bigy, lowx, lowy, useY;
	long offset;

	offset = cinTable[currentHandle].screenDelta;
	
	lowx = lowy = 0;
	bigx = cinTable[currentHandle].xsize;
	bigy = cinTable[currentHandle].ysize;

	if (bigx > cinTable[currentHandle].CIN_WIDTH) bigx = cinTable[currentHandle].CIN_WIDTH;
	if (bigy > cinTable[currentHandle].CIN_HEIGHT) bigy = cinTable[currentHandle].CIN_HEIGHT;

	if ( (startX >= lowx) && (startX+quadSize) <= (bigx) && (startY+quadSize) <= (bigy) && (startY >= lowy) && quadSize <= MAXSIZE) {
		useY = startY;
		scroff = cin.linbuf + (useY+((cinTable[currentHandle].CIN_HEIGHT-bigy)>>1)+yOff)*(cinTable[currentHandle].samplesPerLine) + (((startX+xOff))*cinTable[currentHandle].samplesPerPixel);

		cin.qStatus[0][cinTable[currentHandle].onQuad  ] = scroff;
		cin.qStatus[1][cinTable[currentHandle].onQuad++] = scroff+offset;
	}

	if ( quadSize != MINSIZE ) {
		quadSize >>= 1;
		recurseQuad( startX,		  startY		  , quadSize, xOff, yOff );
		recurseQuad( startX+quadSize, startY		  , quadSize, xOff, yOff );
		recurseQuad( startX,		  startY+quadSize , quadSize, xOff, yOff );
		recurseQuad( startX+quadSize, startY+quadSize , quadSize, xOff, yOff );
	}
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

static void setupQuad( long xOff, long yOff )
{
	long numQuadCels, i,x,y;
	byte *temp;

	if (xOff == cin.oldXOff && yOff == cin.oldYOff && cinTable[currentHandle].ysize == cin.oldysize && cinTable[currentHandle].xsize == cin.oldxsize) {
		return;
	}

	cin.oldXOff = xOff;
	cin.oldYOff = yOff;
	cin.oldysize = cinTable[currentHandle].ysize;
	cin.oldxsize = cinTable[currentHandle].xsize;

	numQuadCels  = (cinTable[currentHandle].xsize*cinTable[currentHandle].ysize) / (16);
	numQuadCels += numQuadCels/4;
	numQuadCels += 64;							  // for overflow

	cinTable[currentHandle].onQuad = 0;

	for(y=0;y<(long)cinTable[currentHandle].ysize;y+=16) 
		for(x=0;x<(long)cinTable[currentHandle].xsize;x+=16) 
			recurseQuad( x, y, 16, xOff, yOff );

	temp = NULL;

	for(i=(numQuadCels-64);i<numQuadCels;i++) {
		cin.qStatus[0][i] = temp;			  // eoq
		cin.qStatus[1][i] = temp;			  // eoq
	}
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

static void readQuadInfo( byte *qData )
{
	const glconfig_t *config;
	if (currentHandle < 0) return;

	cinTable[currentHandle].xsize    = qData[0]+qData[1]*256;
	cinTable[currentHandle].ysize    = qData[2]+qData[3]*256;
	cinTable[currentHandle].maxsize  = qData[4]+qData[5]*256;
	cinTable[currentHandle].minsize  = qData[6]+qData[7]*256;
	
	cinTable[currentHandle].CIN_HEIGHT = cinTable[currentHandle].ysize;
	cinTable[currentHandle].CIN_WIDTH  = cinTable[currentHandle].xsize;

	cinTable[currentHandle].samplesPerLine = cinTable[currentHandle].CIN_WIDTH*cinTable[currentHandle].samplesPerPixel;
	cinTable[currentHandle].screenDelta = cinTable[currentHandle].CIN_HEIGHT*cinTable[currentHandle].samplesPerLine;

	cinTable[currentHandle].half = qfalse;
	cinTable[currentHandle].smootheddouble = qfalse;
	
	cinTable[currentHandle].VQ0 = cinTable[currentHandle].VQNormal;
	cinTable[currentHandle].VQ1 = cinTable[currentHandle].VQBuffer;

	cinTable[currentHandle].t[0] = cinTable[currentHandle].screenDelta;
	cinTable[currentHandle].t[1] = -cinTable[currentHandle].screenDelta;

	cinTable[currentHandle].drawX = cinTable[currentHandle].CIN_WIDTH;
	cinTable[currentHandle].drawY = cinTable[currentHandle].CIN_HEIGHT;

	// rage pro is very slow at 512 wide textures, voodoo can't do it at all
	config = re.GetConfig();
	if ( config->hardwareType == GLHW_RAGEPRO || config->maxTextureSize <= 256 ) {
		if ( cinTable[currentHandle].drawX > 256 ) {
			cinTable[currentHandle].drawX = 256;
		}
		if ( cinTable[currentHandle].drawY > 256 ) {
			cinTable[currentHandle].drawY = 256;
		}
		if ( cinTable[currentHandle].CIN_WIDTH != 256 || cinTable[currentHandle].CIN_HEIGHT != 256 ) {
			Com_Printf( "HACK: approxmimating cinematic for Rage Pro or Voodoo\n" );
		}
	}
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

static void RoQPrepMcomp( long xoff, long yoff ) 
{
	long i, j, x, y, temp, temp2;

	i=cinTable[currentHandle].samplesPerLine; j=cinTable[currentHandle].samplesPerPixel;
	if ( cinTable[currentHandle].xsize == (cinTable[currentHandle].ysize*4) && !cinTable[currentHandle].half ) { j = j+j; i = i+i; }
	
	for(y=0;y<16;y++) {
		temp2 = (y+yoff-8)*i;
		for(x=0;x<16;x++) {
			temp = (x+xoff-8)*j;
			cin.mcomp[(x*16)+y] = cinTable[currentHandle].normalBuffer0-(temp2+temp);
		}
	}
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

static void initRoQ( void ) 
{
	if (currentHandle < 0) return;

	cinTable[currentHandle].VQNormal = (void (*)(byte *, void *))blitVQQuad32fs;
	cinTable[currentHandle].VQBuffer = (void (*)(byte *, void *))blitVQQuad32fs;
	cinTable[currentHandle].samplesPerPixel = 4;
	ROQ_GenYUVTables();
	RllSetupTable();
}

/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/
/*
static byte* RoQFetchInterlaced( byte *source ) {
	int x, *src, *dst;

	if (currentHandle < 0) return NULL;

	src = (int *)source;
	dst = (int *)cinTable[currentHandle].buf2;

	for(x=0;x<256*256;x++) {
		*dst = *src;
		dst++; src += 2;
	}
	return cinTable[currentHandle].buf2;
}
*/


void RoQReset( void ) {
	
	if (currentHandle < 0) return;

	FS_FCloseFile( cinTable[currentHandle].iFile );
	FS_FOpenFileRead( cinTable[currentHandle].fileName, &cinTable[currentHandle].iFile, qtrue );
	FS_Read( cin.file, 16, cinTable[currentHandle].iFile );
	RoQ_init();
	cinTable[currentHandle].status = FMV_LOOPED;
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

static void RoQInterrupt(qboolean bigJump)
{
	byte	*framedata;
  short	 sbuf[32768];
  int		 ssize;
        
	if (currentHandle < 0) return;

  if(cinTable[currentHandle].roq_id == ROQ_QUAD_INFO
    && cinTable[currentHandle].numQuads == -1)
    bigJump = qfalse;

  if(bigJump) {
    FS_Seek( cinTable[currentHandle].iFile, cinTable[currentHandle].RoQFrameSize, FS_SEEK_CUR );
    FS_Read( cin.file, 8, cinTable[currentHandle].iFile );
  } else {
    FS_Read( cin.file, cinTable[currentHandle].RoQFrameSize + 8, cinTable[currentHandle].iFile );
	}
  if ( cinTable[currentHandle].RoQPlayed >= cinTable[currentHandle].ROQSize ) { 
		if (cinTable[currentHandle].holdAtEnd==qfalse) {
			if (cinTable[currentHandle].looping) {
				RoQReset();
			} else {
				cinTable[currentHandle].status = FMV_EOF;
			}
		} else {
			cinTable[currentHandle].status = FMV_IDLE;
		}
		return; 
	}

	framedata = cin.file;
  if(bigJump) {
    goto bigjump;
  }
//
// new frame is ready
//
redump:
	switch(cinTable[currentHandle].roq_id) 
	{
		case	ROQ_QUAD_VQ:
			if ((cinTable[currentHandle].numQuads&1)) {
				cinTable[currentHandle].normalBuffer0 = cinTable[currentHandle].t[1];
				RoQPrepMcomp( cinTable[currentHandle].roqF0, cinTable[currentHandle].roqF1 );
				cinTable[currentHandle].VQ1( (byte *)cin.qStatus[1], framedata);
				cinTable[currentHandle].buf = 	cin.linbuf + cinTable[currentHandle].screenDelta;
			} else {
				cinTable[currentHandle].normalBuffer0 = cinTable[currentHandle].t[0];
				RoQPrepMcomp( cinTable[currentHandle].roqF0, cinTable[currentHandle].roqF1 );
				cinTable[currentHandle].VQ0( (byte *)cin.qStatus[0], framedata );
				cinTable[currentHandle].buf = 	cin.linbuf;
			}
			if (cinTable[currentHandle].numQuads == 0) {		// first frame
				Com_Memcpy(cin.linbuf+cinTable[currentHandle].screenDelta, cin.linbuf, cinTable[currentHandle].samplesPerLine*cinTable[currentHandle].ysize);
			}
			cinTable[currentHandle].numQuads++;
			cinTable[currentHandle].dirty = qtrue;
			break;
		case	ROQ_CODEBOOK:
			decodeCodeBook( framedata, (unsigned short)cinTable[currentHandle].roq_flags );
			break;
		case	ZA_SOUND_MONO:
			if (!cinTable[currentHandle].silent) {
				ssize = RllDecodeMonoToStereo( framedata, sbuf, cinTable[currentHandle].RoQFrameSize, 0, (unsigned short)cinTable[currentHandle].roq_flags);
				S_RawSamples( ssize, 22050, 2, 1, (byte *)sbuf, s_volume->value );
			}
			break;
		case	ZA_SOUND_STEREO:
		
			if (!cinTable[currentHandle].silent) {
				if (cinTable[currentHandle].numQuads == -1) {
					S_Update( 333 );
					//s_rawend = s_soundtime;
				}
				ssize = RllDecodeStereoToStereo( framedata, sbuf, cinTable[currentHandle].RoQFrameSize, 0, (unsigned short)cinTable[currentHandle].roq_flags);
				S_RawSamples( ssize, 22050, 2, 2, (byte *)sbuf, s_volume->value );
			}
			break;
		case	ROQ_QUAD_INFO:
			if (cinTable[currentHandle].numQuads == -1) {
				readQuadInfo( framedata );
				setupQuad( 0, 0 );
				cinTable[currentHandle].startTime = cinTable[currentHandle].lastTime = CL_ScaledMilliseconds();
			}
			if (cinTable[currentHandle].numQuads != 1) cinTable[currentHandle].numQuads = 0;
			break;
		case	ROQ_PACKET:
			cinTable[currentHandle].inMemory = cinTable[currentHandle].roq_flags;
			cinTable[currentHandle].RoQFrameSize = 0;           // for header
			break;
		case	ROQ_QUAD_HANG:
			cinTable[currentHandle].RoQFrameSize = 0;
			break;
		case	ROQ_QUAD_JPEG:
			break;
		default:
			cinTable[currentHandle].status = FMV_EOF;
			break;
	}

bigjump:
//
// read in next frame data
//
	if ( cinTable[currentHandle].RoQPlayed >= cinTable[currentHandle].ROQSize ) { 
		if (cinTable[currentHandle].holdAtEnd==qfalse) {
			if (cinTable[currentHandle].looping) {
				RoQReset();
			} else {
				cinTable[currentHandle].status = FMV_EOF;
			}
		} else {
			cinTable[currentHandle].status = FMV_IDLE;
		}
		return; 
	}
	
  if(!bigJump) {
    framedata	+= cinTable[currentHandle].RoQFrameSize;
  } // else we're already there
	cinTable[currentHandle].roq_id		   = framedata[0] + framedata[1]*256;
	cinTable[currentHandle].RoQFrameSize = framedata[2] + framedata[3]*256 + framedata[4]*65536;
	cinTable[currentHandle].roq_flags	   = framedata[6] + framedata[7]*256;
	cinTable[currentHandle].roqF0		     = (signed char)framedata[7];
	cinTable[currentHandle].roqF1		     = (signed char)framedata[6];

	if (cinTable[currentHandle].RoQFrameSize>65536||cinTable[currentHandle].roq_id==0x1084) {
		Com_DPrintf("roq_size>65536||roq_id==0x1084\n");
		cinTable[currentHandle].status = FMV_EOF;
		if (cinTable[currentHandle].looping) {
			RoQReset();
		}
		return;
	}
	if (cinTable[currentHandle].inMemory && (cinTable[currentHandle].status != FMV_EOF)) { 
		cinTable[currentHandle].inMemory--;
		framedata += 8;
		goto redump; 
	}
//
// one more frame hits the dust
//
//	assert(cinTable[currentHandle].RoQFrameSize <= 65536);
//	r = Sys_StreamedRead( cin.file, cinTable[currentHandle].RoQFrameSize+8, 1, cinTable[currentHandle].iFile );
	cinTable[currentHandle].RoQPlayed	+= cinTable[currentHandle].RoQFrameSize+8;
}


/******************************************************************************
*
* Function:		
*
* Description:	
*
******************************************************************************/

static void RoQ_init( void )
{
	cinTable[currentHandle].startTime = cinTable[currentHandle].lastTime = CL_ScaledMilliseconds();

	cinTable[currentHandle].RoQPlayed = 24;

/*	get frame rate */	
	cinTable[currentHandle].roqFPS	 = cin.file[ 6] + cin.file[ 7]*256;
	
	if (!cinTable[currentHandle].roqFPS) cinTable[currentHandle].roqFPS = 30;

	cinTable[currentHandle].numQuads = -1;

	cinTable[currentHandle].roq_id		= cin.file[ 8] + cin.file[ 9]*256;
	cinTable[currentHandle].RoQFrameSize	= cin.file[10] + cin.file[11]*256 + cin.file[12]*65536;
	cinTable[currentHandle].roq_flags	= cin.file[14] + cin.file[15]*256;

	if (cinTable[currentHandle].RoQFrameSize > 65536 || !cinTable[currentHandle].RoQFrameSize) { 
		return;
	}

}


/*
==================
CIN_RunCinematic

Fetch and decompress the pending frame
==================
*/


e_status CIN_RunROQ(int handle) 
{
	int	start = 0;
	int thisTime = 0;
  qboolean bigJump = qfalse;

	//FIXME? CL_ScaledMilliseconds already uses com_timescale (so I can't see that the com_timescale in here makes any sense at all O_o)
	// we need to use CL_ScaledMilliseconds because of the smp mode calls from the renderer
	thisTime = CL_ScaledMilliseconds();
	if (cinTable[currentHandle].shader && (abs(thisTime - cinTable[currentHandle].lastTime))>100) {
		//RoQReset();
		// TODO: synchronize with server sending when a looping sound should reset?
		// TODO: run video in the background outside of the frame renderer when it is not in view
		// TODO: this causes the slowness we are seeing on Mac, it's like it has to reload a bunch of data to catch up
		//cinTable[currentHandle].startTime += thisTime - cinTable[currentHandle].lastTime;
		//cinTable[currentHandle].numQuads = -1;
    bigJump = qtrue;
	} else {
    bigJump = qfalse;
  }
	// we need to use CL_ScaledMilliseconds because of the smp mode calls from the renderer
	cinTable[currentHandle].tfps = (((CL_ScaledMilliseconds()
                                 - cinTable[currentHandle].startTime)*3)/100);

	start = cinTable[currentHandle].startTime;
	while(  (cinTable[currentHandle].tfps != cinTable[currentHandle].numQuads)
		&& (cinTable[currentHandle].status == FMV_PLAY) ) 
	{
		RoQInterrupt(bigJump);
		if (start != cinTable[currentHandle].startTime) {
			// we need to use CL_ScaledMilliseconds because of the smp mode calls from the renderer
		  cinTable[currentHandle].tfps = (((CL_ScaledMilliseconds()
							                       - cinTable[currentHandle].startTime)*3)/100);
			start = cinTable[currentHandle].startTime;
		} else bigJump = qfalse;
	}

	cinTable[currentHandle].lastTime = thisTime;

	if (cinTable[currentHandle].status == FMV_LOOPED) {
		cinTable[currentHandle].status = FMV_PLAY;
	}

	if (cinTable[currentHandle].status == FMV_EOF) {
	  if (cinTable[currentHandle].looping) {
	    RoQReset();
	  } else {
	    CIN_Shutdown();
	  }
	}

	return cinTable[currentHandle].status;
}

/*
==================
CIN_PlayCinematic
==================
*/

int CIN_PlayROQ( const char *name, int x, int y, int w, int h, int systemBits ) 
{
	unsigned short RoQID;
	Q_strncpyz( cinTable[currentHandle].fileName, name, sizeof( cinTable[currentHandle].fileName ) );

	cinTable[currentHandle].ROQSize = FS_FOpenFileRead( cinTable[currentHandle].fileName, &cinTable[currentHandle].iFile, qtrue );

	if (cinTable[currentHandle].ROQSize<=0) {
		Com_DPrintf("Can't play(%s), ROQSize<=0\n", name);
		cinTable[currentHandle].fileName[0] = '\0';
		if ( cinTable[currentHandle].iFile != FS_INVALID_HANDLE ) {
			FS_FCloseFile( cinTable[currentHandle].iFile );
			cinTable[currentHandle].iFile = FS_INVALID_HANDLE;
		}
		return -1;
	}

	CIN_SetExtents(currentHandle, x, y, w, h);
	CIN_SetLooping(currentHandle, (systemBits & CIN_loop)!=0);

	cinTable[currentHandle].CIN_HEIGHT = DEFAULT_CIN_HEIGHT;
	cinTable[currentHandle].CIN_WIDTH  =  DEFAULT_CIN_WIDTH;
	cinTable[currentHandle].holdAtEnd = (systemBits & CIN_hold) != 0;
	cinTable[currentHandle].alterGameState = (systemBits & CIN_system) != 0;
	cinTable[currentHandle].playonwalls = 1;
	cinTable[currentHandle].silent = (systemBits & CIN_silent) != 0;
	cinTable[currentHandle].shader = (systemBits & CIN_shader) != 0;

	if (cinTable[currentHandle].alterGameState) {
		// close the menu
		if ( uivm ) {
			VM_Call( uivm, 1, UI_SET_ACTIVE_MENU, UIMENU_NONE );
		}
	} else {
		cinTable[currentHandle].playonwalls = cl_inGameVideo->integer;
	}

	initRoQ();
					
	FS_Read (cin.file, 16, cinTable[currentHandle].iFile);

	RoQID = (unsigned short)(cin.file[0]) + (unsigned short)(cin.file[1])*256;
	if (RoQID == 0x1084)
	{
		RoQ_init();

		cinTable[currentHandle].status = FMV_PLAY;
		Com_DPrintf("%s: playing %s\n", __func__, name);

		if (cinTable[currentHandle].alterGameState) {
			cls.state = CA_CINEMATIC;
		}

#ifndef USE_NO_CONSOLE
		Con_Close();
#endif

		if ( !cinTable[currentHandle].silent ) {
			//s_rawend = s_soundtime;
		}

		return currentHandle;
	}
	Com_DPrintf("%s: invalid RoQ ID\n", __func__);

	CIN_Shutdown();
	return -1;
}
