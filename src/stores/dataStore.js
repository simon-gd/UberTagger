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

var fs = require('fs');
var util = require("util");
var events = require("events");
var path = require('path');
var async = require('async');
var sk = require("statkit");

var WordPOS = require('wordpos'),
    wordpos = new WordPOS();

var natural = WordPOS.natural,
    tokenizer = new natural.WordTokenizer();

var covectric = require('covectric');
var _ = require('underscore');

/*
var ndarray = require('ndarray-bundle');
//var show = require('ndarray-show');
var ops = ndarray.ops;
var pack = ndarray.util.pack;
var unpack = ndarray.util.unpack;
var blur = ndarray.signal.filters.gaussian;
var convolve = ndarray.signal.convolve;
*/
var ndarray = require('ndarray');
var ops = require('ndarray-ops');
var pack = require('ndarray-pack');
var unpack = require('ndarray-unpack');
var blur = require('ndarray-gaussian-filter');
var convolve = require('ndarray-convolve');

var type_map = {
	'string': "text",
	'number': "float",
	'integer': "int",
	'date': "date",
	'time': "time",
	'datetime': "date",
	'boolean': "int",
	'binary': "text",
	'object': "text",
	'geopoint': "text",
	'geojson': "text",
	'array': "list",
	'any': "text",
	'time-series': "time-series",
};

var self = null;

function store() {
    events.EventEmitter.call(this);
    this.samplesPerSecond = 1; // Shold be loaded from the project.json
    this.minSecondStep = 0.2; // Shold be loaded from the project.json
    this.mongoose = null;
	this.sim_options = {numeric: true, series: false, textual: true};
	this.nodeLinks = [];
	this.commentNodes = {}; 
	this.selectionNodes = {};
	this.tagNodes = {};
	this.commentNodesA = []; // XXX unused?
	this.tagNodesA = []; // XXX unused?
	this.selectionNodesA = [];  // XXX unused?

	this.Record; // Record Schema model
    this.comments = [];
    this.commentModel = null;
    this.debug = false;
    this.cfg = null;
    this.datasetPath = null;
    this.dataView = null;
    this.currentSelection = {rows:[], cols: [], time:[]};
    this.currentTime = 0;
    this.speed = 1;
	this.columns = [];
	this.columnsMeta = {};
	this.dataStatistics = {};
	this.dataTextModels = {}; //new covectric.Model();

	this.columnVecs = {};

	this.searches = [];
	this.records = [];
	this.db = null;
	this.dbRecords = {};
	//this.maxTime = 0;
	this.totalRecords = 0;
	
	this.dataTimeSeries = {};
	this.dataTimeSeriesSimilarity = {};

	this.seriesArrayDimMap = [];
	this.seriesArrayNameMap = {};
	//this.seriesArray = null;
	this.seriesArrayDims = [0,0,0];
	this.maxSimilarity; 

	this.featureColors = {};

	

	self = this;
}
util.inherits(store, events.EventEmitter);

store.prototype.setCurrentTime = function(t)
{
	self.currentTime = t;
	self.emit("current-time-changed");
};

store.prototype.getCurrentTime = function()
{
	return self.currentTime;
};

store.prototype.init = function( datasetPath, cfg, done) {
	this.cfg = cfg;
	this.datasetPath = datasetPath;

	if(!this.cfg.samplesPerSecond){
		alert("project.json should define samplesPerSecond");
	}else{
		this.samplesPerSecond = this.cfg.samplesPerSecond;
	    this.loadData(done); 	
	}
	
	
};

store.prototype.changeSelection = function(source, type, data) {
	
	if(type === "all"){
		self.currentSelection = data; //.cols.slice();
		//self.currentSelection.rows = data.rows.slice();
		//self.currentSelection.time = data.time.slice();
	}else if(type === "grid"){
		self.currentSelection.cols = data.cols.slice();
		self.currentSelection.rows = data.rows.slice();
	} else if(type === "cell-click"){
		self.currentSelection.cols = self.columns[data]["id"];
	} else if(type === "cell-click-id"){
		self.currentSelection.cols = data;	
	} else if(type === "row-select"){
		self.currentSelection.rows = data;	
	} else if(type === "time"){
		self.currentSelection.time = data;	
	}
	
	//console.log("store.changeSelection: ", source, type, data, self.currentSelection);


    this.emit("selection-changed", {source: source, type: type, data: self.currentSelection});
};

store.prototype.addColToSelection = function(colIndex){
	var index = self.currentSelection.cols.indexOf(self.columns[colIndex]["id"]);
	if (index == -1) {
    	self.currentSelection.cols.push(self.columns[colIndex]["id"]);
	}
	//console.log("self.currentSelection", self.currentSelection);
};

store.prototype.clearColSelection = function(){
	self.currentSelection.cols = [];
	//console.log("self.currentSelection", self.currentSelection);
};

store.prototype.removeColFromSelection = function(colIndex){
	var index = self.currentSelection.cols.indexOf(self.columns[colIndex]["id"]);
	if (index > -1) {
    	self.currentSelection.cols.splice(index, 1);
	}

	//console.log("self.currentSelection", self.currentSelection);
};

store.prototype.addRowToSelection = function(rowID){
	var index = self.currentSelection.rows.indexOf(rowID);
	if (index == -1) {
    	self.currentSelection.rows.push(rowID);
	}
	//console.log("self.currentSelection", self.currentSelection);
};

store.prototype.clearRowsSelection = function(){
	self.currentSelection.rows = [];
	//console.log("self.currentSelection", self.currentSelection);
};

store.prototype.removeRowFromSelection = function(rowID){
	var index = self.currentSelection.rows.indexOf(rowID);
	if (index > -1) {
    	self.currentSelection.rows.splice(index, 1);
	}

	//console.log("self.currentSelection", self.currentSelection);
};

store.prototype.featureIDFromColumnName = function(name)
{
	//var f = name.split(".");
    //var colName = f[0];
    //var featureName = f[1];
	return self.seriesArrayNameMap[name]["series"];
}

