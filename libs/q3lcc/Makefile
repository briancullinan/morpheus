TEMPDIR=/tmp
A=.a
O=.o
E=.wasm

ifndef COMPILE_PLATFORM
COMPILE_PLATFORM   := $(shell uname | sed -e 's/_.*//' | tr '[:upper:]' '[:lower:]' | sed -e 's/\//_/g')
endif

#-mthread-model posix -pthread
#-mthread-model single
PLATFORM := wasm
ARCH := js
OPT := wasm-opt 
CC := ../$(COMPILE_PLATFORM)/wasi-sdk-14.0/bin/clang
LCC_CFLAGS = \
	-O2 -Wall --target=wasm32 \
	-fno-strict-aliasing -MMD \
	-D__WASM__=1 \
	-D__wasi__=1 \
	-D__wasm32__=1 \
	-D_WASI_EMULATED_SIGNAL \
	-D_WASI_EMULATED_MMAN=1 \
	-Wno-logical-op-parentheses \
	-Wno-unused-variable \
	-Wno-misleading-indentation \
	-Wno-unused-label \
	-Wno-parentheses \
	-Wno-dangling-else \
	-Wno-missing-braces \
	-I../wasi-sysroot/include 

#	--import fopen            :(

LDFLAGS := \
	--error-limit=200 \
	--export-dynamic \
	--export malloc \
	--import-memory \
	--import-table \
	--export-all \
	--export sprintf \
	--export stderr \
	--export stdout \
	--allow-undefined-file=../../engine/wasm/wasm.syms \
	../../engine/wasm/wasi/libclang_rt.builtins-wasm32.a \
	../wasi-sysroot/lib/wasm32-wasi/libc.a

LD := ../$(COMPILE_PLATFORM)/wasi-sdk-14.0/bin/wasm-ld
AR=ar
ARFLAGS=cru
RANLIB=ranlib
DIFF=diff
RM=rm -f
RMDIR=rmdir
BUILDDIR=build-$(PLATFORM)-$(ARCH)
BD=$(BUILDDIR)/

ifeq ($(USE_CCACHE),1)
  CC := ccache $(CC)
endif

# Need MACOS_X defined or this won't build.
ifeq ($(PLATFORM),darwin)
#  LCC_CFLAGS += -DMACOS_X
endif

ifeq ($(PLATFORM),sunos)
  INSTALL=ginstall
else
  INSTALL=install
endif

all: q3rcc lburg q3cpp q3lcc

q3rcc: makedirs $(BD)q3rcc$(E)
lburg: makedirs $(BD)lburg/lburg$(E)
q3cpp: makedirs $(BD)q3cpp$(E)
q3lcc: makedirs $(BD)q3lcc$(E)

makedirs:
	@if [ ! -d $(BD) ];then mkdir $(BD);fi
	@if [ ! -d $(BD)/etc ];then mkdir $(BD)/etc;fi
	@if [ ! -d $(BD)/rcc ];then mkdir $(BD)/rcc;fi
	@if [ ! -d $(BD)/cpp ];then mkdir $(BD)/cpp;fi
	@if [ ! -d $(BD)/lburg ];then mkdir $(BD)/lburg;fi

# ===== RCC =====
RCCOBJS= \
	$(BD)rcc/alloc$(O) \
	$(BD)rcc/bind$(O) \
	$(BD)rcc/bytecode$(O) \
	$(BD)rcc/dag$(O) \
	$(BD)rcc/dagcheck$(O) \
	$(BD)rcc/decl$(O) \
	$(BD)rcc/enode$(O) \
	$(BD)rcc/error$(O) \
	$(BD)rcc/event$(O) \
	$(BD)rcc/expr$(O) \
	$(BD)rcc/gen$(O) \
	$(BD)rcc/init$(O) \
	$(BD)rcc/inits$(O) \
	$(BD)rcc/input$(O) \
	$(BD)rcc/lex$(O) \
	$(BD)rcc/list$(O) \
	$(BD)rcc/main$(O) \
	$(BD)rcc/null$(O) \
	$(BD)rcc/output$(O) \
	$(BD)rcc/prof$(O) \
	$(BD)rcc/profio$(O) \
	$(BD)rcc/simp$(O) \
	$(BD)rcc/stmt$(O) \
	$(BD)rcc/string$(O) \
	$(BD)rcc/sym$(O) \
	$(BD)rcc/symbolic$(O) \
	$(BD)rcc/trace$(O) \
	$(BD)rcc/tree$(O) \
	$(BD)rcc/types$(O)

