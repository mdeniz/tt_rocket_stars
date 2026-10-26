# Theme background coverage Specification

## Purpose

Keep visual theme backgrounds continuous across short and long application pages.

## Requirements

### Requirement: Theme backgrounds cover short documents

The active theme background MUST cover the complete viewport when the page
content is shorter than the viewport.

#### Scenario: Settings page is shorter than a tall viewport

- **WHEN** a user opens Settings in a visual theme and the page content is
  shorter than the viewport
- **THEN** the document root and body are at least as tall as the viewport
- **AND** the page has no horizontal overflow
- **AND** long content remains able to extend the document and scroll normally