store.prototype.onChangeSelection= function(newSelection){
	//console.log("dataStore: onChangeSelection");
};


store.prototype.gaussianBlur = function(signal, r) {
  nda = ndarray(signal);
  signal = blur(nda, r).data;
  return signal;
}


store.prototype.getSeriesSegment = function(rowID, featureID, timeRange){
	
	var startTime = Math.ceil(timeRange[0]*self.samplesPerSecond);
	var endTime = Math.ceil(timeRange[1]*self.samplesPerSecond);
	var selectedSignal = self.dataTimeSeries[rowID][featureID].subarray(startTime, endTime);
	//console.log("getSeriesSegment",selectedSignal);
	return selectedSignal; //unpack(oneFeature);
	//return oneFeature;
	
}

store.prototype.getSeriesSegmentMax = function(rowID, featureID, timeRange){
	
	var startTime = Math.ceil(timeRange[0]*self.samplesPerSecond);
	var endTime = Math.ceil(timeRange[1]*self.samplesPerSecond);
	var selectedSignal = self.dataTimeSeries[rowID][featureID].subarray(startTime, endTime);
	var mymax = sk.max(selectedSignal);
	//console.log("getSeriesSegment",selectedSignal);
	return {data: selectedSignal, max: mymax};; //unpack(oneFeature);
	//return oneFeature;
	
}

store.prototype.getSeriesWhole = function(rowID, featureID){
	
	var selectedSignal = self.dataTimeSeries[rowID][featureID];
	//console.log("getSeriesSegment",selectedSignal);
	return selectedSignal; //unpack(oneFeature);
	//return oneFeature;
	
}

store.prototype.getSeries = function(rowID, featureID){
	var selectedSignal = self.dataTimeSeries[rowID][featureID];
	var mymax = sk.max(selectedSignal);
	return {data: selectedSignal, max: mymax}; //unpack(oneFeature);
}
store.prototype.getSeriesSimilarity = function(rowID, featureID){
	
	if(self.dataTimeSeriesSimilarity[rowID] && self.dataTimeSeriesSimilarity[rowID][featureID]){
		var selectedSignal = self.dataTimeSeriesSimilarity[rowID][featureID];
		var mymax = sk.max(selectedSignal);

		return {data: selectedSignal, max: mymax}; 
	}
	
	return {data: undefined, max: 0};
	
}



store.prototype.getCell = function(rowID, colName){
	var cell = self.dbRecords[rowID][colName];
	//console.log("getCell", cell);
	return cell;
}

store.prototype.getRawTimeSeriesSamples = function(rowID, colName){
	var data = self.dbRecords[rowID][colName];
	//console.log("getCell", cell);
	var mymax = sk.max(data);
	return {data: data, max: mymax};
}


store.prototype.getTimeSeries = function(rowID, featureID, timeRange, done)
{
	
	var series = [];
	async.each(features, function(feature, callback){
		var oneFeature = self.seriesArray.pick(null,rowID,featureID);
		var selectedSignal = oneFeature.lo(timeRange[0]).hi(timeRange[1]);

		series.push();
	}, function(err){
		done(series);
	});
};

store.prototype.isTimeSeriesColumn = function(column)
{
	var schema = $.grep(self.Record.fieldMeta(), function( n, i ) { return n.id === column; });
	return (schema.length == 1 && schema[0].dtype === "timeseries");
}

store.prototype.getSimilarRecords = function(recordIndex, columns, maxResults, done){
	try{

		

		if(columns.length > 0){
			// Split columns into types
			var numericColumns = [];
			var textualColumns = [];
			var timeSeriesColumns = [];

			var c;
			for(c = 0; c < columns.length; c++){
				var col = columns[c];
				var schema = $.grep(self.Record.fieldMeta(), function( n, i ) { return n.id === col; });
				if(schema.length == 1){
					var colSchema = schema[0];
					if(self.isNumeric(colSchema["dtype"]) || self.isNumeric(colSchema["display-dtype"])){
						numericColumns.push(col);
					}else if(colSchema.dtype === "string"){
						textualColumns.push(col);
					}
					if(colSchema.dtype === "timeseries"){
						timeSeriesColumns.push(colSchema);
					}
				}
				//var f1, f2;
				//if(col.indexOf(".") > -1){
				//	var sss = col.split(".");
				//	f1 = sss[0];
				//	f2 = sss[1];
				//	
				//	col = f1+".count"; // XXX aaaaa, bad
				//}
				//var schema = $.grep(self.cfg["schema-display"], function( n, i ) { return n.path === col; });
				

				//if(schema.length == 1){
					//console.log("updateSimilarity: ", schema[0]);
				//	if(schema[0].type === "Number"){
				//		numericColumns.push(col);
				//	}else if(schema[0].type === "String"){
				//		textualColumns.push(col);
				//	}
				//	if("time-series" in schema[0]){
				//		timeSeriesColumns.push(schema[0]);
				//	}
				//}else if(schema.length > 1){
				//	schema = $.grep(schema, function( n, i ) { return n["time-series"]["data"] === f2; });
				//	if(schema[0].type === "Number"){
				//		numericColumns.push(col);
				//	}
				//	if("time-series" in schema[0]){
				//		timeSeriesColumns.push(schema[0]);
				//	}
				//}
			}

			//console.log("updateSimilarity: ", numericColumns, textualColumns, timeSeriesColumns);

			var numericWeight = numericColumns.length / columns.length;
			var textualWeight = textualColumns.length / columns.length;
			var timeSeriesWeight = timeSeriesColumns.length / columns.length;


			//var similarity;		
			//if(numericColumns.length > 0){
				//similarity = self.updateSimilarityNumeric(recordIndex, numericColumns);	
			//}
			self.updateSimilarityNumeric(recordIndex, numericColumns, function(similarityNumeric){
				self.updateSimilarityTextual(recordIndex, textualColumns, function(similarityTextual){
					//self.updateSimilaritySeries(recordIndex, timeSeriesColumns, time, function(similarityTimeSeries){
						//similarity
					    //console.log("updateSimilarity: weights: ", numericWeight, textualWeight);
						//console.log("updateSimilarity: sims: ", similarityNumeric, similarityTextual);
						similarity = [];
						for (s in self.dbRecords){
							var nS = (s in similarityNumeric) ? similarityNumeric[s] : 0.0;
							var tS = (s in similarityTextual) ? similarityTextual[s] : 0.0;
							//var sS = (s in similarityTimeSeries) ? similarityTimeSeries[s] : 0.0;
							
							var sim = nS*numericWeight + tS*textualWeight;

							//var item = self.dataView.getItemById(s);
							//console.log(item);	
							similarity.push({id: s, similarity: sim});
						}
						similarity.sort(function(a, b) { return b.similarity - a.similarity; });
						done(null, similarity.slice(0, maxResults));
					//});	
				});	

			});
		}else{
			done(null, {});
		}
		
		



		
	}catch (err){
		console.error(err);
		done(err);
	}
};

