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
// d3



//var data = d3.range(800).map(Math.random);
//var html = "<div id='mytimeline_div' style='position: absolute;top: 0;right: 0;bottom: 0;left: 0;'> This is bull</div>";
var async = requireNode('async');

var self = null;


function Timeline(options){
    self = this;
    this.doResampled = false;
    this.name = options.name;
    this.start_date = new Date();
    this.isPlaying = false;

    this.timeRange = d3.scale.linear().range([0, 100]);
    
    this.dataStore = null;
    this.contextContainer = "";
    this.focusContainer = "";
    this.margin = {top: 10, right: 50, bottom: 20, left: 10};
    this.margin_focus = {top: 10, right: 50, bottom: 20, left: 100};
    this.width = 960 - this.margin.left - this.margin.right;
    this.height = 100 - this.margin.top - this.margin.bottom;

    this.height_focus = 80 - this.margin_focus.top - this.margin_focus.bottom;
    
    this.x = d3.scale.linear().range([0, this.width]);
    this.x_focus = d3.scale.linear().range([0, this.width]);
    
    this.timescale = d3.time.scale().range([0, this.width]).domain([new Date(),new Date()]);
    this.timescale_focus = d3.time.scale().range([0, this.width]).domain([new Date(),new Date()]);

    this.y = d3.scale.linear().range([this.height, 0]).domain([0.0, 1.0]);
    this.y_focus = d3.scale.linear().range([this.height_focus, 0]).domain([0.0, 1.0]);
    //this.y_focus = [];
    //this.y2 = d3.scale.linear().range([this.height, 0]).domain([0.0, 1.0]);
    
    this.brush = d3.svg.brush()
            .x(self.x)
            //.extent([0, 1.0])
            .on("brushstart", self.brushstart)
            .on("brush", self.brushmove)
            .on("brushend", self.brushend);
    //this.color = d3.scale.category10();
    this.iso = d3.time.format("%H:%M:%S.%L");

    this.hourTimeFormat =  d3.time.format("%I %p");
    this.minuteTimeFormat =  d3.time.format("%M");
    this.secondTimeFormat =  d3.time.format(":%S");
    this.customTimeFormat = d3.time.format.multi([
      [".%L", function(d) { return d.getMilliseconds(); }],
      [":%S", function(d) { return d.getSeconds(); }],
      ["%I:%M", function(d) { return d.getMinutes(); }],
      ["%I %p", function(d) { return true; }], //d.getHours();
      ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
      ["%b %d", function(d) { return d.getDate() != 1; }],
      ["%B", function(d) { return d.getMonth(); }],
      ["%Y", function() { return true; }]
    ]);

    this.hourAxis = d3.svg.axis()
            .scale(self.timescale)
            .orient("bottom")
            .ticks(d3.time.hour, 1)
            .tickFormat(this.hourTimeFormat);

    this.hourAxisFocus = d3.svg.axis()
            .scale(self.timescale_focus)
            .orient("bottom")
            .ticks(d3.time.hour, 1)
            .tickFormat(this.hourTimeFormat);

    this.minuteAxis = d3.svg.axis()
            .orient("bottom")
            .ticks(d3.time.minute, 1)
            .tickFormat(this.minuteTimeFormat);
    this.secondAxis = d3.svg.axis()
            .scale(self.timescale)
            .orient("bottom")
            .ticks(d3.time.second, 10)
            .tickFormat(this.secondTimeFormat);
    this.multiScaleAxis = d3.svg.axis()
            .scale(self.timescale)
            .orient("bottom")
            .tickFormat(this.customTimeFormat);

    this.multiScaleAxisFocus = d3.svg.axis()
            .scale(self.timescale_focus)
            .orient("bottom")
            .tickFormat(this.customTimeFormat);
            //.tickPadding(6)
            //.tickSize(8);

    this.yAxis = d3.svg.axis()
        .scale(self.y_focus)
        .orient("left");

    this.yAxisFocus = {};

    //this.y2Axis = d3.svg.axis()
    //    .scale(self.y2)
    //    .orient("right");

   
    

   

    

    this.lineSimple = d3.svg.line()
                    .x(0)
                    .y(function(d) {return d.y;})
    
    

    //this.lineFocus = d3.svg.line()
    //    .x(function(d, i) { return self.x(i); })
    //    .y(function(d, i) { return self.y(d); });

    this.tickLengthMs = 1000 / 20;
    /* gameLoop related variables */
    // timestamp of each loop
    this.previousTick = Date.now();
    // number of times gameLoop gets called
    this.actualTicks = 0;


    this.comments = [];


    
}



Timeline.prototype.setTimeRange = function(min, max)
{
    this.timeRange = d3.scale.linear().range([min, max]);
}

