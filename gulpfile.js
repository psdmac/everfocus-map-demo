var gulp = require('gulp');

var compass = require('gulp-compass');
var sass = require('gulp-ruby-sass');
var browserSync = require('browser-sync');
var reload = browserSync.reload;


var paths = {
  sass: ['./scss/style.scss'],
  html: ['./www/*.html', './www/templates/*.html'],
  js:   ['./www/js/*.js']
};

gulp.task('default', ['compass'], function() {
  browserSync({
    server: {
      baseDir: "./www"
    }
  });
  gulp.watch(paths.sass, ['compass']);
  gulp.watch(paths.html).on("change", browserSync.reload);
  gulp.watch(paths.js).on("change", browserSync.reload);
});

gulp.task('compass', function() {
  gulp.src(paths.sass)
    .pipe(compass({
      css: './www/css',
      sass: 'scss'
    }))
    .pipe(reload({stream:true}));
});

//gulp.task('sass', function(done) {
//  gulp.src('./scss/ionic.app.scss')
//    .pipe(sass({
//      errLogToConsole: true
//    }))
//    .pipe(gulp.dest('./www/css/'))
//    .pipe(minifyCss({
//      keepSpecialComments: 0
//    }))
//    .pipe(rename({ extname: '.min.css' }))
//    .pipe(gulp.dest('./www/css/'))
//    .on('end', done);
//});

//gulp.task('watch', function() {
//  gulp.watch(paths.sass, ['sass']);
//});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});
