export const parseQuery = query => {
  const result = {};
  (/^\?/.test(query) ? query.substr(1) : query).split('&').forEach(pair => {
    const [key, val] = pair.split('=');
    if (key) result[key] = val;
  });
  return result;
};

export const buildQuery = (obj, query = '') => {
  const resObj = Object.assign(parseQuery(query), obj);
  let result = '?';
  for (const key in resObj) {
    if (resObj[key] != null) result += `${key}=${resObj[key]}&`;
  }
  return result.substr(0, result.length - 1);
};
