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

var gridShader = require('./shaders/gridShader.js')


var grid = {
	mesh: null,
	controls: null,
	material: null,
	subjectiveDistance: 500,
	geometry: null,
	create: function(controls, subjectiveDistance){
		this.geometry = new THREE.PlaneGeometry(4000, 4000, 1, 1);
		//this.material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		this.material = new THREE.ShaderMaterial( gridShader );
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.mesh.position.z = 0;
		this.mesh.updateMatrix();
		this.controls = controls;
		controls.addEventListener( 'change', grid.updateZoom );
		this.updateZoom();
		this.subjectiveDistance = subjectiveDistance;
		return this.mesh;
	},
	zoomToScale2: function (zoomValue){
		// XXX - A bit hacky, should generalize
		if (zoomValue < 1.0)
		{	
			var b = 1.0/zoomValue;
			if (b < 2.0)
				b = 1.0;
			else if (b < 4.0)
				b =  2.0;
			else if (b < 8.0)
				b = 4.0;
			else if (b < 16.0)
				b = 8.0;
			else if (b < 32.0)
				b = 16.0;
			else if (b < 64.0)
				b = 32.0;
			else if (b < 128.0)
				b = 64.0;
			
			return 1.0 / b;
		}else{
			if (zoomValue < 2.0)
				return 1.0;
			else if (zoomValue < 4.0)
				return 2.0;
			else if (zoomValue < 8.0)
				return 4.0;
			else if (zoomValue < 16.0)
				return 8.0;
			else if (zoomValue < 32.0)
				return 16.0;
			else if (zoomValue < 64.0)
				return 32.0;
		}
			
	},
	updateZoom: function(){
		var pOrigin = new THREE.Vector3();
		pOrigin.setFromMatrixPosition( grid.mesh.matrixWorld );
		//console.log(grid.controls);
		var dist = pOrigin.distanceTo(grid.controls.eye);
		var zoom = (grid.subjectiveDistance/dist);
		//console.log("zoom",zoom); 
		var scaleVal = grid.zoomToScale2(zoom);
		var diff = zoom-scaleVal;
		var lod =  (scaleVal > 0.5 && diff < 0) ? 0.0 : (diff >= 0) ? Math.abs(diff/scaleVal) : 1.0-(Math.abs(diff/scaleVal)*2);
	
		grid.material.uniforms.scale.value = scaleVal*3.0;
		grid.material.uniforms.lod.value =  lod;
	},

};

module.exports = grid;