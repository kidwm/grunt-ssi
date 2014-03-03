/*
 * grunt-ssi
 * https://github.com/anguspiv/grunt-ssi
 *
 * Copyright (c) 2014 Angus Perkerson
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/*.js',
                '<%= nodeunit.tests %>',
            ],
            options: {
                jshintrc: '.jshintrc',
            },
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp', '.tmp'],
        },

        // Configuration to be run (and then tested).
        ssi: {
            options: {},
            default_options: {
                options: {},
                files: [{
                    expand: true,
                    src: ['html/*'],
                }],
            },
            custom_options: {
                options: {
                    cacheDir: '',

                },
                files: [{
                    expand: true,
                    cwd: 'html',
                    src: ['**/*.html'],
                    dest: '.tmp/html',
                    ext: '.html',
                }],
            },
            test_default: {
                options: {
                    baseDir: 'test/fixtures/html/',
                },
                files: [{
                    expand: true,
                    cwd: 'test/fixtures',
                    src: ['html/**/*.html'],
                    dest: '.tmp/',
                    ext: '.html',
                }],
            },
            cache_options: {
                options: {
                    cache: true,
                },
                files: [{
                    expand: true,
                    cwd: 'html',
                    src: ['**/*.html'],
                    dest: '.tmp/',
                    ext: '.html',
                }],
            }
        },

        // Unit tests.
        nodeunit: {
            tests: ['test/*_test.js'],
        },

    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['clean', 'ssi:test_default', 'nodeunit']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'test']);

};
