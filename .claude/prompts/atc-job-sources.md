# ATC Recruitment — Curated Global Source List

Use this list as the primary search target for ATC vacancy sourcing. These are
direct ANSP careers pages and reputable industry aggregators that publish
actual current vacancies (not just news about hiring). Always prefer a direct
ANSP listing URL over an aggregator's mirror.

## Tier 1 — Direct ANSP careers pages

These publish vacancies with structured fields including, in most cases, an
explicit application closing date. ALWAYS try these first.

### Europe
- **Eurocontrol** (MUAC Maastricht, Network Manager, HQ Brussels) — `jobs.eurocontrol.int`
- **NATS** (UK) — `careers.nats.aero`
- **DFS** (Germany) — `dfs.de/karriere`
- **skyguide** (Switzerland) — `skyguide.ch/en/careers`
- **DSNA** (France) — `recrutement.dgac.fr`, `enac.fr`
- **ENAV** (Italy) — `enav.it/Pagine/lavora-con-noi.aspx`
- **LFV** (Sweden) — `lfv.se/sv/karriar`
- **Avinor Flysikring** (Norway) — `avinor.no/konsern/jobb`
- **Naviair** (Denmark) — `naviair.dk/karriere`
- **Fintraffic ANS** (Finland) — `fintraffic.fi/en/careers`
- **HungaroControl** (Hungary) — `hungarocontrol.hu/career`
- **LPS SR** (Slovakia) — `lps.sk/sk/kariera`
- **ANS CR** (Czechia) — `ans.cz/kariera`
- **Croatia Control** — `crocontrol.hr/kategorija/karijera`
- **Belgocontrol / skeyes** (Belgium) — `skeyes.be/en/jobs`
- **PANSA** (Poland) — `pansa.pl/kariera`
- **NAVIAIR** see above
- **EANS** (Estonia) — `eans.ee`
- **LGS** (Latvia) — `lgs.lv`
- **AENA** (Spain — airports) and **ENAIRE** (Spain — ANSP) — `enaire.es/empleo`

### North America
- **FAA** (USA) — `usajobs.gov` (occupational series 2152 — Air Traffic Control). Open postings for facility/specialty are time-limited; deadlines visible per posting.
- **NAV Canada** — `navcanada.ca/en/careers`

### Asia-Pacific
- **Airservices Australia** — `airservicesaustralia.com/about-us/careers`
- **Airways New Zealand** — `airways.co.nz/careers`
- **CAAS / Civil Aviation Authority of Singapore** — `caas.gov.sg/who-we-are/careers`
- **AAI** (Airports Authority of India) — `aai.aero/careers`
- **JCAB / Japan** — `mlit.go.jp/koku` (vacancies via national civil service)
- **HKAS / Hong Kong** — `cad.gov.hk/english/recruit.html`

### Middle East
- **GACA** (Saudi Arabia) — `gaca.gov.sa/web/en/careers`
- **GCAA** (UAE) — `gcaa.gov.ae/en/careers`
- **GAL** (Global Aerospace Logistics, UAE) — `gal.ae/careers`
- **QCAA** (Qatar) — `caa.gov.qa/en/careers`
- **OPAS / Oman** — `caa.gov.om`

### Africa
- **ATNS** (South Africa) — `atns.com/career`
- **ASECNA** (W & C Africa, 17 states) — `asecna.aero/recrutement`
- **CAAN** (Nigeria) — `naa.gov.ng/careers`
- **KCAA** (Kenya) — `kcaa.or.ke/index.php/recruitment`

### Latin America
- **DECEA** (Brazil) — `decea.mil.br`
- **DGCA Mexico (SENEAM)** — `gob.mx/seneam`
- **AAC** (Argentina — EANA) — `eana.com.ar/oportunidades-laborales`

## Tier 2 — Aggregators (use when Tier 1 produces no results)

- **ATC Network Jobs** — `atc-network.com/jobs`
- **FlightGlobal Jobs** — `jobs.flightglobal.com` (filter "air traffic control")
- **Aviation Job Search** — `aviationjobsearch.com`
- **LinkedIn** — search "air traffic controller" with location filter; site:linkedin.com/jobs
- **IFATCA** — `ifatca.org` (occasional, federation-level)
- **Indeed** — site:indeed.com "air traffic controller" — last-resort signal only

## Tier 3 — Industry-adjacent (ATC-related but not direct controller roles)

Mention these only when no controller vacancies are found from Tier 1/2:
- **Frequentis** (ATC systems) — `frequentis.com/career`
- **Indra ATM** — `indracompany.com/careers`
- **Searidge Technologies** — `searidgetech.com/careers`
- **Aireon** — `aireon.com/careers`

## Closing Date Extraction Rules

When a vacancy listing is found, look for these phrases in the snippet/title
and extract the deadline as an ISO YYYY-MM-DD into `closingDate`:

- "Apply by [DATE]"
- "Closing date: [DATE]"
- "Application deadline: [DATE]"
- "Deadline for applications: [DATE]"
- "Open until [DATE]"
- "Vacancy closes [DATE]"
- "[N] days remaining" → convert to absolute date from today
- "Applications close [DATE]"
- European format `DD/MM/YYYY` and US format `MM/DD/YYYY` — disambiguate via the source's country (e.g., NATS UK uses DD/MM; FAA uses MM/DD).

If no closing date is stated, omit the `closingDate` field — do NOT guess.

## Category Assignment (`type` field)

- **`ACC`** — Area Control Centre / Enroute. Roles named: Area Controller,
  Enroute Controller, ACC Controller, Centre Controller, En-Route ATCO,
  Maastricht UAC controller, ARTCC controller (US).
- **`APP`** — Approach Control. Roles named: Approach Controller,
  Approach/Departure Controller (combined), Radar Approach, RAPCON,
  TRACON controller (US), APP ATCO.
- **`TWR`** — Tower / Aerodrome Control. Roles named: Tower Controller,
  Aerodrome Controller, Ground Controller, Local Controller, ATCT (US).
- For combined ratings, pick the highest-skill rating: ACC > APP > TWR.
- Trainee / OJT positions: still classify by intended end-state rating, but
  Lee does NOT want trainee postings (see prompt's EXPERIENCED-ONLY rule).
