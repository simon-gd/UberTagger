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

// Assumes globals:
// w2ui
// $
var path = requireNode('path');
var gui = requireNode('nw.gui');
var async = requireNode("async");

var Grid = require("./grid.js");
var Timeline = require("./timeline.js");

//console.log("App dataPath is ", gui.App.dataPath());

//background: url(app://localhost/img/handle-v.png) 3px 50% no-repeat;
//background: url(app://localhost/img/handle-h.png) 3px 50% no-repeat;
var pstyleV = 'border: 1px solid #666; padding: 0px; margin: 1px;';
var pstyleH = 'border: 1px solid #666; padding: 0px; margin: 1px;';
var html = ['<iframe id="heatmap_context" width="1500" height="2000" style="position: absolute; top:0;left:0;z-index: 5" src="" nwdisable></iframe>',
            '<canvas id="heatmapArea" style="position:absolute;top:0;left:0;width:1500px;height:2000px;z-index: 100;opacity:0.5;"></canvas>',
            '<canvas id="heatmapSelectedArea" style="position:absolute;top:0;left:0;width:1500px;height:2000px;z-index: 101;opacity:0.5;"></canvas>',
            '<div id="currentTime" style="position:absolute;top:0;left:0;width:1000px;height:1000px;z-index: 102;"></div>'
            ].join("\n");
var grid_html = ['<div id="myGrid" style="position: absolute;top: 0;right: 0;bottom: 0;left: 0;"></div>',
				 ''].join("\n");


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}


var unique = function(a) {
	    var o = {}, i, l = a.length, r = [];
	    for(i=0; i<l;i+=1) o[a[i]] = a[i];
	    for(i in o) r.push(o[i]);
	    return r;
};

var app = null;
function HeatmapView(){
	this.contextArgs =  "";
	this.interactionMouseMovesSchema = "";
	this.datasetPath = "";
	this.grid = new Grid();
	this.timeline = new Timeline({brushing: true, name: "main-timeline", mode: "full"});
	this.dataStore = null;
	this.gridName = "";
	this.currentContextID = null;
	this.heatmap = null;
	this.heatmapSel = null;
	this.pts_cache = {};
	this.selectedItems = [];
	this.layout_config = { 
		name: 'heatmap_layout',
	    panels: [
	              { type: 'left', size: "35%", resizable: true, style:pstyleV, content: grid_html },
	              { type: 'main', size: "20%",  resizable: true, style:pstyleH, overflow: 'auto', content: "<div id='my_timeline_div' style='position: absolute;top: 0;right: 0;bottom: 0;left: 0;'></div><div id='my_timeline_div_focus' style='position: absolute;top: 100px;right: 0;bottom: 0;left: 0;'></div>" },
	              { type: 'preview', overflow: 'auto', size: "80%", style:pstyleH, resizable: true, content: html }
        ]
  	};
  	app = this;

}

function initTimeline(datasetPath, resources){
	
		
	
	
}
/*
HeatmapView.prototype.processInteractionFile = function(filename){
		if(filename in app.pts_cache){
			app.heatmap.addPoints(app.pts_cache[filename]);
		}else{
			var zip = new AdmZip(filename);
		    var zipEntries = zip.getEntries(); // an array of ZipEntry records
		    zipEntries.forEach(function(zipEntry) {
		        //console.log(zipEntry.toString()); // outputs zip entries information
		        var uncompressedData = zip.readAsText(zipEntry);
		        var allData = JSON.parse(uncompressedData);
		        var pts = [];
		        //console.log(app.interactionMouseMovesSchema["objects"], (app.interactionMouseMovesSchema["objects"] in allData));	
		        (allData[app.interactionMouseMovesSchema["objects"]]).forEach(function(element){
		        	pts.push({x:element[app.interactionMouseMovesSchema['x']], y:element[app.interactionMouseMovesSchema['y']], size:20, intensity:0.2});
		        });
		        app.pts_cache[filename] = pts;
		        if(app.heatmap){
		        	//console.log(pts);
			        app.heatmap.addPoints(pts);
		        }
		    });
		}
};	*/
HeatmapView.prototype.updateHeatmap = function(){
        if(app.heatmap){
        	//app.heatmap.clear();
        	//app.heatmap.adjustSize(); // can be commented out for statically sized heatmaps, resize clears the map
            app.heatmap.update(); // adds the buffered points
            app.heatmap.display(); // adds the buffered points

            app.heatmapSel.update(); // adds the buffered points
            app.heatmapSel.display(); // adds the buffered points
                    //heatmap.multiply(0.9995);
                    //heatmap.blur();
                    //heatmap.clamp(0.0, 1.0); // depending on usecase you might want to clamp it
            //window.requestAnimationFrame(app.updateHeatmap);
        }          
                 
};

