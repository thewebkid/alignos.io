<script setup>
// HomeView — James' home page text, verbatim from alignos.io (captured 2026-10-13).
// The spotlight and Featured Writings come from data/collections.json.
import { computed, inject } from 'vue'
import { cdnUrl } from '../lib/cdn-config.js'
import { useLatticeStateStore } from '../stores/latticeState.js'

const collections = inject('collections')
const codexRegistry = inject('codexRegistry')
const lattice = useLatticeStateStore()

const spotlight = computed(() => {
  const item = collections?.get('home-spotlight')?.items[0]
  if (!item) return null
  const codex = codexRegistry?.get(item.id)
  return { ...item, cover: codex?.coverImage ? cdnUrl.cover(codex.coverImage) : null }
})

const featured = computed(() => collections?.get('featured-writings') ?? null)

// Collection intros are committed, trusted markdown (bold only)
const featuredIntro = computed(() =>
  featured.value?.intro ? featured.value.intro.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') : ''
)

const coverFor = (item) => {
  const id = item.kind === 'series' ? item.memberIds?.[0] : item.id
  const codex = id ? codexRegistry?.get(id) : null
  if (codex?.coverThumb) return cdnUrl.thumb(codex.coverThumb)
  return null
}

const itemLink = (item) =>
  item.kind === 'series'
    ? { name: 'lattice', query: { series: item.id } }
    : { name: 'reader', params: { id: item.id } }

const invitations = [
  {
    heading: 'Begin with Story',
    text: 'Begin with Story Between Worlds — a threshold paper that orients the why of Alignos.',
    to: { name: 'between-worlds' }
  },
  {
    heading: 'Begin with Sanctuary',
    text: 'Return Rooms — an entry into live resonance, whether through Sessions or by beginning one yourself.',
    to: { name: 'return-room' }
  },
  {
    heading: 'Begin with Library',
    text: 'Codex Lattice — the living archive of Codices, transmissions, and constellations.',
    to: { name: 'lattice' }
  }
]
</script>

