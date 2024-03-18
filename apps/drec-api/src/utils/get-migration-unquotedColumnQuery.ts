import { QueryRunner } from 'typeorm';
export async function checkColumnQuoting(query): Promise<boolean> {
  const openParenIndex = query.indexOf('(');
  // Find the index of the closing parenthesis after the opening parenthesis
  let closeParenIndex = openParenIndex + 1;
  let parenCount = 1;
  while (parenCount > 0 && closeParenIndex < query.length) {
    if (query[closeParenIndex] === '(') {
      parenCount++;
    } else if (query[closeParenIndex] === ')') {
      parenCount--;
    }
    closeParenIndex++;
  }
  // Extract everything between the opening parenthesis and the closing parenthesis
  const columnsPart = query
    .substring(openParenIndex + 1, closeParenIndex - 1)
    .trim();
  // Split by comma and trim each column definition
  const columnNames = columnsPart.split(',').map((column) => column.trim());
  const unquotedColumnNames = columnNames.filter(
    (column) => !column.startsWith('"') && !column.endsWith('"'),
  );
  return unquotedColumnNames.length === 0;
}

export async function checkAlterColumnQuoting(query): Promise<boolean> {
  const matches = query.match(
    /ALTER\s+TABLE\s+(?:\w+\.)?(\w+)\s+(ADD|ALTER|DROP)\s+(?:COLUMN\s+)?([^,;]+)/i,
  );
  if (matches && matches.length >= 4) {
    const [, tableName, action, columnDefinitions] = matches;
    const columnNames = columnDefinitions
      .split(',')
      .map((column) => column.trim().split(' ')[0]);
    const unquotedColumnNames = columnNames.filter(
      (name) => !name.startsWith('"') && !name.endsWith('"'),
    );
    // return unquotedColumnNames;
    return unquotedColumnNames.length === 0;
  }
}
