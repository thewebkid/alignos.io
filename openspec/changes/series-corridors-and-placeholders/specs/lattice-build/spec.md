## ADDED Requirements

### Requirement: Build resolves series through the registry
The lattice build SHALL read the series registry, fail when a catalog series reference does not resolve (see codex-catalog), and publish each codex's series as `{ id, name, position, total }` using the canonical record. It SHALL also publish the registry itself (with planned positions, aliases, companions, and compilation PDF) as generated JSON for the app and API.

#### Scenario: Unresolved series fails the build
- **WHEN** a catalog entry names a series not in the registry
- **THEN** the build exits with an error naming the entry and the series

#### Scenario: Series published
- **WHEN** the build completes
- **THEN** the generated series JSON contains "The Codices of Harmonic Activation" with its planned position 3

### Requirement: Series siblings are in position order
The build SHALL publish, for each positioned series member, the ordered list of positioned member ids in its series (including itself) so previous/next navigation can be derived without re-sorting. Unplaced members and earlier editions SHALL NOT appear in that list.

#### Scenario: Ordered siblings
- **WHEN** the generated entry for The Codex of the Spiral is read
- **THEN** its ordered series list is positions 1, 2, 4, 5, 6, 7 of Harmonic Activation, with the Spiral itself included

### Requirement: Build publishes edition links
The build SHALL publish `laterEditionId` on earlier editions and `earlierEditionIds` on later editions.

#### Scenario: Reverse link derived
- **WHEN** the catalog records only the earlier → later link
- **THEN** the generated later edition lists the earlier edition in `earlierEditionIds`
