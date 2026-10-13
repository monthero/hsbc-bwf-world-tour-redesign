import fs from 'node:fs'

import { createImageStore } from '../../../server/images.ts'
import { FRAMING_OF, ImageKind, ImageSource } from '../../../src/pages/admin/schema.ts'

type ImageOverride = Partial<Record<ImageKind, string> & Record<'heroFlip' | 'photoFlip', boolean>>

const reasonOf = (e: unknown) => (e instanceof Error ? e.message : String(e))

export const syncImages = async (root: string, overridesFile: string, offline: boolean) => {
  const overrides = fs.existsSync(overridesFile)
    ? ((JSON.parse(fs.readFileSync(overridesFile, 'utf8')) as { players?: Record<string, ImageOverride> }).players ??
      {})
    : {}
  const store = createImageStore(root)
  const failed: string[] = []
  let built = 0
  let fresh = 0
  for (const [id, entry] of Object.entries(overrides)) {
    for (const kind of ImageKind.options) {
      const value = entry[kind]
      if (!value) continue
      const source = ImageSource.safeParse(value)
      if (!source.success) {
        failed.push(`${id} ${kind}: not an image source (${value})`)
        continue
      }
      try {
        if (await store.ensure(id, kind, source.data, !!entry[FRAMING_OF[kind].flip], offline)) built++
        else fresh++
      } catch (e) {
        failed.push(`${id} ${kind}: ${reasonOf(e)}`)
      }
    }
  }
  for (const f of failed) console.warn(`  ! image ${f}`)
  console.log(`images: ${built} built · ${fresh} up to date · ${failed.length} failed`)
}
