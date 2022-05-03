

.DEFAULT_GOAL      := release

LANDING_PAGE = driver/landing/ide.html

# echo_cmd is silent in verbose mode, makes sense
ifeq ($(V),1)
echo_cmd=@:
Q=
else
echo_cmd=@echo
Q=@
endif

ifndef BUILD_DIR
BUILD_DIR := build/release-wasm-js
endif
ifeq ($(BUILD_DIR),)
BUILD_DIR := build/release-wasm-js
endif
ifndef COMPILE_PLATFORM
COMPILE_PLATFORM   := $(shell uname | sed -e 's/_.*//' | tr '[:upper:]' '[:lower:]' | sed -e 's/\//_/g')
endif

MKDIR          := mkdir -p
LD             := libs/$(COMPILE_PLATFORM)/wasi-sdk-14.0/bin/wasm-ld
CC             := libs/$(COMPILE_PLATFORM)/wasi-sdk-14.0/bin/clang
CXX            := libs/$(COMPILE_PLATFORM)/wasi-sdk-14.0/bin/clang++

WASI_INCLUDES  := \
	--target=wasm32 \
	-Ilibs/wasi-sysroot/include \
	-I$(SDL_SOURCE)/include 

BASE_CFLAGS    := \
	$(CFLAGS) -fno-rtti -Wall \
	-Wimplicit -fstrict-aliasing  -fno-inline \
	-ftree-vectorize -fsigned-char -MMD \
	-ffast-math -fno-short-enums  -fPIC \
	-D_XOPEN_SOURCE=700 -D__EMSCRIPTEN__=1 \
	-D__WASM__=1 -D__wasi__=1 -D__wasm32__=1 \
	-D_WASI_EMULATED_SIGNAL -D_WASI_EMULATED_MMAN=1 


CLIENT_CFLAGS  := $(BASE_CFLAGS) -std=gnu11 $(WASI_INCLUDES)

WASI_SYSROOT   := libs/wasi-sysroot/lib/wasm32-wasi
WASI_LDFLAGS   := $(LDFLAGS) \
	-Wl,--import-memory -Wl,--import-table \
	-Wl,--export-dynamic -Wl,--error-limit=200 \
	-Wl,--export=sprintf -Wl,--export=malloc  \
	-Wl,--export=stderr -Wl,--export=stdout  \
	-Wl,--export=errno --no-standard-libraries \
	-Wl,--allow-undefined-file=engine/wasm/wasm.syms \
	engine/wasm/wasi/libclang_rt.builtins-wasm32.a

CLIENT_LDFLAGS := $(WASI_LDFLAGS) \
	$(WASI_SYSROOT)/libc.a 


# WRITE THIS IN A WAY THAT THE FILE TREE
#   CAN PARSE IT AND SHOW A SWEET LITTLE GRAPH
#   OF COMMANDS THAT RUN FOR EACH FILE TO COMPILE.
GAME_SOURCE    := games/lobby
UIVM_SOURCE    := $(GAME_SOURCE)/q3_ui
GAME_SOURCE    := $(GAME_SOURCE)/game
Q3ASM_SOURCE   := libs/q3asm
Q3RCC_SOURCE   := libs/q3lcc/src
LBURG_SOURCE   := libs/q3lcc/lburg
Q3CPP_SOURCE   := libs/q3lcc/cpp
Q3LCC_SOURCE   := libs/q3lcc/etc
ENGINE_SOURCE  := engine
WASM_SOURCE    := engine/wasm
HTTP_SOURCE    := $(WASM_SOURCE)/http
SDL_SOURCE     := libs/SDL2-2.0.14
Q3MAP2_SOURCE  := libs/quake3/q3map2


# LAYOUT BUILD_DIRS UPFRONT
BUILD_DIRS     := \
	$(BUILD_DIR).mkdir \
	$(filter $(MAKECMDGOALS),clean) \
	$(BUILD_DIR).mkdir/q3asm/ \
	$(BUILD_DIR).mkdir/q3lcc/ \
	$(BUILD_DIR).mkdir/q3rcc/ \
	$(BUILD_DIR).mkdir/q3cpp/ \
	$(BUILD_DIR).mkdir/lburg/ \
	$(BUILD_DIR).mkdir/uivm/ \
	$(BUILD_DIR).mkdir/plugin/ \
	$(BUILD_DIR).mkdir/engine/ \
	$(BUILD_DIR).mkdir/ded/ \
	$(BUILD_DIR).mkdir/engine/glsl/ \
	$(BUILD_DIR).mkdir/sdl/ \
	$(BUILD_DIR).mkdir/q3map2/ \
	$(BUILD_DIR).mkdir/sdl/audio/ \
	$(BUILD_DIR).mkdir/sdl/audio/emscripten/ \
	$(BUILD_DIR).mkdir/sdl/atomic/ \
	$(BUILD_DIR).mkdir/sdl/events/ \
	$(BUILD_DIR).mkdir/sdl/thread/ \
	$(BUILD_DIR).mkdir/sdl/thread/generic/ \
	$(BUILD_DIR).mkdir/sdl/timer/ \
	$(BUILD_DIR).mkdir/sdl/timer/unix/ \



define MKDIR_SH
	@if [ ! -d "./$1" ]; \
		then $(MKDIR) "./$1";fi;
endef

$(BUILD_DIR).mkdir/%/:
	$(call MKDIR_SH,$(subst .mkdir,,$@))

$(BUILD_DIR).mkdir/:
	$(call MKDIR_SH,$(subst .mkdir,,$@))

#D_DIRS  := $(addprefix $(BUILD_DIR)/,$(WORKDIRS))
D_FILES := $(shell find $(BUILD_DIR)/** -name '*.d' 2>/dev/null)
ifneq ($(strip $(D_FILES)),)
include $(D_FILES)
endif

release: 
	$(Q)$(MAKE) V=$(V) multigame engine \
		plugin index build-tools deploy \
		BUILD_DIR="build/release-wasm-js" \
		CFLAGS="$(RELEASE_CFLAGS)" \
		LDFLAGS="$(RELEASE_LDFLAGS)"

debug: 
	$(Q)$(MAKE) V=$(V) multigame engine \
		plugin index build-tools deploy \
		BUILD_DIR="build/debug-wasm-js" \
		CFLAGS="$(DEBUG_CFLAGS)" \
		LDFLAGS="$(DEBUG_LDFLAGS)"







deploy: engine plugin build-tools
	@:

ifdef BUILD_DIR
ifneq ($(BUILD_DIR),)

clean:
	-rm ./$(BUILD_DIR)/*/*.o ./$(BUILD_DIR)/*/*.d
	-rm ./$(BUILD_DIR)/*/*/*.o ./$(BUILD_DIR)/*/*/*.d
	-rm ./$(BUILD_DIR)/*/*/*/*.o ./$(BUILD_DIR)/*/*/*/*.d
	-rm ./$(BUILD_DIR)/*.wasm $(BUILD_DIR)/*.html

endif
endif


