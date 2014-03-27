/*
 * grunt-ssi
 * https://github.com/anguspiv/grunt-ssi
 *
 * Copyright (c) 2014 Angus Perkerson
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    var path = require('path');
    var fs = require('fs');
    var extend = require('node.extend');

    /**
     * Default Options for the SSI Object
     * @type {Object}
     */
    var defaults = {
        cacheDir: '.tmp/html',
        fileSep: path.sep,
        ssiRegex: /<!--\s*\#include\s+(file|virtual)=["']([^"'<>|\b]+)['"]\s*-->/gi,
        includeRegex: /<!--\s*\#include\s+(file|virtual)=["']([^"'<>|\b]+)['"]\s*-->/,
        cache: true,
        ext: '.html',
        baseDir: process.cwd(),
        encoding: 'utf8',
        errorMessage: '[There was an error processing this include]',
    };

    /**
     * Recursively removes a directories contents
     * @param  {String} dir     filepath of the directory to remove
     * @param  {Boolean} keepDir Default is false. Whether to keep the enclosing directory or remove it also,
     */
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

        // Remove each of the files inside the directlory
        if (files.length > 0) {
            for (var i = 0; i < files.length; i++) {

                var filePath = dir + path.sep + files[i];

                //If its a file, delete the file
                if (fs.statSync(filePath).isFile()) {
                    grunt.verbose.write('Attempting to remove file: ' + filePath + '... ');
                    try {
                        fs.unlinkSync(filePath);
                        grunt.verbose.ok();
                    } catch (e) {
                        grunt.log.writeln('Could not remove file: ' + filepath).error().error(e.message);
                    }
                    //Else recursively call removeDir
                } else {
                    removeDir(filePath, false);
                }
            }
        }

        //Check to see if we want to remove the enclosing directory
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

    /**
     * SSI Constructor
     * @param {Object} options the options and settings for the SSI module
     * @param {Object} cache   A key map for compiled ssi file buffers to use
     */
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

    /**
     * Sets the root directory for the SSI file includes
     * @param {String} dir the filepath for the ssi root directory
     */
    SSI.prototype.setBaseDir = function (dir) {

        this.baseDir = dir;

    };

    /**
     * Set the current working Directory for ssi processing
     * @param {Striing} dir filepath to the current working directory
     */
    SSI.prototype.setCurrDir = function (dir) {
        this.currDir = dir;
    };

    /**
     * Generates an array of the SSI tags in the given html string
     * @param  {String} html A string of HTML tags
     * @return {Array}      A list of include tag objects, with their type, path, and original tag
     */
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

    /**
     * Creates the full filepath to the include objects path
     * @param  {Object} include The include object to get the full path for
     * @param  {String} currDir The filepath to the current working directory
     * @return {String}         The fullpath to a include objects path
     */
    SSI.prototype.getFullPath = function (include, currDir) {

        var fullPath = this.baseDir;

        if (include.type.toLowerCase() === 'file' && currDir && currDir !== '') {
            fullPath = fullPath + this.settings.fileSep + currDir;
        }

        fullPath = fullPath + this.settings.fileSep + include.path;

        fullPath = path.normalize(fullPath);

        return fullPath;

    };

    /**
     * Creates a key string from the passed in filepath
     * @param  {String} filePath the filepath to create the key for
     * @return {String}          A Key string for the filepath
     */
    SSI.prototype.getKey = function (filePath) {
        var key = filePath.substring(0, filePath.lastIndexOf(path.extname(filePath)));

        key = key.replace(/[\\\/]/g, '-');

        return key;
    };

    /**
     * Creates the filepath for a cache file
     * @param  {String} key The Key String for the cache entry
     * @return {String}     Filepath for the cache file location
     */
    SSI.prototype._getCacheFilePath = function (key) {

        return this.settings.cacheDir + this.settings.fileSep + key + this.settings.ext;

    };

    /**
     * Gets the File data for a cache entry
     * @param  {String} key Key for the cache entry
     * @return {String}     File Data for the cache entry
     */
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

    /**
     * Removes a cache file from the filesystem
     * @param  {String} key Key for the cache entry
     */
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

    /**
     * Creates a file for the cache entry
     * @param {String} key      Key for the cache entry
     * @param {String} data     The Cache Data to save
     * @param {String} encoding The File encoding for creating the file
     */
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

    /**
     * Returns the data for a cache entry in the cache object
     * @param  {String} key Key for the cache entry
     * @return {String}     The Data for the cache entry
     */
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

    /**
     * Creates a cache in the Cache object
     * @param  {String} key  Key to use for the cache entry
     * @param  {String} data Data String to store in the cache
     */
    SSI.prototype.createCacheData = function (key, data) {

        this.dataCache[key] = {
            data: data,
            processed: false,
        };

    };

    /**
     * Sets the cache entries data
     * @param {String} key  The key for the cache entry
     * @param {String} data Data String to store in the cache Object
     */
    SSI.prototype.setCacheData = function (key, data) {

        this.dataCache[key] = {
            data: data,
            processed: true,
        };

    };

    /**
     * Deletes a cache entry from the cache object
     * @param  {String} key Key for the cache entry
     */
    SSI.prototype.deleteCacheData = function (key) {
        delete this.dataCache[key];
        grunt.verbose.writeln('Removed Cache data for key: ' + key);
    };

    /**
     * Deletes a Cache Entry from both the file system and the cache object
     * @param  {String} key Key entry for the cache
     */
    SSI.prototype.deleteCache = function (key) {
        this.deleteCacheData(key);
        this.deleteCacheFile(key);
    };

    /**
     * Creates a cache entry
     * @param {String} key      The key to use for the cache entry
     * @param {String} data     The Data string to store in the cache
     * @param {String} encoding The type of encoding to use for file creation
     */
    SSI.prototype.setCache = function (key, data, encoding) {

        encoding = encoding ? encoding : 'utf8';

        this.setCacheFile(key, data, encoding);

        this.setCacheData(key, data);

    };

    /**
     * Retrieves the data for a cache entry, first checking the Cache Object, then the file system
     * @param  {String} key Key to use for the cache entry
     * @return {String}     The Stored data for a key, or null if the entry does not exist
     */
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

    /**
     * Converts a files SSI #include tags to static html
     * @param  {String} filePath   Filepath for the file to process
     * @param  {String} currDir    The current working directory
     * @param  {Bool|String} clearCache If true, removes the cache for just the file,
     *                                  or 'all' to clear the entire cache
     * @return {String}            The Static HTML String Data
     */
    SSI.prototype.processFile = function (filePath, currDir, clearCache) {

        grunt.verbose.writeln('Processing File: ' + filePath);

        //Get the Cache Key for the filepath
        var key = this.getKey(filePath);

        //Check if we need to clear the entire cache or
        //just the one file
        if (clearCache === 'all') {
            grunt.verbose.subhead('Clear the entire cache');
            this.clearCache();
        } else if (clearCache) {
            grunt.verbose.subhead('Clear the cache for ' + key);
            this.deleteCache(key);
        }

        //If currDir is not set, set to default
        if (!currDir) {
            currDir = '';
        }

        //Check the cache first
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

    /**
     * Deletes all the Cache Files, and deletes all the entries in the cache object
     */
    SSI.prototype.clearCache = function () {

        this.dataCache = {};

        grunt.verbose.writeln('Data Cache reset');

        removeDir(this.settings.cacheDir, true);

    };

    /**
     * Reads the contents of a file
     * @param  {String} filePath Path for the file to read
     * @return {String}          String Data for the file or null on error
     */
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

    /**
     * Converts the SSI Include Tags in a string to static HTML
     * @param  {String} fileData   The HTML String with SSI Includes to convert
     * @param  {String} currDir    The current working directory
     * @param  {Bool} clearCache   If true, clear out the entire cache
     * @return {String}            The converted HTML String Data
     */
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

                //Get the file path for the new CurrDir
                var newDir = currDir + this.settings.fileSep + path.dirname(include.path);

                //Get the includes fullpath
                var filePath = this.getFullPath(includes[i], currDir);

                //Recursively process the include file
                var data = this.processFile(filePath, newDir, false);

                //Insert the includes processed HTML into the parent HTML
                html = html.replace(include.original, data);

            }
        }

        return html;

    };


    return SSI;
};