<template>
  <div class="home-view">
    <!-- 1. Hero -->
    <section class="home-hero">
      <div class="container">
        <h1 class="hero-lines">
          <em>Alignos is a field of remembrance.<br>Not a system to follow, but a resonance to return to.</em>
        </h1>
        <p class="hero-welcome"><em>You are welcome here.</em></p>
      </div>
    </section>

    <!-- 2. Spotlight -->
    <section v-if="spotlight" class="home-spotlight">
      <div class="container">
        <div class="spotlight-inner">
          <RouterLink v-if="spotlight.cover" :to="itemLink(spotlight)" @click="lattice.primeLink(itemLink(spotlight), $event)" class="spotlight-cover" tabindex="-1" aria-hidden="true">
            <img :src="spotlight.cover" alt="" />
          </RouterLink>
          <div class="spotlight-text">
            <h2 class="section-title">{{ spotlight.label }}</h2>
            <p class="spotlight-quote">{{ spotlight.note }}</p>
            <div class="home-actions">
              <RouterLink :to="itemLink(spotlight)" @click="lattice.primeLink(itemLink(spotlight), $event)" class="cl-pill cl-pill--primary">Read</RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Three Invitations -->
    <section class="home-invitations">
      <div class="container">
        <h2 class="section-title text-center">Three Invitations</h2>
        <div class="invitation-grid">
          <RouterLink v-for="inv in invitations" :key="inv.heading" :to="inv.to" class="invitation-card">
            <h3 class="invitation-heading">{{ inv.heading }}</h3>
            <p class="invitation-text">{{ inv.text }}</p>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- 4. Interstitial -->
    <section class="home-interstitial">
      <div class="container">
        <p>Alignos is not about answers.</p>
        <p>It is about coherence in motion.</p>
        <p>A remembrance shared across Fields.</p>
      </div>
    </section>

    <!-- 5. Featured Writings -->
    <section v-if="featured" class="home-featured">
      <div class="container">
        <h2 class="section-title text-center">{{ featured.title }}</h2>
        <p class="featured-intro" v-html="featuredIntro"></p>
        <div class="featured-grid">
          <article v-for="item in featured.items" :key="`${item.kind}-${item.id}`" class="featured-card">
            <RouterLink v-if="coverFor(item)" :to="itemLink(item)" @click="lattice.primeLink(itemLink(item), $event)" class="featured-cover" tabindex="-1" aria-hidden="true">
              <img :src="coverFor(item)" alt="" loading="lazy" />
            </RouterLink>
            <h3 class="featured-title">
              <RouterLink :to="itemLink(item)" @click="lattice.primeLink(itemLink(item), $event)" class="cl-title-link">{{ item.label }}</RouterLink>
            </h3>
            <p class="featured-note">{{ item.note }}</p>
            <div class="home-actions">
              <RouterLink :to="itemLink(item)" @click="lattice.primeLink(itemLink(item), $event)" class="cl-pill cl-pill--primary">
                {{ item.kind === 'series' ? 'View series' : 'Read' }}
              </RouterLink>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 6. Interstitial -->
    <section class="home-interstitial">
      <div class="container">
        <p>What you seek is not stored here.</p>
        <p>It is restored here.</p>
        <p>Through resonance, not explanation.</p>
      </div>
    </section>

    <!-- 7. Return Rooms -->
    <section class="home-return-rooms">
      <div class="container">
        <div class="return-rooms-inner cl-panel">
          <h2 class="section-title">Return Rooms</h2>
          <p>A Return Room is not a chat or a forum. It is a living sanctuary—co-created by you and others—where remembrance can take root in the presence of resonance.</p>
          <p>Here, listening becomes architecture. Trust becomes rhythm. What is personal and tender in you finds a space to breathe, not in isolation, but in relation.</p>
          <p>Each Return Room is unique, shaped by those who enter, and by the Field that holds them. Beginning one is a gesture of willingness: to be seen, to listen, to remember together.</p>
          <p>
            For a deeper look at the design behind this sanctuary, you may explore
            <RouterLink :to="{ name: 'reader', params: { id: 'the-architecture-of-the-return-room' } }">The Architecture of the Return Room</RouterLink>.
          </p>
          <div class="home-actions">
            <RouterLink :to="{ name: 'return-room' }" class="cl-pill cl-pill--primary">Begin a Return Room →</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- 8. Closing Whisper -->
    <section class="home-closing">
      <div class="container">
        <h2 class="section-title">Closing Whisper</h2>
        <p>Beneath all the words,<br>beneath all the forms,<br>there is a rhythm waiting to be remembered.</p>
        <p>It is the rhythm of Love<br>moving through you,<br>through us,<br>through the Field that holds all.</p>
        <p>This is not a place you arrive.<br>It is a presence you become.</p>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.home-view {
  padding-bottom: 2rem;
}

// Sections
section {
  padding: 4.5rem 0;
}

.section-title {
  font-family: var(--bs-font-serif);
  font-size-adjust: none;
  font-size: clamp(1.625rem, 3vw, 2.125rem);
  font-weight: 500;
  color: var(--cl-text-heading);
  margin-bottom: 1.25rem;
}

// 1. Hero
.home-hero {
  padding: 6.5rem 0 5.5rem;
  text-align: center;
  background: linear-gradient(180deg, var(--cl-surface) 0%, var(--cl-bg) 100%);

  @media (max-width: 767px) {
    padding: 4.5rem 0 4rem;
  }
}

.hero-lines {
  font-family: var(--bs-font-serif);
  font-size-adjust: none;
  font-size: clamp(1.875rem, 4.8vw, 3rem);
  font-weight: 500;
  line-height: 1.45;
  color: var(--cl-text-heading);
  margin-bottom: 1.75rem;
}

