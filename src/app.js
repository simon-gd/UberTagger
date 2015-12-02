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
global.d3 = d3;
global.w2ui = w2ui;

var gui = require('nw.gui');
var path = require('path');
//var datasetPath = "D:\\GitHub\\Datasets\\dataset-health-monitoring";
var pstyle = 'border: 1px solid #666; padding: 0px; margin: 1px;';
var pstyle2 = 'border: 1px solid #dfdfdf; padding: 0px;'
var csv = require('csv');
var fs = require('fs');
var events = require('events');

//var sidebarTree = require('sidebarTree.js');
//var datapackage = require('datapackage-read');

//var dispatcher = require('./dispatcher.js');
//var store = require('./js/stores/dataStore.js');

var actions = require('./dispatcher.js');
var dataStore = require('./js/stores/dataStore.js');

var activate_debug = function () {
  var w = gui.Window.get();
  if (w.isDevToolsOpen()) {
    w.closeDevTools();
  } else {
    w.showDevTools();
  }
};


//console.log(window.c8, window.c8.views);

var TagEditor = window.c8.views.tag_editor; //require('./js/views/tag-editor.js');
var HeatmapView = window.c8.views.heatmap_view; ///require('./js/views/heatmap-view.js');

var tag_editor = new TagEditor();
var heatmap_view = new HeatmapView();
//var sidebarDatView = new  sidebarTree.DatasetView();

var activate_fullscreen = function () {
  var g =  require('nw.gui');
  g.Window.get().toggleFullscreen();
  //console.log("app.js activate_fullscreen", gui.Window.get());
};

var activate_quit = function () {
  gui.Window.get().close();
};

var activate_open = function () {
  //console.log("activate_open");
  $("#openDir").trigger('click');  
};

var activate_save = function () {
  //console.log("activate_save");
  //gui.Window.get().toggleFullscreen();
};



// Create a shortcuts
var shortcut_debug = new gui.Shortcut({
  key : "Ctrl+D",
  active : function () {  activate_debug(); },
  failed : function (msg) { console.log(msg); }
});

var shortcut_open = new gui.Shortcut({
  key : "Ctrl+D",
  active : function () {  activate_debug(); },
  failed : function (msg) { console.log(msg); }
});


var shortcut_fullscreen = new gui.Shortcut({
  key : "F11",
  active : function () { activate_fullscreen(); },
  failed : function (msg) { console.log(msg); }
});


function createMenu(){
  var main_menu = new gui.Menu({ type: 'menubar' });
  var dataset_submenu = new gui.Menu();
  dataset_submenu.append(new gui.MenuItem({ label: 'Open' }));
  dataset_submenu.append(new gui.MenuItem({ label: 'Save' }));
  dataset_submenu.append(new gui.MenuItem({ label: 'Quit' }));


  // Add some items
  main_menu.append(new gui.MenuItem({ label: 'Dataset', submenu: dataset_submenu}));
  main_menu.append(new gui.MenuItem({ label: 'View' }));
  main_menu.append(new gui.MenuItem({ label: 'Debug' }));
  main_menu.append(new gui.MenuItem({ label: 'Settings' }));
  main_menu.append(new gui.MenuItem({ label: 'Help' }));

  gui.Window.get().menu = main_menu;
}


createMenu();

//console.log("app.js is called");

// Register global desktop shortcut, which can work without focus.
gui.App.unregisterGlobalHotKey(shortcut_debug);
gui.App.unregisterGlobalHotKey(shortcut_fullscreen);

gui.App.registerGlobalHotKey(shortcut_debug);
gui.App.registerGlobalHotKey(shortcut_fullscreen);

var editor = null;

