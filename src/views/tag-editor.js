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
var async = requireNode('async');
var WordPOS = requireNode('wordpos'),
    wordpos = new WordPOS();
var natural = WordPOS.natural;

var sk = requireNode("statkit");
var _ = requireNode("underscore");

var RelationshipGraph = require("./relationship_graph.js");
var Timeline = require("./simple-timeline.js");

var pstyle = 'border: 1px solid #dfdfdf; padding: 0px;';


var self;
function TagEditor() {
	this.msnry = null;
	this.tagMenu = null;
	this.linkMenu = null;
	this.clickedSelection = null;
	this.dataStore = null;
	this.tagSelections = {};
	this.relationship_graph = new RelationshipGraph();
	this.timeline = new Timeline({brushing: false, name: "selection-timeline", mode: "small"});
	this.currentTags = [];
	this.timeFormat = d3.time.format("%H:%M:%S.%L");
	this.start_date = new Date();

	self = this;
}


var format = d3.time.format("%Y-%m-%d");

var css  = ['<style>',
			'button.btn { margin: 0px;}',
			'#tag-editor-container .item { width: 400px; height: 400px; margin: 5px; padding: 5px;', 
				'background-color: #ece7f2;',
				'border: 1px solid #333; border-radius: 5px; }',
			'.dropdown-menu {z-index: -100;}',
			//'#tag-div { width: 600px;}',
			'#comment-div { width: 400px; height: 200px;}',
			'#tag-relationships-outer { width: 400px; height: 200px;}',
			'.ui-resizable-helper { border: 1px dotted gray; }',
			'.tag_button { margin: 3px; }',
			'#text_editor { position: absolute;  top: 3px; right: 3px; bottom: 35px;  left: 3px; font-family:monospace!important;}',
			'#add_comment_button { position: absolute;  bottom: 5px;  left: 3;}',
			'#comments-div { height: 400px;}',
			'#comments-div-content { overflow: auto; position: absolute;  top: 40px; right: 0; bottom: 3px;  left: 0;}',
			'#comment-list{ list-style-type: none; margin: 0; padding: 0;}',
			'#comment-list li{ border-top: 1px dashed #333; padding: 3px; line-height: 190%;}',
			'.comment-tag:hover { background:#0095dd; color: white; }',
			'.comment-tag { line-height: 140%; display: inline-block; color: #0095dd; font-weight: normal;  cursor: pointer; background-color:#f4f7f8; margin-bottom: 1px; padding: 0px; padding-left: 0px; padding-right: 5px; border-radius:3px; border: #0095dd 1px solid; }',
			'.auto-tag { color: #666; border: #ccc 1px dashed; }',
			'progress.tag { vertical-align: middle; margin-bottom: 1px; -webkit-appearance: none; width: 15px; height: 5px; border: none; background: #EEE; border-radius: 3px; box-shadow: 0 2px 3px rgba(0,0,0,0.2) inset; -webkit-transform: rotate(270deg);}',
			'progress.tag::-webkit-progress-bar { background: #EEE; box-shadow: 0 2px 3px rgba(0,0,0,0.2) inset; border-radius: 3px;}',
			'progress.tag::-webkit-progress-value { background: #0095dd; border-radius: 3px;}',
			'progress.auto-tag::-webkit-progress-value { background: #999;}',
			'.comment-tag:hover progress.tag::-webkit-progress-bar { background: #0095dd; }',
			'.comment-tag:hover progress.tag::-webkit-progress-value { background: #EEE; }',
			'.tag-relation { color: #0095dd; }',
			'.comment-link { line-height: 140%; display: inline-block; font-weight: regular; color: #72ac35; cursor: pointer; background-color: rgb(238, 252, 223); border-radius: 3px; padding: 0px; padding-left: 3px; padding-right: 3px;  border: #72ac35 1px solid; }',
			'.comment-link:hover { background:#72ac35; color: white; }',
			'.comment-buttons {margin: 3px;}',
			'#tag-relationships { overflow: auto; position: absolute; top: 40px; left: 10px; bottom: 3px; right: 3px; }',
			'#tag-relationships svg{ overflow: auto; }',
			'#search_comments {position: absolute; top: 3px; right: 3px; width: 200px; }',
			'#search_tags {position: absolute; top: 3px; right: 3px; width: 200px; }',
			'#search_rels {position: absolute; top: 3px; right: 3px; width: 200px; }',
			'#tag-div { height: 300px;}',
			'#tag-div-content { margin-top: 10px; line-height: 30px; overflow: auto;}',
			'hr { border: 0; border-bottom: 1px dashed black;  background:none; margin: 0px; padding-top: 1px;}',
			'h5.suggestion { border-bottom: 1px dashed black; }',
			'.item_header { border-bottom: 1px solid black; padding-bottom: 12px; }',
			'</style>'].join("\n");

