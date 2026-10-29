# Proposal: CI dependency and secret security gates

Issue #267 adds local and GitHub Actions checks for high-severity locked dependency vulnerabilities and high-confidence committed secrets. Findings are reported without secret values, explicit safe fixtures remain reviewable, and hosted security services are optional.
