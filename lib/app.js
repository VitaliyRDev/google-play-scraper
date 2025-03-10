'use strict';

const R = require('ramda');
const queryString = require('querystring');
const request = require('./utils/request');
const scriptData = require('./utils/scriptData');
const debug = require('debug')('google-play-scraper');
const cheerio = require('cheerio');
const { BASE_URL } = require('./constants');

const PLAYSTORE_URL = `${BASE_URL}/store/apps/details`;

function app (opts) {
  return new Promise(function (resolve, reject) {
    if (!opts || !opts.appId) {
      throw Error('appId missing');
    }

    opts.lang = opts.lang || 'en';
    opts.country = opts.country || 'us';

    const qs = queryString.stringify({
      id: opts.appId,
      hl: opts.lang,
      gl: opts.country
    });
    const reqUrl = `${PLAYSTORE_URL}?${qs}`;

    const options = Object.assign({
      url: reqUrl,
      followRedirect: true
    }, opts.requestOptions);

    request(options, opts.throttle)
      .then(scriptData.parse)
    // comment next line to get raw data
    // .then(scriptData.extractor(MAPPINGS_UPDATED))
      .then((parsedData) => {
        let extractedData;
        try {
          extractedData = scriptData.extractor(MAPPINGS)(parsedData);
        } catch (error) {
          extractedData = scriptData.extractor(MAPPINGS_UPDATED)(parsedData);
        }

        return extractedData;
      })
      .then(R.assoc('appId', opts.appId))
      .then(R.assoc('url', reqUrl))
      .then(resolve)
      .catch(reject);
  });
}

const defFn = (c) => c;