Timeline.prototype.onPlayClick = function(e)
{
    if(self.isPlaying){
        // Stop Animation
        $("#play_button").html('<i class="fa fa-play"></i> Play');
        self.isPlaying = false;
    }else{
        // Start Animation
        if(self.dataStore.currentSelection.time.length > 0){

            $("#play_button").html('<i class="fa fa-pause"></i> Pause');
            self.isPlaying = true;
            var time = self.dataStore.currentSelection.time;
            self.dataStore.setCurrentTime(time[0]);
            self.gameLoop();
        }else{
            alert("Select a time region first, thanks!");
        }
    }
    
}

Timeline.prototype.playback = function(delta) {
  //if(self.isPlaying && self.dataStore.currentSelection.time.length > 1){

  
    if(self.dataStore.getCurrentTime() < self.dataStore.currentSelection.time[1]){
        self.dataStore.setCurrentTime(self.dataStore.getCurrentTime() + (self.dataStore.speed));
        self.updateCurrentTime();
        //process.nextTick (self.playback);  
    }else{
    // Loop to the start
        self.dataStore.setCurrentTime(self.dataStore.currentSelection.time[0]);
        self.updateCurrentTime();
        //process.nextTick(self.playback);
    } 

  //}
  
}

Timeline.prototype.gameLoop = function () {
  if(self.isPlaying && self.dataStore.currentSelection.time.length > 1){
      var now = Date.now();

      self.actualTicks++;
      if (self.previousTick + self.tickLengthMs <= now) {
        var delta = (now - self.previousTick) / 1000;
        self.previousTick = now;

        self.playback(delta);

        //console.log('delta', delta, '(target: ' + self.tickLengthMs +' ms)', 'node ticks', self.actualTicks);
        self.actualTicks = 0;
      }

      if (Date.now() - self.previousTick < self.tickLengthMs - 16) {
        setTimeout(self.gameLoop);
      } else {
        process.nextTick(self.gameLoop);
      }
  }
}

