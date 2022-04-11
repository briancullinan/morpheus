
include Makefile.config

morph:             morpheus

morpheus:          morph.program morph.package morph.plugin

morph.program:     $(BUILD_DIR)/morph.wasm $(BUILD_DIR)/q3map2.wasm $(BUILD_DIR)/morph.opt morph.html

morph.package:     xxx-morph-vms.pk3 xxx-morph-files.pk3

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
											string/strlcpy.o string/strcasecmp.o string/strncasecmp.o \
											\
											stdio/sprintf.o  stdio/fprintf.o   stdio/vsnprintf.o \
											stdio/vfprintf.o stdio/sscanf.o    stdio/fwrite.o    \
											stdio/vsscanf.o  stdio/vfscanf.o   stdio/snprintf.o  \
											stdio/vsprintf.o stdio/setvbuf.o   stdio/__stdio_exit.o \
											stdio/__toread.o stdio/__towrite.o stdio/ofl.o \
											stdio/__lockfile.o stdio/__uflow.o          \
											\
											internal/shgetc.o internal/floatscan.o internal/intscan.o \
											\
											errno/strerror.o errno/__errno_location.o locale/__lctrans.o \
											\
											network/ntohs.o  network/htons.o \
											\
											math/__signbit.o    math/__signbitf.o    math/__signbitl.o \
											math/__fpclassify.o math/__fpclassifyf.o math/__fpclassifyl.o \
											math/frexpl.o       math/scalbn.o        math/copysignl.o \
											math/scalbnl.o      math/fmodl.o         math/ldexp.o \
											math/__math_oflowf.o math/__math_uflowf.o \
											math/__math_invalidf.o math/__math_xflowf.o \
											\
											stdlib/atoi.o   stdlib/atof.o   stdlib/strtod.o \
											stdlib/qsort.o  stdlib/strtol.o stdlib/atol.o \
											\
											ctype/tolower.o ctype/isalnum.o  ctype/isspace.o \
											ctype/isdigit.o ctype/iswdigit.o ctype/isupper.o \
											ctype/isalpha.o \
											\
											multibyte/mbrtowc.o   multibyte/mbstowcs.o multibyte/wctomb.o \
											multibyte/mbsrtowcs.o multibyte/wcrtomb.o  multibyte/mbsinit.o \
											multibyte/mbtowc.o    multibyte/btowc.o    multibyte/internal.o \
											\
											time/gettimeofday.o

MORPH_OBJS         := $(addprefix $(BUILD_DIR)/sdl/,$(SDL_OBJS)) \
											$(addprefix $(BUILD_DIR)/musl/,$(MUSL_OBJS)) \
											$(addprefix $(BUILD_DIR)/,$(ENGINE_OBJS))


$(BUILD_DIR)/morph.wasm:        sdl.audio musl.min \
										$(addsuffix .mkdir,$(addprefix $(BUILD_DIR)/,$(ENGINE_WORKDIRS))) \
										$(addprefix $(BUILD_DIR)/,$(ENGINE_OBJS))
	$(echo_cmd) "LD $@"
	$(Q)$(CC) -o $@ $(MORPH_OBJS) $(CLIENT_LDFLAGS)



$(BUILD_DIR)/q3map2.wasm:       $(Q3MAP2_OBJS)

# minimal system code needed for Q3
musl.min:          $(addsuffix .mkdir,$(addprefix $(BUILD_DIR)/,$(MUSL_WORKDIRS))) \
										$(addprefix $(BUILD_DIR)/musl/,$(MUSL_OBJS))

$(BUILD_DIR)/morph.opt:         $(BUILD_DIR)/morph.wasm
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
