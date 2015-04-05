#!/usr/bin/env node
'use strict';

var fs = require('fs');
var readline = require('readline');

var filename = __dirname + '/../test/.cloudant-password.js';

var rl = readline.createInterface({input:process.stdin, output:process.stdout});

// Check the environment for a variable, otherwise prompt for it. Since
// the readline interface does not pass an error to the callback, neither
// does this function.
function get_var(name, default_value, callback) {
  if (name in process.env) {
    return callback(process.env[name]);
  }

  // Prompt for a variable which the user did not provide.
  var prompt = default_value ? name + ' ['+default_value+']'
                             : name;

  rl.question(prompt+': ', function(answer) {
    callback(answer || default_value || "");
  });
}

get_var('CLOUDANT_HOST', "", function(CLOUDANT_HOST) {
  // If the host is foo.cloudant.com, the username default should be "foo".
  var match = CLOUDANT_HOST.match(/^(\w+)\.cloudant\.com$/);
  var host = match && match[1];

  get_var('CLOUDANT_USERNAME', host, function(CLOUDANT_USERNAME) {
    get_var('CLOUDANT_PASSWORD', "", function(CLOUDANT_PASSWORD) {
      rl.close();

      // Time to make the file with all these values.
      var exports = [CLOUDANT_USERNAME, CLOUDANT_PASSWORD, CLOUDANT_HOST];
      var body = 'module.exports = ' + JSON.stringify(exports) + ';\n';
      fs.writeFile(filename, body, function(er) {
        if (er) {
          throw er;
        }
      });
    });
  });
});
