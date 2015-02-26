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

var async = requireNode('async');

//var mypath = require('path');
var self = null;
function grid() {
	 this.name = "grid";
	 this.menu = null;
	 this.columns = null;
	 this.searches = null;
	 this.records = null;
	 this.groupping = [];
	 this.grid = null;
	 //this.columnpicker = null;
	 this.dataStore = null;
	 self = this;
}

   
grid.prototype.myFilter = function (item, args) {
    //console.log('myFilter',item, args);
      if(args.hideInvalid){
      	return true;	
      }else{
      	return false;
      }
      
};
grid.prototype.upadate = function(){
	if(this.grid){
		this.grid.invalidate();
		this.grid.resizeCanvas();
    	this.grid.render();
	}
}

grid.prototype.avgTotalsFormatter = function(totals, columnDef) {
  var val = totals.avg && totals.avg[columnDef.field];
  if (val != null) {
    return "avg: " + Math.round(val) + "%";
  }
  return "";
}

grid.prototype.sumTotalsFormatter = function(totals, columnDef) {
  var val = totals.sum && totals.sum[columnDef.field];
  if (val != null) {
    return "total: " + ((Math.round(parseFloat(val)*100)/100));
  }
  return "";
}

grid.prototype.groupBy = function(column){
    var data = {
	    getter: column.id,
	    formatter: function (g) {
	      //console.log(g);
	      return column.id+":  " + g.value + "  <span style='color:green'>(" + g.count + " items)</span>";
	    },
	    aggregators: [
			//new Slick.Data.Aggregators.Avg(column.id)
	    ],
	    aggregateCollapsed: false,
	    collapsed: true,
      	lazyTotalsCalculation: true
   	};
   	//for(var k=0; k < answerKeys.length; ++k){
    //	data['aggregators'].push(new Slick.Data.Aggregators.Avg(answerKeys[k]));
   	//}
   	this.groupping.push(data);
   	this.dataStore.dataView.setGrouping(this.groupping);
   	this.dataStore.dataView.collapseAllGroups();
   	self.onCommentsChanged();
    
};

/*
grid.prototype.AddColsToDashboard = function(){
	var selectionModel = self.grid.getSelectionModel();
	var ranges = selectionModel.getSelectedRanges();
	console.log("grid.onSelectedRowsChanged ranges: ", ranges);

	for(var k=0; k < ranges.length; k++){
		var range = ranges[k];
		for(var i=range.fromCell; i <= range.toCell; i++){
			self.dataStore.addColToSelection(i);
		}
	}
	self.syncSelectionStyle();
};

grid.prototype.RemoveColsFromDashboard = function(){
	var selectionModel = self.grid.getSelectionModel();
	var ranges = selectionModel.getSelectedRanges();
	console.log("grid.onSelectedRowsChanged ranges: ", ranges);

	for(var k=0; k < ranges.length; k++){
		var range = ranges[k];
		for(var i=range.fromCell; i <= range.toCell; i++){
			self.dataStore.removeColFromSelection(i);
		}
	}
	self.syncSelectionStyle();
};



grid.prototype.AddRowsToDashboard = function(){
	  

    var selectionModel = self.grid.getSelectionModel();
	var ranges = selectionModel.getSelectedRanges();
	console.log("grid.onSelectedRowsChanged ranges: ", ranges);

	for(var k=0; k < ranges.length; k++){
		var range = ranges[k];
		for(var i=range.fromRow; i <= range.toRow; i++){
			var item = self.dataStore.dataView.getItem(i);
      		if (item){
      			self.dataStore.addRowToSelection(item.id);	
      		} 		
		}
	}
	self.syncSelectionStyle();
};

grid.prototype.RemoveRowsFromDashboard = function(){
	var selectionModel = self.grid.getSelectionModel();
	var ranges = selectionModel.getSelectedRanges();
	console.log("grid.onSelectedRowsChanged ranges: ", ranges);

	for(var k=0; k < ranges.length; k++){
		var range = ranges[k];
		for(var i=range.fromRow; i <= range.toRow; i++){
			var item = self.dataStore.dataView.getItem(i);
      		if (item){
      			self.dataStore.removeRowFromSelection(item.id);	
      		} 		
		}
	}
	self.syncSelectionStyle();
};


grid.prototype.syncSelectionStyle = function(){
	var selection = self.dataStore.currentSelection;
	var changes = {};


	var selectedRows = {};
	var selectedCols = {};
	var colIndexToNameMap = self.dataStore.columns.map(function(x) {return x.id; });

	for(var i=0; i < selection.rows.length; i++){
		var rowIdx = self.dataStore.dataView.getIdxById(selection.rows[i]);
		selectedRows[rowIdx] = true;
	}

	for(var i=0; i < selection.cols.length; i++){
		var colName = selection.cols[i];
		var colIndex = colIndexToNameMap.indexOf(colName); 				
		selectedCols[colIndex] = colName;
	}

	for(var i=0; i < self.dataStore.records.length; i++){
		for(var j=0; j < self.dataStore.columns.length; j++){
			var selectedRow = selectedRows[i];
			var selectedCol = selectedCols[j];

			if(selectedRow || selectedCol){
				if (!changes[i]) {
	        		changes[i] = {};
	        	}
				if(selectedRow && selectedCol){
					changes[i][selectedCols[j]] = "dashboardCellSelected";
				}else{
					changes[i][colIndexToNameMap[j]] = "dashboardSelected";
				}
			}
			
	    }
	}

	self.grid.setCellCssStyles("highlight", changes);
    self.grid.render();
}
*/

