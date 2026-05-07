import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface PlaceCsvRow {
  id: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
  description: string;
  average_rating: string;
  review_count: string;
  category_id: string;
  status: string;
  tag_scores: string;
  image_urls: string;
  thumbnail: string;
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];

    if (ch === '"') {
      if (inQuotes && content[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && content[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function normalizeText(input: string): string {
  return input.replace(/^"+|"+$/g, '').trim();
}

export function readPlaceCsvRows(
  csvRelativePath = 'dataset/places_vungtau_vn_only.csv',
): PlaceCsvRow[] {
  const absPath = resolve(process.cwd(), csvRelativePath);
  const raw = readFileSync(absPath, 'utf-8').replace(/^\uFEFF/, '');
  const parsed = parseCsv(raw);

  if (parsed.length <= 1) return [];
  const [header, ...lines] = parsed;
  const columns = header.map((h) => normalizeText(h));

  return lines
    .filter((line) => line.some((v) => normalizeText(v) !== ''))
    .map((line) => {
      const rec: Record<string, string> = {};
      columns.forEach((name, idx) => {
        rec[name] = normalizeText(line[idx] ?? '');
      });

      return {
        id: rec.id ?? '',
        name: rec.name ?? '',
        address: rec.address ?? '',
        lat: rec.lat ?? '',
        lng: rec.lng ?? '',
        description: rec.description ?? '',
        average_rating: rec.average_rating ?? '',
        review_count: rec.review_count ?? '',
        category_id: rec.category_id ?? '',
        status: rec.status ?? '',
        tag_scores: rec.tag_scores ?? '',
        image_urls: rec.image_urls ?? '',
        thumbnail: rec.thumbnail ?? '',
      };
    });
}

export function parseJsonField<T>(value: string): T | null {
  if (!value || value.trim() === '') return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
