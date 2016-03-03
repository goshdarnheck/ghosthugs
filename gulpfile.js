var del = require('del');
var gulp = require('gulp');
var path = require('path');
var argv = require('yargs').argv;
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var buffer = require('gulp-buffer');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var exorcist = require('exorcist');
var babelify = require('babelify');
var browserify = require('browserify');

var PHASER_PATH = './node_modules/phaser/build/';
var BUILD_PATH = './public/js';
var SCRIPTS_PATH = BUILD_PATH;
var SOURCE_PATH = './src/js';
var STATIC_PATH = './static';
var ENTRY_FILE = SOURCE_PATH + '/ghosthugs.js';
var OUTPUT_FILE = 'ghosthugs.min.js'

var keepFiles = false;

function isProduction() {
	return argv.production;
}

function logBuildMode() {
	if (isProduction()) {
		gutil.log(gutil.colors.green('Running production build...'));
	} else {
		gutil.log(gutil.colors.yellow('Running development build...'));
	}
}

function cleanBuild() {
	if (!keepFiles) {
		del(['build/**/*.*']);
	} else {
		keepFiles = false;
	}
}

function copyStatic() {
	return gulp.src(STATIC_PATH + '/**/*')
		.pipe(gulp.dest(BUILD_PATH));
}

function copyPhaser() {
	var srcList = ['phaser.min.js'];

	if (!isProduction()) {
		srcList.push('phaser.map', 'phaser.js');
	}

	srcList = srcList.map(function(file) {
		return PHASER_PATH + file;
	});

	return gulp.src(srcList)
		.pipe(gulp.dest(SCRIPTS_PATH));
}

function build() {
	var sourcemapPath = SCRIPTS_PATH + '/' + OUTPUT_FILE + '.map';
	logBuildMode();

	return browserify({
		paths: [path.join(__dirname, 'src')],
		entries: ENTRY_FILE,
		debug: true
	})
	.transform(babelify)
	.bundle().on('error', function(error) {
		gutil.log(gutil.colors.red('[Build Error', error.message));
		this.emit('end');
	})
	.pipe(gulpif(!isProduction(), exorcist(sourcemapPath)))
	.pipe(source(OUTPUT_FILE))
	.pipe(buffer())
	.pipe(gulpif(isProduction(), uglify()))
	.pipe(gulp.dest(SCRIPTS_PATH));
}

gulp.task('cleanBuild', cleanBuild);
gulp.task('copyStatic', ['cleanBuild'], copyStatic);
gulp.task('copyPhaser', ['copyStatic'], copyPhaser);
gulp.task('build', ['copyPhaser'], build);

gulp.task('default', ['build']);