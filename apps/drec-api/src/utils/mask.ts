export const mask = (token: string): string => {
  const start = token.slice(0, 3);
  const end = token.slice(-4);
  const middle = '*'.repeat(token.length - 7);
  return `${start}${middle}${end}`;
};

export const isMasked = (token: string): boolean => {
  if (token.length < 7) return false;

  const middle = token.slice(3, -4);

  return middle.length > 0 && middle.split('').every((c) => c === '*');
};