var html = ['<div id="tag-editor-container">',
  			'<div class="item" id="selection-div">',
  				'<div class="item_header"><b>Selection</b></div>',
  				'<div>Rows: <span id="row_selection"></span></div>',
  				'<div>Columns: <span id="col_selection"></span></div>',
  				'<div>Time: <span id="time_selection"></span></div>',
  				'<div>Comments: <span id="comment_selection"></span></div>',
  				'<div>Tags: <span id="comment_selection"></span></div>',
  				'<div class="btn-group"><button id="clear_selection_button" type="button" class="btn btn-default btn-xs">Clear</button>',
  				'<button id="add_filter_button" type="button" class="btn btn-default btn-xs">Filter</button>',
				'<button  id="update_similarity_button" type="button" class="btn btn-default btn-xs">Similarity</button>',
				'</div>',
				'<div id="selection_timeline_div" style="width: 150px; height: 50px; margin-bottom: 3px; margin-top: 3px;"></div>',
				'<hr>',
				'<div class="item_header"><b>Filter</b></div>',
  				'<div>Rows: <span id="row_filter"></span></div>',
  				'<div>Columns: <span id="col_filgter"></span></div>',
  				'<div>Comments: <span id="commnents_filter"></span></div>',
  				'<div>Tags: <span id="tags_filter"></span></div>',
  				'<button id="clear_filter_button" type="button" class="btn btn-default btn-xs">Clear</button>',
  			'</div>',
  			'<div class="item" id="comment-div">',
  				'<div id="text_editor"><br/><br/><br/><br/></div>',
  				'<button id="add_comment_button" type="button" class="btn btn-default btn-xs">Save Comment</button>',
  			'</div>',
  			'<div class="item" id="suggestions-div"><div  class="item_header"><b>Suggestions</b></div>',
 			'<div id="suggestions-div-content"></div>',
  			'</div>',
 			'<div class="item" id="comments-div"><div class="item_header"><b>Comments</b> <i id="comment-refresh" class="fa fa-refresh fa-2"></i>',
 			'<input id="search_comments" type="search" class="form-control" placeholder="Search">',
		    '</div>',
  			'<div id="comments-div-content"><ul id="comment-list"></ul></div>',
 			'</div>',
 			'<div class="item" id="tag-div"><div class="item_header"><b>Tags</b></div>',
 			'<input id="search_tags" type="search" class="form-control" placeholder="Search">',
 			'<div id="tag-div-content"></div>',
 			'</div>',
 			'<div class="item" id="tag-relationships-outer"><div class="item_header"><b>Relationships</b>',
 			'<input id="search_rels" type="search" class="form-control" placeholder="Search">',
 			'</div><div id="tag-relationships"></div>',
 			'</div>',
			'</div>'].join("\n");


TagEditor.prototype.onSelectionChanged = function(event){
	//console.log("onSelectionChanged", event);
	//if(event.source)
	try{


		//console.log("TagEditor.onSelectionChanged: source: ", event.source);
		var text = "from: "+event.source+" ";
		//console.log("TagEditor.onSelectionChanged: ", event.data);
		//text += JSON.stringify(event.data);
		//event.data.rows.forEach(function (row){
		//console.log("TagEditor.onSelectionChanged: ", row);
		//text += row + ", ";
		//});
		//$("#tag_div").text(text);
		var time = "";
		var timeRounded = event.data.time; //.map(function(t){ return d3.round(t, 2); });
		if(event.data.time && event.data.time.length > 0){
			//self.dataStore
			var t1 = self.dataStore.dateAdd(self.start_date, "second", event.data.time[0]); 
			var t2 = self.dataStore.dateAdd(self.start_date, "second", event.data.time[1]); 

			time = self.timeFormat(t1) + " to " +  self.timeFormat(t2); 
		}

		$("#row_selection").text(JSON.stringify(event.data.rows));
		$("#col_selection").text(JSON.stringify(event.data.cols));
		$("#time_selection").text(time);


		var selectionURL = "row="+JSON.stringify(event.data.rows)+"&col="+JSON.stringify(event.data.cols)+"&time="+JSON.stringify(timeRounded);

		

		//var row = (self.editor.selection !== undefined && self.editor.selection.lead !== undefined && self.editor.selection.lead.row !== undefined) ? self.editor.selection.lead.row : 0;
		var newText = "@"+selectionURL;
		//self.editor.session.replace(new Range(0, 0, 0, Number.MAX_VALUE), newText)
		

		//self.editor.insert("@"+selectionURL);
		var cursor = self.editor.getSelection().getCursor();

		//var s = self.editor.getSession().getTextRange(self.editor.getSelectionRange());
		
		//console.log("TagEditor.onSelectionChanged: ", cursor.row);

		var aceRange = ace.require("ace/range").Range;
		var range = new aceRange(cursor.row, 0, cursor.row, Number.MAX_VALUE);
		//var range2 = new ace.Range(0, 0, 0, Number.MAX_VALUE);
		//self.addSelectionMarker(range);
		//console.log("TagEditor.onSelectionChanged: ", Range);
		//console.log("TagEditor.onSelectionChanged: ", range2);
		//console.log("TagEditor.onSelectionChanged: ", range, s);
		

		
		self.editor.getSession().replace(range, newText);
	}catch(err){
		console.error(err);
	}
};



