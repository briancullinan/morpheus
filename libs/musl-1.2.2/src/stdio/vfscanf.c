#include <stdlib.h>
#include <stdarg.h>
#include <ctype.h>
#include <wchar.h>
#include <wctype.h>
#include <limits.h>
#include <string.h>
#include <stdint.h>

#include "stdio_impl.h"
#include "shgetc.h"
#include "intscan.h"
#include "floatscan.h"

#define SIZE_hh -2
#define SIZE_h  -1
#define SIZE_def 0
#define SIZE_l   1
#define SIZE_L   2
#define SIZE_ll  3

static void store_int(void *dest, int size, unsigned long long i)
{
	if (!dest) return;
	switch (size) {
	case SIZE_hh:
		*(char *)dest = i;
		break;
	case SIZE_h:
		*(short *)dest = i;
		break;
	case SIZE_def:
		*(int *)dest = i;
		break;
	case SIZE_l:
		*(long *)dest = i;
		break;
	case SIZE_ll:
		*(long long *)dest = i;
		break;
	}
}

static void *arg_n(va_list ap, unsigned int n)
{
	void *p;
	unsigned int i;
	va_list ap2;
	va_copy(ap2, ap);
	for (i=n; i>1; i--) va_arg(ap2, void *);
	p = va_arg(ap2, void *);
	va_end(ap2);
	return p;
}

int vfscanf(FILE *restrict f, const char *restrict fmt, va_list ap)
{
	int width;
	int size;
	int alloc = 0;
	int base;
	const unsigned char *p;
	int c, t;
	char *s;
	wchar_t *wcs;
	mbstate_t st;
	void *dest=NULL;
	int invert;
	int matches=0;
	unsigned long long x;
	long double y;
	off_t pos = 0;
	unsigned char scanset[257];
	size_t i, k;
	wchar_t wc;

	FLOCK(f);

	if (!f->rpos) __toread(f);
	if (!f->rpos) goto input_fail;

	for (p=(const unsigned char *)fmt; *p; p++) {

		alloc = 0;

		if (isspace(*p)) {
			while (isspace(p[1])) p++;
			shlim(f, 0);
			while (isspace(shgetc(f)));
			shunget(f);
			pos += shcnt(f);
			continue;
		}
		if (*p != '%' || p[1] == '%') {
			shlim(f, 0);
			if (*p == '%') {
				p++;
				while (isspace((c=shgetc(f))));
			} else {
				c = shgetc(f);
			}
			if (c!=*p) {
				shunget(f);
				if (c<0) goto input_fail;
				goto match_fail;
			}
			pos += shcnt(f);
			continue;
		}

		p++;
		if (*p=='*') {
			dest = 0; p++;
		} else if (isdigit(*p) && p[1]=='$') {
			dest = arg_n(ap, *p-'0'); p+=2;
		} else {
			dest = va_arg(ap, void *);
		}

		for (width=0; isdigit(*p); p++) {
			width = 10*width + *p - '0';
		}

		if (*p=='m') {
			wcs = 0;
			s = 0;
			alloc = !!dest;
			p++;
		} else {
			alloc = 0;
		}

		size = SIZE_def;
		switch (*p++) {
		case 'h':
			if (*p == 'h') p++, size = SIZE_hh;
			else size = SIZE_h;
			break;
		case 'l':
			if (*p == 'l') p++, size = SIZE_ll;
			else size = SIZE_l;
			break;
		case 'j':
			size = SIZE_ll;
			break;
		case 'z':
		case 't':
			size = SIZE_l;
			break;
		case 'L':
			size = SIZE_L;
			break;
		case 'd': case 'i': case 'o': case 'u': case 'x':
		case 'a': case 'e': case 'f': case 'g':
		case 'A': case 'E': case 'F': case 'G': case 'X':
		case 's': case 'c': case '[':
		case 'S': case 'C':
		case 'p': case 'n':
			p--;
			break;
		default:
			goto fmt_fail;
		}

		t = *p;

		/* C or S */
		if ((t&0x2f) == 3) {
			t |= 32;
			size = SIZE_l;
		}

		switch (t) {
		case 'c':
			if (width < 1) width = 1;
		case '[':
			break;
		case 'n':
			store_int(dest, size, pos);
			/* do not increment match count, etc! */
			continue;
		default:
			shlim(f, 0);
			while (isspace(shgetc(f)));
			shunget(f);
			pos += shcnt(f);
		}

		shlim(f, width);
		if (shgetc(f) < 0) goto input_fail;
		shunget(f);

		switch (t) {
		case 's':
		case 'c':
			break;
		case 'p':
		case 'X':
		case 'x':
			base = 16;
			goto int_common;
		case 'o':
			base = 8;
			goto int_common;
		case 'd':
		case 'u':
			base = 10;
			goto int_common;
		case 'i':
			base = 0;
		int_common:
			x = __intscan(f, base, 0, ULLONG_MAX);
			if (!shcnt(f)) goto match_fail;
			if (t=='p' && dest) *(void **)dest = (void *)(uintptr_t)x;
			else store_int(dest, size, x);
			break;
		case 'a': case 'A':
		case 'e': case 'E':
		case 'f': case 'F':
		case 'g': case 'G':
			y = __floatscan(f, size, 0);
			if (!shcnt(f)) goto match_fail;
			if (dest) switch (size) {
			case SIZE_def:
				*(float *)dest = y;
				break;
			case SIZE_l:
				*(double *)dest = y;
				break;
			case SIZE_L:
				*(long double *)dest = y;
				break;
			}
			break;
		}

		pos += shcnt(f);
		if (dest) matches++;
	}
	if (0) {
fmt_fail:
alloc_fail:
input_fail:
		if (!matches) matches--;
match_fail:
		if (alloc) {
			free(s);
			free(wcs);
		}
	}
	FUNLOCK(f);
	return matches;
}

weak_alias(vfscanf,__isoc99_vfscanf);
