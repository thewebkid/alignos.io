## ADDED Requirements

### Requirement: Build publishes related works and alternative versions
The lattice build SHALL publish each series' `relatedIds`. It SHALL publish `alternativeVersionIds` on each codex that has them. A related work MUST NOT appear in that series' ordered member list.

#### Scenario: Four Frequencies
- **WHEN** the generated series record for The Architecture of Love is read
- **THEN** `relatedIds` includes `the-four-frequencies-of-love` and `members` does not

#### Scenario: Alternative pair
- **WHEN** the generated entry for `codex-of-the-next-threshold` is read
- **THEN** `alternativeVersionIds` includes `codex-on-becoming-a-portal`
