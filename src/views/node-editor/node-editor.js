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

global.$ = $;
global.THREE = THREE;

var trackballControls = require('./controls/TrackballControls.js');
var grid = require('./grid.js');
var nodeShape = require('./nodeShape.js');
var nodeLinkShape = require('./nodeLinkShape.js');
var colorUtils = require('./utils/colorUtils.js');

function generateDataTexture(width, height, color) {
    var size = width * height;
    var data = new Uint8Array(4 * size);

    var r = Math.floor(color.r * 255);
    var g = Math.floor(color.g * 255);
    var b = Math.floor(color.b * 255);
    //var a = Math.floor( color.a * 255 );

    for (var i = 0; i < size; i++) {
        data[i * 4] = r;
        data[i * 4 + 1] = g;
        data[i * 4 + 2] = b;
        data[i * 4 + 3] = 255;
    }

    var texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.needsUpdate = true;

    return texture;
}

var app = {
  parentName: null,
  top: 0,
  left: 0,
  scene: null, 
  camera: null, 
  renderer: null,
  geometry: null,
  material: null,
  cube: null,
  width: 0,
  height: 0,
  objects: {},
  sceneIDRef: null,
  rtTexture: null,
  buf1: null,
  controls: null,
  subjectiveDistance: 500.0,
  zoom: 1,
  mouseVector: new THREE.Vector3(),
  offset: new THREE.Vector3(),
  INTERSECTED: null, 
  SELECTED: null,
  nodesGroup: null,
  simRes: 512,
  count: 0,
  get_pixel: function( x, y ) { 
    var i =  4*(Math.floor(x) +  app.buf1.image.width * Math.floor(app.buf1.image.height-y));
    var r = app.buf1.image.data[i ];
        var g = app.buf1.image.data[i + 1];
        var b = app.buf1.image.data[i + 2];
        var a = app.buf1.image.data[i + 3];
        //console.log(x, y, app.buf1.image.width, app.buf1.image.height, r, g, b);
    return [r, g, b, a]; 
  },
  init: function(parentName, w, h){
    this.parentName = parentName;
    var parentJQ = $(parentName);
    var parent = parentJQ[0] 
    this.width = w;
    this.height = h;
    this.top = parentJQ.offset().top;
    this.left =  parentJQ.offset().left;

    this.scene = new THREE.Scene();
    this.sceneIDRef = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.width/this.height, 0.1, 10000);

    this.renderer = new THREE.WebGLRenderer({antialias: true, logarithmicDepthBuffer: true, alpha: true, depth: true}); //{antialias: true, logarithmicDepthBuffer: true, alpha: true, depth: true}
    
    this.renderer.setSize(this.width, this.height);
    parent.appendChild(this.renderer.domElement);

    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshBasicMaterial({color: 0x00ff00});
    this.cube = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.cube);

    this.camera.position.z = 400; //this.subjectiveDistance;

    this.buf1 = generateDataTexture(this.width  ,this.height, new THREE.Color(0x000000));
    this.controls = new trackballControls( this.camera,  parent);
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 1.5;

    this.controls.noZoom = false;
    this.controls.noPan = false;
    this.controls.noRotate = true;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 1200;
    this.controls.staticMoving = false;
    this.controls.dynamicDampingFactor = 1.0;

    this.controls.keys = [ 65, 83, 68 ];

    var gridmesh = grid.create(this.controls, this.subjectiveDistance);
    this.scene.add(gridmesh);

    var nodesGroup = new THREE.Object3D();
    var nodesGroupRefID = new THREE.Object3D();
    for(var i=0; i < 100; i++){ 
      var xpos = i*15;//-window.innerWidth *Math.random() + Math.random()*(window.innerWidth );
      var ypos = -i*3;-window.innerHeight*Math.random() + Math.random()*(window.innerHeight);
      nodesGroup.add(nodeShape.create(xpos, ypos, 0.3));
    }
    this.scene.add( nodesGroup );
    this.rtTexture = new THREE.WebGLRenderTarget(this.width,this.height, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );

    for(var i=0; i < (nodesGroup.children.length-1); i++){  
      var c1 = nodesGroup.children[i];
      var c2 = nodesGroup.children[i+1];

      var nls = nodeLinkShape.create(c1.position, c2.position );
      this.scene.add( nls );
      
      //this.sceneRTT.add( nls );
    }

    this.addToRefIDScene(this.scene, this.sceneIDRef);

    //var rtDbgGeo = new THREE.PlaneGeometry(10, 10, 1, 1);
      //var rtDbgMat = new THREE.MeshBasicMaterial({
       //   color: 0xffffff,
        //  map: this.rtTexture
      //});
      //var rtDbgPlane = new THREE.Mesh(rtDbgGeo, rtDbgMat);
      //rtDbgPlane.position.set(0, 0, 0);
      //this.scene.add(rtDbgPlane);

    // Events
    //window.addEventListener( 'resize', this.onWindowResize, false );
    this.renderer.domElement.addEventListener( 'mousemove', this.onMouseMove, false );
    this.renderer.domElement.addEventListener( 'mousedown', this.onMouseDown, false );
    this.renderer.domElement.addEventListener( 'mouseup', this.onMouseUp, false );
  },
  addToRefIDScene: function(group, parent){
    for(var i=0; i < group.children.length; i++){
      var item = group.children[i];
      if(item instanceof THREE.Mesh){
        
        var col = new THREE.Color();
        var rgba = colorUtils.key_to_rgba(item.id);
        col.setRGB(rgba.r/255.0, rgba.g/255.0, rgba.b/255.0);

        // Create  ref to the object for fast access
        app.objects[item.id] = item;
        item.geometry.colorsNeedUpdate = true;

        // XXX - Maybe we need a better policy for efficincy to copy geometry
        var geom = (item.material instanceof THREE.MeshBasicMaterial && item.material.map === null) ? item.geometry : item.geometry.clone();
        var newItem = new THREE.Mesh(  geom, new THREE.MeshBasicMaterial( { color: col } ) );

        //console.log(newItem.geometry.faceVertexUvs.length, newItem.geometry.vertices.length);
        newItem.applyMatrix( item.matrix);
    
        //console.log("old", item);
        //console.log("new", newItem);
        

        parent.add( newItem );

      }else if(item.children.length > 0 && item instanceof THREE.Object3D){
        var newGroup = new THREE.Object3D();
        //newGroup.position.set(item.position.x,item.position.y,item.position.z);
        newGroup.applyMatrix( item.matrix);

        parent.add( newGroup );

        
        app.addToRefIDScene(item, newGroup);
      }
      //console.log(group.children[i]);
      
    }

    //
  },
  update: function(){
    //app.cube.rotation.x += 0.1;
    //app.cube.rotation.y += 0.1;
  },
  render: function(){
    if(this.renderer && this.scene && this.sceneIDRef && this.camera  && this.rtTexture){
      this.renderer.clear();
      this.renderer.render(this.sceneIDRef, this.camera, this.rtTexture, true);

      var gl = this.renderer.getContext();
      gl.readPixels(0, 0,this.width,this.height, gl.RGBA, gl.UNSIGNED_BYTE, this.buf1.image.data);
      this.buf1.needsUpdate = true;
        

      this.renderer.render(this.scene, this.camera);
    }
  },
  resize: function(w, h){
    app.top = $(app.parentName).offset().top;
    app.left = $(app.parentName).offset().left;
    app.width = w;
    app.height = h;

    app.camera.aspect =app.width /app.height;
    app.camera.updateProjectionMatrix();
    app.renderer.setSize(app.width,app.height );
    if(app.controls){
      app.controls.handleResize(app.top, app.left, app.width,app.height);
    }

    app.rtTexture = new THREE.WebGLRenderTarget(app.width,app.height, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
    app.buf1 = generateDataTexture(app.width  ,app.height, new THREE.Color(0x000000));

    app.render();
  },
  onMouseDown: function( event ) {
    //var canvasWidth = app.width;
    //var canvasHeight =app.height;
    var containerWidth = app.width;
    var containerHeight  =app.height;
    //app.mouseVector.x = 2 * (event.clientX / containerWidth) - 1;
    //app.mouseVector.y = 1 - 2 * ( event.clientY / containerHeight );
    //app.mouse.x = ( event.clientX /app.width );
    //app.mouse.y = ( event.clientY /app.height );

    
    //var mouseVector = new THREE.Vector3( 2 * (event.clientX / canvasWidth ) - 1, 
    //                                  1- 2 * (event.clientY / canvasHeight));
  },
  onMouseMove: function( event ) {
      event.preventDefault();
      var mouse_x = event.clientX-app.left;
      var mouse_y = event.clientY-app.top;
      //console.log("onMouseMove", mouse_x, mouse_y);
      //app.mouse.x = ( event.clientX /app.width ) * 2 - 1;
      //app.mouse.y = - ( event.clientY /app.height ) * 2 + 1;
      var containerWidth = app.width;
      var containerHeight  =app.height;

      // MouseCoordinate[0, siz] to NDC [-1,1]
      //app.mouseVector.x = 2 * (mouse_x / containerWidth) - 1;
      //app.mouseVector.y = 1 - 2 * ( mouse_y / containerHeight );

      
      //var raycaster = projector.pickingRay( mouseVector.clone(), camera );

      var pixel = app.get_pixel(mouse_x, mouse_y);
      var itemID = colorUtils.rgba_to_key(pixel[0], pixel[1], pixel[2], pixel[3]);
      var intersects = (itemID in app.objects) ? app.objects[itemID] : null;

      if ( intersects != null && app.INTERSECTED != intersects && intersects instanceof THREE.Mesh) {
          
          if ( app.INTERSECTED && app.INTERSECTED.material.color) app.INTERSECTED.material.color.setHex( app.INTERSECTED.currentHex );

          app.INTERSECTED = intersects;
          //console.log("selection", app.INTERSECTED);
          if ( app.INTERSECTED && app.INTERSECTED.material.color) {
            app.INTERSECTED.currentHex = app.INTERSECTED.material.color.getHex();
            app.INTERSECTED.material.color.setHex( 0x1B99BE );  
          }
          

        

      } else if (app.INTERSECTED != intersects){

        if ( app.INTERSECTED &&  app.INTERSECTED.material.color ) app.INTERSECTED.material.color.setHex( app.INTERSECTED.currentHex );
        //console.log("no selection");
        app.INTERSECTED = null;

      }


      //console.log(itemID, intersects);
      //app.cube.material.color.setRGB(pixel[0]/255.0, pixel[1]/255.0, pixel[2]/255.0);

      

  },

  
  onDocumentMouseUp: function( event ) {

      

  },
}

window.node_editor = app;
//module.exports = app; 