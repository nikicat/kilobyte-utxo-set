// Headless harness: stub enough DOM to run the playground logic and assert forest math.
const fs = require("fs");
const html = fs.readFileSync(__dirname + "/index.html", "utf8");
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];

function el(tag) {
  return {
    tag, style: {}, dataset: {}, children: [], attrs: {}, listeners: {},
    textContent: "", innerHTML: "", className: "", disabled: false,
    classList: {
      add() {}, remove() {}, contains() { return false; },
    },
    setAttribute(k, v) { this.attrs[k] = v; },
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); c.parentNode = null; },
    addEventListener(t, fn) { this.listeners[t] = fn; },
    get firstChild() { return this.children[0] || null; },
  };
}
const ids = {};
["canvas", "edges", "roots", "bits", "msg", "btn-add", "btn-spend", "btn-reset"].forEach(i => (ids[i] = el(i)));
global.document = {
  getElementById: i => ids[i],
  createElement: t => el(t),
  createElementNS: (ns, t) => el(t),
};
global.window = {
  matchMedia: () => ({ matches: true }), // reduced motion -> near-sync timers
};
global.requestAnimationFrame = fn => fn();

eval(src);
const pg = global.window.__pg;

const heights = () => pg.forest().map(t => t.height).sort((a, b) => b - a).join(",");
const assert = (cond, msg) => { if (!cond) { console.error("FAIL:", msg); process.exitCode = 1; } else console.log("ok:", msg); };

function settle(cb) { setTimeout(cb, 30); } // reduced-motion timers fire at 0ms

// initial: 6 coins = 110b -> 4-tree + 2-tree
assert(pg.count() === 6, "reset gives n=6");
assert(heights() === "2,1", "6 coins -> trees of heights [2,1], got " + heights());

// proof for a leaf in the 4-tree has 2 siblings
const p = pg.proofOf("leaf-a");
assert(p && p.siblings.length === 2, "proof for 'a' has 2 siblings");
assert(p.path[0] === pg.forest()[0], "path starts at the 4-tree root");

// spend 'a': 4-tree dissolves into [1-tree,0-tree]; 1-trees merge with existing 2-tree's sibling
pg.select("leaf-a");
pg.spend();
settle(() => {
  assert(pg.count() === 5, "after spend n=5, got " + pg.count());
  assert(heights() === "2,0", "5 coins -> heights [2,0] after cascade, got " + heights());
  // add coins up to the cap
  let i = 0;
  (function addLoop() {
    if (pg.count() < 15 && i++ < 20) { pg.add(); return settle(addLoop); }
    assert(pg.count() === 15, "cap reached at n=15, got " + pg.count());
    assert(heights() === "3,2,1,0", "15 = 1111b -> heights [3,2,1,0], got " + heights());
    pg.add(); // should be a no-op at cap
    settle(() => {
      assert(pg.count() === 15, "add is a no-op at the cap");
      // spend a leaf from the 8-tree: proof has 3 siblings
      const leafId = "leaf-" + pg.forest()[0] && (function f(n){return n.left?f(n.left):n.id})(pg.forest()[0]);
      const pr = pg.proofOf(leafId);
      assert(pr && pr.siblings.length === 3, "proof in 8-tree has 3 siblings");
      pg.select(leafId);
      pg.spend();
      settle(() => {
        assert(pg.count() === 14, "after 2nd spend n=14, got " + pg.count());
        assert(heights() === "3,2,1", "14 = 1110b -> heights [3,2,1], got " + heights());
        console.log(process.exitCode ? "TESTS FAILED" : "ALL TESTS PASSED");
      });
    });
  })();
});