Timeline.prototype.init = function(dataStore, divName,divName2, done){
    //console.log("timeline init", divName, datasetPath, resources);
    try{
        

        this.dataStore = dataStore;

        this.start_date = new Date(this.dataStore.cfg["default_start_time"]);
              
        this.doResampled = this.dataStore.cfg["plot_resampled_data"];

        if(this.doResampled){
             this.line = d3.svg.line()
            .x(function(d, i) { return self.x(i); })
            .y(function(d, i) { return self.y(d); });

            this.linefocus = d3.svg.line()
            .x(function(d, i) { return self.x_focus(i); })
            .y(function(d, i) { return self.y_focus(d); });

            this.areaFocus = d3.svg.area()
            .interpolate("monotone")
            .x(function(d, i) { return self.x_focus(i); })
            .y0(this.height_focus)
            .y1(function(d) { return self.y_focus(d); });
        }else{
            this.line = d3.svg.line()
            .x(function(d) { return self.x(d.x); })
            .y(function(d) { return self.y(d.y); });

            this.linefocus = d3.svg.line()
            .x(function(d, i) { return self.x_focus(d.x); })
            .y(function(d, i) { return self.y_focus(d.y); });

            this.areaFocus = d3.svg.area()
            .interpolate("monotone")
            .x(function(d, i) { return self.x_focus(d.x); })
            .y0(this.height_focus)
            .y1(function(d) { return self.y_focus(d.y); });
        }

        this.dataStore.on("selection-changed", this.onSelectionChanged);
        this.dataStore.on("similarity-done", this.onSelectionChanged);
        var css =['<style rel="stylesheet" type="text/css">',
                   'button.btn { min-width: 0px;}',
                  '.svg-timeline {position: absolute; left: 90px; top: 0; }',
                  '.axis line,.axis path { fill: none;  stroke: #000;  shape-rendering: crispEdges;}',
                  '.line3 {fill: none; stroke: #f7806f; stroke-width: 2.5px;}',
                  '.line4 {fill: none; clip-path: url(#clip); stroke-width: 2.0px;}',
                  '</style>'].join("\n")

        $('head').append(css);

        var html = ['<div style="padding: 3px;">',
        '<div style="margin: 3px; width: 120px; padding: 3px;">',
            '<button type="button" id="play_button" title="Play" class="btn btn-default" style="width: 80px;" href="#"><i class="fa fa-play"></i> Play</button>',
            '<input type="text" name="time" id="time_input" class="input-small" style="width: 74px; height: 20px; margin: 3px; padding: 0px; font-size: 10px;">',
            '<select id="speed_dropdown" class="form-control input-sm" style="width: 80px;">',
            '<option>1x</option><option>3x</option><option>5x</option><option>10x</option><option>20x</option><option>50x</option><option>100x</option><option>200x</option>',
            '</select>',
        '</div>',
        '</div>'].join("\n");

        //w2ui[parentLayout].content(parentPanel, html);
        this.contextContainer = divName;
        this.focusContainer = divName2;
        $(divName).append(html);

        $("#play_button").click(function(event){
            self.onPlayClick(event);
        });

        $("#speed_dropdown").change(function(event){
            var newSpeed = $( this ).val();
            self.dataStore.speed = Number(newSpeed.replace("x", ""));
            //console.log($( this ).val());
        })

        
        //this.createtimeline("#my_timeline_div");
        done();
    }catch(err){
        console.error("Timeline error: ", err);
        done(err);
    }
}
Timeline.prototype.getContextData = function(colName, id){
    var normalizedTimeSeries = []; 
    if(self.dataStore.isTimeSeriesColumn(colName)){
                        var metaData = self.dataStore.columnsMeta[colName];
                        
                        
                        
                        if(self.doResampled){ //metaData["series-type"] === "resampled"){
                            var featureIdx = self.dataStore.seriesArrayNameMap[colName]["series"];
                            var s = self.dataStore.getSeries(id,featureIdx);
                             var totalTime =s.data.length / self.dataStore.samplesPerSecond;
                             //console.log("totalTime: ",totalTime);
                             if(totalTime > self.totalTimeMax){

                                    
                                    self.x.domain([0,totalTime*self.dataStore.samplesPerSecond]);
                                    
                                    var date2 = self.dataStore.dateAdd(self.start_date, "second", totalTime);
                                    self.timescale.domain([self.start_date,date2]);
                                    self.totalTimeMax = totalTime;
                                    //console.log("totalTime: ",totalTime);
                                    //self.setTimeRange(0, totalTime); //*self.dataStore.samplesPerSecond);
                             }


                             if(s.max > 0){
                                 normalizedTimeSeries = new Float64Array(s.data.length);
                                 for(var k=0; k < s.data.length; k++){
                                    normalizedTimeSeries[k] = s.data[k] / s.max;
                                 }
                                 // }
                                return normalizedTimeSeries;
                            }else{
                                return s.data;
                            }
                        }else{
                            var timeData = self.dataStore.getRawTimeSeriesSamples(id, colName+"_time");
                            var seriesData = self.dataStore.getRawTimeSeriesSamples(id, colName+"_series");

                            var timeSeq = timeData.data.map(function(x) { return x / 1000.0; });
                            var valSeq = seriesData.data;
                            var valMax = seriesData.max;

                            if(valSeq.length > 0){
                                

                                var totalTime = timeSeq[timeSeq.length-1];//s.data.length / self.dataStore.samplesPerSecond;
                                
                                if(totalTime > self.totalTimeMax){
                                    self.x.domain([0,totalTime]); //*self.dataStore.samplesPerSecond]);
                                    
                                    var date2 = self.dataStore.dateAdd(self.start_date, "second", totalTime);
                                    self.timescale.domain([self.start_date,date2]);
                                    self.totalTimeMax = totalTime;
                                }
                                
                                

                                if(metaData["series-type"] === "continuous"){
                                   
                                    normalizedTimeSeries.push({x:0, y:valSeq[0] / valMax});
                                    //console.log(timeSeq, valSeq);
                                    for(var k=0; k < valSeq.length; k++){
                                        normalizedTimeSeries.push({x:timeSeq[k], y:valSeq[k] / valMax});
                                        if((k+1) < valSeq.length){
                                            normalizedTimeSeries.push({x:timeSeq[k+1], y:valSeq[k] / valMax});    
                                        }                                    
                                    }
                                }
                                else if(metaData["series-type"] === "continuous-rate"){
                                    normalizedTimeSeries.push({x:0, y:0});
                                    normalizedTimeSeries.push({x:timeSeq[0], y:0});
                                    //console.log(timeSeq, valSeq);
                                    for(var k=0; k < valSeq.length; k++){
                                        normalizedTimeSeries.push({x:timeSeq[k], y:valSeq[k] / valMax});
                                        if((k+1) < valSeq.length){
                                            normalizedTimeSeries.push({x:timeSeq[k+1], y:valSeq[k] / valMax});    
                                        }                                    
                                    }
                                    normalizedTimeSeries.push({x:timeSeq[valSeq.length-1], y:0});

                                }else if(metaData["series-type"] === "event-simple"){
                                    //do events
                                    normalizedTimeSeries.push({x:0, y:0});
                                    //console.log(timeSeq, valSeq);
                                    for(var k=0; k < valSeq.length; k++){
                                        
                                        normalizedTimeSeries.push({x:timeSeq[k]-self.dataStore.samplesPerSecond, y:0});
                                        normalizedTimeSeries.push({x:timeSeq[k], y:valSeq[k] / valMax});
                                        normalizedTimeSeries.push({x:timeSeq[k]+self.dataStore.samplesPerSecond, y:0});
                                    }
                                    normalizedTimeSeries.push({x:self.totalTimeMax, y:0});
                                }

                                return normalizedTimeSeries;

                            }
                        }
    } 
    return null;

}

