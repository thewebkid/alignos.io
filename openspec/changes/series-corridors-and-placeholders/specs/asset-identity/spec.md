## ADDED Requirements

### Requirement: Series compilation PDFs are named by series id
A PDF that compiles a whole series SHALL be named `{series-id}.pdf` and referenced from that series' registry record (`compilation_pdf`). It is not a catalog entry, and its name MUST NOT collide with a catalog id.

#### Scenario: Evolution of the Sovereign compilation
- **WHEN** the registry record `the-evolution-of-the-sovereign` is read
- **THEN** its `compilation_pdf` is `the-evolution-of-the-sovereign.pdf` and that file exists in the PDF directory
