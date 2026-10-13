import fs from 'node:fs';
import path from 'node:path';

export interface Output {
  write: (rel: string, content: string) => void;
  prune: () => number;
}

const sameContent = (file: string, content: string) => fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content;

const filesUnder = (dir: string): string[] =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? filesUnder(full) : [full];
      })
    : [];

const removeEmptyDirs = (dir: string, root: string) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }))
    if (entry.isDirectory()) removeEmptyDirs(path.join(dir, entry.name), root);
  if (dir !== root && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
};

export const createOutput = (root: string): Output => {
  const written = new Set<string>();
  return {
    write: (rel, content) => {
      const file = path.join(root, rel);
      written.add(file);
      if (sameContent(file, content)) return;
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, content);
      fs.renameSync(tmp, file);
    },
    prune: () => {
      const stale = filesUnder(root).filter((file) => !written.has(file));
      for (const file of stale) fs.rmSync(file);
      if (fs.existsSync(root)) removeEmptyDirs(root, root);
      return stale.length;
    },
  };
};
