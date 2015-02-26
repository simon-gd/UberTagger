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

(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "RowColSelectionModel": RowColSelectionModel
    }
  });

  function RowColSelectionModel(options) {
    var _grid;
    var _ranges = [];
    var _self = this;
    var _handler = new Slick.EventHandler();
    var _inHandler;
    var _options;
    var _dataStore = options.dataStore;
    var _defaults = {
      selectActiveRow: true
    };

    function init(grid) {
      _options = $.extend(true, {}, _defaults, options);
      _grid = grid;
      _handler.subscribe(_grid.onActiveCellChanged,
          wrapHandler(handleActiveCellChange));
      _handler.subscribe(_grid.onKeyDown,
          wrapHandler(handleKeyDown));
      _handler.subscribe(_grid.onClick,
          wrapHandler(handleClick));
      _handler.subscribe(_grid.onContextMenu,
          wrapHandler(handleContextMenu));
    }

    function destroy() {
      _handler.unsubscribeAll();
    }

    function wrapHandler(handler) {
      return function () {
        if (!_inHandler) {
          _inHandler = true;
          handler.apply(this, arguments);
          _inHandler = false;
        }
      };
    }

    function rangesToRows(ranges) {
      var rows = [];
      for (var i = 0; i < ranges.length; i++) {
        for (var j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
          rows.push(j);
        }
      }
      return rows;
    }

    function rowsToRanges(rows) {
      var ranges = [];
      var lastCell = _grid.getColumns().length - 1;
      for (var i = 0; i < rows.length; i++) {
        ranges.push(new Slick.Range(rows[i], 0, rows[i], lastCell));
      }
      console.log("selectionModel.setSelectedRows ranges ", ranges);
      return ranges;
    }

    function getRowsRange(from, to) {
      var i, rows = [];
      for (i = from; i <= to; i++) {
        rows.push(i);
      }
      for (i = to; i < from; i++) {
        rows.push(i);
      }
      return rows;
    }

    function getSelectedRows() {
      return rangesToRows(_ranges);
    }

    function setSelectedRows(rows, external) {
      console.log("selectionModel.setSelectedRows", rows, external);
      setSelectedRanges(rowsToRanges(rows), external);
    }

    function setSelectedRanges(ranges, external) {
      _ranges = ranges;

      if(!external){
        addRowsToDashboard(_ranges);
      }      

      _self.onSelectedRangesChanged.notify(_ranges);
    }

    function getSelectedRanges() {
      return _ranges;
    }

    function handleActiveCellChange(e, data) {
      //console.log("slick: handleActiveCellChange: ", e, data);
      if (_options.selectActiveRow && data.row != null) {
        setSelectedRanges([new Slick.Range(data.row, 0, data.row, _grid.getColumns().length - 1)]);
        //_dataStore.changeSelection("grid", "row-select", data.row);
      }
    }

    function handleKeyDown(e) {
      //console.log("slick: handleKeyDown: ", e);
      var activeRow = _grid.getActiveCell();
      if (activeRow && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && (e.which == 38 || e.which == 40)) {
        var selectedRows = getSelectedRows();
        selectedRows.sort(function (x, y) {
          return x - y
        });

        if (!selectedRows.length) {
          selectedRows = [activeRow.row];
        }

        var top = selectedRows[0];
        var bottom = selectedRows[selectedRows.length - 1];
        var active;

        if (e.which == 40) {
          active = activeRow.row < bottom || top == bottom ? ++bottom : ++top;
        } else {
          active = activeRow.row < bottom ? --bottom : --top;
        }

        if (active >= 0 && active < _grid.getDataLength()) {
          _grid.scrollRowIntoView(active);
          _ranges = rowsToRanges(getRowsRange(top, bottom));
          //addRowsToDashboard(getRowsRange(top, bottom));
          setSelectedRanges(_ranges);

        }

        e.preventDefault();
        e.stopPropagation();
      }
    }
    
    function setSelectedCols(cols){
      //if(!mulitSelct){
      _dataStore.clearColSelection();
      //}
      for (var i = 0; i < cols.length; i++) {
        _dataStore.addColToSelection(cols[i]);
      }
      //for(var k=0; k < ranges.length; k++){
        //var range = ranges[k];
        //for(var i=range.fromCell; i <= range.toCell; i++){
         
        //}
      //}
      //_dataStore.changeSelection("grid");
      //syncSelectionStyle();
    };
    function addRowsToDashboard(ranges){
      var rows = rangesToRows(ranges);
      selectedRowIds = [];
      for (var i = 0, l = rows.length; i < l; i++) {
        var item = _dataStore.dataView.getItem(rows[i]);
        if (item) selectedRowIds.push(item.id);
      }
      //console.log("slick.selectmodel.addRowsToDashboard: ", selectedRowIds);

      _dataStore.changeSelection("grid", "row-select", selectedRowIds);
      syncSelectionStyle();
    };

    function syncSelectionStyle(){
      //console.log("syncSelectionStyle");
      var selection = _dataStore.currentSelection;
      var changes = {};


      var selectedRows = {};
      var selectedCols = {};
      var colIndexToIDMap = _dataStore.columns.map(function(x) {return x.id; });
      var colIndexToNameMap = _dataStore.columns.map(function(x) {return x.id; });

      for(var i=0; i < selection.rows.length; i++){
        var rowIdx = _dataStore.dataView.getIdxById(selection.rows[i]);
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

          if(!selectedRow && selectedCol){
            if (!changes[i]) {
                  changes[i] = {};
                }
            //if(selectedRow && selectedCol){
              //changes[i][selectedCols[j]] = "dashboardCellSelected";
            //}else{
            changes[i][colIndexToIDMap[j]] = "dashboardSelected";
            //}
          }
          
          }
      }

      _grid.setCellCssStyles("highlight", changes);
      _grid.render();
      //_dataStore.changeSelection("grid");
    }


    function handleContextMenu(e) {
      var cell = _grid.getCellFromEvent(e);
      //console.log("slick: handleDblClick: cell:", cell);
      if (!cell || !_grid.canCellBeActive(cell.row, cell.cell)) {
        return false;
      }
      
      var selection = _dataStore.currentSelection.cols.map(function(a){return _dataStore.colNameToIndex[a]; });
      var idx = $.inArray(cell.cell, selection);
      //console.log("slick: handleDblClick: selection:", selection);
      //console.log("slick: handleDblClick: idx:", idx);
      //if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
        //return false;
      //}
      if (_grid.getOptions().multiSelect) {
        

        if (idx === -1 && (e.ctrlKey || e.metaKey)) {
          selection.push(cell.cell);
          //_grid.setActiveCell(cell.row, cell.cell);
        } else if (idx !== -1 && (e.ctrlKey || e.metaKey)) {
          selection = $.grep(selection, function (o, i) {
            return (o !== cell.cell);
          });
          //_grid.setActiveCell(cell.row, cell.cell);
        } else if (selection.length && e.shiftKey) {
          var last = selection.pop();
          var from = Math.min(cell.cell, last);
          var to = Math.max(cell.cell, last);
          selection = [];
          for (var i = from; i <= to; i++) {
            if (i !== last) {
              selection.push(i);
            }
          }
          selection.push(last);
          //_grid.setActiveCell(cell.row, cell.cell);
        } else {
          selection = [];
          selection.push(cell.cell);
        } //else if (idx !== -1) {
         // selection = $.grep(selection, function (o, i) {
         //   return (o !== cell.cell);
         // });
        //}
      }
      setSelectedCols(selection);
      _dataStore.changeSelection("grid");
      syncSelectionStyle();
      //var r = rowsToRanges(selection);
      

      //if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
      //  addColsToDashboard(cell.cell, false);
        //e.stopImmediatePropagation();
        //return true;
      //}
      //else if (_grid.getOptions().multiSelect) {
      //  if (e.ctrlKey || e.metaKey) {
      //    addColsToDashboard(cell.cell, true);
      //    //_grid.setActiveCell(cell.row, cell.cell);
      //  } else if (e.shiftKey) {
      //    //XXX need to add support for this...
      //    addColsToDashboard(cell.cell, true);
      //  }

      //}
      e.stopImmediatePropagation();
    }

    function handleClick(e) {
      //console.log("slick: handleClick: e: ", e);
      var cell = _grid.getCellFromEvent(e);
      //console.log("slick: handleClick: cell:", cell);
      if (!cell || !_grid.canCellBeActive(cell.row, cell.cell)) {
        return false;
      }

      var selection = rangesToRows(_ranges);
      var idx = $.inArray(cell.row, selection);
      //console.log("slick: handleClick: selection:", selection);
      //console.log("slick: handleClick: idx:", idx);
      if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
        //if(idx === -1){
        //addRowsToDashboard([cell.row]);
        //}


        return true;
      } else if (_grid.getOptions().multiSelect) {
        


        if (idx === -1 && (e.ctrlKey || e.metaKey)) {
          selection.push(cell.row);
          _grid.setActiveCell(cell.row, cell.cell);
        } else if (idx !== -1 && (e.ctrlKey || e.metaKey)) {
          selection = $.grep(selection, function (o, i) {
            return (o !== cell.row);
          });
          _grid.setActiveCell(cell.row, cell.cell);
        } else if (selection.length && e.shiftKey) {
          var last = selection.pop();
          var from = Math.min(cell.row, last);
          var to = Math.max(cell.row, last);
          selection = [];
          for (var i = from; i <= to; i++) {
            if (i !== last) {
              selection.push(i);
            }
          }
          selection.push(last);
          _grid.setActiveCell(cell.row, cell.cell);
        }

        //addRowsToDashboard(selection);
      }

      _ranges = rowsToRanges(selection);
      setSelectedRanges(_ranges);

      e.stopImmediatePropagation();

      return true;
    }

    $.extend(this, {
      "getSelectedRows": getSelectedRows,
      "setSelectedRows": setSelectedRows,

      "getSelectedRanges": getSelectedRanges,
      "setSelectedRanges": setSelectedRanges,

      "init": init,
      "destroy": destroy,

      "onSelectedRangesChanged": new Slick.Event(),
      "syncSelectionStyle": syncSelectionStyle,
      "setSelectedCols": setSelectedCols

    });
  }
})(jQuery);