Timeline.prototype.getFocusData = function(colName, id, time){
    var s;

    //self.y_focus = {};
    if(self.dataStore.isTimeSeriesColumn(colName)){
        var metaData = self.dataStore.columnsMeta[colName];

        if(time && time[0] !== undefined){
            var totalTime = time[1] - time[0];   
            

            if(self.doResampled){
                var featureIdx = self.dataStore.seriesArrayNameMap[colName]["series"];
                s = self.dataStore.getSeriesSegmentMax(id,featureIdx, time );
                
                //s = self.dataStore.getSeries(id,featureIdx);

                //var ss = self.dataStore.getSeriesSimilarity(id,featureIdx); 
                
                var yscale =  d3.scale.linear().range([self.height_focus, 0]).domain([0.0, s.max]);
                

                var axis = d3.svg.axis()
                    .scale(yscale)
                    .ticks(5)
                    //.tickSize([4,4])
                    //.tickPadding(4)
                    .orient("left");

                if(s.max > 0){
                    var normalizedTimeSeries = new Float64Array(s.data.length);
                    for(var k=0; k < s.data.length; k++){
                        normalizedTimeSeries[k] = s.data[k] / s.max;
                    }  
                    //self.y_focus[colName+"_"+id](d3.scale.linear().range([this.height, 0]).domain([0.0, s.max])); 
                    return [normalizedTimeSeries,axis];
                }else{
                    return [s.data, axis];
                }
            }else{
                var timeData = self.dataStore.getRawTimeSeriesSamples(id, colName+"_time");
                var seriesData = self.dataStore.getRawTimeSeriesSamples(id, colName+"_series");

                var timeSeq = timeData.data.map(function(x) { return x / 1000.0; });
                var valSeq = seriesData.data;
                var valMax = seriesData.max;

                var yscale =  d3.scale.linear().range([self.height_focus, 0]).domain([0.0, valMax]);
                

                var axis = d3.svg.axis()
                    .scale(yscale)
                    .ticks(5)
                    //.tickSize([4,4])
                    //.tickPadding(4)
                    .orient("left");
                var normalizedTimeSeries = [];
                if(valSeq.length > 0){
                    
                    
                    

                    if(metaData["series-type"] === "continuous"){
                                   
                        normalizedTimeSeries.push({x:0, y:valSeq[0] / valMax});
                        //console.log(timeSeq, valSeq);
                        for(var k=0; k < valSeq.length; k++){
                            normalizedTimeSeries.push({x:timeSeq[k], y:valSeq[k] / valMax});
                            if((k+1) < valSeq.length){
                                normalizedTimeSeries.push({x:timeSeq[k+1], y:valSeq[k] / valMax});    
                            }                                    
                        }
                    }
                    else if(metaData["series-type"] === "continuous-rate"){
                        normalizedTimeSeries.push({x:0, y:0});
                        normalizedTimeSeries.push({x:timeSeq[0], y:0});
                        //console.log(timeSeq, valSeq);
                        for(var k=0; k < valSeq.length; k++){
                            normalizedTimeSeries.push({x:timeSeq[k], y:valSeq[k] / valMax});
                            if((k+1) < valSeq.length){
                                normalizedTimeSeries.push({x:timeSeq[k+1], y:valSeq[k] / valMax});    
                            }                                    
                        }
                        normalizedTimeSeries.push({x:timeSeq[valSeq.length-1], y:0});

                    }else if(metaData["series-type"] === "event-simple"){
                        //do events
                        normalizedTimeSeries.push({x:0, y:0});
                        //console.log(timeSeq, valSeq);
                        for(var k=0; k < valSeq.length; k++){
                            
                            normalizedTimeSeries.push({x:timeSeq[k]-self.dataStore.samplesPerSecond, y:0});
                            normalizedTimeSeries.push({x:timeSeq[k], y:valSeq[k] / valMax});
                            normalizedTimeSeries.push({x:timeSeq[k]+self.dataStore.samplesPerSecond, y:0});
                        }
                        normalizedTimeSeries.push({x:self.totalTimeMax, y:0});
                    }

                    return [normalizedTimeSeries, axis];

                }else{
                    return null;
                }

            }
           
        }
    } 
    return null;

}
Timeline.prototype.changeContextGraph = function(selection){
    try {
        var ids = selection.rows;
        var cols = selection.cols;
        var time = selection.time; 
        
        if(time && time.length > 0){
            self.brush.extent(time);
            //self.brush.event(selection);
        }
        

        var series = [];
        var colors = [];
        var idsList = [];
        var colList = [];
        if(ids.length > 0 && cols.length > 0){
            for(var i=0; i < ids.length; i++){
                var id = ids[i];
               
                var argmax = 0.0;
                //var argmax2 = 0.0;
                self.totalTimeMax = 0.0
                for(var j=0; j < cols.length; j++){
                    //selectedData.push(app.dataStore.dbRecords[row_el.id][j]);
                    var colName = cols[j];
                    var color = self.dataStore.featureColors[colName];

                    
                    

                            

                    

                    var cd = self.getContextData(colName, id);
                    if(cd) { 
                        series.push(cd); 
                        colors.push(color);

                        idsList.push(id);
                        colList.push(colName);
                    }
                }
            

            }     
        }
        self.updateContext(series, colors, idsList, colList);   
    }catch(err){
         console.error(err);
    }
}



