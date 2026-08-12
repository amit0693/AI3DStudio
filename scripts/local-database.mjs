import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const d1Directory = join(root, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
const r2Directory = join(root, ".wrangler/state/v3/r2");
const migrationsDirectory = join(root, "drizzle");
const command = process.argv[2] ?? "summary";

function sqlite(database, sql, { inherit = false } = {}) {
  const result = spawnSync("sqlite3", [database, sql], {
    encoding: inherit ? undefined : "utf8",
    stdio: inherit ? "inherit" : "pipe",
  });
  if (result.error?.code === "ENOENT") {
    throw new Error("sqlite3 is required. On macOS it is included with the system tools.");
  }
  if (result.status !== 0) {
    throw new Error((result.stderr || "sqlite3 command failed.").toString().trim());
  }
  return inherit ? "" : result.stdout.trim();
}

function databaseCandidates() {
  if (!existsSync(d1Directory)) return [];
  return readdirSync(d1Directory)
    .filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite")
    .map((name) => join(d1Directory, name));
}

function tableCount(database) {
  const value = sqlite(database, "SELECT count(*) FROM sqlite_master WHERE type='table' AND name IN ('products','orders','uploads');");
  return Number(value) || 0;
}

function resolveDatabase() {
  const candidates = databaseCandidates();
  if (!candidates.length) {
    throw new Error("No local D1 database exists yet. Run `npm run dev` once, then rerun this command.");
  }
  return candidates
    .map((database) => ({ database, score: tableCount(database) }))
    .sort((left, right) => right.score - left.score)[0].database;
}

function tableExists(database, table) {
  return sqlite(database, `SELECT count(*) FROM sqlite_master WHERE type='table' AND name='${table.replaceAll("'", "''")}';`) === "1";
}

function columnExists(database, table, column) {
  return sqlite(database, `SELECT count(*) FROM pragma_table_info('${table.replaceAll("'", "''")}') WHERE name='${column.replaceAll("'", "''")}';`) === "1";
}

function knownMigrationAlreadyApplied(database, filename) {
  if (filename.startsWith("0000_")) return tableExists(database, "products");
  if (filename.startsWith("0001_")) return columnExists(database, "products", "minimum_quantity");
  if (filename.startsWith("0002_")) return tableExists(database, "payment_events");
  if (filename.startsWith("0003_")) return tableExists(database, "personalization_uploads");
  return false;
}

function migrationFiles() {
  return readdirSync(migrationsDirectory)
    .filter((name) => /^\d{4}_.+\.sql$/.test(name))
    .sort();
}

function backup(database, label = "manual") {
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const destination = join(root, ".local-backups", `${stamp}-${label}`);
  mkdirSync(destination, { recursive: true });
  sqlite(database, `.backup '${join(destination, "database.sqlite").replaceAll("'", "''")}'`);
  if (existsSync(r2Directory)) cpSync(r2Directory, join(destination, "r2"), { recursive: true });
  writeFileSync(
    join(destination, "README.txt"),
    `BayLayer local backup\nCreated: ${new Date().toISOString()}\nDatabase source: ${database}\nStop the dev server before restoring this backup.\n`,
  );
  return destination;
}

function migrate(database) {
  const files = migrationFiles();
  if (!files.length) throw new Error("No SQL migrations were found in drizzle/.");
  const destination = backup(database, "before-migrate");
  sqlite(database, `CREATE TABLE IF NOT EXISTS _local_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  let applied = 0;
  for (const filename of files) {
    const escaped = filename.replaceAll("'", "''");
    const recorded = sqlite(database, `SELECT count(*) FROM _local_migrations WHERE name='${escaped}';`) === "1";
    if (recorded) continue;
    if (!knownMigrationAlreadyApplied(database, filename)) {
      const sql = readFileSync(join(migrationsDirectory, filename), "utf8");
      const result = spawnSync("sqlite3", ["-bail", database], { input: sql, encoding: "utf8" });
      if (result.status !== 0) throw new Error(`Migration ${filename} failed: ${(result.stderr || "unknown sqlite error").trim()}`);
      applied += 1;
    }
    sqlite(database, `INSERT INTO _local_migrations (name) VALUES ('${escaped}');`);
  }
  const activeProducts = sqlite(database, "SELECT count(*) FROM products WHERE is_active=1;");
  console.log(`Local database ready: ${database}`);
  console.log(`Applied ${applied} migration(s); ${activeProducts} active products.`);
  console.log(`Safety backup: ${destination}`);
}

function summary(database) {
  const tables = ["products", "orders", "order_items", "uploads", "personalization_uploads", "quotes", "payment_events", "waitlist_entries"];
  console.log(`Database: ${database}`);
  for (const table of tables) {
    console.log(`${table}: ${tableExists(database, table) ? sqlite(database, `SELECT count(*) FROM ${table};`) : "not migrated"}`);
  }
  console.log(`Local R2: ${existsSync(r2Directory) ? r2Directory : "not created yet"}`);
}

function openConsole(database) {
  const result = spawnSync("sqlite3", [database], { stdio: "inherit" });
  if (result.error?.code === "ENOENT") {
    throw new Error("sqlite3 is required. On macOS it is included with the system tools.");
  }
  if (result.status !== 0) throw new Error("sqlite3 console exited with an error.");
}

try {
  const database = resolveDatabase();
  if (command === "migrate") migrate(database);
  else if (command === "summary") summary(database);
  else if (command === "backup") console.log(`Backup created: ${backup(database)}`);
  else if (command === "console") openConsole(database);
  else if (command === "path") console.log(database);
  else throw new Error(`Unknown command: ${command}. Use migrate, summary, backup, console, or path.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
