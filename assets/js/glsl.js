var vert=`
// our vertex data
attribute vec3 aPosition;
attribute vec2 aTexCoord;
attribute vec4 color;

// lets get texcoords just for fun! 
varying vec2 vTexCoord;
varying vec4 vertColor;

void main() {
  // copy the texcoords
  vTexCoord = aTexCoord;
  vertColor = color;

  // copy the position data into a vec4, using 1.0 as the w component
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;

  // send the vertex information on to the fragment shader
  gl_Position = positionVec4;
}
`;

var frag=`
#ifdef GL_ES
precision mediump float;
precision mediump int;
#endif
#define PROCESSING_TEXTURE_SHADER

// lets grab texcoords just for fun
varying vec2 vTexCoord;
varying vec4 vertColor;

// our texture coming from p5
uniform sampler2D tex0;
uniform sampler2D colorMask;
uniform sampler2D whiteMask;
uniform vec2 resolution;
const float PI = 3.14159265;
uniform float time;
uniform float tr;
uniform float transitionRatio;

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

void main() {  
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);


  vec4 mix1 = texture2D(tex0, uv);
  vec4 cMix = texture2D(colorMask, uv);
  vec4 wMix = texture2D(whiteMask, uv);

  vec4 finalMix = (mix1 * transitionRatio) + (cMix * (1.0 - transitionRatio));

  if(cMix.w > 0.0){
    finalMix = (mix1 * transitionRatio) + (cMix * (1.0 - transitionRatio));
  }
  else{
    finalMix = (mix1 * transitionRatio) + (wMix * (1.0 - transitionRatio));
  }
  

  vec3 c = rgb2hsv( vec3(finalMix.x,finalMix.y,finalMix.z) );
  if(cMix.w > 0.0){
    c = hsv2rgb( vec3( noise(vTexCoord.st*3.0+c.z+time) * noise(vTexCoord.st*3.0-time) + time*0.05 , 1.0, c.z*tr + 1.0*(1.0-tr)) );
    gl_FragColor = vec4(c, (c.z*(1.0-tr) + 1.0*tr)*(1.0-tr)  + cMix.w * tr);
  }
  else{
    c = hsv2rgb( vec3( noise(vTexCoord.st*3.0+c.z+time) * noise(vTexCoord.st*3.0-time) + time*0.05 , 1.0-tr, c.z*tr + 1.0*(1.0-tr)) );
    gl_FragColor = vec4(c, (c.z*(1.0-tr) + 1.0*tr)*(1.0-tr) + wMix.w * tr );
  }
  
}`