Timeline.prototype.changeFocusGraph = function(selection){
    try {

       

        var ids = selection.rows;
        var cols = selection.cols; 
        var time = selection.time; 

        var yaxis = [];
        var yaxisNames = [];
        var colors = [];
        var seriesFocus = [];
        var idsList = [];
        var colList = [];
        if(ids.length > 0 && cols.length > 0){
            for(var i=0; i < ids.length; i++){
                var id = ids[i];
                //var row_el = self.dataStore.dataView.getItemById(ids[i]);
                //console.log("Timeline.onSelectionChanged:", row_el["time"], row_el);
                //var totalTime = row_el["time"];
                
                //self.x.domain([0,totalTime*self.dataStore.samplesPerSecond]);
                //self.axisx.domain([0,totalTime]);
                //self.setTimeRange(0, totalTime*self.dataStore.samplesPerSecond);
                if(time && time[0] !== undefined){
                    var totalTime = time[1] - time[0];   
                    
                    if(self.doResampled){
                         self.x_focus.domain([0,totalTime*self.dataStore.samplesPerSecond]);
                        var data1 = self.dataStore.dateAdd(self.start_date, "second", time[0]);
                        var date2 = self.dataStore.dateAdd(self.start_date, "second", time[1]);
                        self.timescale_focus.domain([data1,date2]);
                    }else{
                        var data1 = self.dataStore.dateAdd(self.start_date, "second", time[0]);
                        var date2 = self.dataStore.dateAdd(self.start_date, "second", time[1]);
                        self.x_focus.domain([time[0],time[1]]);

                        self.timescale_focus.domain([data1,date2]);

                    }
                  

                    //self.axisx_focus.domain([0,totalTime]);
                    //self.setTimeRange(0, totalTime*self.dataStore.samplesPerSecond);
                }

                var argmax = 0.0;
                //var argmax2 = 0.0;
                self.totalTimeMax = 0.0
                for(var j=0; j < cols.length; j++){
                    //selectedData.push(app.dataStore.dbRecords[row_el.id][j]);
                    var colName = cols[j];
                    var color = self.dataStore.featureColors[colName];

                    
                    

                            
                    var  cmeta = self.dataStore.columnsMeta[colName];
                    

                    var fd = self.getFocusData(colName, id, time);
                    if(fd) { 
                        
                        colors.push(color);
                        yaxisNames.push(cmeta["name"] + " (" + cmeta["series-units"]+")");

                        seriesFocus.push(fd[0]);
                        yaxis.push(fd[1]);
                        idsList.push(id);
                        colList.push(colName);
                    }    

             
                }
            

            }     
        }
        self.updateFocus(seriesFocus, colors, yaxis, yaxisNames, idsList, colList);   
   
    }catch(err){
         console.error(err);
    }
};

Timeline.prototype.changeTags = function(selection, done){
    try {
        var ids = selection.rows;
        var cols = selection.cols; 
        var time = selection.time; 

        self.dataStore.commentModel
            .where("selections.rows").in(ids).where("selections.cols").in(cols).exec(function (err, comments) {
                async.each(comments, function(comment, callback){
                var selections = comment.selections;
                var i, j, k;
                for(i=0; i < selections.length; i++){
                    var selection = selections[i];

                    if(selection.time && selection.time.length > 0){
                        self.comments.push(comment);
                    }
                    /*
                    for(j=0; j < selection.rows.length; j++){
                        var rowIdx = self.dataStore.dataView.getIdxById(selection.rows[j]);
                        //selectedRows[rowIdx] = true;
                        for(k=0; k < selection.cols.length; k++){
                            var colName = selection.cols[k];
                            var colIndex = colIndexToNameMap.indexOf(colName);
                            if (!changes[rowIdx]) {
                              changes[rowIdx] = {};
                            }
                            changes[rowIdx][colIndexToIDMap[colIndex]] = "taggedCell";      
                            //selectedCols[colIndex] = colName;
                        }
                    }*/

                   
                }
                callback();


              }, function(err){
                if(err){ console.error(err); }
                //self.grid.addCellCssStyles("tagged", changes);
                //self.grid.invalidate();
                //self.grid.render();
                self.updateTags();   
                done();

              });



        });
         
   
    }catch(err){
         console.error(err);
    }
};

