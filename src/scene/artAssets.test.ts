import { describe, expect, it, vi } from 'vitest'
import { drawFitted, parseIconId, pickPosterUrl } from './artAssets'

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
