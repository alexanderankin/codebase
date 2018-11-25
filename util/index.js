var fs = require('fs');
var path = require('path');
var pj = function() { return path.join.apply(null, arguments); };

/**
 * getFeatureProperties
 * 
 * Gets the properties of the first feature in the FeatureCollection of a
 * geojson file. Caches results.
 */
var geojsonFirstProps = {};
var geoDir = require('path').join(__dirname, '..', 'public', 'maps');
function getFeatureProperties(geojson, done) {
  if (geojsonFirstProps[geojson]) {
    return process.nextTick(() => done(null, geojsonFirstProps[geojson]));
  }

  var location = require('path').join(geoDir, geojson);
  fs.readFile(location, 'utf-8', function (err, data) {
    if (err) { return done(err); }

    var properties;
    try {
      properties = JSON.parse(data).features[0].properties;
    } catch (e) { return done(e); }

    geojsonFirstProps[geojson] = properties;
    return done(null, properties);
  });
}

/**
 * getFeatures
 * 
 * Gets all property values of a key from a given geojson file.
 */
var geojsonKeyFeatures = {};
function getFeatures(geojson, key, done) {
  var geojsonKey = [ geojson, key ].join(':');
  if (geojsonKeyFeatures[geojsonKey]) {
    return process.nextTick(() => done(null, geojsonKeyFeatures[geojsonKey]));
  }

  var location = require('path').join(geoDir, geojson);
  fs.readFile(location, 'utf-8', function (err, data) {
    if (err) { return done(err); }

    var features;
    try {
      features = JSON.parse(data).features.map(f => f.properties[key]);
    } catch (e) { return done(e); }

    geojsonKeyFeatures[geojsonKey] = features;
    return done(null, features);
  });
}

function updateEnv(args, done) {
  done = done || function(e) { if (e) throw e; };
  fs.readFile(pj(__dirname, '..', '.env'), 'utf-8', function (err, text) {
    var lines = text.split('\n');
    var config = lines.reduce(function (conf, line) {
      var firstEq = line.indexOf('=');
      if (firstEq === -1) return conf;
      var field = line.substr(0, firstEq);
      var value = line.substr(firstEq + 1, line.length);
      conf[field] = value;
      return conf;
    }, {});
    
    for (var key in args) {
      if (key in config) {
        config[key] = args[key];
      }
    }

    var newText = Object.keys(config).map(function (field) {
      return field + '=' + config[field];
    }).join('\n');

    fs.writeFile(pj(__dirname, '..', '.env'), newText, done);
  });
}

function copyTemplateIfMissing(done) {
  done = done || function(e) { if (e) { throw e; }};
  try {
    var envStat = fs.statSync(pj(__dirname, '..', '.env'));
    if (envStat.isFile()) { return done(); }
  } catch (e) {
    if (e.code !== 'ENOENT')
      return done(new Error('Error that is not "No Entry"'));
  }
  fs.copyFile(
    pj(__dirname, '..', 'template.env'),
    pj(__dirname, '..', '.env'),
    done
    );
}

module.exports = {
  getFeatureProperties, getFeatures, updateEnv, copyTemplateIfMissing
};
