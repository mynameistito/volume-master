import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");

function run(cmd: string) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: ROOT });
}

const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));
const version = pkg.version as string;
const tag = `v${version}`;

run("bunx wxt prepare");
run("bun run icons");
run("bun run check");
run("bun run typecheck");
run("bun test");
run("bun run zip");
run("bun run zip:firefox");

execSync(`git tag ${tag}`, { cwd: ROOT });
execSync(`git push origin ${tag}`, { cwd: ROOT });

const changelogPath = resolve(ROOT, "CHANGELOG.md");
let body = "";
try {
  const changelog = readFileSync(changelogPath, "utf-8");
  const sectionRegex = new RegExp(
    `## ${version.replace(".", "\\.")}\\n([\\s\\S]*?)(?=\\n## |$)`
  );
  const match = changelog.match(sectionRegex);
  if (match?.[1]) {
    body = match[1].trim();
  }
} catch {
  body = `Release ${tag}`;
}

if (!body) {
  body = `Release ${tag}`;
}

const notesPath = resolve(ROOT, ".changeset", "RELEASE_NOTES.md");
writeFileSync(notesPath, body);

run(
  `gh release create ${tag} --title "${tag}" --notes-file "${notesPath}" dist/volume-master-*.zip`
);
