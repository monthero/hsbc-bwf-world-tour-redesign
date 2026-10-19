import { errorMessage } from '../../../server/http.ts';
import { createMediaService, mediaPhase, type MediaEvent } from '../../../server/youtube.ts';
import { all, type Db } from '../db.ts';

interface EditionRow {
  code: string;
  name: string;
  title: string;
  start: string;
  end: string;
}

export const syncVideos = async (db: Db, root: string, key: string | undefined) => {
  if (!key) {
    console.log('videos: skipped, no YOUTUBE_API_KEY');
    return;
  }
  const service = createMediaService({ key, root, persist: true });
  const events = all<EditionRow>(
    db,
    `SELECT e.code, s.name, e.title, e.start, e.end FROM editions e JOIN series s ON s.id = e.series_id
     WHERE e.cancelled = 0 ORDER BY e.start DESC`,
  ).map((e): MediaEvent => ({ ...e, year: Number(e.start.slice(0, 4)) }));
  let saved = 0;
  let missing = 0;
  for (const e of events) {
    if (mediaPhase(e) !== 'settled' || (await service.isArchived(e))) continue;
    try {
      if (await service.archive(e)) saved++;
      else missing++;
    } catch (err) {
      console.warn(`  ! videos ${e.year} ${e.name}: ${errorMessage(err)}`);
      return;
    }
  }
  console.log(`videos: ${saved} tournaments saved · ${missing} without a playlist`);
};
