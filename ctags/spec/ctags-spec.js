'use strict';

var fs = require('fs');
var path = require('path');
var ctags = require('../');

var tagsFile = path.join(__dirname, 'fixtures', 'tags');

describe('ctags.findTags(name, options, callback)', function() {
  it('calls back all matching tags', function() {
    var callback = jasmine.createSpy('callback');
    ctags.findTags(tagsFile, 'duplicate', callback);

    waitsFor(function() {
      return callback.callCount === 1;
    });

    runs(function() {
      var tags = callback.argsForCall[0][1];
      expect(callback.argsForCall[0][0]).toBeFalsy();
      expect(tags.length).toBe(2);
      expect(tags[0].file).toBe('tagged-duplicate.js');
      expect(tags[0].name).toBe('duplicate');
      expect(tags[0].pattern).toBe('/^function duplicate() {$/');
      expect(tags[0].kind).toBe('f');
      expect(tags[0].lineNumber).toBe(0);
      expect(tags[1].file).toBe('tagged.js');
      expect(tags[1].name).toBe('duplicate');
      expect(tags[1].pattern).toBe('/^function duplicate() {$/');
      expect(tags[1].kind).toBe('f');
      expect(tags[1].lineNumber).toBe(0);
    });
  });

  describe('when partialMatch is set to true', function() {
    it('returns tags that partially match the name', function() {
      var callback = jasmine.createSpy('callback');
      ctags.findTags(tagsFile, 'dup', {partialMatch: true}, callback);

      waitsFor(function() {
        return callback.callCount === 1;
      });

      runs(function() {
        var tags = callback.argsForCall[0][1];
        expect(callback.argsForCall[0][0]).toBeFalsy();
        expect(tags.length).toBe(2);
        expect(tags[0].file).toBe('tagged-duplicate.js');
        expect(tags[0].name).toBe('duplicate');
        expect(tags[0].pattern).toBe('/^function duplicate() {$/');
        expect(tags[0].kind).toBe('f');
        expect(tags[0].lineNumber).toBe(0);
        expect(tags[1].file).toBe('tagged.js');
        expect(tags[1].name).toBe('duplicate');
        expect(tags[1].pattern).toBe('/^function duplicate() {$/');
        expect(tags[1].kind).toBe('f');
        expect(tags[1].lineNumber).toBe(0);
      });
    });
  });

  describe('when caseInsensitive is set to true', function() {
    it('returns tags that match the name case insensitively', function() {
      var callback = jasmine.createSpy('callback');
      ctags.findTags(tagsFile, 'callmemaybe', {caseInsensitive: true}, callback);

      waitsFor(function() {
        return callback.callCount === 1;
      });

      runs(function() {
        var tags = callback.argsForCall[0][1];
        expect(callback.argsForCall[0][0]).toBeFalsy();
        expect(tags.length).toBe(1);
        expect(tags[0].file).toBe('tagged.js');
        expect(tags[0].name).toBe('callMeMaybe');
        expect(tags[0].pattern).toBe('/^function callMeMaybe() {$/');
        expect(tags[0].kind).toBe('f');
        expect(tags[0].lineNumber).toBe(0);
      });
    });
  });

  describe('when limit is set', function() {
    it('returns the correct number of tags', function() {
      var callback = jasmine.createSpy('callback');
      ctags.findTags(tagsFile, 'dup', {partialMatch: true, limit: 1}, callback);

      waitsFor(function() {
        return callback.callCount === 1;
      });

      runs(function() {
        var tags = callback.argsForCall[0][1];
        expect(callback.argsForCall[0][0]).toBeFalsy();
        expect(tags.length).toBe(1);
        expect(tags[0].name).toBe('duplicate');
      });
    });
  });
});

