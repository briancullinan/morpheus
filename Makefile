
include Makefile.config

morph:             morpheus

morpheus:          morph.program morph.package morph.plugin

morph.program:     morph.wasm morph.opt morph.html

morph.package:     xxx-morph-vms.pk3 xxx-morph-files.pk3

MORPH_OBJS         := sys_main.o dlmalloc.o sbrk.o sdl_snd.o

morph.wasm:        sdl.audio musl.min $(MORPH_OBJS)

SDL_OBJS           := SDL.o audio/SDL_audio.o SDL_error.o \
											SDL_assert.o sdl_snd.o SDL_sysmutex.o SDL_atomic.o SDL_events.o \
											SDL_spinlock.o SDL_audiocvt.o SDL_audiotypecvt.o SDL_dataqueue.o \
											SDL_thread.o SDL_systimer.o SDL_syssem.o SDL_hints.o \
											SDL_systhread.o SDL_systls.o SDL_mixer.o SDL_emscriptenaudio.o

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
musl.min:          $(MUSL_OBJS)

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
