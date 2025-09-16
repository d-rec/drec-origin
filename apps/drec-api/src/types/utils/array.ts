export const arrayToMap = <T, K extends string | number, V>(
    arr: T[],
    getKey: (e: T) => K,
    getValue: (e: T) => V
): Record<K, V> => {
    const map = {} as Record<K, V>;

    for (let i = 0; i < arr.length; i++) {
        const entry = arr[i];
        map[getKey(entry)] = getValue(entry);
    }

    return map;
};
