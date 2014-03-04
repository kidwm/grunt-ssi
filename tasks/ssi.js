/*
 * grunt-ssi
 * https://github.com/anguspiv/grunt-ssi
 *
 * Copyright (c) 2014 Angus Perkerson
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    var SSI = require('./lib/ssi.js')(grunt);
    var path = require('path');

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('ssi', 'Compiles HTML with SSI into static HTML pages', function () {
        // Merge task-specific and/or target-specific options with these defaults.
        var defaults = {
            cacheDir: '.tmp/.ssiCache',
            fileSep: path.sep,
            includesRegex: /<!--\#include\s+(file|virtual)=["']([^"'<>|\b]+)['"]\s+-->/g,
            cache: false,
            ext: '.html',
            encoding: 'utf8',
            baseDir: 'html',
        };

        var options = this.options(defaults);

        var ssi = new SSI(options);

        if (!grunt.file.exists(options.cacheDir)) {
            grunt.file.mkdir(options.cacheDir);
        }

        // Iterate over all specified file groups.
        this.files.forEach(function (f) {

            grunt.verbose.writeln('BaseDir: ' + options.baseDir);
            ssi.setBaseDir(options.baseDir);

            // Concat specified files.
            var src = f.src.filter(function (filepath) {
                // Warn on and remove invalid source files (if nonull was set).
                if (!grunt.file.exists(filepath) || grunt.file.isDir(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            }).forEach(function (filepath) {

                grunt.verbose.or.write('Creating file \'' + f.dest + '\'... ');
                grunt.verbose.write('Creating File \'' + f.dest + '\' from \'' + filepath + '\'')
                var data = ssi.processFile(filepath, null, options.cache);

                //Check if dest is set, if not default to 'output'
                var dest = f.dest ? f.dest : path.join('output', filepath);

                //Create the processed file
                grunt.file.write(dest, data);
                grunt.verbose.or.ok();
                grunt.verbose.ok();
            });

        });

    });

};