// XXX this need to be refactored, 
// XXX assumes time series has count field
store.prototype.updateSimilarity = function(recordIndex, columns, time, done){
	try{

		if(columns.length > 0){
			// Split columns into types
			var numericColumns = [];
			var textualColumns = [];
			var timeSeriesColumns = [];

			var c;
			for(c = 0; c < columns.length; c++){
				var col = columns[c];
				var schema = $.grep(self.Record.fieldMeta(), function( n, i ) { return n.id === col; });
				if(schema.length == 1){
					var colSchema = schema[0];
					if(self.isNumeric(colSchema["dtype"]) || self.isNumeric(colSchema["display-dtype"])){
						numericColumns.push(col);
					}else if(colSchema.dtype === "string"){
						textualColumns.push(col);
					}
					if(colSchema.dtype === "timeseries"){
						timeSeriesColumns.push(colSchema);
					}
				}
			}

			//console.log("updateSimilarity: ", numericColumns, textualColumns, timeSeriesColumns);

			var numericWeight = numericColumns.length / columns.length;
			var textualWeight = textualColumns.length / columns.length;
			var timeSeriesWeight = timeSeriesColumns.length / columns.length;


			//var similarity;		
			//if(numericColumns.length > 0){
				//similarity = self.updateSimilarityNumeric(recordIndex, numericColumns);	
			//}
			self.updateSimilarityNumeric(recordIndex, numericColumns, function(similarityNumeric){
				self.updateSimilarityTextual(recordIndex, textualColumns, function(similarityTextual){
					self.updateSimilaritySeries(recordIndex, timeSeriesColumns, time, function(similarityTimeSeries){
						//similarity
						//console.log("updateSimilarity: weights: ", numericWeight, textualWeight, timeSeriesWeight);
						//console.log("updateSimilarity: sims: ", similarityNumeric, similarityTextual);
						
							//this.sim_options = {numeric: true, series: false, textual: true};

						for (s in self.dbRecords){
							var nS = ((s in similarityNumeric) && self.sim_options.numeric) ? similarityNumeric[s] : 0.0;
							var tS = ((s in similarityTextual) && self.sim_options.textual) ? similarityTextual[s] : 0.0;
							var sS = ((s in similarityTimeSeries) && self.sim_options.series) ? similarityTimeSeries[s] : 0.0;
							
							var sim = nS*numericWeight + tS*textualWeight + sS*timeSeriesWeight;

							var item = self.dataView.getItemById(s);
							//console.log(item);	
							item['similarity'] = sim;
							self.dataView.updateItem(item.id, item);	
						}
						self.dataView.endUpdate();

						self.emit("similarity-done",  {source: "dataStore", type: "all", data: self.currentSelection});
						done();
					});	
				});	

			});
		}else{
			done();
		}
		
		



		
	}catch (err){
		console.error(err);
		done(err);
	}
	
};

// http://en.wikipedia.org/wiki/Euclidean_distance
// http://en.wikipedia.org/wiki/Mahalanobis_distance
store.prototype.MahalanobisDistance = function(a, b, variance){
	var sum = 0;
	var n;
	for (n=0; n < a.length; n++) {
		sum += (Math.pow(a[n]-b[n], 2) / variance[n]);
	}
	return Math.sqrt(sum);
};

store.prototype.EuclideanDistance = function(a, b){
	var sum = 0;
	var n;
	for (n=0; n < a.length; n++) {
		sum += (Math.pow(a[n]-b[n], 2));
	}
	return Math.sqrt(sum);
};


// XXX this need to be refactored, 
// XXX assumes time series has count field
store.prototype.updateSimilarityNumeric = function(recordIndex, columns, done){
	if(columns.length > 0 && self.sim_options.numeric){
		var distance = {};
		var featureVec = [];
		var varianceVec = [];
		var maxDist = 0;
		var record = self.dbRecords[recordIndex];

		if(!record){
			//console.error(recordIndex + " was not found!");
			done({});
			return;
		}
		
		//console.log("updateSimilarityNumeric: ",columns);
		for(var i=0; i < columns.length; i++){
			var col = columns[i];
			var value;
			//if(col.indexOf(".") > -1){
			//	col = col.split(".")[0];
			//	value = record[col]["count"];
			//	varianceVec.push(self.dataStatistics[col+".count"]["variance"]);
			//}else{
			value = record[col];
			varianceVec.push(self.dataStatistics[col]["variance"]);
			//console.log("updateSimilarityNumeric: ",self.dataStatistics[col]);
			//}

			featureVec.push(value);
		}
		
		//console.log(self.records[0]);
		
		//for(var i=0; i < self.records.length; i++){
		for (recID in self.dbRecords){
			var r = self.dbRecords[recID];
			var localFeatureVec = [];
			for(var j=0; j < columns.length; j++){
				var col = columns[j];
				var value;
				//if(col.indexOf(".") > -1){
				//	col = col.split(".")[0];
				//	value = r[col]["count"];
				//}else{
				value = r[col];
				//}
				localFeatureVec.push(value);
			}
			//console.log(varianceVec, featureVec, localFeatureVec);
			var dist = self.MahalanobisDistance(featureVec, localFeatureVec, varianceVec);
			maxDist = (maxDist < dist) ? dist : maxDist;
			distance[recID] = dist;
		}
		var similarity = {};
		var d;
		// Map on [0,1]
		//console.log(distance, featureVec, localFeatureVec);

		for(d in distance){
			similarity[d] = 1.0 - (distance[d]/maxDist);
		}
		done(similarity);
	}else{
		done({});
	}

}


