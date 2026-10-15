import { memo } from 'react';

import type { NewsBlock } from '~/api/schemas';
import { NewsImage } from '~/components/news';
import { IconExternal, IconYouTube } from '~/components/ui';
import { thumbUrl, watchUrl } from '~/utils/media';

import { FIGURE_SIZES, FIGURE_WIDTHS } from '../../constants';
import { Runs } from './Runs';

import classes from './Blocks.module.css';

type Of<T extends NewsBlock['type']> = Extract<NewsBlock, { type: T }>;

const HEADINGS = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;

const Heading = memo<{ block: Of<'heading'> }>(({ block }) => {
  const Tag = HEADINGS[block.level as keyof typeof HEADINGS] ?? 'h2';
  return (
    <Tag className={classes.heading}>
      <Runs runs={block.runs} />
    </Tag>
  );
});

const Quote = memo<{ block: Of<'quote'> }>(({ block }) => (
  <figure className={classes.quote}>
    <blockquote>
      <Runs runs={block.runs} />
    </blockquote>
    {block.cite && <figcaption>{block.cite}</figcaption>}
  </figure>
));

const List = memo<{ block: Of<'list'> }>(({ block }) => {
  const Tag = block.ordered ? 'ol' : 'ul';
  return (
    <Tag className={classes.list}>
      {block.items.map((runs, i) => (
        <li key={i}>
          <Runs runs={runs} />
        </li>
      ))}
    </Tag>
  );
});

const Figure = memo<{ block: Of<'image'> }>(({ block }) => (
  <figure className={classes.figure}>
    <NewsImage
      image={block.image}
      ratio="natural"
      widths={FIGURE_WIDTHS}
      sizes={FIGURE_SIZES}
      className={classes.figureImage}
    />
    {block.image.caption && <figcaption>{block.image.caption}</figcaption>}
  </figure>
));

const Video = memo<{ block: Of<'video'> }>(({ block }) => (
  <a
    href={watchUrl(block.id)}
    target="_blank"
    rel="noreferrer"
    className={classes.video}
    aria-label={`Watch on YouTube: ${block.title ?? 'highlights'}`}
  >
    <span className={classes.videoThumb}>
      <img src={thumbUrl(block.id)} alt="" loading="lazy" />
      <span className={classes.play}>
        <IconYouTube />
      </span>
    </span>
    <span className={classes.videoText}>
      <span className={classes.videoTitle}>{block.title ?? 'Watch the highlights'}</span>
      <IconExternal className={classes.videoCta} />
    </span>
  </a>
));

export const Block = memo<{ block: NewsBlock }>(({ block }) => {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className={classes.paragraph}>
          <Runs runs={block.runs} />
        </p>
      );
    case 'heading':
      return <Heading block={block} />;
    case 'quote':
      return <Quote block={block} />;
    case 'list':
      return <List block={block} />;
    case 'image':
      return <Figure block={block} />;
    case 'video':
      return <Video block={block} />;
    case 'divider':
      return <hr className={classes.divider} />;
  }
});