const MAPPINGS_UPDATED = {
  // FIXME add appId
  title: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 0, 0],
    fun: defFn
  },
  description: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 72, 0, 1],
    fun: descriptionText
  },
  descriptionHTML: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 72, 0, 1],
    fun: defFn
  },
  summary: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 73, 0, 1],
    fun: defFn
  },
  installs: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 13, 0],
    fun: defFn
  },
  minInstalls: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 13, 1],
    fun: defFn
  },
  maxInstalls: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 13, 2],
    fun: defFn
  },
  score: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 51, 0, 1],
    fun: defFn
  },
  scoreText: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 51, 0, 0],
    fun: defFn
  },
  ratings: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 51, 2, 1],
    fun: defFn
  },
  reviews: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 51, 3, 1],
    fun: defFn
  },
  histogram: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 51, 1],
    fun: buildHistogram
  },
  price: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 57, 0, 0, 0, 0, 1, 0, 0],
    fun: (val) => val / 1000000 || 0
  },
  free: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 57, 0, 0, 0, 0, 1, 0, 0],
    // considered free only if price is exactly zero
    fun: (val) => val === 0
  },
  currency: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 57, 0, 0, 0, 0, 1, 0, 1],
    fun: defFn
  },
  priceText: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 57, 0, 0, 0, 0, 1, 0, 2],
    fun: priceText
  },
  available: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 13, 2],
    fun: Boolean
  },
  offersIAP: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 19, 0],
    fun: Boolean
  },
  IAPRange: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 19, 0],
    fun: defFn
  },
  size: {
    useServiceRequestId: 'Ws7gDc',
    path: [0],
    fun: defFn
  },
  // new version of an website is not response with 'Varies with device' anymore, so if version is not available it's equals to VARY.
  androidVersion: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 140, 0, 0, 0],
    fun: (version) => version || 'VARY'
  },
  androidVersionText: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 140, 0, 0, 0],
    fun: (version) => version ? `${version} and up` : `Varies with device`
  },
  developer: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 68, 0],
    fun: defFn
  },
  developerId: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 68, 1, 4, 2],
    fun: (devUrl) => devUrl.split('id=')[1]
  },
  developerEmail: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 69, 1, 0],
    fun: defFn
  },
  developerWebsite: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 69, 0, 5, 2],
    fun: defFn
  },
  developerAddress: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 69, 2, 0],
    fun: defFn
  },
  privacyPolicy: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 99, 0, 5, 2],
    fun: defFn
  },
  developerInternalID: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 68, 1, 4, 2],
    fun: (devUrl) => devUrl.split('id=')[1]
  },
  genre: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 79, 0, 0, 0],
    fun: defFn
  },
  genreId: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 79, 0, 0, 2],
    fun: defFn
  },
  // Coudn't find path for familyGenre and familyGenreId, it may be removed from Google Play, but if you know hot to get it, you're welcome to contribute!
  familyGenre: {
    useServiceRequestId: 'Ws7gDc',
    path: [0, 12, 13, 1, 0],
    fun: defFn
  },
  familyGenreId: {
    useServiceRequestId: 'Ws7gDc',
    path: [0, 12, 13, 1, 2],
    fun: defFn
  },
  icon: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 95, 0, 3, 2],
    fun: defFn
  },
  headerImage: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 96, 0, 3, 2],
    fun: defFn
  },
  screenshots: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 78, 0],
    fun: (screenshots) => {
      if (screenshots === null) return [];
      return screenshots.map(R.path([3, 2]));
    }
  },
  video: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 100, 0, 0, 3, 2],
    fun: defFn
  },
  videoImage: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 100, 0, 1, 3, 2],
    fun: defFn
  },
  contentRating: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 9, 0],
    fun: defFn
  },
  contentRatingDescription: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 9, 2, 1],
    fun: defFn
  },
  adSupported: {
    useServiceRequestId: 'Ws7gDc',
    path: [0, 1, 2, 48, 0],
    fun: Boolean
  },
  released: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 10, 0],
    fun: defFn
  },
  updated: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 145, 0, 1, 0],
    fun: (ts) => ts * 1000
  },
  // new version of an website is not response with 'Varies with device' anymore, so if version is not available it's equals to VARY.
  version: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 140, 0, 0, 0],
    fun: (version) => version || 'Varies with device'
  },
  recentChanges: {
    useServiceRequestId: 'Ws7gDc',
    path: [1, 2, 144, 1, 1],
    fun: defFn
  },
  comments: {
    useServiceRequestId: 'oCPfdb',
    path: [0],
    fun: extractComments
  },
  editorsChoice: {
    useServiceRequestId: 'Ws7gDc',
    path: [0, 12, 15, 0],
    fun: Boolean
  },
  // Coudn't find path for features, it may be removed from Google Play, but if you know hot to get it, you're welcome to contribute!
  features: {
    path: [],
    fun: () => []
  }
};

