/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

/**
 * Module dependencies
 */

var nodeunit = require('../nodeunit'),
    utils = require('../utils'),
    fs = require('fs'),
    sys = require('sys'),
    path = require('path'),
    async = require('../../deps/async'),
    AssertionError = require('assert').AssertionError,
    child_process = require('child_process'),
    ejs = require('../../deps/ejs');


/**
 * Reporter info string
 */

exports.info = "Report tests result as HTML";

/**
 * Returns absolute version of a path. Relative paths are interpreted
 * relative to process.cwd() or the cwd parameter. Paths that are already
 * absolute are returned unaltered.
 *
 * @param {String} p
 * @param {String} cwd
 * @return {String}
 * @api public
 */

var abspath = function (p, /*optional*/cwd) {
    if (p[0] === '/') return p;
    cwd = cwd || process.cwd();
    return path.normalize(path.join(cwd, p));
};


/**
 * Run all tests within each module, reporting the results to the command-line,
 * then writes out junit-compatible xml documents.
 *
 * @param {Array} files
 * @api public
 */

exports.run = function (files, opts, callback) {
    var error = function (str) {
        return opts.error_prefix + str + opts.error_suffix;
    };
    var ok    = function (str) {
        return opts.ok_prefix + str + opts.ok_suffix;
    };
    var bold  = function (str) {
        return opts.bold_prefix + str + opts.bold_suffix;
    };

    var start = new Date().getTime();
    var paths = files.map(function (p) {
        return path.join(process.cwd(), p);
    });

    var modules = [];
    var curModule;

    nodeunit.runFiles(paths, {
        moduleStart: function (name) {
            curModule = {
                errorCount: 0,
                failureCount: 0,
                tests: 0,
                testcases: [],
                name: name
            };
            modules.push(curModule);
        },
        testDone: function (name, assertions) {
            var testcase = {name: name};
            for (var i=0; i<assertions.length; i++) {
                var a = assertions[i];
                if (a.failed()) {
                    a = utils.betterErrors(a);
                    testcase.failure = {
                        message: a.message,
                        backtrace: a.error.stack
                    };
                    testcase.state = 'fail';

                    if (a.error instanceof AssertionError) {
                        curModule.failureCount++;
                    }
                    else {
                        curModule.errorCount++;
                    }
                    break;
                } else {
                    testcase.pass = 1;
                    testcase.state = 'pass';
                }
            }
            curModule.tests++;
            curModule.testcases.push(testcase);
        },
        done: function (assertions) {
            var end = new Date().getTime();
            var duration = end - start;

            var tmpl = __dirname + "/../../share/html.ejs";
            fs.readFile(tmpl, function (err, data) {
                if (err) throw err;
                var tmpl = data.toString();

                var rendered = ejs.render(tmpl, {
                    locals: { suites: modules }
                });
                sys.puts(rendered);
            });
            setTimeout(function () {
                process.reallyExit(assertions.failures());
            }, 10);
        }
    });
}
