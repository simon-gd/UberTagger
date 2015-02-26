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
var self = null;
function SimpleTimeline(options){
    self = this;
    
    this.name = options.name;
    this.timeRange = d3.scale.linear().range([0, 100]);
    
    this.dataStore = null;
    this.container = "";
    this.margin = {top: 0, right: 0, bottom: 0, left: 0};
    this.width = 300 - this.margin.left - this.margin.right;
    this.height = 50 - this.margin.top - this.margin.bottom;
    
    this.x = d3.scale.linear().range([0, this.width]);
    this.axisx = d3.scale.linear().range([0, this.width]);

    this.y = d3.scale.linear().range([this.height, 0]);
    this.y2 = d3.scale.linear().range([this.height, 0]);
    
    this.brush = d3.svg.brush()
            .x(self.x)
            //.extent([0, 1.0])
            .on("brushstart", self.brushstart)
            .on("brush", self.brushmove)
            .on("brushend", self.brushend);
    this.color = d3.scale.category10();

    this.xAxis = d3.svg.axis()
            .scale(self.axisx)
            .orient("bottom");

    this.yAxis = d3.svg.axis()
        .scale(self.y)
        .orient("left");

   


    this.line = d3.svg.line()
        .x(function(d, i) { return self.x(i); })
        .y(function(d, i) { return self.y(d); });

   


    
}



SimpleTimeline.prototype.setTimeRange = function(min, max)
{
    this.timeRange = d3.scale.linear().range([min, max]);
}
SimpleTimeline.prototype.init = function(dataStore, divName, done){
    //console.log("timeline init", divName, datasetPath, resources);
    try{
        this.dataStore = dataStore;
        
        //this.dataStore.on("selection-changed", this.onSelectionChanged);

        //w2ui[parentLayout].content(parentPanel, html);
        this.container = divName;
        //this.createtimeline("#my_timeline_div");
        done();
    }catch(err){
        console.log("Timeline error: ", err);
        done(err);
    }
}
SimpleTimeline.prototype.changeGraph = function(selection, width, height){
    try {
        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom;

        var ids = selection.rows;
        var cols = selection.cols; 
        var time = selection.time; 
        
        //console.log("SimpleTimeline.onSelectionChanged:",ids, cols, time);

        //return;

        var selectedData = [];
        var series = [];
        var colors = [];
        var seriesSim = [];
        if(ids.length > 0 && cols.length > 0){
            for(var i=0; i < ids.length; i++){

                var row_el = self.dataStore.dataView.getItemById(ids[i]);
                //console.log("Timeline.onSelectionChanged:", row_el["time"], row_el);
                

                if(time && time[0] !== undefined){
                    var totalTime = time[1] - time[0];
                    self.x.domain([0,totalTime*self.dataStore.samplesPerSecond]);
                    self.axisx.domain([0,totalTime]);
                    self.setTimeRange(0, totalTime*self.dataStore.samplesPerSecond);
                    var argmax = 0.0;
                    for(var j=0; j < cols.length; j++){
                        
                        var colName = cols[j];

                        if(self.dataStore.isTimeSeriesColumn(colName)){
                            var cellData = self.dataStore.getCell(ids[i], colName);
                            var featureIdx = self.dataStore.seriesArrayNameMap[colName]["series"];
                            var color = self.dataStore.featureColors[colName];
                            var s = self.dataStore.getSeriesSegmentMax(ids[i],featureIdx, time );
                            //var ss = self.dataStore.getSeriesSimilarity(id,featureIdx);
                            
                            if(s.max > argmax){ argmax = s.max; }
                           
                            var normalizedTimeSeries = new Float64Array(s.data.length);
                            for(var k=0; k < s.data.length; k++){
                                normalizedTimeSeries[k] = s.data[k] / s.max;
                            }

                            colors.push(color);
                            series.push(normalizedTimeSeries);
                        }
                        self.y.domain([0, 1.0]);
                    }
                }else{
                    //var totalTime = row_el["time"];
                
                    //self.x.domain([0,totalTime*self.dataStore.samplesPerSecond]);
                    //self.axisx.domain([0,totalTime]);
                    //self.setTimeRange(0, totalTime*self.dataStore.samplesPerSecond);
                    var argmax = 0.0;
                    var totalTimeMax = 0;
                    for(var j=0; j < cols.length; j++){

                       var colName = cols[j];
                       if(self.dataStore.isTimeSeriesColumn(colName)){
                            var cellData = self.dataStore.getCell(ids[i], colName);
                            var featureIdx = self.dataStore.seriesArrayNameMap[colName]["series"];
                            var color = self.dataStore.featureColors[colName];
                            var s = self.dataStore.getSeries(ids[i],featureIdx);
                          
                            
                            if(s.max > argmax){ argmax = s.max; }

                            var totalTime = s.data.length / self.dataStore.samplesPerSecond;
                            if(totalTime > totalTimeMax){
                                self.x.domain([0,totalTime*self.dataStore.samplesPerSecond]);
                                self.axisx.domain([0,totalTime]);
                                self.setTimeRange(0, totalTime*self.dataStore.samplesPerSecond);
                            }
                          
                            var normalizedTimeSeries = new Float64Array(s.data.length);
                            for(var k=0; k < s.data.length; k++){
                                normalizedTimeSeries[k] = s.data[k] / s.max;
                            }

                            colors.push(color);
                            series.push(normalizedTimeSeries);
                       }
                    }
                    self.y.domain([0, 1.0]);

                }

                

            }     
        }   
        self.update(series, colors, seriesSim);

    }catch(err){
        console.error(err);
    }

};

SimpleTimeline.prototype.onSelectionChanged = function(event){
    
    if(event.source === "timeline"){
        // we don't want circular events
        return;
    }

     self.changeGraph(event.data, self.width, self.height);
};

SimpleTimeline.prototype.update = function(data, colors, simData){
    self.clear();
    self.render(data, colors, simData);
    
}

SimpleTimeline.prototype.clear = function() {
    d3.select(self.container).selectAll('svg').remove();
};

SimpleTimeline.prototype.render = function(data, colors, simData)
{
       

    self.svg = d3.select(self.container).append("svg")
        .attr("width", self.width + self.margin.left + self.margin.right)
        .attr("height", self.height + self.margin.top + self.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

    /*
    self.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + self.height + ")")
      .call(self.xAxis);

    self.svg.append("g")
          .attr("class", "y axis")
          .call(self.yAxis);
    */
        //.append("text")
        //  .attr("transform", "rotate(-90)")
        //  .attr("y", 6)
        //  .attr("dy", ".71em")
        //  .style("text-anchor", "end")
        //  .text("Events");

    for(var i =0; i < data.length; i++){
        //var randomD = d3.range(data[i].size).map(Math.random);
        //console.log("Timeline.prototype.render ", data[i].length);
        self.svg.append("path")
          .datum(data[i])
          .attr("class", "line")
          .attr("d", self.line)
          .style("stroke", function(d) { return colors[i]; });    
    }

   
   
    
    //self.brushstart();
    //self.brushmove();

}



module.exports = SimpleTimeline;
