
include Makefile.config

morph:             morpheus

morpheus:          morph.program morph.package morph.plugin

morph.program:     morph.wasm q3map2.wasm morph.opt morph.html

morph.package:     xxx-morph-vms.pk3 xxx-morph-files.pk3

morph.wasm:        sdl.audio musl.min \
										$(addsuffix .mkdir,$(addprefix $(BUILD_DIR)/,$(ENGINE_WORKDIRS))) \
										$(addprefix $(BUILD_DIR)/,$(ENGINE_OBJS))
	$(echo_cmd) "LD $@"
	$(Q)$(CC) -o $@ $(MORPH_OBJS) $(CLIENT_LDFLAGS)



q3map2.wasm:       $(Q3MAP2_OBJS)

SDL_OBJS           := SDL.o SDL_assert.o SDL_error.o  SDL_dataqueue.o  SDL_hints.o \
											audio/SDL_audio.o audio/SDL_mixer.o audio/emscripten/SDL_emscriptenaudio.o \
											audio/SDL_audiotypecvt.o audio/SDL_audiocvt.o \
											atomic/SDL_atomic.o events/SDL_events.o \
											atomic/SDL_spinlock.o thread/generic/SDL_sysmutex.o \
											thread/SDL_thread.o timer/unix/SDL_systimer.o \
											thread/generic/SDL_syssem.o thread/generic/SDL_systls.o \
											thread/generic/SDL_systhread.o 

# use emscripten SDL audio interface
# TODO: upgrade audio
sdl.audio:         $(addsuffix .mkdir,$(addprefix $(BUILD_DIR)/,$(SDL_WORKDIRS))) \
										$(addprefix $(BUILD_DIR)/sdl/,$(SDL_OBJS))

MUSL_OBJS          := string/stpcpy.o  string/memset.o  string/memcpy.o    \
											string/memmove.o string/memcmp.o  string/memchr.o    \
											string/memrchr.o string/strncpy.o string/strcmp.o    \
											string/strcat.o  string/strchr.o  string/strncmp.o   \
											string/strcpy.o  string/stpncpy.o string/strchrnul.o \
											string/strlen.o  string/strncat.o string/strspn.o    \
											string/strstr.o  string/strrchr.o string/strnlen.o   \
											string/strcspn.o string/strpbrk.o string/strdup.o    \
											string/strlcpy.o string/strcasecmp.o string/strncasecmp.o

# minimal system code needed for Q3
musl.min:          $(addsuffix .mkdir,$(addprefix $(BUILD_DIR)/,$(MUSL_WORKDIRS))) \
										$(addprefix $(BUILD_DIR)/musl/,$(MUSL_OBJS))

morph.opt:         morph.wasm
	$(echo_cmd) "OPT_CC $<"
	$(Q)$(OPT) -Os --no-validation -o $@ $<
	$(DO_SAFE_MOVE)

# TODO: add pk3s to wasm
morph.html:        morph.js morph.plugin morph.png morph.package

# TODO: replace <script>
morph.js:

# TODO: embed image
morph.png: 

xxx-morph-vms.pk3: $(QVM_OBJS)

xxx-morph-files.pk3: $(FILES_OBJS)

morph.plugin:      morph-plugin.opt morph-plugin.zip

# TODO: minify dl-plugin.js
morph-plugin.opt:  driver/dl-plugin.js
	@:

# TODO: minify and zip DevTools relay
morph-plugin.zip: 

github.pages: 
