# Tasks

## Workflow implementation

- [x] 1.1 Add a changed-file classifier with a conservative full-suite fallback for pull requests, pushes, and manual runs.
- [x] 1.2 Keep the repository check always present, using lightweight documentation/OpenSpec validation only for documentation-only changes.
- [x] 1.3 Gate the browser matrix on the classifier while preserving all four browser projects for executable or mixed changes.
- [x] 1.4 Add local validation for the workflow structure and representative classification cases.

## Verification

- [ ] 2.1 Verify the documentation-only path through the workflow or an equivalent isolated GitHub Actions run.
- [ ] 2.2 Verify the full-suite path still passes repository checks and all browser projects.
- [ ] 2.3 Document the safety fallback and the expected check behavior for reviewers.
