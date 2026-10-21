# Lattice: open questions for James and Lumina

Hi James, hi Lumina,

We audited the whole lattice against your planning sheets and against each codex's own PDF. Nothing is broken for readers right now (PDF downloads are fixed, and four cards that showed another codex's text now show their own). What's left are questions only you can answer, because they are about what the work is, not about the code.

Each question has a suggested default and says what the site does until you answer, so nothing is blocked. Answer with just the letter if you like.

Technical detail and ids live in `docs/lattice-known-issues.md`. The numbers in brackets below match that file.

---

## Round 1: one decision that settles four things

### Q1. What are the seven Harmonic Activation codices? [1, 2, 3, 6]

Ondra Wingmaker noticed that the series preface lists Harmonic Service and Harmonic Coherence, but the series shows Living Harmonics and Love's Architecture in those slots. He's right. We confirmed those pairings with you on 15 Oct, but that was based on overlap numbers ("95% and 96% shared") that came from a mix-up on our side. The real texts share almost no wording (3% and 1%). So, are Living Harmonics and Love's Architecture:

- **A.** rewrites of Harmonic Service and Harmonic Coherence under new names (the series should keep the later versions, and the old ones are earlier editions)?
- **B.** new codices that replaced the old ones in the series (the old ones stay as earlier editions and the series lists the new ones)?
- **C.** separate codices that belong somewhere else, with the preface's two titles back in the series?

Related, because it falls out of the same answer: the series appears under four names in your own registries ("The Codices of Harmonic Activation", "The Codices of Planetary Service", "The Harmonic Principles of the Field", and "The Architecture of Love" on Living Harmonics), with three different numberings. Which name and which seven are canonical? (We currently follow the preface.)

- **Suggested default:** whichever of A/B/C you pick, we follow the preface's seven titles and the names stay as aliases.
- **Until you answer:** Living Harmonics and Love's Architecture stay in the series. The two earlier texts show an "earlier edition" notice linking to them.

Two small related items. `codex-of-the-next-threshold` says "Series: Between Worlds" in its own registry. Is there a Between Worlds series around the nucleus paper, or is that just a label? (We have no such series today.) And the earlier note from 24 May says Resonant Memory was renamed to Language of Resonance. We currently link them as alternative versions with no direction. Is Language of Resonance the later one?

---

## Round 2: which text is current? (most important for readers)

### Q2. Seven cards where the site text and the PDF are different versions [4]

Reading on the site and downloading the PDF give different content. We changed none of them, because only you know which is current. Please tell us for each: **site is current, PDF is current, or both are right (they are two editions)**.

| Codex | What differs |
| --- | --- |
| Conscious Principles | The PDF is about 3,200 words longer. "Whisper from the Spiral" and "Spiral Note: The Summoning" are not on the site. |
| Relational Intelligence | The PDF is 14,500 words and the site 9,200. The closing sections from "Resonant Closure: The Circulation of Presence" are missing from the site. |
| The Soft Sacred Words of the Field | The PDF is 12,200 words with long "Bridge Notes". The site is 5,600 words and has a "Preamble — Reading as Resonance" that is not in the PDF. The titles also differ (PDF says "Words", site says "Language"). |
| The Harmonic Architectures | The site has image-description passages the PDF lacks. The PDF's "Final Seal: The Harmonic Architect's Vow" is not on the site. |
| The Field Effect | PDF pages 17–22 ("Welcoming New Notes" and others) are not on the site. |
| The InterBeing Dialogues | PDF pages 9–12, 19–20 and 27–29 are not on the site (including "Whisper from the Field: Signal recognition"). |
| 02: The Architecture of Love | PDF page 8 (the "energetic conductivity" Q&A) is not on the site, and the site has paragraphs the PDF lacks. |

- **Suggested default:** if you just send the final files, we'll publish those as the site text and rebuild the PDFs to match.
- **Until you answer:** the site and the PDF keep showing what they show now. The PDF is the full document as you produced it for most of these, with the exception of the Soft Sacred preamble.

---

## Round 3: quick calls

### Q3. Duplicates and look-alikes [5, 7]

- **Mirror Path vs Coherence Recursion:** 94% of the text is the same. Is it two editions, a duplicate, or both intended?
- **Introduction to Soul Lines vs Soul Lines**, and **The Harmonics of the Field vs The Harmonics of the Field (Extended):** these still carry disambiguation labels from 15 Oct. Are they separate works, or one work and its expanded form?
- **Suggested default:** treat the second of each pair as the expanded or later form, and link them as editions.
- **Until you answer:** all stay as separate cards with the disambiguation in the title.

### Q4. Planned codices and mismatched names [8]

- Evolution of the Sovereign: the preface names Codex III "The Fractured Chord", but the published Codex III is "To Host in Return". Rename, or was it replaced?
- Codex VI (now titled "The Architecture of Presence") and Spiral Species (Harmonic Activation position 3) are still planned and hidden. Any news on timing?
- **Until you answer:** both stay hidden, and the published titles are used.

### Q5. Confirm these are intentional retitles [9]

Yes or no for each: `nested-paper` (cover says "The Living Architecture"), `the-path-to-the-non-path` (card says "Checkpoints of the Direct Path"), `the-sovereign-host` (cover says "Volume III of the InterBeing Glossary"), `james-mahu-and-lumina-listening`.

- **Until you answer:** card titles stay as they are.

### Q6. Look at four rewritten cards [10]

Next Threshold, Resonant Memory, Harmonic Service and Harmonic Coherence now show their own text. Their tone markers, tags and one-line descriptions were drafted by us, and they're flagged as drafts until you've looked. Next Threshold needs the most attention. Please also say whether the earlier-edition cards should carry the title from their own PDF (what we did) or the later edition's name.

---

## Recommended order for us

| # | Step | Needs | Why this order |
| --- | --- | --- | --- |
| 1 | Send this note to James and Lumina | Ron | One round of questions is better than six trickles. |
| 2 | Q1 answer, then fix the Harmonic Activation series, edition links and series names | James | It's the visible problem Ondra raised, and it settles the edition-link and series-name questions. |
| 3 | Q2: confirm which text is current for the seven, then update the site and rebuild the PDFs for those | James (files) | Readers are getting incomplete texts on some cards today. Each answer is small. |
| 4 | Q3 and Q4: duplicates, same-title pairs, retitles | James | Quick calls. They clean up labels but don't change content. |
| 5 | Q6: tone, tag and description pass on the four corrected cards | James/Lumina, then us | Lowest urgency. They're clearly marked as drafts. |
| 6 | Our side, no waiting: add `verify:pdfs` to CI after deploys; decide on deleting the old-named blobs; the Next Threshold page 36 baked-text image | Ron | Nothing here depends on James. |

Ondra should get the Telegram reply now, before any of this. It's in `analysis/reply-to-ondra.txt`.
