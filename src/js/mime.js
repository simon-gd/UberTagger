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
var path = require('path');
var _ = require('underscore');

var map = {
  'compressed': ['zip', 'rar', 'gz', '7z'],
  'text': ['txt', ''],
  'markdown': ['md'],
  'image': ['jpg', 'jpge', 'png', 'gif', 'bmp'],
  'pdf': ['pdf'],
  'css': ['css'],
  'html': ['html', 'htm'],
  'xml': ['xml'],
  'word': ['doc', 'docx'],
  'powerpoint': ['ppt', 'pptx'],
  'movie': ['mkv', 'avi', 'rmvb'],
  'json':['json', 'geojson'],
  'javascript':['js'],
  'csv':['csv'],
  'r':['r'],
  'python':['py']
};

var cached = {};

exports.stat = function(filepath) {
  var result = {
    name: path.basename(filepath),
    path: filepath,
    size: 0,
    type: "",
    mtime: "",
    atime: "",
    ctime: ""
  };

  try {
    var stat = fs.statSync(filepath);
    var fileSizeInBytes = stat["size"];
    //Convert the file size to megabytes (optional)
    result.size = fileSizeInBytes;
    result.mtime = stat["mtime"];
    result.atime = stat["atime"];
    result.ctime = stat["ctime"];
    if (stat.isDirectory()) {
      result.type = 'folder';
    } else {
      var ext = path.extname(filepath).substr(1);
      result.type = cached[ext];
      if (!result.type) {
        for (var key in map) {
          if (_.include(map[key], ext)) {
            cached[ext] = result.type = key;
            break;
          }
        }

        if (!result.type)
          result.type = ext;
      }
    }
  } catch (e) {
    window.alert(e);
  }

  return result;
}