store.prototype.updateSimilarityTextual = function(recordIndex, columns, done){
	var similarity = {};
	var record = self.dbRecords[recordIndex];
	var cCount = columns.length;
	if(cCount < 1 || !self.sim_options.textual){
		done(similarity);
	}else{
		async.each(columns, function(col, callback){
			var value = record[col];
			//var tokens = tokenizer.tokenize(value);
			//tokens.map(function(token){return natural.PorterStemmer.stem(token); });
			//featureVec.push(tokens);
			//similarity[record.id] = 1.0;

			wordpos.getPOS(value, function(results){
				//console.log("updateSimilarityTextual: ", results);
				var t = results.nouns
								.concat(results.verbs)
								.concat(results.adjectives).join(" ");
				var results = self.dataTextModels[col].search(t, self.records.length);
				for(var r=0; r < results.length; r++){
					if(results[r].id in similarity){
						similarity[results[r].id] += results[r].similarity;
					}else{
						similarity[results[r].id] = results[r].similarity;
					}
				}
				callback();
			});
		}, function(err){
			if(err){ console.error(err);}
			for(sim in similarity){
				similarity[sim] /= cCount;
			}

			done(similarity);
		});
	}
}

var numeric = require("numeric");
var DTW = require('dtw');
var dtw = new DTW();

//http://en.wikipedia.org/wiki/Dynamic_time_warping
store.prototype.DTWDistance = function(a, b) {
	var n = a.length;
	var m = b.length;
    var DTW = ndarray([n+1, m+1]);
    var i, j;
    
    for (i = 1; i <= n; i++){
        DTW.set(i, 0, Infinity);
    }
     for (i = 1; i <= m; i++){
        DTW.set(0, i, Infinity);
    }
    
    DTW.set(0,0,0);

    for (i = 1; i <= n; i++){
        for(j = 1; j <= m; j++){
            cost = self.EuclideanDistance(a[i-1], b[j-1])
            DTW.set(i, j, cost + Math.min([DTW.get(i-1, j),    // insertion
                                         DTW.get(i  , j-1),    // deletion
                                         DTW.get(i-1, j-1)]));    // match
        }
    }
    //console.log(DTW.get(n, m));
    return DTW.get(n, m);
    
}

//http://en.wikipedia.org/wiki/Dynamic_time_warping
store.prototype.dtwDistance = function(a, b)
{
	//Normalize the data
	//var meanA = sk.mean(a);
	//var meanB = sk.mean(b);

	//var aNorm = new Float64Array(a.length);
	//var bNorm = new Float64Array(b.length);

	//var i=0;
	//for(i=0; i < a.length; i++){
	//	aNorm[i] =  a[i] - meanA;
	//}
	//for(i=0; i < b.length; i++){
	//	aNorm[i] = b[i] - meanB;
	//}

	var normalArrayA = Array.prototype.slice.call( a );
	var normalArrayB = Array.prototype.slice.call( b );

	var dist = dtw.compute(normalArrayA, normalArrayB);
	//var dist2 = self.DTWDistance(normalArrayA, normalArrayB);
	//console.log("DISTANCE: ", dist, dist2);
	return dist;
}

store.prototype.crossCorrelation = function(a, b)
{

	var pA = new Float64Array(a.length+a.length+b.length+b.length-1);
	var pB = new Float64Array(a.length+a.length+b.length+b.length-1);
	pA.set(a);
	pB.set(b);

	//Normalize the data
	var meanA = sk.mean(a);
	var meanB = sk.mean(b);


	var aNDA = ndarray(pA);
	var bNDA = ndarray(pB);

	var aNorm = ndarray(new Float64Array(pA.length))
	ops.subs(aNorm, aNDA, meanA);


	var bNorm = ndarray(new Float64Array(pB.length))
	ops.subs(bNorm, bNDA, meanB);


	var out = ndarray(new Float64Array(pA.length));
	convolve.correlate(out, aNorm, bNorm);
	
	return out;
}
store.prototype.updateSimilaritySeries = function(recordIndex, columns, timeRange, done)
{
	var similarity = {};
	var finalSim = {};

	try{
		//console.log("updateSimilaritySeries: ", recordIndex, columns, timeRange);
		var maxDist = {};
		var record = self.dbRecords[recordIndex];
		var cCount = columns.length;
		if(cCount < 1 || !self.sim_options.series){
			done({});
		}else{
			for(var j=0; j < columns.length; j++){      
				
				var path = columns[j]["id"];
				var data = "series";

	            var featureIdx = self.seriesArrayNameMap[path][data];
	            
	            var selectedSegment = self.getSeriesWhole(recordIndex,featureIdx); //, timeRange );
	            
	            var recID; // = recordIndex;
	            similarity[featureIdx] = {};
	            maxDist[featureIdx] = 0;
	            for(recID in self.dbRecords){
	            	if(j==0){
	            		finalSim[recID] = 0;
	            	}
	            	var ser  = self.getSeriesWhole(recID,featureIdx );
					if(selectedSegment.length > 1 && ser.length > 1){
						
						//var ccorr = self.crossCorrelation(ser, selectedSegment);
						
						//self.dataTimeSeriesSimilarity[recID][featureIdx] = ccorr.data;
						
						//var dist = sk.max(ccorr.data);
						
						var dist = self.dtwDistance(ser, selectedSegment);
						maxDist[featureIdx] = (maxDist[featureIdx] < dist) ? dist : maxDist[featureIdx];
						similarity[featureIdx][recID] = dist;
					}
					

	            }
	            var sim;
	         }
	         for(var f in similarity){
	         	for(var r in similarity[f]){
					finalSim[r] += (1.0 - (similarity[f][r] / maxDist[f]));
					//console.log("updateSimilaritySeries: ", finalSim[r], similarity[f][r]);
				}
			 }
			 

			done(finalSim);
		}
	}catch(err){
		if(err){console.error(err);}
		done({});
	}
	
}