TagEditor.prototype.update = function(){
	this.msnry.layout();
	this.editor.resize();
}

TagEditor.prototype.selectByTag = function(){
	//var selection = self.tagSelections[self.currentTagID];
	//console.log("Tag Selection clicked", self.currentTagID,selection);

	//self.dataStore.changeSelection("tag-editor", "all", selection);
}

TagEditor.prototype.selectBySelection = function(){
	var selection = self.clickedSelection;
	console.log("Tag Selection clicked",selection);

	self.dataStore.changeSelection("tag-editor", "all", selection);
}



TagEditor.prototype.updateSimilariytBySelection = function(){
	
	
	
	var sel = self.dataStore.currentSelection; //self.clickedSelection;

	//console.log("Tag Similarity Clicked", sel);

	if(sel.rows.length > 1){
		alert("Sorry, currently we only support similarity to a single row");
		return;
	}
	if(sel.cols.length < 1){
		alert("Need to select at least one column.");
		return;
	}

	//var features = self.dataStore.featureIDFromColumnName( cols );

	var cols = sel.cols; 
	var recordIndex = sel.rows[0];
	var timeRange = (sel.time.start) ? [sel.time.start, sel.time.end] : sel.time;

	self.dataStore.updateSimilarity(recordIndex, cols, timeRange, function(err){
		if(err){console.error(err);}
		//self.dataStore.changeSelection("tag-editor", "none");
		console.log("similarity changed");
	});

};
TagEditor.prototype.processWords = function(words, results){
	var j;
	for(j=0; j < results.nouns.length; j++){
		var word = results.nouns[j].toLowerCase(); //natural.PorterStemmer.stem(results.nouns[j]); 
		if(!words[word]){
			words[word] = {name:word, wordtype: "noun"};
		}
	}
	for(j=0; j < results.verbs.length; j++){
		var word = results.verbs[j].toLowerCase(); //natural.PorterStemmer.stem(results.verbs[j]); 
		if(!words[word]){
			words[word] = {name:word, wordtype: "verb"};
		}
	}
	for(j=0; j < results.adjectives.length; j++){
		var word = results.adjectives[j].toLowerCase(); //natural.PorterStemmer.stem(results.adjectives[j]); 
		if(!words[word]){
			words[word] = {name:word, wordtype: "adjective"};
		}
	}
	for(j=0; j < results.adverbs.length; j++){
		var word = results.adverbs[j].toLowerCase(); //natural.PorterStemmer.stem(results.adverbs[j]); 
		if(!words[word]){
			words[word] = {name:word, wordtype: "adverb"};
		}
	}
	for(j=0; j < results.rest.length; j++){
		var word = results.rest[j].toLowerCase(); //natural.PorterStemmer.stem(results.rest[j]); 
		if(!words[word]){
			words[word] = {name:word, wordtype: "other"};
		}
	}
}

TagEditor.prototype.getAutoTags = function(rows, sims, done)
{
	var words = {};
	var lsims = {};
	var out = [];
	async.each(rows, function(recordIndex, rCallback){

		var sim = (sims[recordIndex]) ? sims[recordIndex] : 1.0;
		var cols = [];
		var textColumn;
		for(textColumn in self.dataStore.dataTextModels){
			cols.push(textColumn);
		}
		async.each(cols, function(col, cCallback){
			var cell =  self.dataStore.getCell(recordIndex, col);
			if(!cell || cell === undefined || cell.length < 1){
				cCallback();
			}else{
				wordpos.getPOS(cell, function(results){
					self.processWords(words, results);
					//console.log("words", words);
					var j;
					for(j in words){
						if(!lsims[j] || lsims[j] < sim){
							lsims[j] = sim;
						}
					}
					cCallback();
				});
			}
			
		}, function(err){
			if(err){ console.error(err); }
			rCallback();
		});

	}, function(err){
		if(err){ console.error(err); }

		//html.push("<hr>");
		var j;
		for(j in words){
			var word = words[j];
			word["similarity"] = lsims[j];
			//console.log("getAutoTags: ", word);
			out.push(word);
		//	var word = words[j];
		//	html.push('<span id="tag|'+word.name+'|1.0" class="comment-tag auto-tag '+word.type+'" title="'+word.name+'"><progress class="tag auto-tag" value="100" max="100"></progress>'+word.name+'</span>&nbsp;');
		}
		done(out);
	});

};


