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

 //require('fonts/helvetiker_regular.typeface.js');
 //require('fonts/helvetiker_bold.typeface.js');
var nodeLinkShape = {
 	create: function(startPt, endPt){
 		var obj = new THREE.Object3D();



 		var p1 = new THREE.Vector3(startPt.x+5, startPt.y+2.5, startPt.z);

		var p2 = new THREE.Vector3(startPt.x+5+7, startPt.y+2.5, startPt.z);
		
		var p3 = new THREE.Vector3(endPt.x+5-7, endPt.y+2.5, endPt.z);


		var p4 = new THREE.Vector3(endPt.x+5, endPt.y+2.5, endPt.z);

		var bCurve = new THREE.CubicBezierCurve3(p1, p2, p3, p4);
		//var material = new THREE.LineBasicMaterial({color: 0x0000ff});
		//var geometry = new THREE.Geometry();
		
		//for(var i=1; i < 100; i++){
		//	geometry.vertices.push( bCurve.getPoint(i/100) );	
		//}
		//var line = new THREE.Line( geometry, material );
		var material = new THREE.MeshBasicMaterial( { color: 0x0000ff, overdraw: 0.5 } );
		var geometry = new THREE.TubeGeometry(bCurve, 100, .1, 10, false);
		geometry.dynamic = true;

		var line = new THREE.Mesh( geometry, material );


		obj.add(line)
		return obj;
 	},
 };

 module.exports = nodeLinkShape;