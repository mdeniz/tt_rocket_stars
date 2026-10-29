# Design

The dependency gate runs npm audit against the committed lockfile with high-severity failure policy. The secret gate scans only tracked files using high-confidence credential patterns, skips only an explicit allowlist, and reports file/pattern metadata without matched values. Existing repository, browser, and build jobs remain unchanged.
