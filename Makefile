

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
	$(WASI_SYSROOT)/libc.a -Wl,--no-entry 


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


define DO_ENGINE_LD
	$(echo_cmd) "WASM-LD $1"
	$(Q)$(CC) -o $(BUILD_DIR)/$1 $2 $(CLIENT_LDFLAGS)
endef

define DO_SAFE_MOVE
	-$(Q)mv $2 $2.bak 2> /dev/null
	$(Q)mv $1 $2 2> /dev/null
	-$(Q)rm $2.bak 2> /dev/null
endef

define DO_ENGINE_OPT
	$(echo_cmd) "OPT_CC $2"
	$(Q)wasm-opt -Os --no-validation -o $1 $2
	$(call DO_SAFE_MOVE,$1,$2)
endef

RENDGLSL_OBJS  := $(wildcard engine/renderer2/glsl/*.glsl)
ENGINE_SLIM    := sv_init.c sv_main.c sv_bot.c sv_game.c
ENGINE_FILES   := $(ENGINE_SOURCE)/botlib/be_interface.c \
	$(wildcard $(ENGINE_SOURCE)/botlib/l_*.c) \
	$(wildcard $(ENGINE_SOURCE)/client/*.c) \
	$(wildcard $(ENGINE_SOURCE)/qcommon/*.c) \
	$(wildcard $(ENGINE_SOURCE)/renderer2/*.c) \
	$(addprefix $(ENGINE_SOURCE)/server/,$(ENGINE_SLIM)) \
	$(wildcard $(ENGINE_SOURCE)/wasm/*.c) 
ENGINE_OBJS    := \
	$(addprefix $(BUILD_DIR)/engine/,$(notdir $(ENGINE_FILES:.c=.o))) \
	$(addprefix $(BUILD_DIR)/engine/glsl/,$(notdir $(RENDGLSL_OBJS:.glsl=.o)))

SDL_NEEDED     := \
	SDL.o SDL_assert.o SDL_error.o  SDL_dataqueue.o  SDL_hints.o \
	audio/SDL_audio.o audio/SDL_mixer.o audio/emscripten/SDL_emscriptenaudio.o \
	audio/SDL_audiotypecvt.o audio/SDL_audiocvt.o \
	atomic/SDL_atomic.o events/SDL_events.o \
	atomic/SDL_spinlock.o thread/generic/SDL_sysmutex.o \
	thread/SDL_thread.o timer/unix/SDL_systimer.o \
	thread/generic/SDL_syssem.o thread/generic/SDL_systls.o \
	thread/generic/SDL_systhread.o 
SDL_OBJS       := $(addprefix $(BUILD_DIR)/sdl/,$(SDL_NEEDED))

morph.wasm: $(BUILD_DIRS) $(ENGINE_FILES) $(ENGINE_OBJS) $(SDL_OBJS)
	$(call DO_ENGINE_LD,$@,$(ENGINE_OBJS) $(SDL_OBJS))

morph.opt: morph.wasm $(BUILD_DIR)/morph.wasm
	$(call DO_ENGINE_OPT,$(BUILD_DIR)/morph.opt,$(BUILD_DIR)/morph.wasm)

ENGINE_INCLUDES:= \
	-Igames/lobby/q3_ui \
	-I$(SDL_SOURCE)/include \
	-Iengine/wasm

ENGINE_CFLAGS  := $(BASE_CFLAGS) \
	-std=gnu11          -DBUILD_SLIM_CLIENT=1 \
	-DGL_GLEXT_PROTOTYPES=1 -DGL_ARB_ES2_compatibility=1 \
	-DGL_EXT_direct_state_access=1 -DUSE_Q3KEY=1 \
	-DBUILD_MORPHEUS=1  -DUSE_RECENT_EVENTS=1 \
	-DUSE_MD5=1         -DUSE_VULKAN=0 \
	-DUSE_SDL=0         -DNO_VM_COMPILED=1 \
	-DUSE_ABS_MOUSE=1   -DUSE_LAZY_LOAD=1 \
	-DUSE_LAZY_MEMORY=1 -DUSE_MASTER_LAN=1 \
	$(ENGINE_INCLUDES) \
	$(WASI_INCLUDES)

$(BUILD_DIR)/engine/%.o: $(ENGINE_SOURCE)/botlib/%.c
	$(echo_cmd) "BOTLIB_CC $<"
	$(Q)$(CC) -o $@ -DBOTLIB=1 $(ENGINE_CFLAGS) -c $<

$(BUILD_DIR)/engine/%.o: $(ENGINE_SOURCE)/client/%.c
	$(echo_cmd) "CLIENT_CC $<"
	$(Q)$(CC) -o $@ $(ENGINE_CFLAGS) -c $<

$(BUILD_DIR)/engine/%.o: $(ENGINE_SOURCE)/qcommon/%.c
	$(echo_cmd) "COMMON_CC $<"
	$(Q)$(CC) -o $@ $(ENGINE_CFLAGS) -c $<

$(BUILD_DIR)/engine/%.o: $(ENGINE_SOURCE)/renderer2/%.c
	$(echo_cmd) "REND2_CC $<"
	$(Q)$(CC) -o $@ $(ENGINE_CFLAGS) -c $<

$(BUILD_DIR)/engine/%.o: $(ENGINE_SOURCE)/server/%.c
	$(echo_cmd) "SERVER_CC $<"
	$(Q)$(CC) -o $@ $(ENGINE_CFLAGS) -c $<

$(BUILD_DIR)/engine/%.o: $(ENGINE_SOURCE)/wasm/%.c
	$(echo_cmd) "WASM_CC $<"
	$(Q)$(CC) -o $@ $(ENGINE_CFLAGS) -c $<

$(BUILD_DIR)/engine/glsl/%.c: $(ENGINE_SOURCE)/renderer2/glsl/%.glsl
	$(echo_cmd) "REF_STR $@"
	$(Q)echo "const char *fallbackShader_$(notdir $(basename $(@:.c=.glsl))) =" >> $@
	$(Q)cat $(@:.c=.glsl) | sed -e 's/^/\"/;s/$$/\\n\"/' | tr -d '\r' >> $@
	$(Q)echo ";" >> $@

$(BUILD_DIR)/engine/glsl/%.o: $(BUILD_DIR)/engine/glsl/%.c
	$(echo_cmd) "GLSL_CC $<"
	$(Q)$(CC) -o $@ $(ENGINE_CFLAGS) -c $<

SDL_CFLAGS          := \
	$(ENGINE_CFLAGS) -fno-inline -Wno-macro-redefined \
	-DSDL_VIDEO_DISABLED=1 -DSDL_JOYSTICK_DISABLED=1 \
	-DSDL_SENSOR_DISABLED=1 -DSDL_HAPTIC_DISABLED=1 \
	-DSDL_TIMER_UNIX=1 -DHAVE_MEMORY_H=1 -DHAVE_CLOCK_GETTIME=1 \
	-D_GNU_SOURCE=1 -DHAVE_STDLIB_H=1 -DHAVE_GETENV=0 \
	-DHAVE_UNISTD_H=1 -DHAVE_MATH_H=1 -DHAVE_M_PI=1 \
	-DHAVE_STDIO_H=1 -DHAVE_ALLOCA_H=1 -DHAVE_STRING_H=1 \
	-DSDL_THREADS_DISABLED=1 -DSDL_AUDIO_DRIVER_EMSCRIPTEN=1

$(BUILD_DIR)/sdl/%.o: $(SDL_SOURCE)/src/%.c
	$(echo_cmd) "SDL_CC $<"
	$(Q)$(CC) -o $@ $(SDL_CFLAGS) -c $<

# these will be embedded as virtual filesystem files
LIBRARY_FILES    := $(wildcard driver/library/*.js)

# these will be included in the page
FRONTEND_JS      :=                       \
	$(filter-out %-plugin.js,$(wildcard driver/repl/frontend-*.js)) \
	driver/utils/jsencrypt.js               \
	driver/utils/crypt.js                   \
	driver/utils/keymaster.js               \
	$(wildcard engine/wasm/http/ace/*.js)   \
	engine/wasm/http/nipplejs.js            \
	$(wildcard engine/wasm/sys_*.js)
FRONTEND_EMBEDS  :=                       \
	$(HTTP_SOURCE)/index.html               \
	$(HTTP_SOURCE)/index.css                \
	engine/renderer2/bigchars.png 

INDEX_FILES    := morph.wasm $(FRONTEND_EMBEDS) $(FRONTEND_JS)
INDEX_OBJS     := $(BUILD_DIR)/morph.wasm $(BUILD_DIR)/morph.js

ifdef USE_UGLIFY



else

$(BUILD_DIR)/morph.js: $(FRONTEND_JS)
	$(Q)cat $(FRONTEND_JS) > $@

endif

morph.html: $(INDEX_FILES) $(INDEX_OBJS)
	$(Q)cp -r -f $(HTTP_SOURCE)/index.html $(BUILD_DIR)/morph.html
	node -e "require('./engine/wasm/bin/make').normalReplace( \
		'$(BUILD_DIR)/morph.html', '$(HTTP_SOURCE)/index.css', \
		'$(BUILD_DIR)/morph.js', 'engine/renderer2/bigchars.png', \
		'$(BUILD_DIR)/morph.wasm', '$(LANDING_PAGE)', \
		'$(BUILD_DIR)/sys_worker.js' )"
	node -e "require('./engine/wasm/bin/make').normalEmbedAll( \
		'$(BUILD_DIR)/morph.html', 'driver/library', 'driver/', 'lobby/')"
#	node -e "require('./engine/wasm/bin/make').normalEmbedAll( \
#		'$(BUILD_DIR)/morph.html', 'driver/cerebro', 'driver/', 'lobby/')"

multigame: # q3asm.wasm q3lcc.wasm ui.qvm cgame.qvm qagame.qvm
	@:



engine: morph.wasm morph.opt # q3map2.wasm 
	@:

PLUGIN_FILES   := \
	driver/manifest.json \
	driver/rules.json \
	$(BUILD_DIR)/plugin/frontend.js \
	$(BUILD_DIR)/plugin/backend.js \
	$(HTTP_SOURCE)/index.html \
	$(HTTP_SOURCE)/index.css \
	$(HTTP_SOURCE)/redpill.png 

plugin: engine morph.zip
	$(Q)cp driver/manifest.json $(BUILD_DIR)/plugin/manifest.json
	$(Q)cp driver/rules.json $(BUILD_DIR)/plugin/rules.json
	$(Q)cp $(HTTP_SOURCE)/index.html $(BUILD_DIR)/plugin/index.html
	$(Q)cp $(HTTP_SOURCE)/redpill.png $(BUILD_DIR)/plugin/redpill.png
	@:

morph.zip: backend.js frontend.js $(PLUGIN_FILES)
	@:

BACKEND_PLUGIN  := \
	$(wildcard driver/eval/*.js) \
	$(filter-out %/backend-worker.js,$(wildcard driver/repl/backend*.js)) \
	driver/utils/acorn.js driver/utils/acorn-loose.js \
	driver/utils/crypt.js driver/utils/jsencrypt.js
FRONTEND_PLUGIN := \
	driver/repl/frontend-plugin.js \
	driver/utils/jsencrypt.js driver/utils/crypt.js \
	driver/utils/keymaster.js

backend.js: $(BACKEND_PLUGIN)
	$(Q)cat $(BACKEND_PLUGIN) > $(BUILD_DIR)/plugin/backend.js

frontend.js: $(FRONTEND_PLUGIN)
	$(Q)cat $(FRONTEND_PLUGIN) > $(BUILD_DIR)/plugin/frontend.js

index: sys_worker.js morph.html
	cp $(BUILD_DIR)/morph.html index.html

build-tools: # q3map2.wasm # q3asm.wasm q3lcc.wasm 
	@:







DED_FILES    := $(wildcard $(ENGINE_SOURCE)/botlib/*.c) \
	$(wildcard $(ENGINE_SOURCE)/qcommon/*.c) \
	$(wildcard $(ENGINE_SOURCE)/server/*.c) \
	$(filter-out %/sys_snd.c,$(wildcard $(ENGINE_SOURCE)/wasm/*.c))
DED_OBJS     := $(addprefix $(BUILD_DIR)/ded/,$(notdir $(DED_FILES:.c=.o)))

morph.ded.wasm: $(BUILD_DIRS) $(DED_FILES) $(DED_OBJS)
	$(call DO_ENGINE_LD,$@,$(DED_OBJS))

morph.ded.opt: morph.ded.wasm $(BUILD_DIR)/morph.ded.wasm
	$(call DO_ENGINE_OPT,$(BUILD_DIR)/morph.ded.opt,$(BUILD_DIR)/morph.ded.wasm)

# OKAY THIS IS BASICALLY THE PART THAT COULD BENEFIT IF MAKEFILE RAN IN THE BROWSER
# TODO: I COULD COMPRESS ALL THE CODE FILES IN WINDOW.PREFS, MAKE INDEX.HTML ON 
#   LOAD JUST LIKE BUSYBOX SELF EXTRACTING IMAGE. THEN WHEN I MAKE THE SYS_WORKER.JS
#   I CAN USE A BLOB, OR CREATE SOME GENERIC IDBFS WORKER FOR BOTH SERVICE WORKER AND
#   BACKGROUND WORKER THAT JUST LOADS WHATEVER LATEST .WASM DOWNLOADED FILE.

WORKER_FILES  :=                                        \
	$(wildcard driver/eval/*.js)                          \
	$(filter-out %/backend-plugin.js,$(wildcard driver/repl/backend*.js)) \
	driver/utils/acorn.js driver/utils/acorn-loose.js     \
	driver/utils/crypt.js driver/utils/jsencrypt.js       \
	$(BUILD_DIR)/morph.ded.js \

sys_worker.js: dedicated $(WORKER_FILES)
	$(Q)cat $(WORKER_FILES) > $(BUILD_DIR)/sys_worker.js

$(BUILD_DIR)/morph.ded.js: $(BUILD_DIR)/morph.ded.wasm
	node -e "require('./engine/wasm/bin/make').normalBase64( \
		'$(BUILD_DIR)/morph.ded.js', '$(BUILD_DIR)/morph.ded.wasm', \
		'morph.wasm' )"


dedicated: morph.ded.wasm morph.ded.opt # q3map2.wasm for MemoryMaps
	@: 



$(BUILD_DIR)/ded/%.o: $(ENGINE_SOURCE)/botlib/%.c
	$(echo_cmd) "BOTLIB_CC $<"
	$(Q)$(CC) -o $@ -DDEDICATED=1 -DBOTLIB=1 $(ENGINE_CFLAGS) -c $<

$(BUILD_DIR)/ded/%.o: $(ENGINE_SOURCE)/qcommon/%.c
	$(echo_cmd) "COMMON_CC $<"
	$(Q)$(CC) -o $@ -DDEDICATED=1 $(ENGINE_CFLAGS) -c $<

$(BUILD_DIR)/ded/%.o: $(ENGINE_SOURCE)/server/%.c
	$(echo_cmd) "SERVER_CC $<"
	$(Q)$(CC) -o $@ -DDEDICATED=1 $(ENGINE_CFLAGS) -c $<

$(BUILD_DIR)/ded/%.o: $(ENGINE_SOURCE)/wasm/%.c
	$(echo_cmd) "WASM_CC $<"
	$(Q)$(CC) -o $@ -DDEDICATED=1 $(ENGINE_CFLAGS) -c $<




Q3MAP_VERSION    := 2.5.17n
RADIANT_VERSION  := 1.5.0n
RADIANT_MAJOR_VERSION:=5
RADIANT_MINOR_VERSION:=0
Q3MAP2_CFLAGS = \
	--target=wasm32-unknown-wasi \
	-DPOSIX  -std=c++17 -fno-exceptions \
	-D_XOPEN_SOURCE=700 -D__EMSCRIPTEN__=1 \
	-D__WASM__=1 -D__wasi__=1 -D__wasm32__=1 \
	-D_WASI_EMULATED_SIGNAL -D_WASI_EMULATED_MMAN=1 \
	-DRADIANT_VERSION="\"$(RADIANT_VERSION)\"" \
	-DQ3MAP_VERSION="\"$(Q3MAP_VERSION)\"" \
	-DRADIANT_MAJOR_VERSION="\"$(RADIANT_MAJOR_VERSION)\"" \
	-DRADIANT_MINOR_VERSION="\"$(RADIANT_MINOR_VERSION)\"" \
	-fvisibility=hidden \
	--sysroot libs/wasi-sysroot \
	-I$(Q3MAP2_SOURCE) \
	-I$(Q3MAP2_SOURCE)/../include \
	-I$(Q3MAP2_SOURCE)/../common \
	$(WASI_INCLUDES)

Q3MAP2_LDFLAGS = $(WASI_LDFLAGS) \
	$(WASI_SYSROOT)/libc++.a $(WASI_SYSROOT)/libc++abi.a -Wl,--no-entry



define DO_CLI_LD
	$(echo_cmd) "WASM-LD $1"
	$(Q)$(CXX) -o $(BUILD_DIR)/$1 $2 $(Q3MAP2_LDFLAGS) 
endef

define DO_Q3MAP2_CXX
	$(echo_cmd) "Q3MAP2_CC $<"
	$(Q)$(CXX) -o $@ $(Q3MAP2_CFLAGS) -c $<
endef

Q3MAP2_FILES = $(wildcard $(Q3MAP2_SOURCE)/*.cpp)
Q3MAP2_OBJS  = $(subst $(Q3MAP2_SOURCE)/,$(BUILD_DIR)/q3map2/,$(Q3MAP2_FILES:.cpp=.o))

q3map2.wasm: $(BUILD_DIRS) $(Q3MAP2_FILES) $(Q3MAP2_OBJS)
	$(call DO_CLI_LD,$@,$(Q3MAP2_OBJS))

$(BUILD_DIR)/q3map2/%.o: $(Q3MAP2_SOURCE)/%.cpp
	$(DO_Q3MAP2_CXX)



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


