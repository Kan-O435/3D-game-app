// Optional artwork dropped into src/assets: one image per slot symbol, plus the
// wall poster (one per stage, or a single general one). Anything missing falls back to the procedural placeholder, so the
// game always renders. See src/assets/README.md for the file names.

const iconModules = import.meta.glob('../assets/icons/*.{png,jpg,jpeg,webp,gif,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const posterModules = import.meta.glob('../assets/poster.{png,jpg,jpeg,webp,gif,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const stagePosterModules = import.meta.glob('../assets/posters/*.{png,jpg,jpeg,webp,gif,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** "…/03.png" -> 3 (the trailing number in the file name); null if there isn't one. */
export function parseIconId(path: string): number | null {
  const match = /(\d+)\.[a-z0-9]+$/i.exec(path)
  return match ? Number(match[1]) : null
}

function indexIcons(modules: Record<string, string>): Map<number, string> {
  const byId = new Map<number, string>()
  for (const [path, url] of Object.entries(modules)) {
    const id = parseIconId(path)
    if (id !== null) byId.set(id, url)
  }
  return byId
}

const ICON_URLS = indexIcons(iconModules)

/** URL of the image for a symbol id, if one was supplied. */
export function iconUrl(symbolId: number): string | undefined {
  return ICON_URLS.get(symbolId)
}

/** URL of the general wall poster (src/assets/poster.*), used for any stage without its own. */
export const POSTER_URL: string | undefined = Object.values(posterModules)[0]

const STAGE_POSTER_URLS = indexIcons(stagePosterModules)

/**
 * Which poster to show: the stage's own image (src/assets/posters/NN.* with NN =
 * stage number), else the general poster, else undefined (built-in poster).
 */
export function pickPosterUrl(
  byStage: ReadonlyMap<number, string>,
  general: string | undefined,
  stage: number,
): string | undefined {
  return byStage.get(stage) ?? general
}

export function posterUrlForStage(stage: number): string | undefined {
  return pickPosterUrl(STAGE_POSTER_URLS, POSTER_URL, stage)
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`could not load ${url}`))
    image.src = url
  })
}

/**
 * Draw `image` into a box: 'contain' fits it whole, 'cover' fills the box and
 * crops the overflow. `focus` (0..1, default centre) says which part of the
 * cropped axis to keep — e.g. `{ y: 0.3 }` keeps more of the top of a portrait,
 * where the face is. `zoom` (>= 1, 'cover' only) magnifies past the fit so the
 * subject fills more of the box.
 */
export function drawFitted(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource & { width: number; height: number },
  box: { x: number; y: number; w: number; h: number },
  mode: 'contain' | 'cover',
  focus: { x?: number; y?: number; zoom?: number } = {},
) {
  const zoom = mode === 'cover' ? Math.max(1, focus.zoom ?? 1) : 1
  const scale = (mode === 'contain' ? Math.min : Math.max)(box.w / image.width, box.h / image.height) * zoom
  const w = image.width * scale
  const h = image.height * scale
  ctx.save()
  ctx.beginPath()
  ctx.rect(box.x, box.y, box.w, box.h)
  ctx.clip()
  // For 'cover' the overflow (w - box.w, h - box.h) is what gets cropped; `focus`
  // picks how it's split (0.5 = evenly). For 'contain' the leftover is padding.
  const fx = focus.x ?? 0.5
  const fy = focus.y ?? 0.5
  ctx.drawImage(image, box.x + (box.w - w) * fx, box.y + (box.h - h) * fy, w, h)
  ctx.restore()
}
