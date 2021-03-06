const char *fallbackShader_tonemap_vp =
"attribute vec3 attr_Position;\n"
"attribute vec4 attr_TexCoord0;\n"
"\n"
"uniform mat4   u_ModelViewProjectionMatrix;\n"
"uniform vec3   u_ToneMinAvgMaxLinear;\n"
"\n"
"varying vec2   var_TexCoords;\n"
"varying float  var_InvWhite;\n"
"\n"
"float FilmicTonemap(float x)\n"
"{\n"
"	const float SS  = 0.22; // Shoulder Strength\n"
"	const float LS  = 0.30; // Linear Strength\n"
"	const float LA  = 0.10; // Linear Angle\n"
"	const float TS  = 0.20; // Toe Strength\n"
"	const float TAN = 0.01; // Toe Angle Numerator\n"
"	const float TAD = 0.30; // Toe Angle Denominator\n"
"\n"
"	return ((x*(SS*x+LA*LS)+TS*TAN)/(x*(SS*x+LS)+TS*TAD)) - TAN/TAD;\n"
"}\n"
"\n"
"void main()\n"
"{\n"
"	gl_Position = u_ModelViewProjectionMatrix * vec4(attr_Position, 1.0);\n"
"	var_TexCoords = attr_TexCoord0.st;\n"
"	var_InvWhite = 1.0 / FilmicTonemap(u_ToneMinAvgMaxLinear.z - u_ToneMinAvgMaxLinear.x);\n"
"}\n"
;