store.prototype.createTextVectors = function(Record, records, done)
{
	var columnArray = [];
	var columns = Record.fieldMeta();
	var j;
	for(j=0; j < columns.length; j++){
		if(columns[j]["dtype"] == "string"){
			var p = columns[j]["id"];
			
			self.dataTextModels[p] = new covectric.Model();
			columnArray.push(p);
		}
	}

	async.each(records, function(record, callback){
		async.each(columnArray, function(p, call_inner){
			if(record[p] && record[p] !== undefined){
				var text = record[p];
				wordpos.getPOS(text, function(results){
					//console.log("updateSimilarityTextual: ", results);
					var t = results.nouns
								.concat(results.verbs)
								.concat(results.adjectives).join(" ");
					//console.log("createTextVectors", t);
					
					self.dataTextModels[p].upsertDocument(record["id"], record["id"].toString(), t);
					
					call_inner();
				});
			}else{
				call_inner();
			}						
		}, function(err){
			if(err){console.error(err); }
			//console.log("done with a record");
			callback();
		});
	},function(err){
		if(err){console.error(err);}
		var p;
		// Now we can calculate stats
		for(p in self.dataTextModels){
			self.dataTextModels[p].recomputeVectorBaseTokenWeights();
			//var results = self.dataTextModels[p].search("graph", 10);
			//console.log("Search Results: ", results);
		}
		//console.log("textModels: ", self.dataTextModels);
		done();

	});

}

store.prototype.isNumeric =  function(type){
	return (type === "uint8" || 
		    type === "uint16" ||
		    type === "uint32" ||
		    type === "int8" ||
		    type === "int16" ||
		    type === "int32" ||
		    type === "float32" ||
		    type === "float64");
}

// Creates statistics of each column in the data, ignores undefined values
// so each column may have less then # of records values
store.prototype.createStats = function(Record, records, done)
{
	columnVecs = {};
	var columns = Record.fieldMeta();
	//ar columns = this.cfg["schema-display"];
	var j;
	for(j=0; j < columns.length; j++){
		if(self.isNumeric(columns[j]["dtype"]) || self.isNumeric(columns[j]["display-dtype"])){
			var p = columns[j]["id"];
			self.dataStatistics[p] = {};
			columnVecs[p] = [];
		}
	}

	async.each(records, function(record, callback){
		var p;
		for(p in columnVecs){
			//if(p.indexOf(".") > -1){
			//	var ff = p.split(".");
			//	if(record[ff[0]] && record[ff[0]][ff[1]] && record[ff[0]][ff[1]] !== undefined){
			//		columnVecs[p].push(record[ff[0]][ff[1]]);
			//	}	
			//}else{
			if(record[p] && record[p] !== undefined){
				columnVecs[p].push(record[p]);		
			}				
			//}			
		}
		callback();
	},function(err){
		if(err){console.error(err);}
		var p;
		// Now we can calculate stats
		for(p in self.dataStatistics){
			self.dataStatistics[p] = {count: columnVecs[p].length,  
				                      max: sk.max(columnVecs[p]), 
				                      min: sk.min(columnVecs[p]),
				                      range: sk.range(columnVecs[p]),
				                      quantile: sk.quantile(columnVecs[p]),
				                      median: sk.median(columnVecs[p]),
				                      iqr: sk.iqr(columnVecs[p]),
				                      mean: sk.mean(columnVecs[p]),
				                      gmean: sk.gmean(columnVecs[p]),
				                      hmean: sk.hmean(columnVecs[p]),
				                      variance: sk.var(columnVecs[p]),
				                      std: sk.std(columnVecs[p]),
				                      skew: sk.skew(columnVecs[p]),
				                      kurt: sk.kurt(columnVecs[p]),
				                      entropy: sk.entropy(columnVecs[p])
				                  };
		}
		self.columnVecs = columnVecs;
		//console.log("dataStatistics: ", columnVecs, self.dataStatistics);
		done();

	});


}

