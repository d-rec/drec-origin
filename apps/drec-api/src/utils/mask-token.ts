export const maskToken = (token: string): string => {
  const start = token.slice(0, 3);
  const end = token.slice(-4);
  const middle = '*'.repeat(token.length - 7);
  return `${start}${middle}${end}`;
};
