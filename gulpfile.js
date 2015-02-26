var gulp  = require('gulp');
var shell = require('gulp-shell');
var changed = require('gulp-changed');
var imagemin = require('gulp-imagemin');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var streamify = require('gulp-streamify')
var gulpif = require('gulp-if');

var merge = require('merge-stream');
var browserify = require('browserify');
var partialify = require('partialify/custom');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var config = require('./package.json');
var isProd = config.env === 'prod';

// Run project
gulp.task('run', ['appcode'], function(){ gulp.src('')
  .pipe(shell(['npm start']))
  .once('end', function () {
      process.exit();
    });
});

gulp.task('build', ['package'], shell.task([
  'build.bat'
]));

var vendor_libs = [];

gulp.task('node-editor', function() {
  return browserify('./src/views/node-editor/node-editor.js', {debug: true})
    .transform(partialify.alsoAllow('glsl')) // Transform to allow requireing of templates
    //.external(vendor_libs)
    .bundle() //, external: vendor_libs
    .pipe(gulpif(isProd, streamify(uglify())))
    .pipe(source('node_editor.js'))
    .pipe(gulp.dest(config.dist + '/js'));
  // Single entry point to browserify
  /* gulp.src('public/js/main.js')
        .pipe(browserify({
          insertGlobals : true,
          debug : true
        }))
        .pipe(gulp.dest(config.dist +'/js'));
        */
});

gulp.task('views', function() {
  return browserify('./src/views/views.js', {debug: true})
    .bundle() //, external: vendor_libs
    .pipe(gulpif(isProd, streamify(uglify())))
    .pipe(source('views.js'))
    .pipe(gulp.dest(config.dist + '/js'));
  //var dest = config.dist;
  //return gulp.src('src/views/**/*')
    //.pipe(changed(dest))
  //  .pipe(gulpif(isProd, uglify()))
  //  .pipe(gulp.dest(config.dist + '/js/views/'));
});
/*
gulp.task('tag-editor', function() {
  var dest = config.dist;
  return gulp.src('src/views/tag-editor/tag-editor.js')
    .pipe(changed(dest))
    .pipe(gulpif(isProd, uglify()))
    .pipe(gulp.dest(config.dist + '/js/'));
  //return browserify('./src/views/tag-editor/tag-editor.js')
  //  .bundle() //, external: vendor_libs
  //  .pipe(source('tag-editor.js'))
  //  .pipe(gulp.dest(config.dist + '/js'));
});

gulp.task('timeline', function() {
  var dest = config.dist;
  return gulp.src('src/views/timeline/timeline.js')
    .pipe(changed(dest))
    .pipe(gulpif(isProd, uglify()))
    .pipe(gulp.dest(config.dist + '/js/'));
  //return browserify('./src/views/timeline/timeline.js')
  //  .bundle() //, external: vendor_libs
  //  .pipe(source('timeline.js'))
  //  .pipe(gulp.dest(config.dist + '/js'));
});
*/

gulp.task('stores', function() {
  var dest = config.dist;
  return gulp.src('src/stores/**/*') 
    .pipe(changed(dest))
    .pipe(gulpif(isProd, uglify()))
    .pipe(gulp.dest(config.dist + '/js/stores/'));
});

// Copy package.json ton build folder
gulp.task('appcode', ['views', 'stores'], function() {
  var dest = config.dist;
  var appFiles = gulp.src(['package.json', 'src/*.html', 'src/app.js']) 
    .pipe(changed(dest))
    .pipe(gulp.dest(dest));

  var appFiles2 = gulp.src(['src/js/**/*']) 
    .pipe(changed(dest))
    .pipe(gulp.dest(dest+'/js'));
	
  var cssFiles = gulp.src('src/css/**/*') 
    .pipe(changed(dest))
    .pipe(gulp.dest(dest+'/css'));

  var imgFiles = gulp.src('src/img/**/*') 
    .pipe(changed(dest))
    //.pipe(imagemin()) // Optimize
    .pipe(gulp.dest(dest+'/img'));
  
  var currentStream = merge(appFiles, appFiles2, cssFiles);
  
  return currentStream; 

});

gulp.task('package', ['appcode'], function() {
  var dest = config.dist;
  var nodeModules = gulp.src('node_modules/.bin/**') 
    .pipe(changed(dest))
    .pipe(gulp.dest(dest +'/node_modules/.bin'));

  var bowerModules = gulp.src(['bower_components/**/src-min-noconflict/ace.js',
                               'bower_components/**/w2ui-1.4.1.js',
                               'bower_components/**/webgl-heatmap.js',
                               'bower_components/**/src-min-noconflict/theme*.js',
                               'bower_components/**/src-min-noconflict/mode*.js',
                               'bower_components/**/src-min-noconflict/worker*.js',, 
                               'bower_components/**/jquery.js',
                               'bower_components/**/*.min.js',
                               'bower_components/**/*.min.map',
                               'bower_components/**/*.min.css', 
                               'bower_components/**/*.svg', 
                               'bower_components/**/*.eot',
                               'bower_components/**/*.ttf', 
                               'bower_components/**/*.woff']) 
    .pipe(changed(dest))
    .pipe(gulp.dest(dest +'/vendor'));
  var slickgrid = gulp.src(['bower_components/slickgrid/**/*']) 
    .pipe(changed(dest))
    .pipe(gulp.dest(dest +'/vendor/slickgrid'));
  
  var currentStream = merge(bowerModules, slickgrid);
  
  for(var key in config.dependencies) {
    	var nStream = gulp.src('node_modules/'+key+'/**/*')
    					//.pipe(changed(dest))
    					.pipe(gulp.dest(dest+'/node_modules/'+key));
      var nStream2 = gulp.src('node_modules/'+key+'/**/*.json')
              //.pipe(changed(dest))
              .pipe(gulp.dest(dest+'/node_modules/'+key));
     
    	currentStream = merge(currentStream, nStream, nStream2);
  }
  return currentStream;	
});

gulp.task('watch', function() {
    gulp.watch("src/**/*", ['appcode']);
});

// default project
gulp.task('default', ['run','watch'])