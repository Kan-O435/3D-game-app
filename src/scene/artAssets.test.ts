import { describe, expect, it, vi } from 'vitest'
import { drawFitted, parseIconId, parseSpecialId, pickPosterUrl } from './artAssets'

describe('parseIconId', () => {
  it('reads the trailing number of the file name', () => {
    expect(parseIconId('../assets/icons/03.png')).toBe(3)
    expect(parseIconId('../assets/icons/14.webp')).toBe(14)
    expect(parseIconId('../assets/icons/icon-07.jpg')).toBe(7)
    expect(parseIconId('../assets/icons/0.svg')).toBe(0)
  })

  it('is null when there is no number', () => {
    expect(parseIconId('../assets/icons/burst.png')).toBeNull()
    expect(parseIconId('../assets/icons/README.md')).toBeNull()
  })
})

describe('drawFitted', () => {
  const fakeCtx = () => ({ save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), rect: vi.fn(), clip: vi.fn(), drawImage: vi.fn() })

  it('contain: a wide image is scaled to the box width and centred vertically', () => {
    const ctx = fakeCtx()
    drawFitted(ctx as unknown as CanvasRenderingContext2D, { width: 200, height: 100 } as never, { x: 0, y: 0, w: 100, h: 100 }, 'contain')
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 25, 100, 50)
  })

  it('cover with a focus keeps that part of a tall image (face near the top)', () => {
    const ctx = fakeCtx()
    // 100x200 into a 100x100 box: 100 px overflow vertically; focus 0.25 crops only 25% off the top
    drawFitted(ctx as unknown as CanvasRenderingContext2D, { width: 100, height: 200 } as never, { x: 0, y: 0, w: 100, h: 100 }, 'cover', { y: 0.25 })
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, -25, 100, 200)
  })

  it('cover with zoom magnifies past the fit and crops around the focus', () => {
    const ctx = fakeCtx()
    // 100x100 into 100x100 at zoom 1.5: drawn 150x150, overflow 50 split by focus (0.2, 0.4)
    drawFitted(ctx as unknown as CanvasRenderingContext2D, { width: 100, height: 100 } as never, { x: 0, y: 0, w: 100, h: 100 }, 'cover', { x: 0.2, y: 0.4, zoom: 1.5 })
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), -10, -20, 150, 150)
  })

  it('zoom is ignored for contain and never shrinks below the fit', () => {
    const a = fakeCtx()
    drawFitted(a as unknown as CanvasRenderingContext2D, { width: 200, height: 100 } as never, { x: 0, y: 0, w: 100, h: 100 }, 'contain', { zoom: 3 })
    expect(a.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 25, 100, 50)
    const b = fakeCtx()
    drawFitted(b as unknown as CanvasRenderingContext2D, { width: 100, height: 100 } as never, { x: 0, y: 0, w: 100, h: 100 }, 'cover', { zoom: 0.2 })
    expect(b.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 100, 100)
  })

  it('cover: a wide image is scaled to the box height and cropped left/right', () => {
    const ctx = fakeCtx()
    drawFitted(ctx as unknown as CanvasRenderingContext2D, { width: 200, height: 100 } as never, { x: 0, y: 0, w: 100, h: 100 }, 'cover')
    expect(ctx.drawImage).toHaveBeenCalledWith(expect.anything(), -50, 0, 200, 100)
  })
})

describe('pickPosterUrl', () => {
  const byStage = new Map([
    [1, 'stage1.png'],
    [3, 'stage3.png'],
  ])

  it('prefers the stage\'s own poster', () => {
    expect(pickPosterUrl(byStage, 'general.png', 1)).toBe('stage1.png')
    expect(pickPosterUrl(byStage, undefined, 3)).toBe('stage3.png')
  })

  it('falls back to the general poster, then to nothing (the built-in one)', () => {
    expect(pickPosterUrl(byStage, 'general.png', 2)).toBe('general.png')
    expect(pickPosterUrl(byStage, undefined, 2)).toBeUndefined()
    expect(pickPosterUrl(new Map(), undefined, 1)).toBeUndefined()
  })
})

describe('parseSpecialId', () => {
  it('accepts names or symbol numbers for the three specials', () => {
    expect(parseSpecialId('../assets/specials/flame.png')).toBe(12)
    expect(parseSpecialId('../assets/specials/star.webp')).toBe(13)
    expect(parseSpecialId('../assets/specials/Wild.PNG')).toBe(14)
    expect(parseSpecialId('../assets/specials/14.png')).toBe(14)
  })

  it('ignores anything else', () => {
    expect(parseSpecialId('../assets/specials/03.png')).toBeNull()
    expect(parseSpecialId('../assets/specials/notes.png')).toBeNull()
  })
})
