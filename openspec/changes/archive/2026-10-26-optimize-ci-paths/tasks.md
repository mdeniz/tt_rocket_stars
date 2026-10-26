# Tasks

## Workflow implementation

- [x] 1.1 Add a changed-file classifier with a conservative full-suite fallback for pull requests, pushes, and manual runs.
- [x] 1.2 Keep the repository check always present, using lightweight documentation/OpenSpec validation only for documentation-only changes.
- [x] 1.3 Gate the browser matrix on the classifier while preserving all four browser projects for executable or mixed changes.
- [x] 1.4 Add local validation for the workflow structure and representative classification cases.

## Verification

- [x] 2.1 Verify the documentation-only path through the workflow or an equivalent isolated GitHub Actions run.
- [x] 2.2 Verify the full-suite path still passes repository checks and all browser projects.
- [x] 2.3 Document the safety fallback and the expected check behavior for reviewers.

Verification evidence:

- Documentation-only path: GitHub Actions run [40385773455](https://github.com/mdeniz/tt_rocket_stars/actions/runs/40385773455) ran the scope classifier and lightweight repository checks; the browser matrix was skipped.
- Full-suite path: GitHub Actions run [40384799390](https://github.com/mdeniz/tt_rocket_stars/actions/runs/40384799390) passed repository checks and all four browser projects, with 51 tests passing in each browser project.
- Safety fallback: unknown, manual, empty, and non-documentation paths set `full_suite=true`; the workflow description in `docs/ci-scope-verification.md` records this reviewer-facing behavior.
