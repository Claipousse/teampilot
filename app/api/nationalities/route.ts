import { NextResponse } from 'next/server';

type RawCountry = {
  cca2: string;
  demonyms?: { fra?: { m?: string } };
};

let cache: { label: string; iso: string }[] | null = null;

const SOURCES = [
  'https://raw.githubusercontent.com/mledoze/countries/master/countries.json',
  'https://restcountries.com/v3.1/all?fields=cca2,demonyms',
];

export async function GET() {
  if (cache) return NextResponse.json(cache);

  for (const url of SOURCES) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'teampilot-app/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data: RawCountry[] = await res.json();
      const result = data
        .filter(c => c.demonyms?.fra?.m)
        .map(c => ({ label: c.demonyms!.fra!.m!, iso: c.cca2.toLowerCase() }))
        .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
      if (result.length > 0) {
        cache = result;
        return NextResponse.json(cache);
      }
    } catch {
      // try next source
    }
  }

  return NextResponse.json([], { status: 502 });
}