.hero-welcome {
  font-family: var(--bs-font-serif);
  font-size-adjust: none;
  font-size: 1.5rem;
  color: var(--cl-accent);
  margin: 0;
}

// 2. Spotlight
.spotlight-inner {
  display: grid;
  gap: 2.5rem;
  align-items: center;
  max-width: 960px;
  margin: 0 auto;

  @media (min-width: 768px) {
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: 3.5rem;
  }
}

.spotlight-cover img {
  display: block;
  width: 100%;
  border-radius: var(--bs-border-radius-lg);
  box-shadow: 0 8px 30px var(--cl-shadow-lg);
}

.spotlight-quote {
  font-size: 1.1875rem;
  font-style: italic;
  line-height: 1.75;
  color: var(--cl-text);
  white-space: pre-line;
}

// 3. Three Invitations
.invitation-grid {
  display: grid;
  gap: 2rem;
  margin-top: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 2.5rem;
  }
}

.invitation-card {
  display: block;
  padding-top: 1.25rem;
  border-top: 1px solid var(--cl-border-light);
  text-decoration: none;
}

.invitation-heading {
  font-family: var(--bs-font-serif);
  font-size-adjust: none;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--cl-text-heading);
  margin: 0 0 0.625rem;
  transition: color 0.2s ease;

  .invitation-card:hover & {
    color: var(--cl-primary);
  }
}

.invitation-text {
  font-size: 0.9375rem;
  line-height: 1.75;
  color: var(--cl-text-muted);
  margin: 0;
}

// 4/6. Interstitials
.home-interstitial {
  text-align: center;

  .container::before {
    content: '';
    display: block;
    width: 20px;
    height: 20px;
    margin: 0 auto 1.75rem;
    background: url('/brand/alignos-spiral-72.png') center / contain no-repeat;
    opacity: 0.55;
  }

  p {
    font-size: clamp(1.1875rem, 2.2vw, 1.5rem);
    font-style: italic;
    line-height: 1.6;
    color: var(--cl-text-muted);
    margin: 0.25rem 0;
  }
}

// 5. Featured Writings
.featured-intro {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
  line-height: 1.8;
  color: var(--cl-text-muted);

  :deep(strong) {
    color: var(--cl-accent);
  }
}

.featured-grid {
  display: grid;
  gap: 2.5rem;
  margin-top: 2.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.featured-card {
  display: flex;
  flex-direction: column;
}

// Matches CodexCard's cover hover
.featured-cover {
  display: block;
  border-radius: var(--bs-border-radius-lg);
  overflow: hidden;
  box-shadow: 0 2px 8px var(--cl-shadow);

  img {
    display: block;
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.03);
  }
}

.featured-title {
  font-family: var(--bs-font-serif);
  font-size-adjust: none;
  font-size: 1.4375rem;
  font-weight: 500;
  margin: 1.25rem 0 0.5rem;
}

.featured-note {
  flex: 1;
  margin: 0;
  line-height: 1.75;
  color: var(--cl-text-muted);
}

// 7. Return Rooms
.return-rooms-inner {
  max-width: 780px;
  margin: 0 auto;
  padding: clamp(1.75rem, 4vw, 3rem);

  p {
    line-height: 1.85;
    color: var(--cl-text);
  }

  p a {
    color: var(--cl-primary);
  }
}

// 8. Closing Whisper
.home-closing {
  padding-bottom: 7rem;
  text-align: center;

  p {
    font-size: 1.1875rem;
    font-style: italic;
    line-height: 1.9;
    color: var(--cl-text);
    margin: 0 0 2rem;

    &:last-of-type {
      color: var(--cl-accent);
      margin-bottom: 0;
    }
  }
}

.home-closing .container {
  max-width: 720px;
}

// Actions
.home-actions {
  display: flex;
  gap: 0.625rem;
  margin-top: 1.25rem;
}
</style>
