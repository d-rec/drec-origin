export const getMegawattsFromWatts = (read: number): number => {
    return read / 10 ** 6;
};
