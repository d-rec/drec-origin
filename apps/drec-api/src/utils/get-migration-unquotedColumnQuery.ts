import { QueryRunner } from 'typeorm';
export async function checkColumnQuoting(query): Promise<boolean> {
  const openParenIndex = query.indexOf('(');
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

  const columnsPart = query.substring(openParenIndex + 1, closeParenIndex - 1).trim();
  const columnNames = columnsPart.split(',').map(column => column.trim());
  const unquotedColumnNames = columnNames.filter(column => !column.startsWith('"') && !column.endsWith('"'));
  return unquotedColumnNames.length === 0;
}

export async function checkAlterColumnQuoting(query):Promise<boolean>{
  const matches = query.match(/ALTER\s+TABLE\s+(?:\w+\.)?(\w+)\s+(ADD|ALTER|DROP)\s+(?:COLUMN\s+)?([^,;]+)/i);
  if (matches && matches.length >= 4) {
      const [, tableName, action, columnDefinitions] = matches;
      const columnNames = columnDefinitions.split(',').map(column => column.trim().split(' ')[0]);
      const unquotedColumnNames = columnNames.filter(name => !name.startsWith('"') && !name.endsWith('"'));
      return unquotedColumnNames.length === 0;
  }
}