Timeline.prototype.onSelectionChanged = function(event){
    //console.log("Timeline.onSelectionChanged: ", event.source, self.name);
    if(event.source === self.name){
        // we don't want circular events
        return;
    }

    try {
        self.clearTags();
        self.changeTags(event.data, function(){
             self.changeContextGraph(event.data);
             self.changeFocusGraph(event.data);

        });
       
        
    }catch(err){
        console.error(err);
    }
};

Timeline.prototype.updateContext = function(data, colors, idsList, colList){
    self.clearContext();
    self.renderContext(data, colors, idsList, colList);

}

Timeline.prototype.updateFocus = function(data, colors, yaxis, yaxisNames, idsList, colList){
    self.clearFocus();
    self.renderFocus(data, colors, yaxis, yaxisNames, idsList, colList);
    
}

Timeline.prototype.updateTags = function(){
    //self.clearTags();
    //self.renderTags();
    
}

Timeline.prototype.updateCurrentTime = function(){

    var currentDate = self.dataStore.dateAdd(self.start_date, "second", self.dataStore.getCurrentTime()); 

    $("#time_input").val(self.iso(currentDate));
    var newX = self.x(self.dataStore.getCurrentTime()); //*self.dataStore.samplesPerSecond);

    var tOffset = self.dataStore.getCurrentTime(); //-self.dataStore.currentSelection.time[0]; 
   // var newXF = self.x_focus(tOffset*self.dataStore.samplesPerSecond);
    var newXF = self.x_focus(tOffset); //*self.dataStore.samplesPerSecond);
    //console.log("newX: ", newX);

    d3.selectAll(".currentGraphTimelinePosition").attr("transform","translate("+newX+",0)");
    d3.selectAll(".currentFocusTimelinePosition").attr("transform","translate("+newXF+",0)");

}

Timeline.prototype.clearContext = function() {
    d3.select(self.contextContainer).selectAll('svg').remove();
};
Timeline.prototype.clearFocus = function() {
    d3.select(self.focusContainer).selectAll('svg').remove();
};


Timeline.prototype.color = function(d, i) {
    //console.log("Timeline Color: ", i);
    return "black";
};

Timeline.prototype.clearTags = function() {
    d3.selectAll(".taggedTimeRegion").remove();

};


Timeline.prototype.renderTags = function(svg, focus, id, col) {
    //self.clearTags(svg);
    for(var i=0; i < self.comments.length; i++){
        var comment = self.comments[i];

        var selections = comment.selections;
        var j, k;
        for(j=0; j < selections.length; j++){
            var selection = selections[j];

            if(selection.rows.indexOf(id) > -1 && selection.cols.indexOf(col) > -1){
                var time =  selection.time;
                
                var startX, endX, w;

                if(focus){
                    startX = self.x_focus(time[0]);
                    endX = self.x_focus(time[1]);
                    w = endX-startX;
                    svg.append("rect").attr("class", "taggedTimeRegion")
                                             .attr("x", startX)
                                             .attr("y", self.height_focus)
                                             .attr("width", w)
                                             .attr("height", 20)
                                             .style("clip-path", "url(#clip)");
                    //console.log("renderTags", time, comment.id, startX, endX);

                }else{
                    startX = self.x(time[0]);
                    endX = self.x(time[1]);

                    w = endX-startX;
                    svg.append("rect").attr("class", "taggedTimeRegion")
                                             .attr("x", startX)
                                             .attr("y", self.height)
                                             .attr("width", w)
                                             .attr("height", 20);
                }
                

            }
            

        }

    }

};

Timeline.prototype.focusTimelineClick = function(event, focus){
     


     var timeClicked = self.x_focus.invert(event.offsetX - self.margin_focus.left);

     self.dataStore.setCurrentTime(timeClicked);
     self.updateCurrentTime();

     console.log("clicked!", timeClicked);
}

