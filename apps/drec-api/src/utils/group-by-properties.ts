export const arrayFromObject = <T>(obj: T): T[Extract<keyof T, string>][] => {
  const arr = [];
  for (const i in obj) {
    arr.push(obj[i]);
  }
  return arr;
};

export const groupByProperties = <T, U, K>(
  list: U[],
  callback: (listItem: U) => K[],
): T[Extract<keyof T, string>][] => {
  const groups: any = {} as T;
  for (let i = 0; i < list.length; i++) {
    const group: string = JSON.stringify(callback(list[i]));
    if (group in groups) {
      groups[group].push(list[i]);
    } else {
      groups[group] = [list[i]];
    }
  }
  return arrayFromObject(groups);
};

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
  return Object.keys(groups).map((group) => {
    return groups[group];
  });
};

export const hasOwnProperty = <
  X extends Record<string, unknown>,
  Y extends PropertyKey,
>(
  obj: X,
  prop: Y,
): obj is X & Record<Y, unknown> => {
  return obj.hasOwnProperty(prop);
};