TagEditor.prototype.getTagsForRow = function(rowIndex, done){
	var out = [];

	self.dataStore.commentModel.find()
	   .where('selections.rows').in(rowIndex.toString()).exec(function (err, comments) {
	  if (err) { console.error(err); }

	  //console.log("getTagsForRow", comments);
	  
	  async.each(comments, function(comment, callback){
	  	for(var t=0; t <  comment.tags.length; t++){
	  		out.push({name: comment.tags[t].name, weight: comment.tags[t].weight } );		
	  	}
	  	callback();
	  }, function(err){
	  	if(err){ console.error(err); }
	  	//console.log("getTagsForRow tags: ", out);
	  	done(out);
	  	

	  });
	  
	  
	});
	/*
	var allLinks = self.dataStore.getNodesLinks();
	var allSelectionNodes = self.dataStore.getSelectionNodesA();
	var allCommentNodes = self.dataStore.getCommentNodesA();
	var allTagNodes = self.dataStore.getTagNodesA();
	var allCommentLinks = $.grep(allLinks, function( n ) { return n.type === "comment-selection"; });
	var allTagLinks = $.grep(allLinks, function( n ) { return n.type === "tag-comment"; });

	var selNodes = $.grep(allSelectionNodes, function( n) { return (n.selection.rows.indexOf(rowIndex) > -1); });
	var selNodesNames = selNodes.map(function(v){ return v.name; });

	

	var commentLinksToSelection = $.grep(allCommentLinks, function( n) { return (selNodesNames.indexOf(n.target) > -1); });
	var commentNames = commentLinksToSelection.map(function(v){ return v.source; });

	var tagCommentLinks = $.grep(allTagLinks, function( n) { return (commentNames.indexOf(n.target) > -1); });

	var tagNodes = $.grep(allTagNodes, function( n) { return (tagCommentLinks.indexOf(n.source) > -1); });

	console.log("getTagsForRow: ", rowIndex, tagNodes);
	return tagNodes;
	*/

};

TagEditor.prototype.getTagsForRows = function(rows, sims, done){
	var out = {};

	async.each(rows, function(recordIndex, rCallback){
		//console.log("getTagsForRows", recordIndex);
		var sim = (sims[recordIndex]) ? sims[recordIndex] : 1.0;
		self.getTagsForRow(recordIndex, function(results){

			for(var i=0; i < results.length; i++){
				if(!out[results[i].name]){
					out[results[i].name] = {name: results[i].name, weight: results[i].weight, similarity: sim };
				}
			}
			rCallback();

		});
		
		
		
	}, function(err){
		if(err){ console.error(err); }

		//html.push("<hr>");

		done(out);
	});

};