grid.prototype.onSelectionChanged = function(event){
	if(event.source === "grid" || event.type === "time"){
		return;
		//console.log("TagEditor.onSelectionChanged: ", text);
	}else{
		

		var selectionModel = self.grid.getSelectionModel();
		// map ids to rows

		var rows = event.data.rows.map(function(r) { return self.dataStore.dataView.getIdxById(r);  } );

		console.log("grid.prototype.onSelectionChanged: ", rows);

		selectionModel.setSelectedRows(rows, true);
		selectionModel.syncSelectionStyle();	
	}
};

grid.prototype.onCommentsChanged = function(){
	
	//console.log("grid.prototype.onCommentsChanged");

	self.grid.removeCellCssStyles("taggedCell");
	var changes = {};
	
    //var selectedRows = {};
    //var selectedCols = {};

	var colIndexToIDMap = self.dataStore.columns.map(function(x) {return x.id; });
    var colIndexToNameMap = self.dataStore.columns.map(function(x) {return x.id; });

	self.dataStore.commentModel.find(function (err, comments) {
	  if (err) return console.error(err);
	  async.each(comments, function(comment, callback){
	  	var selections = comment.selections;
	  	var i, j, k;
	  	for(i=0; i < selections.length; i++){
	  		var selection = selections[i];
	  		//console.log("selection: ", selection);
	  		for(j=0; j < selection.rows.length; j++){
		        var rowIdx = self.dataStore.dataView.getIdxById(selection.rows[j]);
		        //console.log("rowIdx: ", rowIdx);
		        //selectedRows[rowIdx] = true;
		        for(k=0; k < selection.cols.length; k++){
		        	var colName = selection.cols[k];
		        	var colIndex = colIndexToNameMap.indexOf(colName);
		        	//console.log("colName: ", colName, colIndex, colIndexToIDMap[colIndex]);
		        	if (!changes[rowIdx]) {
	                  changes[rowIdx] = {};
	                }
		        	changes[rowIdx][colIndexToIDMap[colIndex]] = "taggedCell";      
		        	//selectedCols[colIndex] = colName;
		    	}
		    }

		   
	  	}
	  	callback();


	  }, function(err){
	  	if(err){ console.error(err); }
	  	self.grid.addCellCssStyles("taggedCell", changes);
	    self.grid.invalidate();
	    self.grid.render();

	  });
	  
	  
	});
} 

