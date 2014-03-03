/*
 * grunt-ssi
 * https://github.com/anguspiv/grunt-ssi
 *
 * Copyright (c) 2014 Angus Perkerson
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (logger, grunt) {

    var path = require('path');
    var fs = require('fs');
    var extend = require('node.extend');

    var log = logger ? logger : function () {
            var args = [].slice.call(arguments);
            console.log(args.join(' '));
        };

    var defaults = {
        cacheDir: '.tmp/html',
        fileSep: path.sep,
        ssiRegex: /<!--\#include\s+(file|virtual)=["']([^"'<>|\b]+)['"]\s+-->/gi,
        includeRegex: /<!--\#include\s+(file|virtual)=["']([^"'<>|\b]+)['"]\s+-->/,
        cache: true,
        ext: '.html',
        baseDir: process.cwd(),
        encoding: 'utf8',
        errorMessage: '[There was an error processing this include]',
    };

    var removeDir = function (dir, keepDir) {

        grunt.verbose.subhead('Removing dir: ' + dir);

        grunt.verbose.write('Reading Dir files...');
        try {
            var files = fs.readdirSync(dir);
            grunt.verbose.ok();
        } catch (e) {

            grunt.log.writeln('Could not retrieve cache files').error().error(e.message);
            return;
        }

        if (files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                var filePath = dir + path.sep + files[i];



                if (fs.statSync(filePath).isFile()) {
                    grunt.verbose.write('Attempting to remove file: ' + filePath + '... ');
                    try {
                        fs.unlinkSync(filePath);
                        grunt.verbose.ok();
                    } catch (e) {
                        grunt.log.writeln('Could not remove file: ' + filepath).error().error(e.message);
                    }

                } else {
                    removeDir(filePath, false);
                }
            }
        }
        if (!keepDir) {
            grunt.verbose.write('Attempting to remove directory: ' + dir + '... ');

            try {
                fs.rmdirSync(dir);
                grunt.verbose.ok();
            } catch (e) {
                grunt.log.writeln('Could not remove directory: ' + dir).error().error(e.message);
                return;
            }
        }
    };

    var SSI = function (options, cache) {

        this.dataCache = {};

        this.settings = extend(true, defaults, options);

        if (cache) {
            this.dataCache = extend(true, this.dataCache, cache);
        }

        this.baseDir = this.settings.baseDir;
        this.currDir = this.settings.baseDir;

        return this;

    };

    SSI.prototype.setBaseDir = function (dir) {

        this.baseDir = dir;

    };

    SSI.prototype.setCurrDir = function (dir) {
        this.currDir = dir;
    };

    SSI.prototype.getIncludes = function (html) {

        var matches = html.match(this.settings.ssiRegex);

        var includes = [];

        if (matches) {

            for (var i = 0; i < matches.length; i++) {

                var includeParts = this.settings.includeRegex.exec(matches[i]);

                if (includeParts) {

                    var include = {
                        type: includeParts[1],
                        path: includeParts[2],
                        original: includeParts[0]
                    };

                    includes.push(include);
                }

            }
        }

        return includes;

    };

    SSI.prototype.getFullPath = function (include, currDir) {

        var fullPath = this.baseDir;

        if (include.type.toLowerCase() === 'file' && currDir && currDir !== '') {
            fullPath = fullPath + this.settings.fileSep + currDir;
        }

        fullPath = fullPath + this.settings.fileSep + include.path;

        fullPath = path.normalize(fullPath);

        return fullPath;

    };

    SSI.prototype.getKey = function (filePath) {
        var key = filePath.substring(0, filePath.lastIndexOf(path.extname(filePath)));

        key = key.replace(/[\\\/]/g, '-');

        return key;
    };

    SSI.prototype._getCacheFilePath = function (key) {

        return this.settings.cacheDir + this.settings.fileSep + key + this.settings.ext;

    };

    SSI.prototype.getCacheFile = function (key) {

        var filePath = this._getCacheFilePath(key)

        var stat = fs.statSync(filePath);

        grunt.verbose.write('Getting Cached File \'' + filePath + '\'... ');

        try {
            var fileData = stat.isFile() ? fs.readFileSync(filePath, 'utf8') : null;
            grunt.verbose.ok();
            return fileData;
        } catch (e) {
            grunt.verbose.warn().warn(e.message);
            return null;
        }

    };

    SSI.prototype.deleteCacheFile = function (key) {

        var filePath = this._getCacheFilePath(key);

        var stat = fs.statSync(filePath);

        grunt.verbose.write('Removing Cached File \'' + filePath + '\'... ');

        try {
            var fileData = stat.isFile() ? fs.unlinkSync(filePath) : null;
            grunt.verbose.ok();
            return fileData;
        } catch (e) {
            grunt.log.error().error(e.message);
            return null;
        }

    };

    SSI.prototype.setCacheFile = function (key, data, encoding) {

        var filePath = this._getCacheFilePath(key);

        var encode = encoding ? encoding : this.settings.encoding;

        grunt.verbose.write('Creating Cache file \'' + filePath + '\'... ');
        try {
            fs.writeFileSync(filePath, data, encode);
            grunt.verbose.ok();
        } catch (e) {
            grunt.verbose.warn().warn(e.message);
        }

    };

    SSI.prototype.getCacheData = function (key) {

        if (!this.dataCache[key]) {
            return null;
        }

        var data = this.dataCache[key].data;

        if (this.dataCache[key].processed) {
            return data;
        } else {
            return data.replace(this.settings.ssiRegex, this.settings.errorMessage);
        }

    };

    SSI.prototype.createCacheData = function (key, data) {

        this.dataCache[key] = {
            data: data,
            processed: false,
        };

    };

    SSI.prototype.setCacheData = function (key, data) {

        this.dataCache[key] = {
            data: data,
            processed: true,
        };

    };

    SSI.prototype.deleteCacheData = function (key) {
        delete this.dataCache[key];
        grunt.verbose.writeln('Removed Cache data for key: ' + key);
    };

    SSI.prototype.deleteCache = function (key) {
        this.deleteCacheData(key);
        this.deleteCacheFile(key);
    };

    SSI.prototype.setCache = function (key, data, encoding) {

        encoding = encoding ? encoding : 'utf8';

        this.setCacheFile(key, data, encoding);

        this.setCacheData(key, data);

    };

    SSI.prototype.getCache = function (key) {

        var data = this.getCacheData(key);

        if (!data || data === 0 || data === -1) {
            try {
                data = this.getCacheFile(key);
            } catch (e) {
                grunt.verbose.warn('No cache found for ' + key).warn().warn(e.message);

                return null;
            }
        }

        return data;

    };

    SSI.prototype.processFile = function (filePath, currDir, clearCache) {

        grunt.verbose.writeln('Processing File: ' + filePath);

        var key = this.getKey(filePath);

        if (clearCache === 'all') {
            grunt.verbose.subhead('Clear the entire cache');
            this.clearCache();
        } else if (clearCache) {
            grunt.verbose.subhead('Clear the cache for ' + key);
            this.deleteCache(key);
        }

        if (!currDir) {
            currDir = '';
        }

        var cachedData = this.getCache(key);
        if (cachedData !== null) {
            return cachedData;
        } else {

            var fileData = this._getFileData(filePath);

            if (fileData !== null) {

                this.createCacheData(key, fileData);

                var data = this.processData(fileData, currDir);

                this.setCache(key, data);

                return data;

            } else {

                return this.settings.errorMessage;
            }
        }

    };

    SSI.prototype.clearCache = function () {

        this.dataCache = {};

        grunt.verbose.writeln('Data Cache reset');

        removeDir(this.settings.cacheDir, true);

    };


    SSI.prototype._getFileData = function (filePath) {

        grunt.verbose.write('Reading File Data \'' + filePath + '\'...');

        try {
            var fileData = fs.readFileSync(filePath, 'utf8');
            grunt.verbose.ok();
        } catch (e) {
            grunt.verbose.writeln('Error reading file \'' + filePath + '\' ').error().error(e.message);
            return null;
        }

        return fileData;

    };

    SSI.prototype.processData = function (fileData, currDir, clearCache) {

        if (clearCache) {
            this.clearCache();
        }

        currDir = currDir ? currDir : '';

        var includes = this.getIncludes(fileData);

        var html = fileData;

        if (includes) {

            for (var i = 0; i < includes.length; i++) {

                var include = includes[i];

                var newDir = currDir + this.settings.fileSep + path.dirname(include.path);

                var filePath = this.getFullPath(includes[i], currDir);

                var data = this.processFile(filePath, newDir, false);

                html = html.replace(include.original, data);

            }
        }

        return html;

    };


    return SSI;
};
