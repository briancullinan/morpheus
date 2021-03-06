const char *fallbackShader_calclevels4x_fp =
"uniform sampler2D u_TextureMap;\n"
"\n"
"uniform vec4      u_Color;\n"
"\n"
"uniform vec2      u_InvTexRes;\n"
"varying vec2      var_TexCoords;\n"
"\n"
"const vec3  LUMINANCE_VECTOR =   vec3(0.2125, 0.7154, 0.0721); //vec3(0.299, 0.587, 0.114);\n"
"\n"
"vec3 GetValues(vec2 offset, vec3 current)\n"
"{\n"
"	vec2 tc = var_TexCoords + u_InvTexRes * offset;\n"
"	vec3 minAvgMax = texture2D(u_TextureMap, tc).rgb;\n"
"\n"
"#ifdef FIRST_PASS\n"
"\n"
"  #if defined(USE_PBR)\n"
"	minAvgMax *= minAvgMax;\n"
"  #endif\n"
"\n"
"	float lumi = max(dot(LUMINANCE_VECTOR, minAvgMax), 0.000001);\n"
"	float loglumi = clamp(log2(lumi), -10.0, 10.0);\n"
"	minAvgMax = vec3(loglumi * 0.05 + 0.5);\n"
"#endif\n"
"\n"
"	return vec3(min(current.x, minAvgMax.x), current.y + minAvgMax.y, max(current.z, minAvgMax.z));\n"
"}\n"
"\n"
"void main()\n"
"{\n"
"	vec3 current = vec3(1.0, 0.0, 0.0);\n"
"\n"
"#ifdef FIRST_PASS\n"
"	current = GetValues(vec2( 0.0,  0.0), current);\n"
"#else\n"
"	current = GetValues(vec2(-1.5, -1.5), current);\n"
"	current = GetValues(vec2(-0.5, -1.5), current);\n"
"	current = GetValues(vec2( 0.5, -1.5), current);\n"
"	current = GetValues(vec2( 1.5, -1.5), current);\n"
"	\n"
"	current = GetValues(vec2(-1.5, -0.5), current);\n"
"	current = GetValues(vec2(-0.5, -0.5), current);\n"
"	current = GetValues(vec2( 0.5, -0.5), current);\n"
"	current = GetValues(vec2( 1.5, -0.5), current);\n"
"	\n"
"	current = GetValues(vec2(-1.5,  0.5), current);\n"
"	current = GetValues(vec2(-0.5,  0.5), current);\n"
"	current = GetValues(vec2( 0.5,  0.5), current);\n"
"	current = GetValues(vec2( 1.5,  0.5), current);\n"
"\n"
"	current = GetValues(vec2(-1.5,  1.5), current);\n"
"	current = GetValues(vec2(-0.5,  1.5), current);\n"
"	current = GetValues(vec2( 0.5,  1.5), current);\n"
"	current = GetValues(vec2( 1.5,  1.5), current);\n"
"\n"
"	current.y *= 0.0625;\n"
"#endif\n"
"\n"
"	gl_FragColor = vec4(current, 1.0);\n"
"}\n"
;
