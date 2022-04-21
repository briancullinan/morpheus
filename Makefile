

.DEFAULT_GOAL      := release

# echo_cmd is silent in verbose mode, makes sense
ifeq ($(V),1)
echo_cmd=@:
Q=
else
echo_cmd=@echo
Q=@
endif

ifndef BUILD_DIR
BUILD_DIR := build/release
endif
ifeq ($(BUILD_DIR),)
BUILD_DIR := build/release
endif
ifndef COMPILE_PLATFORM
COMPILE_PLATFORM   := $(shell uname | sed -e 's/_.*//' | tr '[:upper:]' '[:lower:]' | sed -e 's/\//_/g')
endif

MKDIR              := mkdir -p
LD                 := libs/$(COMPILE_PLATFORM)/wasi-sdk-14.0/bin/wasm-ld
CC                 := libs/$(COMPILE_PLATFORM)/wasi-sdk-14.0/bin/clang
CXX                := libs/$(COMPILE_PLATFORM)/wasi-sdk-14.0/bin/clang++

Q3ASM_SOURCE  := libs/q3asm
MUSL_SOURCE   := libs/musl-1.2.2

CLIENT_INCLUDES    := \
	-Iengine/wasm \
	-I$(MUSL_SOURCE)/include \
	-I$(SDL_SOURCE)/include 

BASE_CFLAGS        := \
	$(CFLAGS) -Wall --target=wasm32 \
	-Wimplicit -fstrict-aliasing \
	-ftree-vectorize -fsigned-char -MMD \
	-ffast-math -fno-short-enums  -fPIC \
	-D_XOPEN_SOURCE=700 \
	-D__EMSCRIPTEN__=1 \
	-D__WASM__=1 \
	-std=gnu11

CLIENT_CFLAGS      := $(BASE_CFLAGS) \
											$(CLIENT_INCLUDES)
CLIENT_LDFLAGS     := $(LDFLAGS) \
	-Wl,--import-memory -Wl,--import-table -Wl,--error-limit=200 \
	-Wl,--no-entry --no-standard-libraries -Wl,--export-dynamic \
	-Wl,--allow-undefined-file=engine/wasm/wasm.syms \
	engine/wasm/wasi/libclang_rt.builtins-wasm32.a 

Q3ASM_CFLAGS       := $(CLIENT_CFLAGS)

# WRITE THIS IN A WAY THAT THE FILE TREE
#   CAN PARSE IT AND SHOW A SWEET LITTLE GRAPH
#   OF COMMANDS THAT RUN FOR EACH FILE TO COMPILE.

LIBRARY_DIRS  := $(Q3ASM_SOURCE)/

# LAYOUT BUILD_DIRS UPFRONT
BUILD_DIRS    := \
	$(BUILD_DIR) \
	$(filter $(MAKECMDGOALS),clean) \
	$(subst libs/,$(BUILD_DIR)/,$(LIBRARY_DIRS))

define MKDIR_SH
	@if [ ! -d "./$@" ]; \
		then $(MKDIR) "./$@";fi;
endef

$(BUILD_DIR)/%/: libs/%/
	$(MKDIR_SH)

$(BUILD_DIR):
	$(MKDIR_SH)

#D_DIRS  := $(addprefix $(BUILD_DIR)/,$(WORKDIRS))
D_FILES := $(shell find $(BUILD_DIR)/** -name '*.d' 2>/dev/null)
ifneq ($(strip $(D_FILES)),)
include $(D_FILES)
endif

release: 
	$(Q)$(MAKE) multigame engine \
		plugin index build-tools deploy \
		BUILD_DIR="build/release" \
		CFLAGS="$(RELEASE_CFLAGS)" \
		LDFLAGS="$(RELEASE_LDFLAGS)"

debug: 
	$(Q)$(MAKE) multigame engine \
		plugin index build-tools deploy \
		BUILD_DIR="build/debug" \
		CFLAGS="$(DEBUG_CFLAGS)" \
		LDFLAGS="$(DEBUG_LDFLAGS)"

multigame: q3asm q3lcc ui.qvm cgame.qvm qagame.qvm

# MAKE Q3LCC-WASM TO RECOMPILE GAME CODE IN BROWSER-WORKER
Q3ASM_FILES  := $(wildcard $(Q3ASM_SOURCE)/*.c)
Q3ASM_OBJS   := $(subst libs/,$(BUILD_DIR)/,$(Q3ASM_FILES:.c=.o))

q3asm: $(BUILD_DIRS) $(Q3ASM_FILES) $(Q3ASM_OBJS)
	$(echo_cmd) "WASM-LD $@"
	$(Q)$(CC) -o $(BUILD_DIR)/$@.wasm $(Q3ASM_OBJS) $(CLIENT_LDFLAGS)

$(BUILD_DIR)/q3asm/%.o: $(Q3ASM_SOURCE)/%.c
	$(echo_cmd) "Q3ASM_CC $<"
	$(Q)$(CC) -o $@ $(Q3ASM_CFLAGS) -c $<

q3lcc: $(BUILD_DIRS) $(Q3LCC_FILES) $(Q3LCC_OBJS)



