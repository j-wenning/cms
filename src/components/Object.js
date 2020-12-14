const stringifyRecurse = obj => {
  const result = typeof obj === typeof Object() ? {} : [];
  for (const key in obj) {
    result[key] = (() => {
      switch(typeof obj[key]) {
        case typeof Object():
        /* eslint-disable-next-line no-array-constructor, no-fallthrough */
        case typeof Array():
          return stringifyRecurse(obj[key]);
          /* eslint-disable-next-line no-new-func */
          case typeof Function():
            return obj[key].toString();
        default:
          return obj[key];
      }
    })();
  }
  return result;
};

export const stringifyFuncs = obj => stringifyRecurse(obj);

export const stringify = obj => JSON.stringify(stringifyRecurse(obj));

const isEqualSwitch = (key1, key2) => {
  let _key1 = key1;
  let _key2 = key2;
  switch(typeof _key1) {
    case typeof Object():
    /* eslint-disable-next-line no-array-constructor, no-fallthrough */
    case typeof Array():
      return isEqual(_key1, _key2);
    /* eslint-disable-next-line no-new-func */
    case typeof Function():
      _key1 = _key1.toString();
      _key2 = _key2.toString();
    /* eslint-disable-next-line no-fallthrough */
    default:
      return Object.is(_key1, _key2);
  }
}

export const isEqual = (obj1, obj2) => {
  for (const key in obj1) {
    if (!isEqualSwitch(obj1[key], obj2[key])) return false;
  }
  return true;
};