Timeline.prototype.renderFocus = function(data, colors, yaxis, yaxisName, idsList, colList) {
    //console.log("Timeline Color: ", i);

    for(var i =0; i < data.length; i++){
    
    //console.log(scale);

    

    //console.log(areaFocus);

    var focus = d3.select(self.focusContainer).append("svg")
        .attr("width", self.width + self.margin_focus.left + self.margin_focus.right)
        .attr("height", self.height_focus + self.margin_focus.top + self.margin_focus.bottom)
        .style("vertical-align", "top")
      .append("g")
        .attr("transform", "translate(" + self.margin_focus.left + "," + self.margin_focus.top + ")");
    focus.append("defs").append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("width", self.width)
        .attr("height", self.height_focus+20);

    d3.select(self.focusContainer).on("click", function() {
      if (d3.event.defaultPrevented) return; // click suppressed
      self.focusTimelineClick(d3.event, focus);
     
    });
    //focus.on("click", function() {
    //  if (d3.event.defaultPrevented) return; // click suppressed
    //  self.focusTimelineClick(d3.event, focus);
    // 
    //});


    focus.append("line").attr("class", "contextFocusLine")
                        .attr("x1", 0).attr("y1",-self.margin_focus.top*2).attr("x2", 0).attr("y2", self.height_focus+self.margin_focus.bottom);

    focus.append("line").attr("class", "contextFocusLine")
                        .attr("x1", self.width).attr("y1",-self.margin_focus.top*2).attr("x2", self.width).attr("y2", self.height_focus+self.margin_focus.bottom);
   
    focus.append("rect")
        .attr("x", 1)
        .attr("y", self.height_focus)
        .attr("width", self.width-2)
        .attr("height", 20)
        .style("fill", "dcdcdc");

    self.renderTags(focus, true, idsList[i], colList[i]);
    
   

    focus.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + self.height_focus + ")")
    .call(self.multiScaleAxisFocus);

      //f0f0f0
    focus.append("g")
          .attr("class", "y axis")
          .call(yaxis[i])
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", -40)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text(yaxisName[i]);
    
     focus.append("path")
          .datum(data[i])
          .attr("class", "line4")
          .attr("d", self.linefocus)
          .style("stroke", function(d, k) { return colors[i]; });
          //.style("fill", function(d, k) { return colors[i]; });

     focus.append("g").attr("class", "currentFocusTimelinePosition").append("svg:path").attr("class", "line3").attr("d", self.lineSimple([{'y':0},{'y':self.height_focus}]));
 
    
    }
    
};


