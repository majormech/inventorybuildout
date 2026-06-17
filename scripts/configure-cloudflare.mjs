import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, "..");

const targetPaths = [
  resolve(workspaceRoot, "wrangler.jsonc"),
  resolve(workspaceRoot, "downloadable", "wrangler.jsonc")
].filter((targetPath) => existsSync(targetPath));

const options = parseArgs(process.argv.slice(2));

if (options.help || !hasUpdateOptions(options)) {
  printUsage(options.help ? 0 : 1);
}

validateUuidOption("staging-db-id", options["staging-db-id"]);
validateUuidOption("production-db-id", options["production-db-id"]);

for (const targetPath of targetPaths) {
  const config = JSON.parse(readFileSync(targetPath, "utf8"));

  if (options["staging-worker-name"]) {
    config.name = options["staging-worker-name"];
  }

  const stagingDatabase = ensureDatabaseConfig(config, "d1_databases");
  if (options["staging-db-name"]) {
    stagingDatabase.database_name = options["staging-db-name"];
  }
  if (options["staging-db-id"]) {
    stagingDatabase.database_id = options["staging-db-id"];
  }

  config.env ??= {};
  config.env.production ??= {
    name: "dfd-inventory",
    vars: {
      APP_NAME: "Decatur Fire Department Inventory",
      AI_PROVIDER: "mock"
    },
    d1_databases: [
      {
        binding: "DB",
        database_name: "dfd_inventory_prod",
        database_id: "00000000-0000-0000-0000-000000000000",
        migrations_dir: "./migrations"
      }
    ]
  };

  if (options["production-worker-name"]) {
    config.env.production.name = options["production-worker-name"];
  }

  const productionDatabase = ensureDatabaseConfig(
    config.env.production,
    "d1_databases"
  );
  if (options["production-db-name"]) {
    productionDatabase.database_name = options["production-db-name"];
  }
  if (options["production-db-id"]) {
    productionDatabase.database_id = options["production-db-id"];
  }

  writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`Updated ${targetPath}`);
}

console.log("");
console.log("Next steps:");
console.log("  1. npm run db:migrate:remote:staging");
console.log("  2. npm run deploy:staging");

if (options["production-db-id"] || options["production-db-name"]) {
  console.log("  3. npm run db:migrate:remote:production");
  console.log("  4. npm run deploy:production");
}

function ensureDatabaseConfig(config, key) {
  config[key] ??= [
    {
      binding: "DB",
      database_name: "dfd_inventory",
      database_id: "00000000-0000-0000-0000-000000000000",
      migrations_dir: "./migrations"
    }
  ];

  if (!Array.isArray(config[key]) || config[key].length === 0) {
    throw new Error(`Expected ${key} to contain at least one D1 database binding.`);
  }

  return config[key][0];
}

function hasUpdateOptions(parsedOptions) {
  return Object.entries(parsedOptions).some(
    ([key, value]) => key !== "help" && Boolean(value)
  );
}

function parseArgs(argv) {
  const parsed = { help: false };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
      continue;
    }

    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for argument: ${token}`);
    }

    parsed[key] = value;
    index += 1;
  }

  return parsed;
}

function printUsage(exitCode) {
  console.log("Usage:");
  console.log(
    "  npm run cf:configure -- --staging-db-id <UUID> [--production-db-id <UUID>]"
  );
  console.log("");
  console.log("Optional flags:");
  console.log("  --staging-db-name <name>");
  console.log("  --production-db-name <name>");
  console.log("  --staging-worker-name <worker-name>");
  console.log("  --production-worker-name <worker-name>");
  process.exit(exitCode);
}

function validateUuidOption(optionName, value) {
  if (!value) {
    return;
  }

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(value)) {
    throw new Error(`Expected --${optionName} to be a UUID, received "${value}".`);
  }
}
