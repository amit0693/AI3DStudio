import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
const expected = [
  ["PG-01", 3999, 1],
  ["PG-05", 3999, 1],
  ["SE-04", 2999, 1],
  ["BE-01", 349, 20],
  ["BE-03", 3499, 1],
  ["CP-02", 3900, 1],
  ["GH-04", 3999, 1],
  ["PD-01", 3199, 1],
];

function text(path) {
  return readFileSync(new URL(path, root), "utf8");
}

test("all D1 migrations apply and seed the authoritative launch catalog", () => {
  const working = mkdtempSync(join(tmpdir(), "baylayer-migrations-"));
  const database = join(working, "commerce.sqlite");
  try {
    for (const migration of [
      "drizzle/0000_slimy_frank_castle.sql",
      "drizzle/0001_nervous_the_liberteens.sql",
      "drizzle/0002_wet_switch.sql",
      "drizzle/0003_closed_may_parker.sql",
    ]) {
      execFileSync("sqlite3", [database, `.read ${new URL(migration, root).pathname}`]);
    }
    const rows = execFileSync(
      "sqlite3",
      [database, "SELECT id,base_price_cents,minimum_quantity FROM products WHERE is_active=1 ORDER BY sort_order;"],
      { encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .map((row) => row.split("|").map((value, index) => (index ? Number(value) : value)));
    assert.deepEqual(rows, expected);
    assert.equal(
      execFileSync("sqlite3", [database, "PRAGMA foreign_key_check;"], { encoding: "utf8" }),
      "",
    );
  } finally {
    rmSync(working, { recursive: true, force: true });
  }
});

test("web research catalog exposes only the same eight launch offers", () => {
  const catalog = text("app/data/catalog.ts");
  const launchIds = [...catalog.matchAll(/id:"([A-Z]{2}-\d{2})"[^\n]*status:"launch"/g)].map((match) => match[1]);
  assert.deepEqual(launchIds.sort(), expected.map(([id]) => id).sort());
  assert.match(catalog, /id:"BE-01"[^\n]*minimum:20/);
});

test("checkout is server-priced and payment state is webhook-owned", () => {
  const orders = text("app/api/orders/route.ts");
  const webhook = text("app/api/webhooks/stripe/route.ts");
  assert.match(orders, /base_price_cents \* item\.quantity/);
  assert.match(orders, /item\.quantity < product\.minimum_quantity/);
  assert.match(orders, /personalization_uploads WHERE id = \?/);
  assert.match(orders, /automatic_tax\[enabled\]/);
  assert.match(orders, /subtotalCents < FREE_SHIPPING_CENTS/);
  assert.doesNotMatch(orders, /payment_status = 'paid'/);
  assert.match(webhook, /request\.text\(\)/);
  assert.match(webhook, /verifyStripeSignature/);
  assert.match(webhook, /payment_events/);
  assert.match(webhook, /payment_status = 'paid'/);
});