HeatmapView.prototype.onSelectionChanged = function(event){
  		
  		try{

  			//console.log("HeatmapView: onSelectionChanged: ", event);

  			d3.select("#currentTime").selectAll('circle').remove();

  			var ids = event.data.rows; //.map(function(a){return a.recid});
	   		//ids = unique(ids);
	   		//console.log(ids); 

	   		//console.log("HeatmapView.prototype.onSelectionChanged", app); 

	   		//ids.forEach(function(element, index){
   			

   			var context_row = app.dataStore.dataView.getItemById(ids[0]);
   			if(this.currentContextID != context_row){
   				//console.log("HeatmapView.prototype.onSelectionChanged", context_row); 
	   			args = app.contextArgs.map(function(el){ return context_row[el]});
	   			//questionID =
	   			//console.log(args, row);
		   			//app.contextArgs 	
		   		//});
		  		var fullLInk = path.resolve(app.datasetPath, app.contextLink.format.apply(app.contextLink, args));//path.normalize(path.join(app.datasetPath, app.contextLink.format(questionID, condition)));
		  		$("#heatmap_context").attr('src', fullLInk);
		  		this.currentContextID = context_row;
   			}
   			
	  		
	  		
	  		app.selectedItems = [];

	  		if(app.heatmap){
	  			app.heatmap.clear();
	  			app.heatmapSel.clear();
	  		}
	  		async.each(ids, function(ID, callback){
		  		var row_el = app.dataStore.dataView.getItemById(ID); //w2ui[app.gridName].get(element);
		  		//var interactionDataID = app.interactionMouseMovesSchema["field"] + row_el.id;
		  		//var interactionDataMappedData = app.interactionMouseMovesSchema["context-mapped-data"];
		  		//console.log(interactionDataID);
		  		try{
		  			if(!app.heatmap){
			  			var myCanvas = $("#heatmapArea")[0];
			  			var myCanvas2 = $("#heatmapSelectedArea")[0];
					    app.heatmap = createWebGLHeatmap({canvas: myCanvas, intensityToAlpha:true, alphaRange: [0, 0.05], gradientTexture:'img/simple-gradient.png'});
					    app.heatmapSel = createWebGLHeatmap({canvas: myCanvas2, intensityToAlpha:true, alphaRange: [0, 0.05], gradientTexture:'img/skyline-gradient.png'});		
		  			}
		  			//if(interactionDataID in app.pts_cache){
					//	app.heatmap.addPoints(app.pts_cache[interactionDataID]);
					//}
						var pts = [];
						var ptsSel = [];
						var ptsCache = [];
						//console.log(app.dataStore.dbRecords[row_el.id][app.interactionMouseMovesSchema["field"]]);
						var items = app.dataStore.dbRecords[row_el.id][app.interactionMouseMovesSchema["field"]];
						
						//console.log("HeatmapView.prototype.onSelectionChanged",items);
						var currentSelectedSec = this.dataStore.currentSelection.time;
						
						//var do_event_based = false;

						//if(do_event_based){
						//	var itemCount = items[app.interactionMouseMovesSchema['time']].length;
						//	for(var i=0; i < itemCount; i++){
								
								//var pt_xy = items["positionsMappedToContext"](i);
						//		var pt_xy = [items[app.interactionMouseMovesSchema['x']][i], items[app.interactionMouseMovesSchema['y']][i]];

						//		var pt = {x:pt_xy[0], y:pt_xy[1], size:20, intensity:0.05};
								
						//		var cTime = items[app.interactionMouseMovesSchema['time']][i] / 1000.0; 

						//		if(!(isNaN(currentSelectedSec[0])) && cTime >= currentSelectedSec[0] && cTime <= currentSelectedSec[1]){
						//			ptsSel.push(pt);
						//		}else{
						//			pts.push(pt);	
						//		}	
						//	}
						//}else{
						var time_seq = items[app.interactionMouseMovesSchema['time']].map(function(x) { return x / 1000.0; });;
						var x = items[app.interactionMouseMovesSchema['x']];
						var y = items[app.interactionMouseMovesSchema['y']];
						var maxTime = time_seq[time_seq.length-1];
						
						/*
						var time_start = 0;
						var time_end = 0;
						for(var i=0; i < time_seq.length; i++){
							
							time_end = time_seq[i];
							//console.log("time_start,time_end", time_start,time_end);
							//var timeDiff = time_end-time_start;
							console.log("time_start", time_start);
							console.log("time_end", time_end);
							for(var t_i = time_start; t_i <= time_end; t_i += (1.0/app.dataStore.samplesPerSecond)){
								//var v = (i>0) ? val_seq[i] : 0;
								//console.log("t_i", t_i);
								var xpos = x[i];
								var ypos = y[i];
								//var size = Math.max(20, 1000*(timeDiff/maxTime));
								//var intensity = Math.max(0.05, 100*(timeDiff/maxTime));
								var pt = {x:xpos, y:ypos, size:20, intensity:0.05};
								ptsCache.push([xpos, ypos]);
								console.log(t_i, i);

								if(!(isNaN(currentSelectedSec[0])) && t_i >= currentSelectedSec[0] && t_i <= currentSelectedSec[1]){
								//if(!(isNaN(currentSelectedSec[0])) && 
								//	((time_start >= currentSelectedSec[0] && time_end <= currentSelectedSec[1]) 
								//	 || (time_start <= currentSelectedSec[0] && time_end >= currentSelectedSec[1])
								//	 || (time_start >= currentSelectedSec[0] && time_end <= currentSelectedSec[1])
								//	 || (time_start <= currentSelectedSec[0] && time_end >= currentSelectedSec[1])
								//	)){
								
									ptsSel.push(pt);
								}else{
									pts.push(pt);	
								}	
							}
							
							time_start = time_seq[i];
							//self.seriesArray.set(record.id-1, Math.ceil(i*self.samplesPerSecond), index, v);	
						}*/
							
							var k = 0;
							
							for(var i=0; i < maxTime; i+=(1.0/app.dataStore.samplesPerSecond)){
								
								var t_i = time_seq[k];
								if(t_i <= i){
									k++;
								}
								var xpos = x[k];
								var ypos = y[k];

								var pt = {x:xpos, y:ypos, size:20, intensity:app.intensity};
								
								ptsCache.push([xpos, ypos]);

								if(!(isNaN(currentSelectedSec[0])) && t_i >= currentSelectedSec[0] && t_i <= currentSelectedSec[1]){
									ptsSel.push(pt);
								}else{
									pts.push(pt);	
								}	
							}
						
						

						app.selectedItems.push(ptsCache);
						app.heatmap.addPoints(pts);
						app.heatmapSel.addPoints(ptsSel);
						
						

						//app.pts_cache[interactionDataID] = pts;
						//console.log(items, pts);
						//console.log(pts);
					//}
				    
				}
				catch(error){
				    console.error(error);
				}
				callback();
			}, function(err){
				if(err){ console.error(err);}

				app.updateHeatmap();
			});
			
			
			

			

	  	}catch(err){
	  		console.error("gridName: ",app.gridName);
	  		console.error(err);
	  	}
};
HeatmapView.prototype.onCurrentTimeChanged = function()
{
	//app.currentTimeCanvasContext.clearRect(0, 0, app.currentTimeCanvas.width, app.currentTimeCanvas.height);
	d3.select("#currentTime").selectAll('circle').remove();

	//console.log("onCurrentTimeChanged", app.dataStore.getCurrentTime());
	for(var i=0; i < app.selectedItems.length; i++){
		var items = app.selectedItems[i];
		var pos = Math.floor(app.dataStore.getCurrentTime() * app.dataStore.samplesPerSecond);
		//console.log(app.dataStore.getCurrentTime(), pos, items.length);
		if(pos < items.length){
			var x = items[pos][0];
			var y = items[pos][1];
			
			app.currentTimeSVG.append("circle")
	                         .attr("cx", x)
	                         .attr("cy", y)
	                         .attr("fill", "green")
	                         .attr("r", 5);
	        for(var k=0; k < app.dataStore.speed; k++){
	        	if((pos-k) >= 0){
	        		var x_s = items[pos-k][0];
					var y_s = items[pos-k][1];
					var opacity = 1.0 - (k/(app.dataStore.speed));
					
					app.currentTimeSVG.append("circle")
	                         .attr("cx", x_s)
	                         .attr("cy", y_s)
	                         .attr("fill", "green")
	                         .attr("fill-opacity", opacity)
	                         .attr("r", 2);	
	        	}
	        	
	        }
		}else{
			console.error(app.dataStore.getCurrentTime(), pos, items.length);
		}
		

		//app.currentTimeCanvasContext.beginPath();
        //app.currentTimeCanvasContext.arc(x, y, radius, 0, 2 * Math.PI, false);
        //app.currentTimeCanvasContext.fillStyle = 'red';
        //app.currentTimeCanvasContext.fill();
		//console.log("onCurrentTimeChanged",pos, x, y);	
	}
	

	
};