store.prototype.createNDArray = function(Record, records, done)
{
	try{
		

		//var secCount = Math.ceil(self.maxTime*self.samplesPerSecond); 
		var recordsCount = Math.ceil(self.totalRecords);


		this.seriesArrayDimMap = [];
		
		var columns = Record.fieldMeta();

		//var columns = this.cfg["schema-display"];
		for(var j=0; j < columns.length; j++){
			if(columns[j]["dtype"] == "timeseries"){
				var p = columns[j]["id"];
				var time = "time";
				var data = "series";
				var filter = columns[j]["filter"];
				
				
				this.seriesArrayDimMap.push([p, time, data, filter]);

				
			}			
		}

		this.seriesArrayNameMap = {};
		for(var k=0; k < this.seriesArrayDimMap.length; k++){
			var p = this.seriesArrayDimMap[k][0];
			var data = this.seriesArrayDimMap[k][2];
			if(!(p in this.seriesArrayNameMap)){
				this.seriesArrayNameMap[p] = {};	
			}
			//console.log("seriesArrayNameMap: ", p, data, k);
			this.seriesArrayNameMap[p][data] = k;
		}
		//console.log("createNDArray: ", this.seriesArrayNameMap);
		var dim = this.seriesArrayDimMap.length;
		
		//this.seriesArrayDims = [recordsCount, secCount, dim];
		//var kde = kernelDensityEstimator(epanechnikovKernel(7), x);

		//this.maxSimilarity = Array(recordsCount);
		//this.seriesArray = ndarray(new Float64Array(recordsCount*secCount*dim), this.seriesArrayDims); //ndarray.zeros(this.seriesArrayDims); //(new Float32Array(x*y*dim), [x, y, dim]);
		//console.log(x, y, dim, this.seriesArrayDimMap);
		async.each(records, function(record, callback){
			self.dataTimeSeries[record.id] = {};
			self.dataTimeSeriesSimilarity[record.id] = {};

			var maxArrayLength = 0;
			for(var i=0; i < self.seriesArrayDimMap.length; i++){
				var series = self.seriesArrayDimMap[i];
				var time_seq  = record[series[0]+"_"+series[1]]
				var lastTime = time_seq[time_seq.length-1]/ 1000.0;
				var arrayLength = Math.ceil(lastTime*self.samplesPerSecond);
				maxArrayLength = (arrayLength > maxArrayLength) ? arrayLength : maxArrayLength;
			}

			async.each(self.seriesArrayDimMap, function(series, icallback){
				var index = self.seriesArrayDimMap.indexOf(series);
				//console.log("record", series, record);
				var time_seq = record[series[0]+"_"+series[1]].map(function(x) { return x / 1000.0; });
				var val_seq = record[series[0]+"_"+series[2]];
				var filter = series[3];

				//var arrayLength = Math.ceil(time_seq[time_seq.length-1]*self.samplesPerSecond);
				
				//throw("arrayLength is "+arrayLength);
				// Create an array full of zeros
				self.dataTimeSeries[record.id][index] = new Float64Array(maxArrayLength); //Array.apply(null, new Float64Array(arrayLength)).map(Number.prototype.valueOf,0); 
				
				//self.dataTimeSeries[record.id][index].map(function(i){return 0.0; });
				
				
				//console.log("debug_this_thing", filter, val_seq);	
				//console.log("createNDArray: times ", index, series[0],series[1], time_seq, val_seq);
				if(val_seq && val_seq.length > 0){
					if(filter === "interp"){
						
						// user actual values
						var k = 0;
						var maxTime = time_seq[time_seq.length-1];
						for(var i=0; i < maxTime; i+=(1.0/self.samplesPerSecond)){
							var t_i = time_seq[k];
							if(t_i <= i){
								k++;
							}
							var v = val_seq[k];
							self.dataTimeSeries[record.id][index][Math.ceil(i*self.samplesPerSecond)] = v;
							//self.seriesArray.set(record.id-1, Math.ceil(i*self.samplesPerSecond), index, v);	
						}
						//self.dataTimeSeries[record.id][index] = self.gaussianBlur(self.dataTimeSeries[record.id][index], self.samplesPerSecond);
					}else if(filter === "interp2"){
						
						// user actual values
						var time_start = 0;
						var time_end = 0;
						for(var i=0; i < time_seq.length; i++){
							time_end = time_seq[i];
							for(var t_i = time_start; t_i <= time_end; t_i += (1.0/self.samplesPerSecond)){
								var v = (i>0) ? val_seq[i-1] : 0;
								self.dataTimeSeries[record.id][index][Math.ceil(t_i*self.samplesPerSecond)] = v;
							}
							time_start = time_seq[i];
							//self.seriesArray.set(record.id-1, Math.ceil(i*self.samplesPerSecond), index, v);	
						}
						//self.dataTimeSeries[record.id][index] = self.gaussianBlur(self.dataTimeSeries[record.id][index], 2);
					}else if(filter === "interp3"){
						
						// user actual values
						var time_start = 0;
						var time_end = 0;
						for(var i=0; i < time_seq.length; i++){
							time_end = time_seq[i];
							for(var t_i = time_start; t_i <= time_end; t_i += (1.0/self.samplesPerSecond)){
								var v = (i>0) ? val_seq[i] : 0;
								self.dataTimeSeries[record.id][index][Math.ceil(t_i*self.samplesPerSecond)] = v;
							}
							time_start = time_seq[i];
							//self.seriesArray.set(record.id-1, Math.ceil(i*self.samplesPerSecond), index, v);	
						}
						//self.dataTimeSeries[record.id][index] = self.gaussianBlur(self.dataTimeSeries[record.id][index], 2);

					
					}else if(filter === "hist"){
						// simply do hist of events
						
						for(var i=0; i < time_seq.length; i++){
							var t_i = time_seq[i];

							var actual_t = Math.ceil(t_i * self.samplesPerSecond);

							var v = self.dataTimeSeries[record.id][index][actual_t] + 1;
							//console.log("hist: ", record.id, index, actual_t, self.dataTimeSeries[record.id][index][actual_t], v);
							self.dataTimeSeries[record.id][index][actual_t] = v;
							
							//var v = self.seriesArray.get(record.id-1,actual_t, index) + 1;
							//self.seriesArray.set(record.id-1, actual_t, index, v);	
						}
						//self.dataTimeSeries[record.id][index]  = self.gaussianBlur(self.dataTimeSeries[record.id][index], 4);
					}else if(filter === "event"){
						// simply do hist of events
						
						for(var i=0; i < time_seq.length; i++){
							var t_i = time_seq[i];

							var actual_t = Math.ceil(t_i * self.samplesPerSecond);

							self.dataTimeSeries[record.id][index][actual_t] = val_seq[i];
							//console.log("event", actual_t, val_seq[i]);
							//var v = self.seriesArray.get(record.id-1,actual_t, index) + 1;
							//self.seriesArray.set(record.id-1, actual_t, index, v);	
						}
						//self.dataTimeSeries[record.id][index]  = self.gaussianBlur(self.dataTimeSeries[record.id][index], 4);
						
					}else if(filter === "occum"){
						// simply do hist of events
						var k = 0;
						var runningSum = 0;
						var maxTime = time_seq[time_seq.length-1];
						for(var i=0; i < maxTime; i+=(1.0/self.samplesPerSecond)){
							var t_i = time_seq[k];
							if(t_i <= i){
								k++;
								runningSum += val_seq[k];
							}
							
							self.dataTimeSeries[record.id][index][Math.ceil(i*self.samplesPerSecond)] = runningSum;
							//self.seriesArray.set(record.id-1, Math.ceil(i*self.samplesPerSecond), index, v);	
						}
						
						//self.dataTimeSeries[record.id][index]  = self.gaussianBlur(self.dataTimeSeries[record.id][index], self.samplesPerSecond*2);
					}else{
						console.error("createNDArray Error: type not supported. ", typeof(val_seq[0]));
					}
					
					//console.log(val_seq.length, val_seq[0], typeof(val_seq[0]) );	
				}
				//if(self.debug_this_thing === undefined){
				//	console.log("debug_this_thing", self.dataTimeSeries[record.id][index]);	
				//	self.debug_this_thing = true;
				//}
				
			
				icallback();
			},function(err){
				// done with features
				if(err){console.error(err);}
				callback();
			});		
		}, function(err){
			// done with all records
			
			done();
				
			
		});
	}catch(err){
		if(err){console.error(err);}
		done();	
	}
}



