#ifndef BURG_INCLUDED
#define BURG_INCLUDED

/* iburg.c: */
extern void *alloc(int nbytes);

typedef enum { TERM=1, NONTERM } Kind;
typedef struct rule *Rule;
typedef struct term *Term;
struct term {		/* terminals: */
	char *name;		/* terminal name */
	Kind kind;		/* TERM */
	int esn;		/* external symbol number */
	int arity;		/* operator arity */
	Term link;		/* next terminal in esn order */
	Rule rules;		/* rules whose pattern starts with term */
};

typedef struct nonterm *Nonterm;
struct nonterm {	/* nonterminals: */
	char *name;		/* nonterminal name */
	Kind kind;		/* NONTERM */
	int number;		/* identifying number */
	int lhscount;		/* # times nt appears in a rule lhs */
	int reached;		/* 1 iff reached from start nonterminal */
	Rule rules;		/* rules w/nonterminal on lhs */
	Rule chain;		/* chain rules w/nonterminal on rhs */
	Nonterm link;		/* next terminal in number order */
};
extern Nonterm nonterm(char *id);
extern Term term(char *id, int esn);

typedef struct tree *Tree;
struct tree {		/* tree patterns: */
	void *op;		/* a terminal or nonterminal */
	Tree left, right;	/* operands */
	int nterms;		/* number of terminal nodes in this tree */
};
extern Tree tree(char *op, Tree left, Tree right);

struct rule {		/* rules: */
	Nonterm lhs;		/* lefthand side nonterminal */
	Tree pattern;		/* rule pattern */
	int ern;		/* external rule number */
	int packed;		/* packed external rule number */
	int cost;		/* cost, if a constant */
	char *code;		/* cost, if an expression */
	char *template;		/* assembler template */
	Rule link;		/* next rule in ern order */
	Rule next;		/* next rule with same pattern root */
	Rule chain;		/* next chain rule with same rhs */
	Rule decode;		/* next rule with same lhs */
	Rule kids;		/* next rule with same _kids pattern */
};
extern Rule rule(char *id, Tree pattern, char *template, char *code);

/* gram.y: */
void yyerror(char *fmt, ...);
int yyparse(void);
void yywarn(char *fmt, ...);
extern int errcnt;
extern FILE *infp;
extern FILE *outfp;



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

#endif
