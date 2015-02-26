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

/**
 * Record schema
 */
module.exports = function(mongoose) {
  var Schema = mongoose.Schema;

  var commentSchema = new Schema({
    souce_text: String
    , display_text: String
    , selections: [{rows:[String], cols:[String], time:[Number]}]
    , tags: [{name: String, weight: Number}]
    , tagRelations: [{from: String, to: String, type: {type: String }}]
    , codeBlocks: [String]  
    , created_at: { type: Date, default: Date.now }
    , author: { type: String, default: "anonymous" }
  });

  var tagNodeSchema = new Schema({
    name: String
    //, selections: [{rows:[Number], cols:[String], time:[Number]}]
    , created_at: { type: Date, default: Date.now },
  });

  var tagRelationsSchema = new Schema({
    name: String
    , from: Schema.Types.ObjectId
    , to: Schema.Types.ObjectId
    , type: String
    , weight: { type: Number, default: 1.0 }
    , created_at: { type: Date, default: Date.now }
  });


  var CommentModel = mongoose.model("Comment", commentSchema);
  var TagModel = mongoose.model("Tag", tagNodeSchema);
  var LinkModel = mongoose.model("Link", tagRelationsSchema);

  return {comment: CommentModel, tag: TagModel, link: LinkModel};
};