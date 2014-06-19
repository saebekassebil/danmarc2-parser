'use strict';

var Transform = require('readable-stream/transform'),
  JSONStream = require('JSONStream'),
  inherits = require('util').inherits;

var splitter = /(?:^|[^@])(\*[0-9a-zæøå])/gi;
var partFinder = /^(\w{3})\s+(\d{2}[0-9a-zæøå]?)?/i;

function DanMARC2Parser(options) {
  if (!(this instanceof DanMARC2Parser))
    return new DanMARC2Parser(options);

  options = options || {};
  options.objectMode = true;

  Transform.call(this, options)
  this._raw = '';
  this._field = null;
}

inherits(DanMARC2Parser, Transform);

DanMARC2Parser.prototype._transform = function(chunk, enc, cb) {
  this._raw += chunk.toString('utf8');

  var lines = this._raw.split(/\r?\n/), line, i, field;

  for (i = 0; i < lines.length; i++) {
    line = lines[i];

    if (this._field && line.substr(0, 4) === '    ') {
      this._field += line.substr(4);
    } else {
      if (this._field && (field = this._parseField(this._field)))
        this.push(field);

      this._field = line;
    }
  }

  cb();
}

DanMARC2Parser.prototype._flush = function(cb) {
  if (this._field)
    this.push(this._parseField(this._field));

  this._field = this._raw = null;
  cb();
}

DanMARC2Parser.prototype._parseField = function(field) {
  field = field.trim();
  var parts = field.match(partFinder);
  if (!parts) {
    return;
  }

  var fieldNumber = parts[1];
  var indicators = parts[2];
  var subfields = field
    .substr(parts[0].length)
    .trim()
    .split(splitter)
    .reduce(function(fields, subfield, i, arr) {
      if (/\*[0-9a-zæøå]/i.test(subfield))
        fields[subfield] = arr.length > i + 1 ? arr[i + 1].trim() : undefined;

      return fields;
    }, {});
   
  return {
    fieldNumber: fieldNumber,
    indicators: indicators,
    subfields: subfields
  };
}

module.exports = DanMARC2Parser

if (!module.parent) {
  process.stdin
    .pipe(module.exports())
    .pipe(JSONStream.stringify())
    .pipe(process.stdout);
}
