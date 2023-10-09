export const arrayFromObject = <T>(obj: T): T[Extract<keyof T, string>][] => {
  const arr = [];
  for (const i in obj) {
    arr.push(obj[i]);
  }
  return arr;
};

// Can also be done with lodash: values(groupBy(list, item => JSON.stringify([ item.key1, item.key2, item.key3 ])))
export const groupByProps = <T, U, K>(
  array: T[],
  callback: (listItem: T) => U[],
): K[] => {
  const groups: any = {};
  array.forEach((item): void => {
    const group: string = JSON.stringify(callback(item));
    groups[group] = groups[group] || [];
    groups[group].push(item);
  });
  return arrayFromObject(groups);
};
