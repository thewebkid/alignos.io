"""
Content-level lattice audit: does each entry's markdown match its own PDF, and
are any two entries' texts near-duplicates?

  1. md vs PDF: share of the markdown's 5-word sequences found in the PDF, and
     the share of the PDF's found in the markdown. Low in both directions means
     the markdown holds another document's text. Low in one direction means one
     side has passages the other lacks (a different revision, or a truncation).
  2. md vs md: near-duplicate entries across the lattice.

PDFs are not in Git. Without --pdf-dir they are downloaded from the blob store
into --cache (default: the OS temp dir) and reused on later runs.

  python scripts/audit-content.py [--pdf-dir DIR] [--cache DIR] [--json OUT]

Findings are reported, never written back. Record accepted ones in
docs/lattice-known-issues.md.
"""
import itertools, json, os, pathlib, re, sys, tempfile, urllib.request

import fitz  # PyMuPDF

sys.stdout.reconfigure(encoding='utf-8')
ROOT = pathlib.Path(__file__).resolve().parent.parent
BLOB = os.environ.get('VITE_BLOB_BASE_URL', 'https://qahh5hlfi6v2odz8.public.blob.vercel-storage.com').rstrip('/')
N = 5
LOW = 0.85       # either direction below this is reported
COPY = 0.05      # both directions below this: the markdown is another document's text
DUP = 0.90       # md vs md overlap reported above this (smaller entry's sequences)


def arg(name, default=None):
    a = sys.argv[1:]
    return a[a.index(name) + 1] if name in a else default


cat = json.loads((ROOT / 'data/codex-catalog.json').read_text('utf-8'))
pdf_dir = pathlib.Path(arg('--pdf-dir') or arg('--cache') or pathlib.Path(tempfile.gettempdir()) / 'alignos-pdf-cache')
pdf_dir.mkdir(parents=True, exist_ok=True)


def pdf_path(c):
    p = pdf_dir / f"{c['id']}.pdf"
    if not p.exists():
        if arg('--pdf-dir'):
            raise SystemExit(f'missing {p}')
        urllib.request.urlretrieve(f"{BLOB}/{c['assets']['pdf']}", p)
    return p


def words(t):
    return re.findall(r"[a-z0-9]+", t.lower().replace('\u2019', "'").replace('\u200b', ' '))


def shingles(t):
    w = words(t)
    return {' '.join(w[i:i + N]) for i in range(len(w) - N + 1)}, len(w)


md_sh, pdf_sh = {}, {}
for c in cat:
    md_sh[c['id']] = shingles((ROOT / 'client/public/md' / f"{c['id']}.md").read_text('utf-8'))
    pdf_sh[c['id']] = shingles('\n'.join(pg.get_text() for pg in fitz.open(pdf_path(c))))

print('== 1. markdown vs its own PDF')
res = []
for c in cat:
    m, mw = md_sh[c['id']]
    p, pw = pdf_sh[c['id']]
    inter = len(m & p) if m and p else 0
    res.append((c, inter / len(m) if m else 0, inter / len(p) if p else 0, mw, pw))
copied = [r for r in res if r[1] < COPY and r[2] < COPY]
partial = [r for r in res if min(r[1], r[2]) < LOW and r not in copied]
print(f'{len(copied)} entries hold another document\'s text; {len(partial)} differ in one direction; {len(res) - len(copied) - len(partial)} match')
for label, rows in (('another document\'s text', copied), ('partial / different revision', partial)):
    for c, a, b, mw, pw in sorted(rows, key=lambda r: r[0]['sequence']):
        print(f"  [{label}] #{c['sequence']:>3} {c['id']}: md->pdf {a:.0%}  pdf->md {b:.0%}  (md {mw}w, pdf {pw}w)  '{c['title']}'")

print('\n== 2. near-duplicate markdown across entries')
by = {c['id']: c for c in cat}
dups = []
for a, b in itertools.combinations([c['id'] for c in cat], 2):
    sa, sb = md_sh[a][0], md_sh[b][0]
    if sa and sb:
        ov = len(sa & sb) / min(len(sa), len(sb))
        if ov > DUP:
            dups.append((ov, a, b))
print(f'{len(dups)} pair(s) above {DUP:.0%}')
for ov, a, b in sorted(dups, reverse=True):
    print(f"  {ov:.0%}  #{by[a]['sequence']} {a}  <->  #{by[b]['sequence']} {b}")

if arg('--json'):
    pathlib.Path(arg('--json')).write_text(json.dumps(dict(
        copied=[c['id'] for c, *_ in copied], partial=[c['id'] for c, *_ in partial],
        dups=[dict(overlap=round(o, 3), a=a, b=b) for o, a, b in dups]), indent=1), 'utf-8')

# Findings already recorded as open in docs/lattice-known-issues.md (`backticked-ids` under the
# "Needs ..." headings, not the "Fixed" table) do not fail the run.
issues = ROOT / 'docs/lattice-known-issues.md'
open_text = ''
if issues.exists():
    text = issues.read_text('utf-8')
    start = text.find('\n## Needs')
    open_text = text[start:] if start >= 0 else ''
known = set(re.findall(r'`([a-z0-9-]+)`', open_text))
new_copied = [c['id'] for c, *_ in copied if c['id'] not in known]
new_dups = [(a, b) for _, a, b in dups if not (a in known and b in known)]
if new_copied or new_dups:
    print(f'\nNOT in docs/lattice-known-issues.md: copied text {new_copied}, duplicate pairs {new_dups}')
    sys.exit(1)
print('\nNo unrecorded findings.')