store.prototype.loadTags = function(){
	//self.tagModel.find(function (err, tags) {
	//  if (err) return console.error(err);
	//  tags.forEach(function(tag){
	//  	self.tags.push(tag);	
	//  });
	//  
	//  console.log("Tags: ", self.tags);
	//})
/*
	self.tags = {};
	self.commentModel.find(function (err, comments) {
	  if (err) return console.error(err);
	  async.each(comments, function(comment, callback){
	  	
	  	//for(var i=0; i < )
	  	self.tags[tagName] = tagData;	
	  


	  }, function(err){
	  	if(err){ console.error(err); }
	  	self.emit("tags-changed");
	  });
	  
	  
	})
*/

};

store.prototype.extractNodesFromComments = function(){
	this.commentNodes = {};
	this.tagNodes = {};
	this.selectionNodes = {};
	
	this.commentNodesA = [];
	this.tagNodesA = [];
	this.selectionNodesA = [];
	this.nodeLinks = [];

	for(var i=0; i < self.comments.length; i++){
		var comment = self.comments[i];

		this.commentNodes["comment_"+comment._id] = {name: "comment_"+comment._id, label: "", type: "comment"};
		this.commentNodesA.push(this.commentNodes["comment_"+comment._id]);

		for(var t=0; t < comment.tags.length; t++){
			var tag = comment.tags[t];

			this.tagNodes["tag_"+tag.name] = {name: "tag_"+tag.name, label: tag.name, type: "tag"};
			this.tagNodesA.push(this.tagNodes["tag_"+tag.name]);
			this.nodeLinks.push({source: "tag_"+tag.name, target: "comment_"+comment._id, weight: tag.weight, type: "tag-comment" }); 

		}

		for(var s=0; s < comment.selections.length; s++){
			var selection = comment.selections[s];
			var name = JSON.stringify(selection);
			this.selectionNodes["selection_"+name] = {name: "selection_"+name, label: "", type: "selection", selection: selection};
			this.selectionNodesA.push(this.selectionNodes["selection_"+name]);
			this.nodeLinks.push({source: "comment_"+comment._id, target: "selection_"+name, weight: 1, type: "comment-selection" }); 

		}

		for(var r=0; r < comment.tagRelations.length; r++){
			var rel = comment.tagRelations[r];
			this.nodeLinks.push({source: "tag_"+rel.from, target: "tag_"+rel.to, type: "tag-tag" }); 

		}
	}

};

store.prototype.getCommentNodes = function(){
	return this.commentNodes;
};

store.prototype.getSelectionNodes = function(){
	return this.selectionNodes;
};

store.prototype.getTagNodes = function(){
	return this.tagNodes;
};

store.prototype.getCommentNodesA = function(){
	return this.commentNodesA;
};

store.prototype.getSelectionNodesA = function(){
	return this.selectionNodesA;
};

store.prototype.getTagNodesA = function(){
	return this.tagNodesA;
};

store.prototype.getNodes = function(){
	var nodes = {};
	$.extend( nodes, this.commentNodes );
	$.extend( nodes, this.selectionNodes );
	$.extend( nodes, this.tagNodes );
	return nodes;
};

store.prototype.getNodesLinks = function(){
	return this.nodeLinks;
};

store.prototype.createComment= function(souce_text, display_text, selections, tags, tagRelations, codeBlocks){
	//var tagName = "test" + Math.floor((Math.random() * 100) + 1);
	//var tag = new this.tagModel({ name: tagName, selection: { rows: [1], cols: ["mouse_moves.y"], time:{start: 0, end: 10.5}} });
	//console.log("createComment: ", tagRelations);
	//console.log("tags: ", tags);
	var comment = new self.commentModel({souce_text:souce_text, display_text: display_text, selections:selections, tags: tags, tagRelations: tagRelations, codeBlocks:codeBlocks });
	comment.save(function (err) {
	  if (err) { console.error(err); }
	  //console.log('Comment Added', comment);
	  self.comments.push(comment);
	  self.emit("comment-changed");
	});
};

store.prototype.editComment= function(id, souce_text, display_text, links, tags, codeBlocks){
	//var tagName = "test" + Math.floor((Math.random() * 100) + 1);
	//var tag = new this.tagModel({ name: tagName, selection: { rows: [1], cols: ["mouse_moves.y"], time:{start: 0, end: 10.5}} });
	//var comment = new self.commentModel({souce_text:souce_text, display_text: display_text, links:links, tags: tags, codeBlocks:codeBlocks });
	//comment.save(function (err) {
	//  if (err) { console.error(err); }
	//  console.log('Comment Added', comment);
	//});
};

store.prototype.deleteComment= function(id){
	//var tagName = "test" + Math.floor((Math.random() * 100) + 1);
	//var tag = new this.tagModel({ name: tagName, selection: { rows: [1], cols: ["mouse_moves.y"], time:{start: 0, end: 10.5}} });
	//var comment = new self.commentModel({souce_text:souce_text, display_text: display_text, links:links, tags: tags, codeBlocks:codeBlocks });
	//comment.save(function (err) {
	//  if (err) { console.error(err); }
	//  console.log('Comment Added', comment);
	//});
};


