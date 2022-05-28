
const request = require('./utils/request');
const R = require('ramda');
const scriptData = require('./utils/scriptData');
const c = require('./constants');

const { UPDATED_MAPPINGS, UPDATED_MAPPINGS_V2 } = require('./utils/appList');

function buildInitialUrl (opts) {
  let category = opts.category.toUpperCase();
  if (!category) category = 'APPLICATION';
  if (!R.contains(category, R.values(c.category))) throw new Error(`Invalid category ${category}`);

  const country = opts.country ? opts.country : 'us';
  const lang = opts.lang ? opts.lang : 'en';

  return `https://play.google.com/store/apps/category/${category}?hl=${lang}&gl=${country}`;
}

function findAndGetTitle (list) {
  const title = R.find(item => R.is(String, item), list);
  return title;
}

function generateList (list) {
  return R.map((app) => {
    let item = scriptData.extractor(UPDATED_MAPPINGS)(app);

    if (!item.title) {
      item = scriptData.extractor(UPDATED_MAPPINGS_V2)(app);
    }

    return item;
  }, list);
}

function allInOneFilter (list) {
  const rList = [];
  R.forEach((item) => {
    rList.push(...item.list);
  }, list);

  return R.uniq(rList);
}

request({
  url: 'https://play.google.com/store/apps/category/GAME?hl=uk&gl=KR',
  method: 'GET',
  followRedirect: true
}).then(scriptData.parse).then(parsedObject => {
  const listOfCollections = R.path(['ds:3', 0, 1], parsedObject);
  const result = [];
  R.forEach((i) => {
    const lastItem = R.last(i);
    // варіант якщо два останніх елементи в списку це теж списки
    if (lastItem.length === 2 && R.is(Array, lastItem[0]) && R.is(Array, lastItem[1])) {
      const title = findAndGetTitle(lastItem[1]);
      const list = generateList(lastItem[0]);

      result.push({
        title,
        list
      });
    }
  }, listOfCollections);
});

function newList (opts) {
  return request({
    url: buildInitialUrl(opts),
    method: 'GET',
    followRedirect: true
  }).then(scriptData.parse).then(parsedObject => {
    const listOfCollections = R.path(['ds:3', 0, 1], parsedObject);
    let result = [];
    R.forEach((i) => {
      const lastItem = R.last(i);
      // варіант якщо два останніх елементи в списку це теж списки
      if (lastItem.length === 2 && R.is(Array, lastItem[0]) && R.is(Array, lastItem[1])) {
        const title = findAndGetTitle(lastItem[1]);
        const list = generateList(lastItem[0]);

        result.push({
          title,
          list
        });
      }
    }, listOfCollections);

    if (opts.notMerge) return result;
    return allInOneFilter(result);
  });
}

module.exports = newList;
