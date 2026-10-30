import { errorMessage } from '../../../server/http.ts';
import { createImageStore } from '../../../server/images.ts';
import { FRAMING_OF, ImageKind, imageSlot, ImageSource } from '../../../src/pages/admin/schema.ts';
import { readOverrides } from '../util.ts';

export const syncImages = async (root: string, overridesFile: string, offline: boolean) => {
  const overrides = readOverrides(overridesFile);
  const store = createImageStore(root);
  const failed: string[] = [];
  const keep = new Set<string>();
  let built = 0;
  let fresh = 0;
  for (const [id, entry] of Object.entries(overrides)) {
    for (const kind of ImageKind.options) {
      const value = entry[kind];
      if (!value) continue;
      keep.add(imageSlot(id, kind));
      const source = ImageSource.safeParse(value);
      if (!source.success) {
        failed.push(`${id} ${kind}: not an image source (${value})`);
        continue;
      }
      try {
        if (await store.ensure(id, kind, source.data, !!entry[FRAMING_OF[kind].flip], offline)) built++;
        else fresh++;
      } catch (e) {
        failed.push(`${id} ${kind}: ${errorMessage(e)}`);
      }
    }
  }
  for (const f of failed) console.warn(`  ! image ${f}`);
  const removed = keep.size ? await store.prune(keep) : 0;
  console.log(`images: ${built} built · ${fresh} up to date · ${removed} removed · ${failed.length} failed`);
};
