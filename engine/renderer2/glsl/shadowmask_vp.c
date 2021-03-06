const char *fallbackShader_shadowmask_vp =
"attribute vec4 attr_Position;\n"
"attribute vec4 attr_TexCoord0;\n"
"\n"
"uniform vec3   u_ViewForward;\n"
"uniform vec3   u_ViewLeft;\n"
"uniform vec3   u_ViewUp;\n"
"uniform vec4   u_ViewInfo; // zfar / znear\n"
"\n"
"varying vec2   var_DepthTex;\n"
"varying vec3   var_ViewDir;\n"
"\n"
"void main()\n"
"{\n"
"	gl_Position = attr_Position;\n"
"	vec2 screenCoords = gl_Position.xy / gl_Position.w;\n"
"	var_DepthTex = attr_TexCoord0.xy;\n"
"	var_ViewDir = u_ViewForward + u_ViewLeft * -screenCoords.x + u_ViewUp * screenCoords.y;\n"
"}\n"
;
