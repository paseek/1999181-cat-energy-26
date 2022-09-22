import gulp from 'gulp';
import plumber from 'gulp-plumber';
import sass from 'gulp-dart-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import browser from 'browser-sync';
import htmlmin from 'gulp-htmlmin';
import minify from 'gulp-minify';
import csso from 'gulp-csso';
import rename from 'gulp-rename';
import squoosh from 'gulp-libsquoosh';
import svgo from 'gulp-svgo';
import svgstore from 'gulp-svgstore';
import {deleteAsync} from 'del';
import newer from 'gulp-newer';
import changed from 'gulp-changed';

// Styles to build
export const styles = () => {
  return gulp.src('source/sass/style.scss', { sourcemaps: true })
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(csso())
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('build/css', { sourcemaps: '.' }))
    .pipe(browser.stream());
}

// HTML
const html = () => {
  return gulp.src('source/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('build'));
}

// Scripts
// const scripts = () => {
//   return gulp.src('source/js/*.js')
//     .pipe(minify({
//       noSource: true
//     }))
//     // .pipe(rename(function (path) {
//     //   path.basename += ".min";
//     //  }))
//     .pipe(rename('toggle.min.js'))

//     // .pipe(rename({ suffix: ".min" }))
//     .pipe(gulp.dest('build/js'));
// }


const scripts = () => {
  return gulp.src('source/js/*.js')
    .pipe(minify({
        noSource: true,
        ext:{
          min:'.min.js'
        },
    }))
    .pipe(gulp.dest('build/js'));
}


// Images
const optimizeImages = () => {
  return gulp.src(['source/img/**/*.{png,jpg}', '!source/img/favicons/*.{png,jpg}'])
    .pipe(squoosh())
    .pipe(gulp.dest('build/img'))
}

const copyImages = () => {
  return gulp.src(['source/img/**/*.{png,jpg}', '!source/img/favicons/*.{png,jpg}'])
    .pipe(gulp.dest('build/img'))
}


// Тесты
const images = () => {
  return gulp.src(['source/img/**/*.{png,jpg}', '!source/img/favicons/*.{png,jpg}'])
    .pipe (changed ('build/img')) // Отправлять только измененные или недавно добавленные файлы изображений в следующий поток
    .pipe(squoosh())
    .pipe(gulp.dest('build/img'));
  }


// WebP
const createWebp = () => {
  return gulp.src('source/img/**/*.{png,jpg}')
    // .pipe(newer('build/img'))
    .pipe(squoosh({
      webp: {}
    }))
    .pipe(gulp.dest('build/img'))
}

// SVG
const svg = () => {
  return gulp.src(['source/img/**/*.svg', '!source/img/icons/*.svg', '!source/img/favicons/*.svg'])
    .pipe(svgo())
    .pipe(gulp.dest('build/img'));
}

// SVG Sprite
const sprite = () => {
  return gulp.src('source/img/icons/*.svg')
    .pipe(svgo())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('build/img'));
}

// Copy
const copy = (done) => {
  gulp.src([
    'source/fonts/*.{woff2,woff}',
    'source/*.ico',
    'source/img/favicons/*.*'
  ], {
  base: 'source'
  })
    .pipe(gulp.dest('build'))
    done();
}

// Clean
const clean = () => {
  return deleteAsync('build');
}


// Server
const server = (done) => {
  browser.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

// Reload
const reload = (done) => {
  browser.reload();
  done();
}

// Files
const cleanmobile = () => {
  del.sync([
    'source/**',
    // here we use a globbing pattern to match everything inside the `mobile` folder
    // we don't want to clean this file though so we negate the pattern
    '!source'
  ]);
};



// Watcher
const watcher = () => {
  gulp.watch('source/sass/**/*.scss', gulp.series(styles));
  gulp.watch('source/js/**/*.js', gulp.series(scripts));
  gulp.watch('source/*.html', gulp.series(clean));
  // gulp.watch('source/*', gulp.series(clean));
  // gulp.watch('source/*.html').on('change', browser.reload);
  // gulp.watch('source/img/**/*.{png,jpg}', gulp.series(optimizeImages, createWebp, reload));
  // gulp.watch(paths.images.src, images);
}

// Build
export const build = gulp.series(
  clean,
  // cleanmobile,
  copy,
  // images,
  optimizeImages,
  gulp.parallel(
  styles,
  html,
  scripts,
  svg,
  sprite,
  createWebp
  ),
);

// Default
export default gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(
  styles,
  html,
  scripts,
  svg,
  sprite,
  createWebp
  ),
  gulp.series(
    server, watcher
  )
);
