export const isSuperset = (set1, set2) => {
  for(const val of set1) if (!set1.has(val)) return false;
  return true;
};

export const difference = (set1, set2) => {
  const dif = new Set(set1);
  set2.forEach(val => dif.delete(val));
  return dif;
}
