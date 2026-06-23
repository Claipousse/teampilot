import { NextResponse } from 'next/server';

type RawCountry = {
  cca2: string;
  demonyms?: { fra?: { m?: string }; eng?: { m?: string } };
};

type NatEntry = { label_fr: string; label_en: string; iso: string };

let cache: NatEntry[] | null = null;

const SOURCES = [
  'https://raw.githubusercontent.com/mledoze/countries/master/countries.json',
  'https://restcountries.com/v3.1/all?fields=cca2,demonyms',
];

export async function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get('lang') ?? 'fr';

  if (!cache) {
    for (const url of SOURCES) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'teampilot-app/1.0' },
          signal:  AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;

        const data: RawCountry[] = await res.json();
        const result = data
          .filter(c => c.demonyms?.fra?.m)
          .map(c => ({
            label_fr: c.demonyms!.fra!.m!,
            label_en: c.demonyms?.eng?.m ?? c.demonyms!.fra!.m!,
            iso: c.cca2.toLowerCase(),
          }))
          .sort((a, b) => a.label_fr.localeCompare(b.label_fr, 'fr'));

        if (result.length > 0) { cache = result; break; }
      } catch {
        // source indisponible, on passe à la suivante
      }
    }
  }

  if (!cache) return NextResponse.json([], { status: 502 });

  const sorted =
    lang === 'en'
      ? [...cache].sort((a, b) => a.label_en.localeCompare(b.label_en, 'en'))
      : cache;

  return NextResponse.json(sorted.map(n => ({ label: lang === 'en' ? n.label_en : n.label_fr, iso: n.iso })));
}
