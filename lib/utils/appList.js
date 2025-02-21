'use strict';

const url = require('url');
const R = require('ramda');
const scriptData = require('./scriptData');
const { BASE_URL } = require('../constants');

const UPDATED_MAPPINGS = {
  appId: [0, 0, 0],
  title: [0, 3],
  url: {
    path: [0, 10, 4, 2],
    fun: (path) => new url.URL(path, 'https://play.google.com').toString()
  },
  icon: [0, 1, 3, 2],
  developer: [0, 14],
  summary: [0, 13, 1],
  scoreText: [0, 4, 0],
  score: [0, 4, 1]
};

const UPDATED_MAPPINGS_V2 = {
  appId: [0, 0],
  title: [3],
  url: {
    path: [10, 4, 2],
    fun: (path) => new url.URL(path, 'https://play.google.com').toString()
  },
  icon: [1, 3, 2],
  developer: [14],
  summary: [13, 1],
  scoreText: [4, 0],
  score: [4, 1]
};

const MAPPINGS = {
  title: [2],
  appId: [12, 0],
  url: {
    path: [9, 4, 2],
    fun: (path) => new url.URL(path, BASE_URL).toString()
  },
  icon: [1, 1, 0, 3, 2],
  developer: [4, 0, 0, 0],
  developerId: {
    path: [4, 0, 0, 1, 4, 2],
    fun: extaractDeveloperId
  },
  priceText: {
    path: [7, 0, 3, 2, 1, 0, 2],
    fun: (price) => price === undefined ? 'FREE' : price
  },
  currency: {
    path: [7, 0, 3, 2, 1, 0, 2],
    fun: (price) => price === undefined ? undefined : price.match(/([^0-9.,\s]+)/)[0]
  },
  price: {
    path: [7, 0, 3, 2, 1, 0, 2],
    fun: (price) => price === undefined ? 0 : parseFloat(price.match(/([0-9.,]+)/)[0])
  },
  free: {
    path: [7, 0, 3, 2, 1, 0, 2],
    fun: (price) => price === undefined
  },
  summary: [4, 1, 1, 1, 1],
  scoreText: [6, 0, 2, 1, 0],
  score: [6, 0, 2, 1, 1]
};

function extaractDeveloperId (link) {
  return link.split('?id=')[1];
}

/*
 * Apply MAPPINGS for each application in list from root path
*/

function extract (root, data, mappings = 'REGULAR') {
  const input = R.path(root, data);
  if (input === undefined) return [];

  if (mappings === 'UPDATED') {
    return R.map((app) => {
      let item = scriptData.extractor(UPDATED_MAPPINGS)(app);

      if (!item.title) {
        item = scriptData.extractor(UPDATED_MAPPINGS_V2)(app);
      }

      return item;
    }, input);
  }
  return R.map(scriptData.extractor(MAPPINGS), input);
}

module.exports = { MAPPINGS, UPDATED_MAPPINGS, UPDATED_MAPPINGS_V2, extract };
