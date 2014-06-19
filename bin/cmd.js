#!/usr/bin/env node

var fs = require('fs');
var dm2parser = require('../');
var JSONStream = require('JSONStream');

if (process.argv.indexOf('--help') !== -1 || process.argv.indexOf('-h') !== -1)
  return fs.createReadStream(__dirname + '/usage.txt').pipe(process.stdout);

process.stdin
  .pipe(dm2parser())
  .pipe(JSONStream.stringify())
  .pipe(process.stdout);
