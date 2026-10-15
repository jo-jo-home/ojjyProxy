# Neutral public surface

## Scope

Neutralize first-party page branding, engine display labels and URLs emitted by the application.
Keep source attribution, required licenses and a functioning source offer. This is not a promise of
invisibility, filtering bypass, anonymous traffic, or a keyword-free executable engine.

The user's request names proxy, Scramjet, Titanium and network. Existing vendor request filenames
are already neutral. Remaining safe targets are shell/login/PWA branding, display metadata, the
encoded-content route, app asset URLs, and direct publication of implementation directories.

Do not apply a blanket case-insensitive substitution to JavaScript or WebAssembly. `Proxy` is a
standard JavaScript API; upstream names also participate in cross-worker RPC, emitted code,
WebAssembly imports, database names, and retained website sessions. Renaming those without a
separate compatible engine build/migration would be a correctness/data-loss risk. Keep legal names
and native APIs rather than falsely reporting a zero-match scan.

## Design

- Change the encoded-content prefix to `/runtime/content/` consistently in all engine adapters and
  generated configuration. Runtime scope remains `/runtime/` so the service-worker boundary does not
  change. Other existing neutral asset URLs remain stable; no blanket response transformation.
- Edit first-party display text explicitly. Do not rewrite proxied destinations, arbitrary
  destination query strings, native API names, binary/vendor bodies, or persisted settings keys.
- Render the short brand `ojjy` and generic engine labels (`Engine stable`, `Engine A0`, etc.) in
  page/login/PWA and published configuration. Preserve engine IDs, actual package pins, attribution,
  saved preferences, protocol names, and third-party/native identifiers.
- Move the full About/credits copy to an explicitly opened legal resource, with a source link and
  the existing author acknowledgements intact. Legal resources are not claimed to be masked.
- Block direct `/vendor/` and source-map routes. Required licenses/notices remain available through
  their existing endpoints; vendor files are loaded through the controlled runtime route.
- Preserve concurrent headless-engine changes by working from a clean worktree. Do not commit or
  overwrite the other working tree's changes. Any integration must touch only this task's files.

## Verification

Unit/server tests cover traversal, content-prefix configuration, stable storage names, unmodified
vendor/WASM bytes, legal/source access, metadata labels and compatibility URLs. Browser tests record
the shell/runtime request paths and verify neutral emitted asset/content URLs, working engines, page
navigation, saved data and access to legal information. Run the existing full deep browser matrix
without dropping known failures or claiming existing excluded checks passed.

## Unavoidable / operator-controlled exposure

The current public hostnames and relay URLs are environment configuration and can still contain
identifying names. Source repositories, licenses, native API names, upstream executable internals,
destination addresses and monitoring software remain visible through their respective channels.
Changing those hostnames requires an operator's deployment/DNS changes, not a text replacement.