const MAPPINGS = {
  // FIXME add appId
  title: ['ds:5', 0, 0, 0],
  description: {
    path: ['ds:5', 0, 10, 0, 1],
    fun: descriptionText
  },
  descriptionHTML: ['ds:5', 0, 10, 0, 1],
  summary: ['ds:5', 0, 10, 1, 1],
  installs: ['ds:5', 0, 12, 9, 0],
  minInstalls: ['ds:5', 0, 12, 9, 1],
  maxInstalls: ['ds:5', 0, 12, 9, 2],
  score: ['ds:6', 0, 6, 0, 1],
  scoreText: ['ds:6', 0, 6, 0, 0],
  ratings: ['ds:6', 0, 6, 2, 1],
  reviews: ['ds:6', 0, 6, 3, 1],
  histogram: {
    path: ['ds:6', 0, 6, 1],
    fun: buildHistogram
  },

  price: {
    path: ['ds:3', 0, 2, 0, 0, 0, 1, 0, 0],
    fun: (val) => val / 1000000 || 0
  },
  free: {
    path: ['ds:3', 0, 2, 0, 0, 0, 1, 0, 0],
    // considered free only if price is exactly zero
    fun: (val) => val === 0
  },
  currency: ['ds:3', 0, 2, 0, 0, 0, 1, 0, 1],
  priceText: {
    path: ['ds:3', 0, 2, 0, 0, 0, 1, 0, 2],
    fun: priceText
  },
  available: {
    path: ['ds:5', 0, 12, 11, 0],
    fun: Boolean
  },
  offersIAP: {
    path: ['ds:5', 0, 12, 12, 0],
    fun: Boolean
  },
  IAPRange: ['ds:5', 0, 12, 12, 0],
  size: ['ds:8', 0],
  androidVersion: {
    path: ['ds:8', 2],
    fun: normalizeAndroidVersion
  },
  androidVersionText: ['ds:8', 2],
  developer: ['ds:5', 0, 12, 5, 1],
  developerId: {
    path: ['ds:5', 0, 12, 5, 5, 4, 2],
    fun: (devUrl) => devUrl.split('id=')[1]
  },
  developerEmail: ['ds:5', 0, 12, 5, 2, 0],
  developerWebsite: ['ds:5', 0, 12, 5, 3, 5, 2],
  developerAddress: ['ds:5', 0, 12, 5, 4, 0],
  privacyPolicy: ['ds:5', 0, 12, 7, 2],
  developerInternalID: ['ds:5', 0, 12, 5, 0, 0],
  genre: ['ds:5', 0, 12, 13, 0, 0],
  genreId: ['ds:5', 0, 12, 13, 0, 2],
  familyGenre: ['ds:5', 0, 12, 13, 1, 0],
  familyGenreId: ['ds:5', 0, 12, 13, 1, 2],
  icon: ['ds:5', 0, 12, 1, 3, 2],
  headerImage: ['ds:5', 0, 12, 2, 3, 2],
  screenshots: {
    path: ['ds:5', 0, 12, 0],
    fun: (screenshots) => {
      if (screenshots === null) return [];
      return screenshots.map(R.path([3, 2]));
    }
  },
  video: ['ds:5', 0, 12, 3, 0, 3, 2],
  videoImage: ['ds:5', 0, 12, 3, 1, 3, 2],
  contentRating: ['ds:5', 0, 12, 4, 0],
  contentRatingDescription: ['ds:5', 0, 12, 4, 2, 1],
  adSupported: {
    path: ['ds:5', 0, 12, 14, 0],
    fun: Boolean
  },
  released: ['ds:5', 0, 12, 36],
  updated: {
    path: ['ds:5', 0, 12, 8, 0],
    fun: (ts) => ts * 1000
  },
  version: ['ds:8', 1],
  recentChanges: ['ds:5', 0, 12, 6, 1],
  comments: {
    useServiceRequestId: 'UsvDTd',
    path: [0],
    fun: extractComments
  },
  editorsChoice: {
    path: ['ds:5', 0, 12, 15, 0],
    fun: Boolean
  },
  features: {
    path: ['ds:5', 0, 12, 16],
    fun: extractFeatures
  }
};

function extractFeatures (featuresArray) {
  if (featuresArray === null) {
    return [];
  }

  const features = featuresArray[2] || [];

  return features.map(feature => ({
    title: feature[0],
    description: R.path([1, 0, 0, 1], feature)
  }));
}

function descriptionText (description) {
  // preserve the line breaks when converting to text
  const html = cheerio.load('<div>' + description.replace(/<br>/g, '\r\n') + '</div>');
  return html('div').text();
}

function priceText (priceText) {
  return priceText || 'Free';
}

function normalizeAndroidVersion (androidVersionText) {
  const number = androidVersionText.split(' ')[0];
  if (parseFloat(number)) {
    return number;
  }

  return 'VARY';
}

function buildHistogram (container) {
  if (!container) {
    return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  }

  return {
    1: container[1][1],
    2: container[2][1],
    3: container[3][1],
    4: container[4][1],
    5: container[5][1]
  };
}

/**
 * Extract the comments from google play script array
 * @param {array} comments The comments array
 */
function extractComments (comments) {
  if (!comments) {
    return [];
  }

  debug('comments: %O', comments);

  return R.compose(
    R.take(5),
    R.reject(R.isNil),
    R.pluck(4))(comments);
}

module.exports = app;
