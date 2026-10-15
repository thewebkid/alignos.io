## ADDED Requirements

### Requirement: Return Room offers its readings bundle
The Begin a Return Room page SHALL offer the `return-room-readings` bundle as a single download alongside James' instruction to upload the readings to your AI, without changing his text. Individual PDFs remain available.

#### Scenario: Bundle beside the instruction
- **WHEN** a visitor reaches "We invite you to upload these PDFs to your AI"
- **THEN** a download for `/bundles/return-room-readings.md` is offered there, and the per-reading PDF links remain
