import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`https://baylayer.test${path}`, {
      headers: { accept: "text/html", host: "baylayer.test" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the BayLayer Labs storefront", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Custom 3D Printing in the Bay Area \| BayLayer Labs<\/title>/i);
  assert.match(html, /Good ideas deserve/);
  assert.match(html, /THE FIRST DROP/);
  assert.match(html, /CUSTOM PRINT STUDIO/);
  assert.match(html, /AI OBJECT SCAN/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site/i);
});

test("ships installable-app assets and removes the starter preview", async () => {
  const [manifest, serviceWorker, layout, page, packageJson] = await Promise.all([
    readFile(new URL("public/manifest.webmanifest", root), "utf8"),
    readFile(new URL("public/sw.js", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);

  assert.equal(JSON.parse(manifest).name, "BayLayer Labs");
  assert.match(serviceWorker, /baylayer-shell-v1/);
  assert.match(layout, /PwaRegistration/);
  assert.match(layout, /openGraph/);
  assert.match(page, /StorefrontExperience/);
  assert.match(packageJson, /"name": "baylayer-labs-storefront"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("app/_sites-preview/SkeletonPreview.tsx", root)));
});
