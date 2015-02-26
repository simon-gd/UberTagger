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

var events = require('events');
var fs = require('fs');
var path = require('path');
var util = require('util');
//var filesize = require('filesize');

//var mime = require('mime.js');


// Template engine
//var gen_files_view = jade.compile([
//    '- each file in files',
//    '  .file(data-path="#{file.path}")',
//    '    .name #{file.name}',
//].join('\n'));

// Our type
function DatasetView() {
  events.EventEmitter.call(this);
  //var self = this;
  //console.log("Simon K");
  // Click on blank
  //this.element.parent().on('click', function() {
  //  self.element.children('.focus').removeClass('focus');
  //});
  // Click on file
  //this.element.delegate('.file', 'click', function(e) {
  //  self.element.children('.focus').removeClass('focus');
  //  $(this).addClass('focus');
  //  e.stopPropagation();
  //});
  // Double click on file
  //this.element.delegate('.file', 'dblclick', function() {
  //  var file_path = $(this).attr('data-path');
  //  self.emit('navigate', file_path, mime.stat(file_path));
  //});
}

util.inherits(DatasetView, events.EventEmitter);
/*
var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    
    var pending = list.length;
    
    if (!pending) return done(null, results);
    
    list.forEach(function(file) {
      
      var fileMime = mime.stat(path.join(dir, file));
      
      if (fileMime.name == "node_modules" || fileMime.name == ".git"){ //
      	  if (!--pending) done(null, results);	
      } else if (fileMime.type == "folder"){
          walk(path.join(dir, file), function(err, res) {

            //results = results.concat(res);
            var fileID = "folder_"+fileMime.path.replace(/[^a-zA-Z0-9_\-]+/g,'');
            results.push({id: fileID, text: fileMime.name, route: fileMime.path, icon: 'fa fa-folder', nodes: res, type: fileMime.type, size:fileMime.size, count: filesize(fileMime.size, {base: 2})});


            if (!--pending) done(null, results);
          });
       } else {
          var fileID = "file_"+fileMime.path.replace(/[^a-zA-Z0-9_\-]+/g,'');
          results.push({id: fileID, text: fileMime.name, route: fileMime.path, icon: 'fa fa-file-o', type: fileMime.type, size:fileMime.size, count: filesize(fileMime.size, {base: 2}) });
          if (!--pending) done(null, results);
       }
      
    });
  });
};
*/

DatasetView.prototype.open = function(cfg, done) {
  var self = this;

  var files = cfg["files"];
  var main_file = cfg["main"];
  for (var i = 0; i < files.length; ++i) {

  }
  done();
  
  //walk(dir, function(error, res){
  //	if (error) {
  //    console.log(error);
  //    window.alert(error);
  //    return done(error);
  //  }
  //  self.sidebar.insert('root', null, res);
  //  done(null, res);
  // });
  /*
  fs.readdir(dir, function(error, files) {
    if (error) {
      console.log(error);
      window.alert(error);
      return;
    }
    var fileTree = [];

    for (var i = 0; i < files.length; ++i) {
      files[i] = mime.stat(path.join(dir, files[i]));

      fileTree.push({id: files[i].name, text: files[i].name, route: files[i].path, icon: 'fa fa-file-o' });
    }
    console.log(self.sidebar);
    self.sidebar.insert('root', null, fileTree);

    //w2ui.sidebar.add([
    //    { id: 'new-1', text: 'New Item 1', icon: 'w2ui-icon-check' },
    //    { id: 'new-2', text: 'New Item 2', icon: 'w2ui-icon-check' },
    //    { id: 'new-3', text: 'New Item 3', icon: 'w2ui-icon-check' }
    //]);

    //self.element.html("main",gen_files_view({ files: files }));
  });*/
}

exports.DatasetView = DatasetView; 