HeatmapView.prototype.init = function(dataStore, parentLayout, parentPanel, datasetPath, viewData, resources, done){
		//console.trace();
		//var parent = $(parentID);
		//parent.html("We have initiated a heatmap layout");
		//console.log("heatmap-view: ", datasetPath, viewData);
		this.dataStore = dataStore;
		this.dataStore.on("selection-changed", this.onSelectionChanged);
		this.dataStore.on("current-time-changed", this.onCurrentTimeChanged);

	

		app.datasetPath = datasetPath;
		var context_data = viewData["context-data"];
		app.contextLink = context_data.url;
		app.contextArgs = context_data.args;
		app.interactionMouseMovesSchema = viewData["data-paths"]["mouse-moves"];

		app.context_width = viewData["context-width"];
		app.context_height = viewData["context-height"];
		app.intensity = viewData["intensity"];

		//console.log(app.interactionMouseMovesSchema);


		if(w2ui[this.layout_config.name] !== undefined){
            w2ui[parentLayout].lock(parentPanel, 'Loading...', true);
            w2ui[parentLayout].content(parentPanel, w2ui[this.layout_config.name]);
            w2ui[parentLayout].unlock(parentPanel); 
        }else{
        	w2ui[parentLayout].lock(parentPanel, 'Loading...', true);
			//$().w2layout(this.layout_config);
			w2ui[parentLayout].content(parentPanel, $().w2layout(this.layout_config));
			w2ui[parentLayout].unlock(parentPanel); 
		}
		

	
			w2ui["heatmap_layout"].on('resize', function(event) {
						event.onComplete = function(){
							//console.log('heatmap_layout resize');
							app.grid.upadate();
						};
			});
			w2ui[this.layout_config.name].on('render', function(event) {
				event.onComplete = function(){
				//var result = $.grep(resources, function(e){ return e.name == viewData['observation-data']; });
				
					//console.log("timeline start: ",$("div#timeline_div"));
					

					//app.currentTimeCanvas = document.getElementById('currentTime');
       				//app.currentTimeCanvasContext = app.currentTimeCanvas.getContext('2d');

       				$("#heatmapArea").width(app.context_width).height(app.context_height);
       				$("#heatmapSelectedArea").width(app.context_width).height(app.context_height);
       				$("#currentTime").width(app.context_width).height(app.context_height);

       				app.currentTimeSVG = d3.select("#currentTime").append("svg")
				        .attr("width", app.context_width)
				        .attr("height", app.context_height)
				      .append("g");

				    

					app.timeline.init(dataStore, "#my_timeline_div", "#my_timeline_div_focus",  function(err){
								if(err){ console.log("timeline.init Error: ",err); }
								//console.log("timeline: ",timeline);
					});	

					app.grid.init(dataStore, "heatmap_layout", "left", datasetPath, function(gridName){
						//console.log(gridname, w2ui[gridname]);
						app.gridName = gridName;
						done();
					});

					


				
				};					
			});
			
		
		
};



module.exports = HeatmapView;