describe('ctags.createReadStream(tagsFilePath)', function() {
  it('returns a stream that emits data and end events', function() {
    var endHandler = jasmine.createSpy('endHandler');
    var stream = ctags.createReadStream(tagsFile);
    var tags = [];

    stream.on('data', function(chunk) {
      tags = tags.concat(chunk);
    });
    stream.on('end', endHandler);

    waitsFor(function() {
      return endHandler.callCount === 1;
    });

    runs(function() {
      expect(tags.length).toBe(4);
      expect(tags[0].file).toBe('tagged.js');
      expect(tags[0].name).toBe('callMeMaybe');
      expect(tags[0].pattern).toBe('/^function callMeMaybe() {$/');
      expect(tags[0].kind).toBe('f');
      expect(tags[0].lineNumber).toBe(0);
      expect(tags[1].file).toBe('tagged-duplicate.js');
      expect(tags[1].name).toBe('duplicate');
      expect(tags[1].pattern).toBe('/^function duplicate() {$/');
      expect(tags[1].kind).toBe('f');
      expect(tags[1].lineNumber).toBe(0);
      expect(tags[2].file).toBe('tagged.js');
      expect(tags[2].name).toBe('duplicate');
      expect(tags[2].pattern).toBe('/^function duplicate() {$/');
      expect(tags[2].kind).toBe('f');
      expect(tags[2].lineNumber).toBe(0);
      expect(tags[3].file).toBe('tagged.js');
      expect(tags[3].name).toBe('thisIsCrazy');
      expect(tags[3].pattern).toBe('/^var thisIsCrazy = true;$/');
      expect(tags[3].kind).toBe('v');
      expect(tags[3].lineNumber).toBe(0);
    });
  });

  it('emits an error event when the tags file does not exist', function() {
    var missingTagsFile = path.join(__dirname, 'fixtures/not-tags');
    expect(fs.existsSync(missingTagsFile)).toBe(false);

    var stream = ctags.createReadStream(missingTagsFile);
    var errorHandler = jasmine.createSpy('endHandler');
    stream.on('error', errorHandler);

    waitsFor(function() {
      return errorHandler.callCount === 1;
    });
  });
});

describe('emit tags in chunks of the given size', function() {
  var stream = ctags.createReadStream(tagsFile, {
    chunkSize: 3
  });

  var dataHandler = jasmine.createSpy('dataHandler');
  stream.on('data', dataHandler);

  var endHandler = jasmine.createSpy('endHandler');
  stream.on('end', endHandler);

  waitsFor(function() {
    return endHandler.callCount === 1;
  });

  runs(function() {
    expect(dataHandler.argsForCall[0][0].length).toBe(3);
    expect(dataHandler.argsForCall[1][0].length).toBe(1);
    expect(dataHandler.argsForCall[0][0][0].file).toBe('tagged.js');
    expect(dataHandler.argsForCall[0][0][0].name).toBe('callMeMaybe');
    expect(dataHandler.argsForCall[0][0][0].pattern).toBe('/^function callMeMaybe() {$/');
    expect(dataHandler.argsForCall[0][0][0].kind).toBe('f');
    expect(dataHandler.argsForCall[0][0][0].lineNumber).toBe(0);
    expect(dataHandler.argsForCall[0][0][1].file).toBe('tagged-duplicate.js');
    expect(dataHandler.argsForCall[0][0][1].name).toBe('duplicate');
    expect(dataHandler.argsForCall[0][0][1].pattern).toBe('/^function duplicate() {$/');
    expect(dataHandler.argsForCall[0][0][1].kind).toBe('f');
    expect(dataHandler.argsForCall[0][0][1].lineNumber).toBe(0);
    expect(dataHandler.argsForCall[0][0][2].file).toBe('tagged.js');
    expect(dataHandler.argsForCall[0][0][2].name).toBe('duplicate');
    expect(dataHandler.argsForCall[0][0][2].pattern).toBe('/^function duplicate() {$/');
    expect(dataHandler.argsForCall[0][0][2].kind).toBe('f');
    expect(dataHandler.argsForCall[0][0][2].lineNumber).toBe(0);
    expect(dataHandler.argsForCall[1][0][0].file).toBe('tagged.js');
    expect(dataHandler.argsForCall[1][0][0].name).toBe('thisIsCrazy');
    expect(dataHandler.argsForCall[1][0][0].pattern).toBe('/^var thisIsCrazy = true;$/');
    expect(dataHandler.argsForCall[1][0][0].kind).toBe('v');
    expect(dataHandler.argsForCall[1][0][0].lineNumber).toBe(0);
  });
});
