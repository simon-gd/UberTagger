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

/****************************************
 * Assumes colors stored RGBA
 ****************************************/

var colorUtils = {
	rgba_to_key: function(r,g,b,a){
	  var rgba = this.build_rgba(r,g,b,a);
	  // colors stored as RGBA. undo the shift in key_to_rgba() above:
   	  return (rgba >> 8);
	},
	key_to_rgba: function(key){
	   // Colors stored as RGBA, shift data past A on the assumption
	   // that the framebuffer doesn't actually store alpha:

	   // XXX - should handle bits per component other than 8
	   var rgba = ((key << 8) | 0xff);

   	   return {r: this.rgba_to_r(rgba), g: this.rgba_to_g(rgba), b: this.rgba_to_b(rgba), a: this.rgba_to_a(rgba)};
	},
	rgba_to_r: function (c) { return (c>>24); },
	rgba_to_g: function(c)  { return (c>>16) & 0xff; },
    rgba_to_b: function (c) { return (c>> 8) & 0xff; },
	rgba_to_a: function (c) { return c & 0xff; },
	build_rgba: function(r, g, b, a) {
		var alpha = a || 255;
   		return ((r<<24) | (g<<16) | (b<<8) | alpha);
	},



};

module.exports = colorUtils;