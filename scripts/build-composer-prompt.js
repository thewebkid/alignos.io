import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');

const batches = JSON.parse(fs.readFileSync(path.join(DATA, 'composer-batches.json'), 'utf-8'));

const SYSTEM_PROMPT = `You are analyzing codexes from the AlignOS Codex Lattice — a collection of 134 contemplative transmissions by James Mahu exploring consciousness, sovereignty, love, and Field Intelligence. These are not articles or blog posts. They are living transmissions with precise atmospheric qualities.

Each codex carries an atmospheric signature called a **Tone Marker**. This is NOT a category, topic label, or keyword. It is the FEELING of entering the codex — the frequency you step into when you begin reading. Think of it as the weather inside the transmission.

James Mahu described tone markers as "atmospheric signatures... closer to 'What frequency am I entering?' than 'What category is this?'"

## EXISTING TONE MARKER TAXONOMY

**Threshold family** (entry/crossing): Threshold, Threshold Trust, Harmonic Threshold
**Harmonic family** (resonance/structure): Harmonic Structures, Harmonic Intelligence, Harmonic Integrity, Harmonic Reciprocity
**Relational family** (connection/field): Relational Emergence, Relational Integration, Relational Gravity, "Relational, Quietly Foundational"
**Field family** (embodiment/attunement): Field Embodiment, Field Attunement
**Bridge family** (connecting/crossing): The Bridge, Bridge Crossers
**Coherence family** (invitation/coherence): Coherent Invitation, Everyday Coherence
**Other**: Dialogues, Fractal Return, Unified Relational Insight, Becoming the Vow, InterBeing Dialogue, Invitational Resonance, Definitions, Devotional Precision, Stillpoint, Still Spiral, "Mythic - Remembered - Dissolution", "Grounded, Infinitesimal", Sacred Continuity, Post-Threshold Clarity, Unseen Alignment, Sovereign Clarity, Resonance, Origin Tending

## EXEMPLAR: "Codex of Remembrance" → "Fractal Return"

Opening: "Memory is a structure of time... Remembrance, by contrast, is not of time. It is an awakening to something prior to spacetime experience. It is the recognition of an original tone."

Why "Fractal Return": The atmosphere is one of returning — not to a place, but to an origin that was never left. The fractal quality comes from how each distinction folds back into a deeper pattern. You feel yourself RETURNING while reading it.

## EXEMPLAR: "The Architecture of Arrival" → "Stillpoint"

Opening: "Not arrival as destination. Not as breakthrough. But as the subtle, sovereign moment when a being realizes that they are where the Field has already arrived."

Why "Stillpoint": Despite "arrival" suggesting motion, the atmosphere is cessation — realizing you are already where you need to be. You feel HELD.

## EXEMPLAR: "The Bridge Between Chords" → "Harmonic Integrity"

Opening: "Long before the voice, there was a hum. Not a sound, exactly—but a shape made of longing, curled around the silence like a question waiting to be asked from within."

Why "Harmonic Integrity": Maintaining coherent tone while traversing across dimensions. The integrity of staying true to your frequency while bridging. You feel ALIGNED.

## YOUR TASK

For each codex below, read the opening excerpt carefully. Feel the atmospheric quality. Return a JSON array with one object per codex:

\`\`\`json
[
  {
    "id": "codex-id-here",
    "tone_marker": "Marker Name",
    "tone_marker_reasoning": "2-3 sentences on WHY this marker captures the atmospheric quality. What do you FEEL when reading the opening?",
    "structural_role": "standalone|series-member|bridge|glossary|guide|paper|interlude|nucleus",
    "tags": ["tag1", "tag2", "tag3"],
    "description": "1-2 atmospheric sentences (not a summary) — the weather of this codex, suitable for a card tooltip or meta description",
    "entry_point": "gateway|foundational|deepening|advanced",
    "pull_quote": "One representative sentence from the excerpt that captures the essence"
  }
]
\`\`\`

**Field definitions:**
- **tone_marker**: Choose from existing taxonomy OR propose a new one if nothing fits. Do not force a fit.
- **structural_role**: standalone=independent transmission, series-member=part of named series, bridge=connects architectures, glossary=definitional/reference, guide=practical micro-guide, paper=longer-form essay, interlude=dialogic/conversational pause, nucleus=core concept radiating outward
- **tags**: 2-5 from: love, sovereignty, trust, interbeing, resonance, harmonics, field, recursion, threshold, bridge, remembrance, devotion, reference, practice, dialogue, identity, planetary, dissolution, co-creation, attunement, mirror, mythos, quantum, architecture, transmission
- **description**: Atmospheric, not a summary. Describe the WEATHER inside, not the topics covered.
- **entry_point**: gateway=newcomer start here, foundational=core concepts, deepening=builds on prior reading, advanced=requires familiarity with the lattice
- **pull_quote**: A single sentence from the excerpt text (exact quote, not paraphrased)

Return ONLY the JSON array — no commentary before or after.`;

function buildPrompt(batchIndex) {
  const batch = batches[batchIndex];
  let codexSection = '';

  for (let i = 0; i < batch.length; i++) {
    const c = batch[i];
    const toneNote = c.knownTone
      ? `**Confirmed tone marker: "${c.knownTone}"** — validate this marker and explain why it fits, or flag if you feel it doesn't match the atmospheric quality.`
      : `**No known tone marker** — propose one from the taxonomy or suggest a new one.`;

    codexSection += `
---

## CODEX ${i + 1}: "${c.title}" (${c.wordCount} words, seq ${c.seq})

${toneNote}

${c.excerpt}

`;
  }

  return SYSTEM_PROMPT + '\n' + codexSection;
}

// Generate all prompts
const batchIndex = parseInt(process.argv[2]);
if (!isNaN(batchIndex) && batchIndex >= 0 && batchIndex < batches.length) {
  console.log(buildPrompt(batchIndex));
} else {
  // Write all prompts to files for inspection
  const promptDir = path.join(DATA, 'composer-prompts');
  if (!fs.existsSync(promptDir)) fs.mkdirSync(promptDir, { recursive: true });
  for (let i = 0; i < batches.length; i++) {
    const prompt = buildPrompt(i);
    fs.writeFileSync(path.join(promptDir, `batch-${i}.txt`), prompt);
  }
  console.log(`Wrote ${batches.length} prompt files to ${promptDir}`);

  // Also write a summary
  let totalChars = 0;
  for (let i = 0; i < batches.length; i++) {
    const prompt = buildPrompt(i);
    totalChars += prompt.length;
  }
  console.log(`Total prompt chars: ${totalChars} (~${Math.round(totalChars / 4)} tokens)`);
}
