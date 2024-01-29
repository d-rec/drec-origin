export const asyncReduce = async <T, U>(
  array: T[],
  callback: (previousValue: U, currentValue: T) => Promise<U>,
  initialValue: U,
): Promise<U> => {
  let result = initialValue;

  for (const item of array) {
    result = await callback(result, item);
  }

  return result;
};
