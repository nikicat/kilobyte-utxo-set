# The Kilobyte UTXO Set

An interactive explainer of why Bitcoin wants UTXO accumulators, how Utreexo's
Merkle forest works, how SwiftSync differs, the tradeoffs, and who should run
what — for developers, with the deep dives collapsed by default.

Single self-contained `index.html`: no build step, no external assets, no
dependencies. Includes a live accumulator playground (add coins, inspect
Merkle proofs, spend and watch the proof hashes become the new roots).

## Preview locally

```
python3 -m http.server 8000
# open http://localhost:8000/
```

## Test the playground logic

The forest math (binary-counter merges, proof construction, in-place deletes)
has a headless test harness:

```
node pg_test.js
```

## Publishing

Served as-is by GitHub Pages: Settings → Pages → deploy from `main`, root.
After the first deploy, fill in the `og:url` / `canonical` placeholders in
`index.html`.

## Figures

Chain constants (~753 GB blocks, ~180 M coins, ~12 GB chainstate) are mid-2026
mainnet approximations. The playground simplifies Utreexo's position
bookkeeping (noted inline in the article); the root arithmetic is faithful.
