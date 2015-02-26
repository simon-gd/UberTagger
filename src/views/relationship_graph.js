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
function RelationshipGraph(){
    self = this;
    
    this.inited = false;
    this.dataStore = null;
    this.container = "";
    this.margin = {top: 30, right: 6, bottom: 10, left: 6};
    this.width = 200 - this.margin.left - this.margin.right;
    this.height = 200 - this.margin.top - this.margin.bottom;
    
    
    this.color = d3.scale.category10();

    this.svg = null;
}



RelationshipGraph.prototype.init = function(dataStore, parentDiv){
   
    try{
        this.dataStore = dataStore;
        this.dataStore.on("selection-changed", this.onSelectionChanged);
        this.container = parentDiv;
        var css  = ['<style>',
                    parentDiv+' rect { fill: #fff; }',
                    //parentDiv+' .tags { fill:#f4f7f8; stroke:#0095dd; stroke-width:3px;} ',
                    parentDiv+' .axis path, .axis line { fill: none; stroke: #fff; }',
                    parentDiv+' .link {  fill: none; stroke: #666; stroke-width: 1.5px; }',
                    parentDiv+' #licensing {fill: green; }',
                    parentDiv+' .link.tag-comment {  stroke: #b2abd2; }',
                    parentDiv+' .link.comment-selection {  stroke:  #72ac35; }',
                    parentDiv+' .link.tag-tag {  stroke: #0095dd; }',
                    parentDiv+' .link.tag-selection { stroke: blue; stroke-dasharray: 0,2 1; }',
                    parentDiv+' .marker.tag-comment {  fill: #b2abd2; }',
                    parentDiv+' .marker.comment-selection {  fill: #72ac35; }',
                    parentDiv+' .marker.tag-tag {  fill: #0095dd; }',
                    parentDiv+' .marker.tag-selection { fill: blue; }',
                    parentDiv+' circle.tag { fill: #f4f7f8; stroke: #0095dd; stroke-width: 1.5px; }',
                    parentDiv+' circle.comment { fill: #d8daeb; stroke: #b2abd2; stroke-width: 1.5px; }',
                    parentDiv+' circle.selection { fill: #eefcdf; stroke: #72ac35; stroke-width: 1.5px; }',
                    parentDiv+' text { font: 10px sans-serif; pointer-events: none; text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff; }',
                    '</style>'].join("\n");
        $('head').append(css);
        this.inited = true;
        this.update();
    }catch(err){
        console.error("Relationship Graph: ", err);
    }
}

RelationshipGraph.prototype.onSelectionChanged = function(event){
    
    if(event.source === "relationship-graph"){
        // we don't want circular events
        return;
    }

    try {
        //self.update();

    }catch(err){
        console.error(err);
    }
};

RelationshipGraph.prototype.update = function(data){
    self.clear();

    //console.trace();

    self.width = $(self.container).width() - self.margin.left - self.margin.right
    self.height = $(self.container).parent().height() - self.margin.top - self.margin.bottom;

    //console.log("RelationshipGraph update", self.width, self.height);

    self.render(data);
    
}

RelationshipGraph.prototype.clear = function() {
    self.svg = null;
    self.nodeGroup = null;
    d3.select(self.container).selectAll('svg').remove();
};


RelationshipGraph.prototype.render = function(data)
{
    self.dataStore.extractNodesFromComments();
    var nodes =self.dataStore.getNodes();
    var links = self.dataStore.getNodesLinks();
    // Compute the distinct nodes from the links.
    
    links.forEach(function(link) {
      link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
      link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    });

    //console.log("RelationshipGraph", nodes, links);

    var width = this.width,
        height = this.height;

    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height])
        .linkDistance(60)
        .charge(-300)
        .on("tick", tick)
        .start();


    var x = d3.scale.linear()
        .domain([-width / 2, width / 2])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([-height / 2, height / 2])
        .range([height, 0]);

    //var xAxis = d3.svg.axis()
    //    .scale(x)
    //    .orient("bottom")
    //    .tickSize(-height);

    //var yAxis = d3.svg.axis()
    //    .scale(y)
    //    .orient("left")
    //    .ticks(5)
    //    .tickSize(-width);

    var zoom = d3.behavior.zoom()
        .scaleExtent([0.5, 5])
        .on("zoom", zoomed);

   var outer = d3.select("#tag-relationships").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("pointer-events", "all");

    self.svg = outer.append("g")
        .call(zoom)
        .on("dblclick.zoom", null)
        .append('g')
        .on("mousedown", mousedown);

    self.svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'white');

    self.nodeGroup = self.svg.append("g");

    //self.svg.append("g")
    //    .attr("class", "x axis")
    //    .attr("transform", "translate(0," + height + ")")
    //    .call(xAxis);

    //self.svg.append("g")
    //    .attr("class", "y axis")
    //    .call(yAxis);

    function zoomed() {
      //self.svg.select(".x.axis").call(xAxis);
      //self.svg.select(".y.axis").call(yAxis);

      trans=d3.event.translate;
      scale=d3.event.scale;

      self.nodeGroup.attr("transform",
        "translate(" + trans + ")"
        + " scale(" + scale + ")");

    }
    function mousedown() {
      
        // allow panning if nothing is selected
        //self.svg.call(d3.behavior.zoom().on("zoom"), zoomed);
        //return;
      
    }

   

    //self.viz = svg.append('svg:g')
    //    .call(d3.behavior.zoom().on("zoom", self.rescale))
    //    .on("dblclick.zoom", null);
    //self.background = self.viz.append('svg:rect')
    //    .attr('width', width)
    //    .attr('height', height)
    //    .attr('fill', 'white');

    // Per-type markers, as they don't inherit styles.
    self.nodeGroup.append("defs").selectAll("marker")
        .data(["tag-comment", "tag-tag", "tag-selection", "comment-selection"])
      .enter().append("marker")
        .attr("id", function(d) { return d; })
        .attr("class", function(d) { return "marker " + d; })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5");
    
    

    var path = self.nodeGroup.append("g").selectAll("path")
        .data(force.links())
      .enter().append("path")
        .attr("class", function(d) { return "link " + d.type; })
        .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

    var circle = self.nodeGroup.append("g").selectAll("circle")
        .data(force.nodes())
      .enter().append("circle")
        .attr("class", function(d) { return d.type; })
        .attr("r", 6)
        .call(force.drag);

    var text = self.nodeGroup.append("g").selectAll("text")
        .data(force.nodes())
      .enter().append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .text(function(d) { return d.label; });

    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
      path.attr("d", linkArc);
      circle.attr("transform", transform);
      text.attr("transform", transform);
    }

    function linkArc(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

    function transform(d) {
      return "translate(" + d.x + "," + d.y + ")";
    }

}


module.exports = RelationshipGraph;