Timeline.prototype.renderContext = function(data, colors, idsList, colList)
{
       

    self.context = d3.select(self.contextContainer).append("svg")
        .attr("width", self.width + self.margin.left + self.margin.right)
        .attr("height", self.height + self.margin.top + self.margin.bottom)
        .attr("style","position: absolute; left: 90px; top: 0;")
      .append("g")
        .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

     //self.svg.append("g")
    //      .attr("class", "y axis")
    //      .call(self.yAxis);
    //self.svg.append("g")
    //      .attr("class", "y axis")
     //     .call(self.y2Axis);
        //.append("text")
        //  .attr("transform", "rotate(-90)")
        //  .attr("y", 6)
        //  .attr("dy", ".71em")
        //  .style("text-anchor", "end")
        //  .text("Events");

    self.context.append("rect")
        .attr("x", 0)
        .attr("y", self.height)
        .attr("width", self.width)
        .attr("height", 20)
        .style("fill", "dcdcdc");


    for(var i =0; i < data.length; i++){
        //var randomD = d3.range(data[i].size).map(Math.random);
        //console.log("Timeline.prototype.render ", data[i].length);
        self.renderTags(self.context, false, idsList[i], colList[i]);

        self.context.append("path")
          .datum(data[i])
          .attr("class", "line")
          .attr("d", self.line)
          .style("stroke", function(d, k) { return colors[i]; });


        //self.addFocus(data[i], colors[i]);
    }


    if(self.dataStore.cfg["time-scale"] === "hour"){
        self.context.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + self.height + ")")
        .call(self.hourAxis);
    }else if(self.dataStore.cfg["time-scale"] === "second"){
        self.context.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + self.height + ")")
        .call(self.multiScaleAxis);
    }
    
   
                
    self.context.append("g").attr("class", "currentGraphTimelinePosition").append("svg:path").attr("class", "line3").attr("d", self.lineSimple([{'y':0},{'y':self.height}]));
  

    /*
    if(simData){
        for(var i =0; i < simData.length; i++){
            //var randomD = d3.range(data[i].size).map(Math.random);
            //console.log("Timeline.prototype.render ", simData[i].length);
            self.svg.append("path")
              .datum(simData[i])
              .attr("class", "line2")
              .attr("d", self.line2)
              .style("stroke", function(d, i) { return "red"; });    
        }
    }*/

    self.frect1 = self.context.append("rect").attr("visibility", "visible") //visible hidden
                                             .attr("class", "contextFocusShape")
                                             .attr("height", self.height+self.margin.bottom);


    self.fline1 = self.context.append("line").attr("visibility", "visible")
                                             .attr("class", "contextFocusLine")
                                             .attr("x1", 0).attr("y1", self.height+self.margin.bottom-1).attr("x2", 0).attr("y2", self.height+self.margin.bottom-1);

    self.frect2 = self.context.append("rect").attr("visibility", "visible")
                                             .attr("class", "contextFocusShape")
                                             .attr("height", self.height+self.margin.bottom);

    self.fline2 = self.context.append("line").attr("visibility", "visible")
                                             .attr("class", "contextFocusLine")
                                             .attr("x1", 0).attr("y1", self.height+self.margin.bottom-1).attr("x2", self.width).attr("y2", self.height+self.margin.bottom-1);

    self.fline3 = self.context.append("line").attr("visibility", "visible")
                                             .attr("class", "contextFocusLine")
                                             .attr("x1", 0).attr("y1", 0).attr("x2",0).attr("y2", 0);
   
    //self.resizeline2 = self.context.append("line").attr("visibility", "visible")
    //                                         .attr("class", "contextFocusLine")
    //                                         .attr("x1", 0).attr("y1", self.height+self.margin.bottom).attr("x2", self.width).attr("y2", self.height+self.margin.bottom);
    function resizePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = self.height / 3;
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }

    //var brushClipPath = self.context.append("defs").append("mask")
    //    .attr("id", "brushmask");

    //self.clipPathRect = brushClipPath.append("rect")
    //    .attr("width", 100)
    //    .attr("height", self.height+self.margin.bottom)
    //    .attr("fill", "#ffffff");

    self.brushg = this.context.append("g")
        .attr("class", "brush")
        .call(self.brush);


    var s = self.brush.extent();
    var extent = s.map(function(k){ return self.x(k); });

    self.brushg.selectAll("rect")
        .attr("height", self.height+self.margin.bottom);

    d3.select("rect.extent")
        .attr("x", extent[0])
        .attr("width", extent[1]-extent[0]);



    var robj = self.brushg.selectAll(".resize"); 
    robj.append("line").attr("class", "contextFocusLine").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", self.height+self.margin.bottom-1);
    robj.append("path").attr("d", resizePath)
    
    d3.select(".resize.w")
        .attr("transform","translate("+extent[0]+",0)");
    d3.select(".resize.e")
        .attr("transform","translate("+extent[1]+",0)");
     
    if(s){
        self.updateContextFocusShapes();
    }

    //self.brush.brush(this.context);

    //self.brush.redraw(self.brushg);
    
    //self.brushstart();
    //self.brushmove();

}
Timeline.prototype.updateContextFocusShapes = function(s){
    //console.log("updateContextFocusShapes: ",s[0], s[1]);
    //console.log("updateContextFocusShapes invert: ",self.x(s[0]), self.x(s[1]));
    var extent = self.brush.extent().map(function(k){ return self.x(k); });
    //console.log("extent is ",  extent, d3.select("rect.extent"));

    self.frect1.attr("visibility", "visible")
               .attr("x", 0)
               .attr("width", extent[0]);

     self.fline1.attr("visibility", "visible")
                .attr("x2", extent[0]);

    self.frect2.attr("visibility", "visible")
               .attr("x", extent[1])
               .attr("width", self.width - extent[1]);

    self.fline2.attr("visibility", "visible")
                .attr("x1", extent[1]);


    self.fline3.attr("visibility", "visible")
               .attr("x1", extent[0])
               .attr("x2", extent[1]);
     //self.clipPathRect = brushClipPath.append("rect")
    //    .attr("width", 100)
    //    .attr("height", self.height+self.margin.bottom)
    //    .attr("fill", "#ffffff");
}

Timeline.prototype.brushstart = function() {
  //self.context.classed("selecting", true);
  //console.log("brushstart");
}

Timeline.prototype.brushmove = function() {
  
  var s = self.brush.extent();
  if(d3.event && !d3.event.target.empty()){
    self.updateContextFocusShapes(s);
    //var s2 = self.brush.extent().map(function(a){return (self.doResampled) ? a/self.dataStore.samplesPerSecond : a;; }); ///self.dataStore.samplesPerSecond; });
    //self.dataStore.changeSelection(self.name, "time", s2); //d3.event.target.extent().map(function(a){return self.x(a)}));
    //self.changeFocusGraph(self.dataStore.currentSelection);
  }
  
}

Timeline.prototype.brushend = function() {
  var s = self.brush.extent();
  if(!d3.event.target.empty()){
    self.updateContextFocusShapes(s);
    var s2 = self.brush.extent().map(function(a){ return (self.doResampled) ? a/self.dataStore.samplesPerSecond : a; }); ///self.dataStore.samplesPerSecond; });
    self.dataStore.changeSelection(self.name, "time", s2); //d3.event.target.extent().map(function(a){return self.x(a)}));
    self.changeFocusGraph(self.dataStore.currentSelection);
  }
  
}

module.exports = Timeline;
