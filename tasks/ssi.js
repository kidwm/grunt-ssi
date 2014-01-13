/*
 * grunt-ssi
 * https://github.com/anguspiv/grunt-ssi
 *
 * Copyright (c) 2014 Angus Perkerson
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var Path = require('path');

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('ssi', 'Compiles HTML with SSI into static HTML pages', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      punctuation: '.',
      separator: ', '
    });

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      // Concat specified files.
      var src = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function(filepath) {
        // Read file source.
        return grunt.file.read(filepath);
      }).join(grunt.util.normalizelf(options.separator));

      // Handle options.
      src += options.punctuation;

      // Write the destination file.
      grunt.file.write(f.dest, src);

      // Print a success message.
      grunt.log.writeln('File "' + f.dest + '" created.');
    });
  });

  var includesRegex = /<!--\s*\#\s*include\s+(file|virtual)\s*=\s*["']([^"'<>|\b]+)['"]\s*-->/g;

  var getIncludes = function (file) {
    var matches = file.match(includes.regex);

    var includes = [];

    for(var i =0; i < matches.length; i++) {

      var include = {
        type: matches[i][1],
        path: matches[i][2],
        original: mathes[i][0]
      };

      includes.push(include);

    }

    return includes;
  };

  var getFullPath = function (include, workingDir) {
    var fullPath = include.path;

    if(include.type === 'file') {

      fullPath = workingDir + fullPath;

      fullPath = Path.normalize(fullPath);

    }

    return fullPath;
  };

  var getKey = function (fullPath) {
    var key = fullPath.substring(0, fullPath.lastIndexOf(Path.extname(fullPath)) - 1);

    key = key.replace(/[\\\/]/g,'-');

    return key;
  };

  var getCachedFile = function(key, cacheDir) {

    var filePath = cacheDir + Path.sep() + key + '.html';

    var fStat = fs.statSync(filePath);

    if(fstat.isFile()) {
      return fs.readFileSync(filePath);
    } else {
      return null;
    }

  };

  var setCachedFile = function(key, cacheDir, data) {
    
    var success = false;

    try {

      fs.writeFileSync(cacheDir + '/' + key + '.html', data);

      success = true;

    } catch(e) {

      console.log('Could not create file for cache '+key+' - '+e);

      success  = false;

    }

    return success;

  };

  var getCacheData = function(key, cache) {

    var cacheData = null;

    if(cache[key]) {
      cacheData = cache[key].processed ? cache[key].data : -1;
    } else {
      cacheData = 0;
    }

    return cacheData;
  };

  var createCacheData = function(key, cache) {
    cache[key] = {
      data: null,
      processed: false,
    };
  };

  var setCacheData = function(cache, key, data, cacheDir, ext) {

    if(cache[key]) {
      cache[key].data = data;
      cache[key].processed = true;
    } else {
      cache[key] = {
        data: data,
        processed: true,
      }
    }

  };

  var processFile = function(filePath, cache) {

    if(cache) {
      var key = getKey(filePath);
      createCacheData(key, cache);
    }

    var fileData = fs.readFileSync(filePath);

    var includes = getIncludes(fileData);

    for(var i = 0; i < includes.length; i++) {

      if(cache) {
        var includeKey = getKey(includes[i].path);
        var data = getCacheData(includeKey);

        switch(data) {
          -1 :
            throw "File contains a looping include...";
            break;  
          0 :
            data = processFile(include.path, cache);
            break;
          default:
          break;
        }
      } else {
        data = processFile(include.path, cache);
      }

      fileData.replace(include.orginal, data);

    }

    return fileData;
  };

};
