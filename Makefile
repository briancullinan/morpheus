

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

# THIS IS WAY TO MUCH BS FOR 1 MAKEFILE

# LAYOUT BUILD_DIRS UPFRONT
BUILD_DIRS     := \
	$(BUILD_DIR).mkdir \
	$(filter $(MAKECMDGOALS),clean) 

# TODO: lol, make github actions to make commands to make a github
#   actions quine that makes a github actions and the action runs
#   make to make another github action. test messaging systems by
#   making them stall from stack overflow?

release: 

debug: 

deploy: 

clean:

