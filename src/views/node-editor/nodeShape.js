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

 //var colorUtils = require('components/webgl/utils/colorUtils');
 //require('fonts/helvetiker_regular.typeface.js');
 //require('fonts/helvetiker_bold.typeface.js');
 var nodeShape = {
 	borderWidth: .1,
 	create: function(x, y, z){
 		var obj = new THREE.Object3D();
 		obj.position.set(x,y,z);
 		obj.updateMatrix();
 		this.addShape(obj, 0xFFFFFF, 0, 0, 0, 0, 0, 0, 1);
 		
 		
		return obj;
 	},
 	addShape: function (obj, color, x, y, z, rx, ry, rz, s ) {
		
		var shape = new THREE.Shape();
 	
 		this.roundedRect( shape, 0, 0, 10.0, 5.0, 1.0 );
 		
		
		var geometry = new THREE.ShapeGeometry( shape );

		var material = new THREE.MeshBasicMaterial( { color: color, overdraw: 0.5 } );
		

		var mesh = new THREE.Mesh( geometry, material );
		mesh.position.set( x, y, z );
		mesh.rotation.set( rx, ry, rz );
		mesh.scale.set( s, s, s );
		mesh.updateMatrix();
		//if(idRef){
		//	var rgba = colorUtils.key_to_rgba(mesh.id);
		//	material.color.setRGB(rgba.r, rgba.g, rgba.b);
		//}

		obj.add( mesh );


		// line
		geometry = shape.createPointsGeometry();
		material = new THREE.LineBasicMaterial( { linewidth: 10.0, color: 0x333333, transparent: false, depth:false } );

		var line = new THREE.Line( geometry, material );
		line.position.set( x, y, z );
		line.rotation.set( rx, ry, rz );
		line.scale.set( s, s, s );
		line.updateMatrix();
		//if(idRef){
		//	var rgba = colorUtils.(line.id);
		//	material.color.setRGB(rgba.r, rgba.g, rgba.b);
		//}

		obj.add( line );

		var textTexture = this.makeTextSprite( "Node Name", { width: 100, height: 20, borderColor: {r:255, g:0, b:0, a:1.0}, backgroundColor: {r:255, g:255, b:255, a:0.8} } );
		textTexture.position.set(x+5, y+2.5, z+.4);
		textTexture.rotation.set( rx, ry, rz );
		textTexture.scale.set( s, s, s );
		textTexture.updateMatrix();
		obj.add( textTexture );

		//geometry = new THREE.TextGeometry("text", { size: 1, height: 0, face: 'helvetiker', bevelEnabled: false});
		//var textShapes = THREE.FontUtils.generateShapes("Node Name", {size: 1.2,font: 'helvetiker'}) //style: normal, italics, weight: normal, bold
		//geometry = new THREE.ShapeGeometry( textShapes );
		//material = new THREE.MeshBasicMaterial( { color: 0x000000 } );
		//mesh = new THREE.Mesh( geometry, material );
		//mesh.position.set( x+1, y+2, z +.3 );
		//mesh.rotation.set( rx, ry, rz );
		//mesh.scale.set( s, s, s );

		//obj.add( mesh );

	},
	roundedRect: function( ctx, x, y, width, height, radius ){
		ctx.moveTo( x, y + radius );
		ctx.lineTo( x, y + height - radius );
		ctx.quadraticCurveTo( x, y + height, x + radius, y + height );
		ctx.lineTo( x + width - radius, y + height) ;
		ctx.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
		ctx.lineTo( x + width, y + radius );
		ctx.quadraticCurveTo( x + width, y, x + width - radius, y );
		ctx.lineTo( x + radius, y );
		ctx.quadraticCurveTo( x, y, x, y + radius );
	},
	makeTextSprite: function( message, parameters ){
		if ( parameters === undefined ) parameters = {};
	
		var fontface = parameters.hasOwnProperty("fontface") ? 
			parameters["fontface"] : "Arial";
		
		var padding = parameters.hasOwnProperty("padding") ? 
			parameters["padding"] : 3;
		
		
		var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
			parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

		var width = parameters.hasOwnProperty("width") ?
			parameters["width"] : 100;
		
		var height = parameters.hasOwnProperty("height") ?
			parameters["height"] : 20;
		
		
 		var canvas = document.createElement('canvas');
 		var context = canvas.getContext('2d');


		canvas.width = width + padding*2;
		canvas.height = height+ padding*2;

		context.font = "100px " + fontface;

		

		var metrics = context.measureText( message );
		var textWidth = metrics.width;

		var fontsize = width*100/textWidth
	
		context.font = fontsize+"px " + fontface;
		

		
	    
		// get size data (height depends only on font size)
		
		
		// background color
		context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
									  + backgroundColor.b + "," + backgroundColor.a + ")";
		// border color
		//context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
		//							  + borderColor.b + "," + borderColor.a + ")";

		///context.lineWidth = borderThickness;
		context.fillRect(0, 0, canvas.width, canvas.height);

		//roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
		// 1.4 is extra height factor for text below baseline: g,j,p,q.
		
		// text color
		context.fillStyle = "rgba(0, 0, 0, 1.0)";

		context.fillText( message, padding, height);
		
		
		// canvas contents will be used for a texture
		var texture = new THREE.Texture(canvas) 
		texture.needsUpdate = true;

		

		var ratio = canvas.width/canvas.height;
		//var spriteMaterial = new THREE.SpriteMaterial( { map: texture, useScreenCoordinates: true } );
		//var sprite = new THREE.Sprite( spriteMaterial );
		//return sprite;	
		var meterial = new THREE.MeshBasicMaterial( { map: texture } );
		var geometry = new THREE.PlaneGeometry(ratio, 1,1,1);//canvas.width/fontsize, canvas.height/fontsize, 1, 1);
		

		//console.log(canvas);

		return new THREE.Mesh(geometry, meterial);


}

 };

module.exports = nodeShape;