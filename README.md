# Declassified Encounters

### ▶ [Open the live site — declassified-encounters.vercel.app](https://declassified-encounters.vercel.app/)

A searchable, provenance-checked index of government UFO / UAP archives.

**Purpose:** one place where you can search declassified material from PURSUE, Project Blue Book, the FBI, CIA, NSA, the UK MoD, France's GEIPAN, Canada, Brazil, New Zealand, Australia and the Soviet KGB — and always see which kind of source you are actually reading.

No build step. No framework. Static HTML, CSS and vanilla JS. Deploys to Vercel as-is.

---

## What's inside

- **45 indexed records** — 18 collections, 25 file-level documents, 2 myths
- **Search** across titles, agencies, countries, years, tags and summaries
- **Facets** — category, agency, era, document type, provenance
- **Two views** — dense table (archive style) or cards
- **Provenance badges** — official government / institutional / mirror / no primary document
- **Record drawer** — summary, what's inside, why it matters, caution note, storage estimate, direct source link, copyable permalink
- **Sources & storage** — direct PURSUE bundle links with real sizes, plus fetch commands and disk budgeting
- **Agencies glossary** — 25 acronyms decoded (CIA, NSA, NARA, DoW, CNES, FAB, KGB…) with links
- **Myth check** — the Nixon "1960 treaty", the Greada Treaty, Valiant Thor and the Gleason story, with the archival test that debunks each
- **PURSUE timeline** — all seven 2026 releases
- **Where to go deeper** — five wider archives, with an explicit outbound-links-only policy

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

> Asset URLs are versioned (`?v=11`) and served with `must-revalidate`. When you change `styles.css` or `app.js`, bump the `?v=` number in `index.html` so returning visitors don't get a cached copy.

---

## Viewing it on your own machine

The site is fully static and loads its data through plain `<script>` tags, not `fetch`, so **you can just double-click `index.html`** and it works offline. No Node, no npm, no build step.

If you prefer a local server (recommended if you plan to edit files):

```bash
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:3000` (or `:8080`).

> Note: Vercel Analytics is skipped on `localhost` and `file://`, so local previews produce no network calls or errors.

---

## Vercel Web Analytics

This is a static site, so it uses the **script-tag** version of Vercel Analytics — not the Next.js `@vercel/analytics` React component shown in the dashboard's default instructions.

The tag is already in `index.html`:

```html
<script defer src="/_vercel/insights/script.js"></script>
```

It is injected only when the site is served from a real host (not localhost/file). To start counting:

1. Open the project in Vercel → **Analytics** tab.
2. Click **Enable** (Web Analytics).
3. Redeploy if the tab asks for it.
4. Visit the site, then check **Visitors / Page Views** in the dashboard.

The Hobby plan includes a limited monthly event allowance; check the current limit in the dashboard before relying on it.

---

## Deploy to Vercel

The current public deployment is **[declassified-encounters.vercel.app](https://declassified-encounters.vercel.app/)**.

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

## Related projects

This index is deliberately narrow — 45 records, checked by hand. The sites below go wider. They are
listed for navigation, not endorsement: none is affiliated with this project, none paid to be listed,
and their content, accuracy and licences are their own.

| Project | What it is | Notes |
|---|---|---|
| [uap-files.org](https://www.uap-files.org/) | Full-text mirror of the PURSUE releases — 188 PDFs, 7,798 OCR pages, 103 videos | CC0 data dump, `/api.json`, RSS and `/llms-full.txt` |
| [uap-archives.com](https://uap-archives.com/) | The widest record set — 11,548 files, 1,836 locations, 1944–2026 | Free to read; sells $3–25/mo membership tiers |
| [uap-archive.org](https://uap-archive.org/uap/) | Official-source pointers only, same "pointer, not authority" approach | 87 link records; published method, source policy, corrections; CC BY 4.0 dataset with DOI |
| [Co-Messi/uap-pursue](https://github.com/Co-Messi/uap-pursue) | Bulk mirror of PURSUE releases 01–04 — 178 PDFs, 21 photos, 89 videos | Public-domain material, files on disk |
| [war.gov/UFO](https://www.war.gov/UFO/) | The PURSUE portal itself | Primary source; authoritative release notes and file inventory |

Deliberately left out: sites I could not confirm are maintained, and sites that republish material
without a licence.

### Linking policy

This repository contains **outbound links only**. No third-party documents, text, images or datasets
are copied, mirrored, embedded or rehosted here — each entry points at a site exactly as its operator
publishes it. Site names and trademarks belong to their owners and are used only to identify them;
listing is not affiliation, sponsorship or endorsement, and is not a claim about a site's accuracy.
Access and licence status were checked on 24 October 2026 and can change without notice — verify with
the source before republishing anything.

---

## License

Code: MIT. See `LICENSE`.
Documents, scans and trademarks remain the property of their issuing institutions. Links are provided for research and verification.
