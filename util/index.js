var fs = require('fs');

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

module.exports = {
  getFeatureProperties, getFeatures
};
