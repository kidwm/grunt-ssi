# grunt-ssi

> Compiles HTML with SSI into static HTML pages

## Getting Started
This plugin requires Grunt `~0.4.2`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-ssi --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-ssi');
```

## The "ssi" task

### Overview
In your project's Gruntfile, add a section named `ssi` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  ssi: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.baseDir
Type: `String`
Default value: `'html'`

The Directory location where to locate Server Side Includes from.

#### options.cacheDir
Type: `String`
Default value: `'.tmp/.ssiCache'`

The Directory Location to store the cached ssi files

#### options.includesRegex
Type: `Regex`
Default value: `/<!--\#include\s+(file|virtual)=["']([^"'<>|\b]+)['"]\s+-->/g`

The Regex Object used to find and parse SSI Include Tags

#### options.cache
Type: `String | Boolean`
Default value: `false`

Whether or not to check the cache when processing the file. `true` to use the cached version, `false` to clear the file cache, and `'all'` to clear all cached files

#### options.ext
Type: `String`
Default value: `'.html'`

The extension to use for the outputed files.

#### options.encoding
Type: `String`
Default value: `'utf8'`

File encoding used to read and write out the files.

### Usage Examples

#### Standard Options
Typical Settings as such read in `.html` files in the `/html` directory, and outputs the parsed files to `/.tmp/html`. This will only output the originating `.html` files, but still include files specified by `#include` tags such as `.inc` or `.shtml`
```js
grunt.initConfig({
  ssi: {
    options: {},
    files: [{
          expand: true,
          cwd: 'html'
          src: ['**/*.html'],
          dest: '.tmp/html',
        }],
  },
});
```

#### Custom Options
Here is an example that clears the entire cache, and outputs files as `.shtml`

```js
grunt.initConfig({
  ssi: {
    options: {
      cache: 'all',
      ext: '.shtml',
      baseDir: 'path/to/views',
    },
    files: [{
          expand: true,
          cwd: 'html',
          src: ['**/*.html'],
          dest: '.tmp/html',
        }],
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
### 0.2.0 (3rd Mar 2014) (Current)
Updated to allow for proper Grunt Logging for normal use and verbose
and Fixes for passing the cache clear option

### 0.1.2 (26th Feb 2014)
Fixes to use the proper Grunt Files options

### 0.0.1 (Jan 2014)
Intial release and proof of concept
