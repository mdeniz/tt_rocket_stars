# CI scope verification

The CI workflow classifies the complete pull request diff before scheduling checks.

- Documentation-only changes run the scope classifier and repository documentation checks.
- Source, test, asset, dependency, build, workflow, and unknown changes run the repository checks and all browser projects.
- Manual runs and changes that cannot be classified conservatively use the full suite.

The browser jobs remain visible as skipped for documentation-only pull requests. This keeps the required repository check present while avoiding unnecessary browser installation and execution.
