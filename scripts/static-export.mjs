#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const aside = path.join(root, ".static-excluded");
const excluded = ["src/app/admin/login", "src/app/api", "src/proxy.ts"];
const flat = (rel) => rel.replace(/[\\/]/g, "__");

const moved = [];
const restore = () => {
  for (const rel of moved) renameSync(path.join(aside, flat(rel)), path.join(root, rel));
  moved.length = 0;
  if (existsSync(aside)) rmSync(aside, { recursive: true, force: true });
};

try {
  const basePath = process.env.BASE_PATH ?? "";
  if (basePath && !basePath.startsWith("/")) {
    throw new Error(
      `BASE_PATH must start with "/" (got "${basePath}"). In Git Bash prefix the command with MSYS_NO_PATHCONV=1.`,
    );
  }

  mkdirSync(aside, { recursive: true });
  for (const rel of excluded) {
    const from = path.join(root, rel);
    if (!existsSync(from)) continue;
    try {
      renameSync(from, path.join(aside, flat(rel)));
    } catch (err) {
      if (err.code === "EPERM" || err.code === "EBUSY") {
        throw new Error(`Could not move ${rel} aside (the file is locked). Stop "npm run dev" and run this again.`);
      }
      throw err;
    }
    moved.push(rel);
  }

  rmSync(path.join(root, "out"), { recursive: true, force: true });
  rmSync(path.join(root, ".next/dev/types"), { recursive: true, force: true });
  rmSync(path.join(root, ".next-static"), { recursive: true, force: true });

  console.log(`[static-export] building with BASE_PATH="${basePath}"`);
  execSync("npx next build", { stdio: "inherit", env: { ...process.env, STATIC_EXPORT: "1", BASE_PATH: basePath } });

  renameSync(path.join(root, ".next-static"), path.join(root, "out"));
  writeFileSync(path.join(root, "out", ".nojekyll"), "");
  console.log("[static-export] done -> out/");
} finally {
  restore();
}