grid.prototype.init = function(dataStore, parentLayout, parentPanel, datasetPath, done){

		//done();
		//return;

		this.dataStore = dataStore;

		this.dataStore.on("selection-changed", this.onSelectionChanged);
		this.dataStore.on("comment-changed", this.onCommentsChanged);

		this.columns = dataStore.columns;
	 	this.searches = dataStore.searches;
	 	this.records = dataStore.records;


	 	this.menu = new gui.Menu();
	 	this.menu.append(new gui.MenuItem({label: "Add Selected Columns to Dashboard", click: function() {
										    	self.AddColsToDashboard();
										  	}}));
		this.menu.append(new gui.MenuItem({ label: 'Remove Selected Columns from Dashboard', click: function() {
										    	self.RemoveColsFromDashboard();
										  	}}));
		this.menu.append(new gui.MenuItem({label: "Add Selected Rows to Dashboard", click: function() {
										    	self.AddRowsToDashboard();
										  	}}));
		this.menu.append(new gui.MenuItem({ label: 'Remove Selecte Rows from Dashboard', click: function() {
										    	self.RemoveRowsFromDashboard();
										  	}}));

		for (var i = 0; i < this.columns.length; i++) {
		  this.columns[i].header = {
		    menu: {
		      items: [
			{
			  title: "Group by "+this.columns[i].name,
			  command: "group"
			},
			{
			  title: "Clear Grouping",
			  command: "clear_group"
			}
		      ]
		    }
		  };
		}
		
		var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
		this.dataStore.dataView = new Slick.Data.DataView({
				    groupItemMetadataProvider: groupItemMetadataProvider,
				    inlineFilters: true });
		  this.dataStore.dataView.beginUpdate();
		  this.dataStore.dataView.setItems(this.records);
		  this.dataStore.dataView.setFilter(this.myFilter);
		  this.dataStore.dataView.setFilterArgs({
		      hideInvalid: true
		  });
		  //this.groupBy("valid",answerKeys);
		  this.dataStore.dataView.endUpdate();


		var headerMenuPlugin = new Slick.Plugins.HeaderMenu({});
		headerMenuPlugin.onCommand.subscribe(function(e, args) {
		    //console.log("Command: ", args);
		    if(args.command == "group"){
		      self.groupBy(args.column);
		      self.upadate();
		    }else if(args.command == "clear_group"){
		      self.dataStore.dataView.setGrouping([]);
		      self.groupping = [];
		      self.upadate();
		    }
		});
			      
		  
		var options = {
				  editable: false,
				  //enableAddRow: false,
				  enableColumnReorder: true,
				  enableCellNavigation: true,
				  forceFitColumns: false,
				  //autoEdit: false,
				  multiColumnSort: true,
				  enableAsyncPostRender: true
				  //cellHighlightCssClass: "dashboardCellSelected",
				  //cellHighlightCssClass: "dashboardSelected",
				  
		};
		
	    this.grid = new Slick.Grid("#myGrid", this.dataStore.dataView, this.columns, options);
	   

	  	this.grid.setSelectionModel(new Slick.RowColSelectionModel({dataStore: dataStore}));
	  	//this.columnpicker = new Slick.Controls.ColumnPicker(this.columns, this.grid, options);

		this.grid.registerPlugin(headerMenuPlugin);
	  	this.grid.registerPlugin(groupItemMetadataProvider);

	  	this.grid.onSort.subscribe(function (e, args) {
	      var cols = args.sortCols;

	      self.dataStore.dataView.sort(function (dataRow1, dataRow2) {
	        for (var i = 0, l = cols.length; i < l; i++) {
	          var field = cols[i].sortCol.field;
	          var sign = cols[i].sortAsc ? 1 : -1;
	          var value1 = dataRow1[field], value2 = dataRow2[field];
	          var result = (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
	          if (result != 0) {
	            return result;
	          }
	        }
	        return 0;
	      });
	      self.onCommentsChanged();
	      self.grid.invalidate();
	      self.grid.render();
	    });

	    //this.grid.onCellChange.subscribe(function (e, args) {
			//dataView.updateItem(args.item.id, args.item);
		//    console.log("grid.onCellChange", e, args);
		//});

		//this.grid.onAddNewRow.subscribe(function (e, args) {
		//    console.log("grid.onAddNewRow", e, args);
		//});
		/*
		this.grid.onMouseEnter.subscribe(function(e) {
				var cell = self.grid.getCellFromEvent(e);

				self.grid.setSelectedRows([cell.row]);
                e.preventDefault();
			});

		this.grid.onMouseLeave.subscribe(function(e) {
				self.grid.setSelectedRows([]);
                e.preventDefault();
			});
*/
		//this.grid.onContextMenu.subscribe(function (e) {
	     // e.preventDefault();
	      //var cell = self.grid.getCellFromEvent(e);
	     
	      // $("body").one("click", function () {
	     //   $("#contextMenu").hide();
	     // });
	     // $("#contextMenu")
	     //     .data("cell", cell)
	     //     .css("top", e.pageY)
	     //     .css("left", e.pageX)
	     //     .show();

	     // $("body").one("click", function () {
	     //   $("#contextMenu").hide();
	     // });
	    //});
		//this.grid.onSelectedRowsChanged.subscribe(function (e, args) {
			//console.log("grid.onSelectedRowsChanged", e, args);
			//var selectionModel = self.grid.getSelectionModel();
			//var ranges = selectionModel.getSelectedRanges();
			//console.log("grid.onSelectedRowsChanged ranges: ", ranges);
	        /*
	            selectedRowIds = [];
                var rows = self.grid.getSelectedRows();
                for (var i = 0, l = rows.length; i < l; i++) {
                    var item = self.dataStore.dataView.getItem(rows[i]);
                    if (item) selectedRowIds.push(item.id);
                }
                console.log("grid.onSelectedRowsChanged: ", selectedRowIds);
			self.dataStore.changeSelection(self.name, "row-select", selectedRowIds);
			*/
			//e.preventDefault();
        	//e.stopPropagation();      

			//self.menu.popup(e.clientX, e.clientY);
		//});

        //this.grid.onActiveCellChanged.subscribe(function(e, args){
        	//console.log("onActiveCellChanged", e, args);

        	//e.preventDefault();
        	//e.stopPropagation();      

			//self.menu.popup(e.clientX, e.clientY);
        //});

        //this.grid.onActiveCellPositionChanged.subscribe(function(e, args){
        	//console.log("onActiveCellPositionChanged", e, args);
        //});


		//this.grid.onDragEnd.subscribe(function(e, args){
			//e.preventDefault();
        	//e.stopPropagation();      
			
			//self.menu.popup(e.clientX, e.clientY);
		//});
		
		//this.grid.onClick.subscribe(function (e, args) {
			
			//e.preventDefault();
        	//e.stopPropagation();      
			
			//self.menu.popup(e.clientX, e.clientY);
			//console.log("grid.onClick", e, args);
			//var selectionModel = self.grid.getSelectionModel();
			//var ranges = selectionModel.getSelectedRanges();
			//console.log("grid.onSelectedRowsChanged ranges: ", ranges);
			//var item = self.dataStore.dataView.getItem(args.cell);

			//self.dataStore.changeSelection(self.name, "cell-click", args.cell);
		    
		//});


		// wire up model events to drive the grid
		this.dataStore.dataView.onRowCountChanged.subscribe(function (e, args) {
		    //console.log("dataView.onRowCountChanged", e, args);
		    self.grid.updateRowCount();
		    self.grid.render();
		});

		this.dataStore.dataView.onRowsChanged.subscribe(function (e, args) {
			//console.log("dataView.onRowsChanged", e, args);
		    self.grid.invalidateRows(args.rows);
		    self.grid.render();
		});





	    //console.log("done with the grid");
		  
	    this.onCommentsChanged();
		
		done(this.name);

		
}


module.exports = grid;