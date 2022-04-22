// OPINIONATED FRONTENDS FOR MISSING WASI FILESYSTEM/MISC

int Sys_fputc(int, FILE *);
#define fputc(i, f) Sys_fputc(i, f)
int Sys_feof(FILE *);
#define feof(f) Sys_feof(f)
int Sys_fgetc(FILE *f);
#define fgetc(f) Sys_fgetc(f)
int Sys_getc(FILE *f);
#define getc(f) Sys_getc(f)
int Sys_putc(int c, FILE *f);
#define putc(c, f) Sys_putc(c, f)
int Sys_time(int *t);
#define time(t) Sys_time(t)

// I'M BEING DANGEROUS
int Sys_execv(const char *path, char *const argv[]);
#define execv(p, a) Sys_execv(p, a)



__attribute__((__visibility__("default")))
__attribute__((__noinline__))
void* malloc(size_t bytes);

__attribute__((__visibility__("default")))
__attribute__((__noinline__))
int sprintf(char *__restrict, const char *__restrict, ...);

int Sys_fprintf(FILE *__restrict, const char *__restrict, ...);
#define fprintf(x, ...) Sys_fprintf(x, __VA_ARGS__)
int Sys_vfprintf(FILE *__restrict, const char *__restrict, __isoc_va_list);
#define vfprintf(x, y, ...) Sys_vfprintf(x, y, __VA_ARGS__)
int Sys_fputs(const char *__restrict, FILE *__restrict);
#define fputs(x, y) Sys_fputs(x, y)
FILE *Sys_FOpen(const char *__restrict, const char *__restrict);
#define fopen(x, y) Sys_FOpen(x, y)
char *Sys_fgets(char *__restrict, int, FILE *__restrict);
#define fgets(buf, size, fh) Sys_fgets(buf, size, fh)