TagEditor.prototype.getTagCoOccurance = function(tags, done){
	var out = {};
	var mytags = tags.map(function(t){ return t.name; });
	//console.log("getTagCoOccurance mytags: ", mytags);

	async.each(mytags, function(tag, rCallback){
		self.dataStore.commentModel.find()
		   .where('tags.name').equals(tag).exec(function (err, comments) {
		  if (err) { console.error(err); }
		  //console.log("getTagCoOccurance comments", comments);
		  async.each(comments, function(comment, callback){
		  	//console.log("getTagCoOccurance comment", comment);
		  	for(var t=0; t <  comment.tags.length; t++){
		  		var thisTag = comment.tags[t];
		  		//console.log("getTagCoOccurance tag: ", thisTag);
		  		
		  		if(mytags.indexOf(thisTag.name) == -1){
		  			if(out[thisTag.name]){
		  				out[thisTag.name] += 1;	
		  			}else{
		  				out[thisTag.name] = 1;	
		  			}		  			
		  		}
		  				
		  	}
		  	callback();
		  }, function(err){
		  	if(err){ console.error(err); }
		  	//console.log("getTagsForRow tags: ", out);
		  	rCallback();
		  	

		  });
		  
		  
		});

		/*
		var sim = (sims[recordIndex]) ? sims[recordIndex] : 1.0;
		self.getTagsForRow(recordIndex, function(results){

			for(var i=0; i < results.length; i++){
				if(!out[results[i].name]){
					out[results[i].name] = {name: results[i].name, weight: results[i].weight, similarity: sim };
				}
			}
			rCallback();

		});
		
		*/
		
	}, function(err){
		if(err){ console.error(err); }
		//console.log("getTagCoOccurance tag: ", out);
		//html.push("<hr>");

		done(out);
	});

};
TagEditor.prototype.onTextEditorChanged = function(e)
{
	//console.log("onTextEditorChanged", e);
	var value = self.editor.getValue();
	self.currentTags = [];
	var hatshtag_pattern = /[#]{1}([*A-Za-z0-9-_\/\(\)]|([.](?=[0-9])))+/g; ///[#]{1}[A-Za-z0-9-_\/\(\).]+/g;
	value.replace(hatshtag_pattern, function(hashtag){
				var tag = self.getTagName(hashtag);
				for(i=0; i < tag.length; i++){
					self.currentTags.push(tag[i]);	
				}				
				return "";
	});
	//console.log(self.currentTags);
	self.updateSuggestions();
};

TagEditor.prototype.insertTag = function(name){
	self.editor.insert("#"+name+" ");

};

TagEditor.prototype.updateSuggestions = function(){
	$('#suggestions-div-content').html("");

	var similar_tags = self.currentTags; //self.dataStore.getTagNodes();
	var html = [];
	var count = 0, maxCount = 10;
	var sel = self.dataStore.currentSelection; //self.clickedSelection;
	var rows = sel.rows;
	var selecteCols = sel.cols;

	async.series([
		function(callback){
			// Get Local Tags
			// AutoTags only 
			html.push('<h5 class="suggestion">Local</h5>');
			self.getAutoTags(rows, {}, function(results){

				for(r in results){
					var word = results[r];
					html.push('<span id="s1tag|'+word.name+'" class="comment-tag auto-tag '+word.wordtype+'" title="'+word.name+'"><progress class="tag auto-tag" value="100" max="100"></progress>'+word.name+'</span>&nbsp;');
				}
				callback();
			});
			
		},
		function(callback){

			// Get Similar AutoTags
			html.push('<h5 class="suggestion">Similar</h5>');
			// Lets get x similar records
			self.dataStore.getSimilarRecords(rows[0], selecteCols, 10, function(err, results){
				//console.log("updateSuggestions: Similarity Results: ", results);
				if(results && results.length > 0){


					var i;
					var rows = [];
					var sims = {};
					for(i=0; i < results.length; i++){
						r = results[i];
						rows.push(r.id);
						sims[r.id] = r.similarity;
					}
					// Get Tags
					self.getTagsForRows(rows, sims, function(results3){
						//console.log("updateSuggestions: getTagsForRows: ", results3);
						for(r in results3){
							var tag = results3[r];
							similar_tags.push(tag);
							var weight = 100 * tag.similarity;
							html.push('<span id="s2tag|'+tag.name+'" class="comment-tag" title="Similarity: '+tag.similarity+'"><progress class="tag" value="'+weight+'" max="100"></progress>'+tag.name+'</span>&nbsp;');
						}

						// Get AutoTags
						self.getAutoTags(rows, sims, function(results2){
							//console.log("updateSuggestions: getAutoTags: ", results2);
							for(r in results2){
								var word = results2[r];
								var weight = 100 * word.similarity;
								html.push('<span id="s3tag|'+word.name+'" class="comment-tag auto-tag '+word.wordtype+'" title="Similarity: '+word.similarity+'"><progress class="tag auto-tag" value="'+weight+'" max="100"></progress>'+word.name+'</span>&nbsp;');
							}

							callback();
						});

						
					});
					

				}else{
					callback();
				}

				

			});
			
			/*
			for(t in tags){
				if(count  < maxCount){
					var tag = tags[t];
					//console.log("Tag: ", tag);
					html.push('<span id="tag|'+tag.label+'|1.0" class="comment-tag" title="'+tag.label+'"><progress class="tag" value="100" max="100"></progress>'+tag.label+'</span>&nbsp;');
				}
				count++;			
			}*/
			//callback();

		},
		function(callback){
			html.push('<h5 class="suggestion">Co-Occurrences</h5>');
			//console.log("Co-Occurrences", similar_tags);
			self.getTagCoOccurance(similar_tags, function(results){
				var maxCount = 0;
				for(r in results){
					maxCount = (maxCount > results[r]) ? maxCount : results[r];
				}
				for(r in results){
					var tag = r;
					var weight = 100 * (results[r]/maxCount);
					html.push('<span id="s3tag|'+r+'" class="comment-tag" title="Count: '+results[r]+'"><progress class="tag" value="'+weight+'" max="100"></progress>'+r+'</span>&nbsp;');
				}
				callback();
			});
			// Get tags from current comment and find co-occurances
			// Get all existing tags
			//for(t in tags){
			//	if(count  < maxCount){
			//		var tag = tags[t];
			//		//console.log("Tag: ", tag);
			//		html.push('<span id="tag|'+tag.label+'|1.0" class="comment-tag" title="'+tag.label+'"><progress class="tag" value="100" max="100"></progress>'+tag.label+'</span>&nbsp;');
			//	}
			//	count++;			
			//}
			

		}
	],
	function(err, results){
	    // results is now equal to ['one', 'two']
	    //console.log("updateSuggestions: got to the end");
	    var t = html.join("\n");
		$('#suggestions-div-content').html(t);

		$("#suggestions-div-content .comment-tag").click(function(e){
				//console.log("suggestion tag clicked", e.currentTarget.id);
				self.insertTag(e.currentTarget.innerText);
		});
	});
};

TagEditor.prototype.populateTags  = function(){
	$('#tag-div-content').html("");
	var tags = self.dataStore.getTagNodes();
	var html = [];
	for(t in tags){
		var tag = tags[t];
		//console.log("Tag: ", tag);
		html.push('<span id="tag|'+tag.label+'|1.0" class="comment-tag" title="'+tag.label+'"><progress class="tag" value="100" max="100"></progress>'+tag.label+'</span>&nbsp;');
							
	}
	var t = html.join("\n");
	$('#tag-div-content').html(t);
}

TagEditor.prototype.getTagName = function(str){
	var weightPattern = /[\(]{1}[0-9.]*[\)]{1}/;	
	var tags = (str.indexOf("/") != -1) ? str.replace("#","").split("/") : [str.replace("#","")];
	
	tags = tags.map(function (t) {
		var name = t.replace("#","");
		var weight = 1.0;

		name = name.replace(weightPattern, function(w){
			weight = Number(w.slice(1, -1));
			return "";
		});	
		return {name: name, weight: weight};
	});
	return tags;	
};

TagEditor.prototype.getCode = function(str){
	return str.replace(/'{3}/g,"");
};

TagEditor.prototype.getSelectionFromLink = function(str){
	var selection = {rows:[], cols: [], time:[]};
	var s = str.replace("@","");
	var params = s.split("&");
	//console.log("getSelectionFromLink 1 ", selection);

	for(var i=0; i < params.length; i++){
		var p = params[i];
		if(p.indexOf("row") != -1){
			var valueS = p.replace("row=", "");
			var row = JSON.parse(valueS);
			//eval("var "+p+";");
			//console.log(row);
			for(var k=0; k < row.length; k++){
				selection.rows.push(row[k]);	
			}
			// = _.clone(row);

		}else if(p.indexOf("col") != -1){
			eval("var "+p);
			selection.cols = col;
		}else if(p.indexOf("time") != -1){
			//console.log("TagEditor.getSelectionFromLink: ", p);
			eval("var "+p);
			selection.time = time;
		}else {
			//console.log("TagEditor.getSelectionFromLink: failed to parse a link");
			return selection;
		}
	}
	//console.log("getSelectionFromLink 2 ", selection);
	return selection;
};

TagEditor.prototype.api_plot = function(link, options){
	var width = options.width;
	var height = options.height;
	var selection = self.getSelectionFromLink(link);
	self.timeline.changeGraph(selection, width, height);
	var content = $("#selection_timeline_div").html();
	//var outputString += '<img src="img/test-graph.png" style="width:'+width+'px; height: '+height+'px;" />'
	//console.log("api_plot: ", content);
	return content;
};

TagEditor.prototype.evaluate = function(codeBlock){
	var outputString = "";
	var c8 = {
	getColumnNames: function(link){
		var selection = self.getSelectionFromLink(link);

		return selection.cols.map(function(n){ return n.split(".")[0]; });
	},
	getColumnData: function(link){
		var selection = self.getSelectionFromLink(link);
		//var columns = self.dataStore.cfg["schema-display"];
		//console.log("getColumnData",columns);
		var data = [];
		for(var i=0; i < selection.cols.length; i++){
			var col = selection.cols[i];
			//var p = columns[col]["path"];
			var cData = self.dataStore.columnVecs[col];
			data.push(cData);
		}
		//console.log("getColumnData: ", data);
		return data;
	},
	plot: function(link, options){
		
		outputString += self.api_plot(link, options);
		//console.log("plot: ",options);
		//var width = options.width;
		//var height = options.height;
		//outputString += '<img src="img/test-graph.png" style="width:'+width+'px; height: '+height+'px;" />'
		//outputString += "---- ploted " + " selection here " + '<br/>';
	},
	corr: function(a, b){
		//outputString += "----- hist " + " selection here " + '<br/>';
		var c = sk.corr(a, b);
		//console.log("corr: ", a, b, c)
		return c;
	},
	mean: function(a){
		//outputString += "----- hist " + " selection here " + '<br/>';
		return sk.mean(a);
	},
	std: function(a){
		//outputString += "----- hist " + " selection here " + '<br/>';
		return sk.std(a);
	},
	print: function(value){
		//outputString += "----- hist " + " selection here " + '<br/>';
		outputString += value + "<br/>";
	}};

	eval(codeBlock);
	return outputString;
};

TagEditor.prototype.addComment = function(){
	try{
		var comment_value = self.editor.getValue();
		//var usernames = twttr.txt.extractMentions("Mentioning @twitter and @jack")
		var hatshtag_pattern = /[#]{1}([*A-Za-z0-9-_\/\(\)]|([.](?=[0-9])))+/g; ///[#]{1}[A-Za-z0-9-_\/\(\).]+/g;
		var link_pattern = /[@]{1}[A-Za-z0-9-_:%&~\?\/.=,\[\]\>\<\"]+/g;
		var codepattern = /'{3}[\s\S]*?'{3}/g;  
		
		//var hashtags = comment_value.match(hatshtag_pattern);
		//var links = comment_value.match(link_pattern);
		//var codeBlocks = comment_value.match(codepattern);

		var display_comment = comment_value;
		var tags = [];
		var tagRelations = [];
		var links = [];
		var codeBlocks = [];
	
		display_comment = display_comment.replace(codepattern, function(code){
			var codetext = self.getCode(code);

			var output = self.evaluate(codetext);
			codeBlocks.push(codetext);
			//console.log("code: ", codetext);
			return '<div class="code-output">'+ output +'</div>';
		});		


		display_comment = display_comment.replace(hatshtag_pattern, function(hashtag){
				var tag = self.getTagName(hashtag);
				var html = "";
				if(tag.length > 1){
					html += "&nbsp;";
					for(var i=0; i < tag.length; i++){
						tags.push(tag[i]);
						var weight = 100*Number(tag[i].weight);
						if((i+1) < tag.length){
							var from = tag[i].name;
							var to = tag[i+1].name;
							tagRelations.push({from:from, to: to, type: "parent"});
							html += '<span id="tag|'+tag[i].name+'|'+tag[i].weight+'" class="comment-tag" title="weight: '+tag[i].weight+'"><progress class="tag" value="'+weight+'" max="100"></progress>'+tag[i].name+'</span>';
							html += '<span class="tag-relation">&#9658;</span>';
						}else{
							html += '<span id="tag|'+tag[i].name+'|'+tag[i].weight+'" class="comment-tag" title="weight: '+tag[i].weight+'"><progress class="tag" value="'+weight+'" max="100"></progress>'+tag[i].name+'</span>';
						}
												
					}
					html += "&nbsp;";
				}else if(tag.length == 1){
					tags.push(tag[0]);	
					var weight = 100*Number(tag[0].weight);
					html += '&nbsp;<span id="tag|'+tag[0].name+'|'+tag[0].weight+'" class="comment-tag" title="weight: '+tag[0].weight+'"><progress  class="tag" value="'+weight+'" max="100"></progress>'+tag[0].name+'</span>&nbsp;';	
				}
				
				
				//console.log("hashtag: ", tagName);
				return html;
		});

	
		display_comment = display_comment.replace(link_pattern, function(link){
			var selection = self.getSelectionFromLink(link);
			links.push(selection);
			//console.log("link: ", selection);
			return '<span class="comment-link">'+link+'</span>';
		});

		display_comment = display_comment.replace(/[\r]/g,"<br/>");
		
		self.dataStore.createComment(comment_value, display_comment, links, tags, tagRelations, codeBlocks);
		//console.log("code: ", tags, tagRelations, links);
		self.editor.setValue("");
	}catch(err){
		console.error(err);
	}
};
TagEditor.prototype.onCommentsChanged = function(){
	var container = $("#comment-list");
	container.html('');
	async.each(self.dataStore.comments, function(comment, callback){
		var html = ["<li><div>",
					comment.display_text,
		           '</div><div class="btn-group comment-buttons">',
				   '  <button id="edit-btn_'+comment._id+'" type="button" class="btn btn-default edit_button">Edit</button>',
				   '  <button id="edit-btn_'+comment._id+'" type="button" class="btn btn-default delete_button">Delete</button>',
				   '</div></li>'].join("\n");

		container.prepend(html);
		callback();
	}, function(err){
		if(err){console.error(err);}
		

		//console.log("onCommentsChanged");
		if(self.relationship_graph.inited){
			self.relationship_graph.update();	
		}		

		$(".comment-tag").click(function(e){
			self.currentTagID = e.currentTarget.id;
			self.tagMenu.popup(e.clientX, e.clientY);
		});
		$(".comment-link").click(function(e){
			//console.log("link clicked",e.currentTarget, e.currentTarget.innerText);
			
			self.clickedSelection = self.getSelectionFromLink(e.currentTarget.innerText);
			self.linkMenu.popup(e.clientX, e.clientY);
			//self.currentTagID = e.currentTarget.value;
			//self.menu.popup(e.clientX, e.clientY);
		});

		$(".edit_button").click(function(e){
			//console.log("edit_button clicked",e.currentTarget.id);
			//self.linkMenu.popup(e.clientX, e.clientY);
			//self.currentTagID = e.currentTarget.value;
			//self.menu.popup(e.clientX, e.clientY);
		});


		$(".delete_button").click(function(e){
			//console.log("delete_button clicked",e.currentTarget.id);
			//self.linkMenu.popup(e.clientX, e.clientY);
			//self.currentTagID = e.currentTarget.value;
			//self.menu.popup(e.clientX, e.clientY);
		});

		$("#update_similarity_button").click(function(e){
			//console.log("delete_button clicked",e.currentTarget.id);
			self.clickedSelection = self.dataStore.currentSelection;
			self.updateSimilariytBySelection();
			//self.linkMenu.popup(e.clientX, e.clientY);
			//self.currentTagID = e.currentTarget.value;
			//self.menu.popup(e.clientX, e.clientY);
		});

		self.populateTags();

		//container.append("");
	});
}

TagEditor.prototype.applyFilter = function(type){
	var selection = self.clickedSelection;
	console.log("applyFilter ", selection);
	if(type === "rows"){
		var myFilter = function(item, args) {
		  console.log(selection, item,args);
		  if (selection.rows.indexOf(item["id"]) > -1) {
		    return true;
		  }
		  return false;
		}

		self.dataStore.dataView.setFilter(myFilter);
		self.dataStore.dataView.endUpdate();
	}
	//console.log("Tag Selection clicked",selection);
}

TagEditor.prototype.init = function(dataStore, parentDiv, datasetPath, resources, done){
		this.dataStore = dataStore;
		//console.log("tag-editor init", parentDiv, datasetPath, resources);
		//console.trace();
		try{
			//w2ui[parentLayout].content(parentPanel, html);
			this.tagMenu = new gui.Menu();
			this.linkMenu = new gui.Menu();

			this.tagMenu.append(new gui.MenuItem({label: "Select Rows", click: function(e) {
											    	//self.selectBySelection();
											    	//console.log("Select", self.clickedSelection);
											  	}}));
			this.tagMenu.append(new gui.MenuItem({label: "Select Columns", click: function(e) {
											    	//self.selectBySelection();
											    	//console.log("Select", self.clickedSelection);
											  	}}));
			this.tagMenu.append(new gui.MenuItem({ type: 'separator' }));

			this.tagMenu.append(new gui.MenuItem({label: "Filter Rows", click: function() {
											    	//self.selectByTag();
											    	self.applyFilter("rows");
											  	}}));
			this.tagMenu.append(new gui.MenuItem({label: "Filter Columns", click: function() {
											    	//self.selectByTag();
											  	}}));		
			this.tagMenu.append(new gui.MenuItem({label: "Filter Comments", click: function() {
											    	//self.selectByTag();
											  	}}));		
			this.tagMenu.append(new gui.MenuItem({ label: 'Filter Relationships', click: function() {
											    	
											  	}}));
			//this.menu.append(new gui.MenuItem({ label: 'Show related Tags' }));
			//this.menu.append(new gui.MenuItem({ type: 'separator' }));
			//this.menu.append(new gui.MenuItem({ label: 'Delete' }));

			this.linkMenu.append(new gui.MenuItem({label: "Select", click: function(e) {
											    	self.selectBySelection();
											    	//console.log("Select", self.clickedSelection);
											  	}}));
			this.linkMenu.append(new gui.MenuItem({ type: 'separator' }));

			this.linkMenu.append(new gui.MenuItem({ label: 'Filter Rows', click: function() {
											    	
											  	}}));
			
			this.linkMenu.append(new gui.MenuItem({ label: 'Filter Columns', click: function() {
											    	
											  	}}));
			this.linkMenu.append(new gui.MenuItem({ label: 'Filter Comments', click: function() {
											    	
											  	}}));
			this.linkMenu.append(new gui.MenuItem({ label: 'Filter Tags', click: function() {
											    	
											  	}}));
			this.linkMenu.append(new gui.MenuItem({ label: 'Filter Relationships', click: function() {
											    	
											  	}}));

			this.linkMenu.append(new gui.MenuItem({ type: 'separator' }));

			this.linkMenu.append(new gui.MenuItem({ label: 'Update Similarity', click: function() {
											    	self.updateSimilariytBySelection();
											  	}}));
			//this.linkMenu.append(new gui.MenuItem({ label: 'Update Similarity to this Selection (ignore Time Selection)', click: function() {
			//								    	self.updateSimilariytBySelection();
			//								  	}}));
			
			

			this.start_date = new Date(this.dataStore.cfg["default_start_time"]);

			dataStore.on("selection-changed", this.onSelectionChanged);
			dataStore.on("comment-changed", this.onCommentsChanged);

			$('head').append(css);
			$(parentDiv).html(html);
		
			$("#addTagInput").blur(function() {
			  $("#addTagInput").val("");
			});
			

			$( "#clear_selection_button").click(function(e){
				alert("Method not implemented yet");
			});
			$( "#clear_filter_button").click(function(e){
				alert("Method not implemented yet");
			});
			$( "#add_filter_button").click(function(e){
				alert("Method not implemented yet");
			});
			
			$( "#add_comment_button").click(function(e){

				self.addComment();

				
			   //self.addTag($( "#addTagInput" ).val(), self.dataStore.currentSelection);
			   //$("#addTagInput").val("");
			   //$("#addTagInput").blur();
			});


			
			this.msnry = new Masonry( '#tag-editor-container', {
  			  itemSelector: '.item'
  			  //gutter: 0
  			  //columnWidth: 5,
			});
			this.msnry.layout();
			this.msnry.bindResize();

			//var $container = $('#tag-editor-container').packery();
			
			var $itemElems = $('#tag-editor-container').find('.item');
			//$itemElems.draggable();
			//self.msnry.bindUIDraggableEvents( $itemElems );
			$itemElems.resizable({helper: "ui-resizable-helper", stop: function(event, ui) {
        									//console.log("resize: ", ui.element.attr("id"));
        									if( ui.element.attr("id") === "tag-relationships-outer"){
        										//console.log("tag-relationships-outer resized");
        										self.relationship_graph.update();
        									}
        									self.update();
        									//self.msnry.fit( ui.element);
									  }});
			

			this.editor = ace.edit("text_editor");
			this.editor.setShowPrintMargin(false);
			this.editor.getSession().setOption("useWorker", false);
			this.editor.getSession().setUseWrapMode(true);

			this.editor.getSession().on('change', self.onTextEditorChanged);

    		//editor.setTheme("ace/theme/down");
    		this.editor.getSession().setMode("ace/mode/javascript");

    		this.onCommentsChanged();

    		this.relationship_graph.init(this.dataStore, "#tag-relationships");

    		this.populateTags();

    		this.timeline.init(dataStore, "#selection_timeline_div", function(err){
				if(err){ console.error("selection_timeline_div.init Error: ",err); }
			});	
    		
			done();
		}catch(err){
			if(err) { console.error(err); }
			done(err);
		}
};


module.exports = TagEditor;