store.prototype.findComments= function(id, selection, tag){
	//var tagName = "test" + Math.floor((Math.random() * 100) + 1);
	//var tag = new this.tagModel({ name: tagName, selection: { rows: [1], cols: ["mouse_moves.y"], time:{start: 0, end: 10.5}} });
	//var comment = new self.commentModel({souce_text:souce_text, display_text: display_text, links:links, tags: tags, codeBlocks:codeBlocks });
	//comment.save(function (err) {
	//  if (err) { console.error(err); }
	//  console.log('Comment Added', comment);
	//});
};

store.prototype.loadComments = function(){
	self.comments = [];
	self.commentModel.find(function (err, comments) {
	  if (err) return console.error(err);
	  async.each(comments, function(comment){
	  	self.comments.push(comment);	
	  }, function(err){
	  	if(err){ console.error(err); }
	  	self.emit("comment-changed");
	  });
	  
	  
	});

};

store.prototype.loadData= function(done){

	if(this.cfg.db.current == "tingo"){
  		require('tungus');  
	}

	this.mongoose = require('mongoose');
	var dbString = (this.cfg.db.current == "tingo") ? 'tingodb://'+this.datasetPath+'/'+this.cfg.db.tingo.path 
                                           : 'mongodb://'+ this.cfg.db.mongo.host +'/'+this.cfg.db.mongo.db; 

	var schemaData = require(path.join(this.datasetPath, this.cfg["schema"]))(this.mongoose);
	var tagSchemaData = require("./tag_schema.js")(this.mongoose);

	//this.tagModel = tagSchemaData.tag;
    //this.tagLinkModel = tagSchemaData.link;
    this.commentModel = tagSchemaData.comment;

    this.loadTags();
    this.loadComments();

	var Record = schemaData.model;
	var RecordSchema = schemaData.schema;
	this.Record = Record;
	 
	//console.log(RecordSchema);
	//console.log(Record.fieldMeta());


	this.mongoose.connect(dbString, function (err) {
	  // if we failed to connect, abort
	  if (err) throw err;

	  // we connected ok
	  console.log("Connected to mongodb! ", dbString);
	  
	 
	  Record.find().exec(function (err, records) {
	  	  
		  if (err) return console.error(err);
		  //console.log("self.totalRecords: ",records.length);
		  //self.maxTime = records[0].time;
		  self.totalRecords = records.length;
      	  //console.log("self.maxTime: ", self.maxTime);
		  
		  
		self.createNDArray(Record, records, function(){
		  	self.mongoLoadRecords(Record, records, function(){
			  	self.createStats(Record, records, function(){
			  		self.createTextVectors(Record, records, function(){
			  			self.mongoose.disconnect();
			  			done();	
			  		});
			  	});

			  	
		  	});
		});
		  
		  
		 
	  })
	});
	
	
};
store.prototype.mongoLoadRecords= function(Record, records, done){
	// setup columns
	try{
		var columns = Record.fieldMeta();

		this.columns.push({ 'id': "similarity", //An unique identifier for each column in the model, allowing to set more than one column reading the same field.
							'name': "Similarity", // The name to be displayed in the view. 
				            'field': "similarity", // The field name used in the data row objects.
			           		//Optional:
			                'sortable': true,
			            	'resizable': true,
			            	'width': 50,
			            	'headerCssClass': "similarity_columnHeader"
				            });
		
		var css = [];
		for(var i=0; i < columns.length; i++){

			var id = columns[i].id; //An unique identifier for each column in the model, allowing to set more than one column reading the same field.
			var name = columns[i].name; // The name to be displayed in the view. 
			this.columnsMeta[id] = columns[i];

			var  cData = {  'id': id, //An unique identifier for each column in the model, allowing to set more than one column reading the same field.
							'name': name, // The name to be displayed in the view. 
			                'field': id, // The field name used in the data row objects.
			                //Optional:
			                'sortable': true,
			            	'resizable': true,
			            	'width': 100
			};

			if(columns[i]["color"]){
				cData["headerCssClass"] = "columnHeader_"+i;
				css.push(".columnHeader_"+i+" {color: "+ columns[i]["color"] +"}");
				this.featureColors[id] = columns[i]["color"];
			}

			this.columns.push(cData);
		}

		

		var jCss = "<style>" + css.join("\n")+"</style>";
		$("head").append(jCss);

		
		this.colIndexToNameMap = this.columns.map(function(x) {return x.id; });
		this.colNameToIndex = {};
		for(var i=0; i < this.columns.length; i++){
			this.colNameToIndex[this.columns[i].id] = i; 
		}
		

		//console.log("mongoLoadRecords ",this.columns);
		
		for(var i=0; i < records.length; i++){
			var node = {};
			
			//node["index"] = i;
			node["similarity"] = 0;

			self.dbRecords[records[i].id] = records[i];

			for(var j=0; j < columns.length; j++){
				//var feature_name = (columns[j].length > 2) ? columns[j][4]["name"] : "";
				var id = columns[j].id;
				node[id] = records[i][id];
			}
			//console.log(node);
			self.records.push(node);  	
		}
		
		//console.log("mongoLoadRecords ", self.records[0]);
		done();
	}catch(err){
		console.error(err);
		done();
	}
};

store.prototype.saveRecord = function(record){
	this.collection.insert(record, function(err, result){
		//console.log("saveRecord: ", err, result);
	});
};

store.prototype.dateAdd = function(date, interval, units) {
  var ret = new Date(date); //don't change original date
  switch(interval.toLowerCase()) {
    case 'year'   :  ret.setFullYear(ret.getFullYear() + units);  break;
    case 'quarter':  ret.setMonth(ret.getMonth() + 3*units);  break;
    case 'month'  :  ret.setMonth(ret.getMonth() + units);  break;
    case 'week'   :  ret.setDate(ret.getDate() + 7*units);  break;
    case 'day'    :  ret.setDate(ret.getDate() + units);  break;
    case 'hour'   :  ret.setTime(ret.getTime() + units*3600000);  break;
    case 'minute' :  ret.setTime(ret.getTime() + units*60000);  break;
    case 'second' :  ret.setTime(ret.getTime() + units*1000);  break;
    default       :  ret = undefined;  break;
  }
  return ret;
}



module.exports = exports = new store(); 