var config = {
  layout: {
    name: 'layout',
    padding: 0,
    panels: [
              { type: 'top', size: 250, minSize:100, resizable: true, style: pstyle, content: "<div id='tag-editor-div' style='position: absolute;top: 0;right: 0;bottom: 0;left: 0;'><div id='controls' style='position: absolute;top: 0;right: 0;'>" },
              //{ type: 'left', size: 300, resizable: true, minSize: 120, style: pstyle },
              { type: 'main', resizable: true, overflow: 'hidden', style: pstyle, content: ''}
            
            ],
    onResize: function(target, eventData) {
        eventData.onComplete = function() {
          
        };
        
    },
  },

  toolbar: {
  	name: 'toolbar',
    items: [
          { type: 'menu',   id: 'dataset', caption: 'Dataset', icon: 'fa fa-file', items: [
              { id:'open', text: 'Open', icon: 'fa fa-folder-open-o', count:"Ctrl-O"}, 
              { id:'save_file', text: 'Save', icon: 'fa fa-save', count:"Ctrl-S" }, 
              { type: 'spacer' },
              { id:'quit', text: 'Quit', icon: 'fa fa-sign-out' }
          ]},
          { type: 'menu',   id: 'view', caption: 'View', icon: 'fa fa-eye', items: [
              { id: 'toggleFileExplorer', text: 'Toggle File Explorer',  type: 'menu',
                 items: [
                    { text: 'Item 1', img: 'icon-page' }, 
                    { text: 'Item 2', img: 'icon-page' }, 
                    { text: 'Item 3', img: 'icon-page' }
                ]
              },
              { id: 'toggleFileEditor', text: 'Toggle File Editor'},
              { id: 'toggleTagEditor', text: 'Toggle Tag Editor'},
              { id: 'toggleVisualization', text: 'Toggle Visualization'},
              { id: 'toggleSuggestions', text: 'Toggle Suggestions'},
              { type: 'spacer' },
              { id: 'fullScreen', text: 'Full Screen', icon: 'fa fa-arrows-alt', count:"F11"}
          ]},
          { type: 'menu',   id: 'debug', caption: 'Debug', icon: 'fa fa-wrench', items: [
              { id: 'devTools', text: 'Developer Tools', icon: 'fa fa-wrench', count:"Ctrl+D"}, 
          ]},
          { type: 'spacer' },
          { type: 'button',  id: 'settings',  caption: 'Settings', icon: 'fa fa-gear' },
          { type: 'button',  id: 'help',  caption: 'Help', icon: 'fa fa-question-circle' }
    ],
    onClick: function(event) {
      switch (event.target) {
        case 'dataset:quit':
          activate_quit();
          break;
        case 'dataset:open':
          activate_open();
          break;
        case 'debug:devTools':
          activate_debug();
          break;
        case 'view:fullScreen':
          activate_fullscreen();
          break;
      }
     
      //console.log('item '+ event.target + ' is clicked.');
    }        
  },
  sidebar: {
      name: 'sidebar',
      nodes: [] //{ id: 'root', text: "Datasets", group: true, expanded: true, nodes: []}]
  }
};


function clearCurrentDataset()
{

}

function initHeatmapView(dataStore, datasetPath, viewData, cfg)
{
   w2ui['layout'].lock("main", "Loading...", true);
   heatmap_view.init(dataStore, "layout", "main", datasetPath, viewData, cfg, function(){
      w2ui['layout'].unlock("main");
   });
}

function initTagEditor(dataStore, datasetPath, cfg)
{
   //console.log( "initTagEditor");
   w2ui['layout'].lock("top", "Loading...", true);
   tag_editor.init(dataStore, "#tag-editor-div", datasetPath, cfg, function(){
      w2ui['layout'].unlock("top");
   });
}




function openDataset(datasetPath){
  w2utils.lock($('body'), "Loading...", true);

  clearCurrentDataset();


  fs.readFile(path.join(datasetPath, "package.json"), function(err, cfgdata){
    if(err){
      console.error(err);
    }else{
      var cfg = JSON.parse(cfgdata)["uber-tagger"];
      dataStore.init(datasetPath, cfg, function(){
        //console.log("DataStore loaded");
        

        //w2ui.layout.content('left', $().w2sidebar(config.sidebar));

        //sidebarDatView.open(w2ui.sidebar, cfg);
        //w2ui.sidebar.on('click', function (event) {
        //}
        initTagEditor(dataStore, datasetPath, cfg);  
        var default_view = cfg["views"][0];
        initHeatmapView(dataStore, datasetPath, default_view, cfg);
       
          
          w2utils.unlock($('body'));    

      });

      
      
      
    }
     
  });


  var range_count = 0;
  
}

function loadDataset(datapath)
{
    //console.log("openDir", datapath);
    localStorage.datasetPath = datapath;
    openDataset(datapath);
}


$(function(){
  //w2utils.lock($('body'), "Select Dataset", false);
  
  if(localStorage.datasetPath !== undefined && localStorage.datasetPath !== ""){
    //console.log("set datasetPath from localStrorage");
    $("#openDir").attr("nwworkingdir", localStorage.datasetPath);  
  }
  
  $("#openDir").change(function(evt) {
    try{
      loadDataset("loadComments");        
    }catch(err){
      console.error(err);
    }

    $(this).val('');
  });

  $('#myLayout').w2layout(config.layout);
   


  $("#openDir").trigger("click");
 
});