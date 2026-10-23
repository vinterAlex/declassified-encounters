# Declassified Encounters

A searchable, provenance-checked index of government UFO / UAP archives.

**Live goal:** one place where you can search declassified material from PURSUE, Project Blue Book, the FBI, CIA, NSA, the UK MoD, France's GEIPAN, Canada, Brazil, New Zealand, Australia and the Soviet KGB — and always see which kind of source you are actually reading.

No build step. No framework. Static HTML, CSS and vanilla JS. Deploys to Vercel as-is.

---

## What's inside

- **45 indexed records** — 18 collections, 25 file-level documents, 2 myths
- **Search** across titles, agencies, countries, years, tags and summaries
- **Facets** — category, agency, era, document type, provenance
- **Two views** — dense table (archive style) or cards
- **Provenance badges** — official government / institutional / mirror / no primary document
- **Record drawer** — summary, what's inside, why it matters, caution note, direct source link, copyable permalink
- **Myth check** — the Nixon "1960 treaty", the Greada Treaty, Valiant Thor and the Gleason story, with the archival test that debunks each
- **PURSUE timeline** — all seven 2026 releases

The design is a dark ember palette with restrained cyberpunk accents (mono labels, thin grid, scanlines). No external UI libraries.

---

## Structure

```
declassified_encounters/
├── index.html
├── assets/
│   ├── styles.css
│   └── app.js
├── data/
│   ├── collections.js   # 20 archive-level records
│   └── documents.js     # 25 file-level records
├── vercel.json
├── .gitignore
├── LICENSE
└── README.md
```

### Data model

`collections.js` exposes `window.DE_COLLECTIONS = { meta, stats, records: [...] }`.
`documents.js` exposes `window.DE_DOCUMENTS = [...]`.

A record looks like:

```js
{
  id: "doc-robertson",
  kind: "document",              // collection | document | myth (derived for myths)
  title: "Report of Meetings of Scientific Advisory Panel...",
  short: "The Robertson Panel report",
  org: "CIA Office of Scientific Intelligence",
  agency: "CIA",
  country: "United States",
  category: "intelligence",      // us-federal | intelligence | international | scientific | myth
  type: "Report",
  format: "PDF",
  badge: "gov",                  // gov | institution | mirror | myth
  dateLabel: "Jan 1953",
  yearStart: 1953,
  location: "Washington, D.C.",
  release: "CIA FOIA",
  collection: "robertson-panel", // parent collection id, optional
  url: "https://www.cia.gov/...",
  urlLabel: "CIA-RDP79B00752A000300100010-4.pdf",
  summary: "...",
  inside: ["...", "..."],
  why: "...",
  caution: "...",
  tags: ["CIA", "1953", "Robertson"]
}
```

To add a record, append it to the relevant array. No rebuild needed.

---

## Run locally

Because the data is plain `<script>` files, you can just open `index.html` — but a local server is cleaner:

```bash
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:3000` (or `:8080`).

---

## Deploy to Vercel

1. Push this folder to GitHub (see below).
2. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → pick `declassified-encounters`.
3. Framework preset: **Other**. Build command: **empty**. Output directory: **`.`** (root).
4. Deploy.

Or from the CLI:

```bash
npm i -g vercel
vercel
vercel --prod
```

No environment variables are required.

---

## Provenance policy

This project is a pointer, not an authority.

- **Official government** — hosted by the issuing agency on a `.gov`, `.mil` or national-archive domain.
- **Institutional** — released by a public institution (space agency, archive, university reproduction).
- **Mirror / partial** — real material with an imperfect chain of custody.
- **No primary document** — a claim included only so it can be compared against the record.

Nothing in this index establishes non-human intelligence. "Unidentified" and "unresolved" are filing categories, not conclusions. Always cite the record group / file ID and the issuing agency.

---

## Sources

PURSUE (war.gov/UFO) · AARO · FBI Vault · CIA Reading Room · NSA FOIA · US National Archives (Project Blue Book, MJ-12 reference report) · The National Archives (UK) · CNES/GEIPAN · Library and Archives Canada · Arquivo Nacional (Brazil) · New Zealand Defence Force · National Archives of Australia · University of Colorado (Condon Report) · US Air Force (Roswell Reports) · Brookings Institution / NASA · KGB "Blue Folder" (1991).

---

## License

Code: MIT. See `LICENSE`.
Documents, scans and trademarks remain the property of their issuing institutions. Links are provided for research and verification.
