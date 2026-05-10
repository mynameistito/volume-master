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

try {
  execSync(`git rev-parse ${tag}`, { cwd: ROOT, stdio: "pipe" });
} catch {
  execSync(`git tag ${tag}`, { cwd: ROOT });
}
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

try {
  run(
    `gh release create ${tag} --title "${tag}" --notes-file "${notesPath}" dist/volume-master-*.zip`
  );
} catch {
  run(`gh release upload ${tag} dist/volume-master-*.zip --clobber`);
}

const EXTENSION_APPID = "ejggkdaeicpnfgijniabadejblpmmdgc";
const REPO = "mynameistito/volume-master";
const chromeZipUrl = `https://github.com/${REPO}/releases/download/${tag}/volume-master-${version}-chrome.zip`;

const updatesXml = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${EXTENSION_APPID}'>
    <updatecheck codebase='${chromeZipUrl}' version='${version}' />
  </app>
</gupdate>
`;

const updatesPath = resolve(ROOT, "updates.xml");
writeFileSync(updatesPath, updatesXml);

run("git add updates.xml");
run(
  `git -c user.name="github-actions[bot]" -c user.email="github-actions[bot]@users.noreply.github.com" commit -m "chore: update updates.xml for ${tag}"`
);
run("git push origin HEAD:main");
