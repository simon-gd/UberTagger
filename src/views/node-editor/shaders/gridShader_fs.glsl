// The MIT License (MIT)
//
// Copyright (c) 2014 Autodesk, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// http://opensource.org/licenses/MIT

varying vec2 vUv;
uniform float lod; // interpolation lod parameter 
uniform float scale;

float sqr(float x)
{
   return x*x;
}

float line_alpha(float x, float w)
{
   // find distance to nearest canonical line
   x = fract(x);
   x = min(x,1.0-x); 
   return (x > w) ? 0.0 : (1.0 - sqr(x/w));
}


float stroke_ink(vec2 u, float width, float spacing)
{
   // return the alpha value at the given uv coordinate
   float a = line_alpha(u.y*spacing, width);
   float b = line_alpha(u.x*spacing, width);
   return max(a,b);
}

void main()	{
	vec4 baseColor = vec4(234.0/255.0, 249.0/255.0, 1.0, 1.0);
	vec4 lineColor = vec4(162.0/255.0,180.0/255.0,182.0/255.0,1.0);
	float tex_size = 1024.0;
	vec2 u = vUv; 
	vec4 myColor = vec4(1.0);

	float s0 = 1.0/(scale);
	float s1 = s0/2.0;

	float width = 0.01; 

	vec4 a = mix(baseColor, lineColor, stroke_ink(u/s0, width, 1.0)); 
	vec4 b = mix(baseColor, lineColor, stroke_ink(u/s0, width*5.0, 10.0));
	vec4 a2 = mix(a, b, 0.2);
	vec4 c = mix(baseColor, lineColor, stroke_ink(u/s1, width, 1.0));
	vec4 d = mix(baseColor, lineColor, stroke_ink(u/s1, width*5.0, 10.0));
	vec4 b2 = mix(c, d, 0.2);


	myColor = mix(a2, b2, lod);
	
	gl_FragColor = myColor;//vec4(myColor, 0.0,0.0, 1.0); 
}