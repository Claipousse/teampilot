import { NextResponse } from 'next/server';

type RawCountry = {
  cca2: string;
  demonyms?: { fra?: { m?: string } };
};

// Cache module-level : la liste des nationalités ne change jamais, inutile de la refetcher
// à chaque appel. Null tant que la première requête n'a pas abouti.
let cache: { label: string; iso: string }[] | null = null;

// Deux sources de secours : si la première est indisponible, on essaie la seconde
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
        signal:  AbortSignal.timeout(8000), // abandonne après 8s pour ne pas bloquer
      });
      if (!res.ok) continue;

      const data: RawCountry[] = await res.json();
      const result = data
        .filter(c => c.demonyms?.fra?.m)                                                // garde uniquement les pays avec un gentilé français
        .map(c => ({ label: c.demonyms!.fra!.m!, iso: c.cca2.toLowerCase() }))
        .sort((a, b) => a.label.localeCompare(b.label, 'fr'));

      if (result.length > 0) {
        cache = result;
        return NextResponse.json(cache);
      }
    } catch {
      // source indisponible, on passe à la suivante
    }
  }

  // Aucune source n'a fonctionné
  return NextResponse.json([], { status: 502 });
}