$(BD)q3rcc$(E): $(RCCOBJS)
	$(LD) $(LDFLAGS) -o $@ $(RCCOBJS)

$(BD)rcc/%$(O): src/%.c
	$(CC) $(LCC_CFLAGS) -c -Isrc -o $@ $<

$(BD)rcc/dagcheck$(O): $(BD)rcc/dagcheck.c
	$(CC) $(LCC_CFLAGS) -Wno-unused -c -Isrc -o $@ $<

$(BD)rcc/dagcheck.c: $(BD)lburg/lburg$(E) src/dagcheck.md
	$(Q)node -e "require('../../engine/wasm/bin/lburg.js') \
		('src/dagcheck.md', '$@')"


# ===== LBURG =====
LBURGOBJS= \
	$(BD)lburg/lburg$(O) \
	$(BD)lburg/gram$(O)

$(BD)lburg/lburg$(E): $(LBURGOBJS)
	$(LD) $(LDFLAGS) -o $@ $(LBURGOBJS)
	$(Q)$(OPT) -Os --no-validation -o $@ $@


$(BD)lburg/%$(O): lburg/%.c
	$(CC) $(LCC_CFLAGS) -c -Ilburg -o $@ $<


# ===== CPP =====
CPPOBJS= \
	$(BD)cpp/cpp$(O) \
	$(BD)cpp/lex$(O) \
	$(BD)cpp/nlist$(O) \
	$(BD)cpp/tokens$(O) \
	$(BD)cpp/macro$(O) \
	$(BD)cpp/eval$(O) \
	$(BD)cpp/include$(O) \
	$(BD)cpp/hideset$(O) \
	$(BD)cpp/getopt$(O) \
	$(BD)cpp/unix$(O)

$(BD)q3cpp$(E): $(CPPOBJS)
	$(LD) $(LDFLAGS) -o $@ $(CPPOBJS)

$(BD)cpp/%$(O): cpp/%.c
	$(CC) $(LCC_CFLAGS) -c -Icpp -o $@ $<


# ===== LCC =====
LCCOBJS= \
	$(BD)etc/lcc$(O) \
	$(BD)etc/bytecode$(O)

$(BD)q3lcc$(E): $(LCCOBJS)
	$(LD) $(LDFLAGS) \
		../wasi-sysroot/lib/wasm32-wasi/libwasi-emulated-signal.a \
		../wasi-sysroot/lib/wasm32-wasi/libwasi-emulated-getpid.a \
	 -o $@ $(LCCOBJS)

$(BD)etc/%$(O): etc/%.c
	$(CC) $(LCC_CFLAGS) -DTEMPDIR=\"$(TEMPDIR)\" -DSYSTEM=\"\" -c -Isrc -o $@ $<


install: q3lcc q3cpp q3rcc
	$(INSTALL) -s -m 0755 $(BD)q3lcc$(E) ../
	$(INSTALL) -s -m 0755 $(BD)q3cpp$(E) ../
	$(INSTALL) -s -m 0755 $(BD)q3rcc$(E) ../

uninstall:
	-$(RM) ../q3lcc$(E)
	-$(RM) ../q3cpp$(E)
	-$(RM) ../q3rcc$(E)

clean:
	if [ -d $(BD) ];then (find $(BD) -name '*.d' -exec rm {} \;)fi
	$(RM) $(RCCOBJS) $(LBURGOBJS) $(CPPOBJS) $(LCCOBJS)
	$(RM) $(BD)rcc/dagcheck.c $(BD)lburg/lburg$(E)
	$(RM) $(BD)q3lcc$(E) $(BD)q3cpp$(E) $(BD)q3rcc$(E)
	$(RM) -r $(BD)

D_FILES=$(shell find . -name '*.d')

ifneq ($(strip $(D_FILES)),)
  include $(D_FILES)
endif
