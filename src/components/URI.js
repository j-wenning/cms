export const parseQuery = query => {
  const result = {};
  (/^\?/.test(query) ? query.substr(1) : query).split('&').forEach(pair => {
    const [key, val] = pair.split('=');
    result[key] = val;
  });
  return result;
};

export const buildQuery = (obj, query) => {
  const resObj = {};
  let result = '';
  switch (typeof query) {
    case typeof Object():
    case typeof String():
      break;
    default:
      return console.error('Invalid query type');
  }
  Object.assign(resObj, typeof query === typeof Object() ? query : parseQuery(query));
  Object.assign(resObj, obj);
  for (const key in resObj) result += `${key}=${resObj[key]}&`;
  return '?' + result.substr(0, result.length - 1);
};
