import type { RawRunRecord } from './types';

const splitCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let isQuoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      isQuoted = !isQuoted;
      continue;
    }

    if (char === ',' && !isQuoted) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);

  return values;
};

export const parseCsv = (csvText: string): RawRunRecord[] => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  const [headerLine, ...rowLines] = lines;
  if (!headerLine) {
    return [];
  }

  const headers = splitCsvLine(headerLine);

  return rowLines.map((line) => {
    const values = splitCsvLine(line);

    return headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = values[index] ?? '';
      return record;
    }, {}) as RawRunRecord;
  });
};
