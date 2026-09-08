export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      if (field !== '' || row.length > 0) {
        row.push(field)
        rows.push(row)
      }
      row = []
      field = ''
    } else {
      field += ch
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const [header, ...dataRows] = rows
  return {
    columns: header ?? [],
    rows: dataRows.map((r) => r.map(coerceValue)),
  }
}

function coerceValue(raw) {
  const value = raw.trim()
  return value !== '' && Number.isFinite(Number(value)) ? Number(value) : value
}

export function csvToChartData(csv) {
  const labels = csv.rows.map((row) => String(row[0] ?? ''))
  const series = csv.columns.slice(1).map((name, seriesIndex) => ({
    name,
    values: csv.rows.map((row) => {
      const value = row[seriesIndex + 1]
      return typeof value === 'number' ? value : 0
    }),
  }))
  return { labels, series }
}