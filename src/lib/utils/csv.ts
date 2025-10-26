export function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const data = rows.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(',')
  );

  return [headers.join(','), ...data].join('\n');
}
