# Proposal: Optimize CI by Change Scope

## Problem

The CI workflow currently runs repository checks and all four Playwright browser projects for every pull request, including documentation-only and OpenSpec-only changes. This consumes runner time without exercising application behavior that the change cannot affect.

## Proposal

Classify the files changed by each event in a dedicated workflow job. Run lightweight documentation/OpenSpec validation for documentation-only changes and run the complete repository and browser checks whenever application code, tests, assets, dependencies, build configuration, or workflow configuration may be affected.

## Scope

- Add deterministic changed-file classification for pull requests, pushes, and manual runs.
- Preserve stable check names for repository and browser jobs.
- Keep full browser coverage for mixed changes and all potentially executable changes.
- Validate OpenSpec and Markdown hygiene for documentation-only changes.

## Out of Scope

- Changing application runtime behavior.
- Reducing browser coverage for code or test changes.
- Changing branch protection or repository rulesets.
