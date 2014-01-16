/*
 * grunt-ssi
 * https://github.com/anguspiv/grunt-ssi
 *
 * Copyright (c) 2014 Angus Perkerson
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(logger) {

  var path = require('path');
  var fs = require('fs');
  var extend = require('node.extend');

  var log = logger ? logger : function() {
    var args = [].slice.call(arguments);
    console.log(args.join(' '));
  };

  console.log(logger);

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

  var removeDir = function(dir, keepDir) {
  	try {
  		var files = fs.readdirSync(dir);
  	} catch(e) { 
  		return;
  	}

  	if(files.length > 0) {
  		for(var i = 0; i < files.length; i++) {
  			var filePath = dirPath + path.sep + files[i];
  			if(fs.statSync(filePath).isFile()) {
  				fs.unlinkSync(filePath);
  			} else {
  				removeDir(filePath);
  			}
  		}
  	}
  	if(!keepDir) {
  		fs.rmdirSync(dir);
  	}
  };

  var SSI = function(options, cache) {

  	this.dataCache = {};

  	this.settings = extend(true, defaults, options);

  	if(cache) {
  		this.dataCache = extend(true, this.dataCache, cache);
  	}

    this.baseDir = this.settings.baseDir;
    this.currDir = this.settings.baseDir;

  	return this;

  };

  SSI.prototype.setBaseDir = function(dir) {

    this.baseDir = dir;

  };

  SSI.prototype.setCurrDir = function(dir) {
    this.currDir = dir;
  };

  SSI.prototype.getIncludes = function(html) {

  	var matches =  html.match(this.settings.ssiRegex);

  	var includes = [];

    if(matches) {

    	for(var i =0; i < matches.length; i++) {

        var includeParts = this.settings.includeRegex.exec(matches[i]);

        if(includeParts) {

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

  SSI.prototype.getFullPath = function(include, currDir) {

  	var fullPath = this.baseDir;

  	if(include.type.toLowerCase() === 'file' && currDir && currDir !== '') {
  		fullPath = fullPath + this.settings.fileSep + currDir;
  	}

    fullPath = fullPath + this.settings.fileSep + include.path;

    fullPath = path.normalize(fullPath);

  	return fullPath;

  };

  SSI.prototype.getKey = function(filePath) {
  	var key = filePath.substring(0, filePath.lastIndexOf(path.extname(filePath)));

    key = key.replace(/[\\\/]/g,'-');

    return key;
  };

  SSI.prototype._getCacheFilePath = function(key) {

  	return this.settings.cacheDir + this.settings.fileSep + key + this.settings.ext;

  };

  SSI.prototype.getCacheFile = function(key) {

  	var filePath = this._getCacheFilePath(key)

  	var stat = fs.statSync(filePath);

  	try {

  		return stat.isFile() ? fs.readFileSync(filePath, 'utf8') : null;
  	} catch(e) {
  		return null;
  	}

  };

  SSI.prototype.deleteCacheFile = function(key) {

    var filePath = this._getCacheFilePath(key);

    var stat = fs.fs.statSync(filePath);

    try {
      return stat.isFile() ? fs.fs.unlinkSync(filePath) : null;
    } catch(e) {
      console.log('Error removing file \'' + filePath +'\' ' +e);
      return null;
    }

  };

  SSI.prototype.setCacheFile = function (key, data, encoding) {

  	var filePath = this._getCacheFilePath(key);

  	var encode = encoding ? encoding : this.settings.encoding;

  	fs.writeFileSync(filePath, data, {endcoding: encode});

  };

  SSI.prototype.getCacheData = function(key) {

  	if(!this.dataCache[key]) {
      return null;
    } 

    var data = this.dataCache[key].data;
    
    if(this.dataCache[key].processed) {
      return data;
    } else {
      return data.replace(this.settings.ssiRegex, this.settings.errorMessage);
    }

  };

  SSI.prototype.createCacheData = function(key, data) {

  	this.dataCache[key] = {
      data: data,
      processed: false,
    };

  };

  SSI.prototype.setCacheData = function(key, data) {

  	this.dataCache[key] = {
      data: data,
      processed: true,
    };

  };

  SSI.prototype.deleteCacheData = function(key) {
    delete this.dataCache[key];
  };

  SSI.prototype.deleteCache = function(key) {
    this.deleteCacheData(key);
    this.deleteCacheFile(key);
  };

  SSI.prototype.setCache = function(key, data, encoding) {

    encoding = encoding ? encoding : 'utf8';

    log('Creating cache for '+key);

  	try {
  		this.setCacheFile(key, data, encoding);
  	} catch(e) {
  		log('Could not create cache file for '+key+': '+e);
  	}

  	this.setCacheData(key, data);

  };

  SSI.prototype.getCache = function(key) {

  	var data = this.getCacheData(key);

  	if(!data || data === 0 || data === -1) {
  		try {
  			data = this.getCacheFile(key);
  		} catch(e) {
  			log('No cache found for '+key);
  			return null;
  		}
  	}

  	return data;

  };

  SSI.prototype.processFile = function(filePath, currDir, clearCache) {

    log('Processing File: ', filePath);

  	var key = this.getKey(filePath);

    if(clearCache === 'all') {
      this.clearCache();
    } else if(clearCache) {
      this.deleteCache(key);
    }

    if(!currDir) {
      currDir = '';
    }

	  var cachedData = this.getCache(key);
	  if(cachedData !== null) {
	  	return cachedData;
	  } else {

      var fileData = this._getFileData(filePath);

      if(fileData !== null) {

        this.createCacheData(key, fileData);

        var data = this.processData(fileData, currDir);

        this.setCache(key, data);

        return data;

      } else {

        return this.settings.errorMessage;
      }
    }

  };

  SSI.prototype.clearCache = function() {

  	this.dataCache = {};

		removeDir(this.settings.cacheDir, true);

  };


  SSI.prototype._getFileData= function(filePath) {
  	
  	try {
			var fileData = fs.readFileSync(filePath, 'utf8');
		} catch(e) {
			return null;
		}

		return fileData;

  };

  SSI.prototype.processData = function(fileData, currDir, clearCache) {

  	if(clearCache) {
  		this.clearCache();
  	}

    log('Processing Data...');

    currDir = currDir ? currDir : '';

  	var includes = this.getIncludes(fileData);

  	var html = fileData;

    if(includes) {

    	for(var i = 0; i < includes.length; i++) {

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