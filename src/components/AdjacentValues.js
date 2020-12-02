export const getAdjVals = (val, padding, lowerBound, upperBound) => {
  const result = [];
  let lowerVal = val - padding;
  let upperVal = val + padding;
  const lowerExcess = Math.max(lowerBound - lowerVal, 0)
  const upperExcess = Math.max(upperVal - upperBound, 0);
  lowerVal = Math.max(lowerVal - upperExcess, lowerBound);
  upperVal = Math.min(upperVal + lowerExcess, upperBound);
  for (let i = lowerVal; i <= upperVal; ++i) result.push(i);
  return result;
}
