import { describe, it, expect } from 'vitest'
import { resolvePkgUrl } from '../url'

describe('resolvePkgUrl', () => {
  describe('absolute URLs (returned unchanged)', () => {
    it('preserves http:// URLs', () => {
      expect(resolvePkgUrl('http://example.com/video.mp4')).toBe('http://example.com/video.mp4')
    })

    it('preserves https:// URLs', () => {
      expect(resolvePkgUrl('https://cdn.example.com/asset.png')).toBe(
        'https://cdn.example.com/asset.png'
      )
    })

    it('preserves data: URIs', () => {
      const dataUri = 'data:image/png;base64,iVBOR...'
      expect(resolvePkgUrl(dataUri)).toBe(dataUri)
    })

    it('preserves blob: URLs', () => {
      const blob = 'blob:http://localhost/abc-123'
      expect(resolvePkgUrl(blob)).toBe(blob)
    })

    it('preserves file:// URLs', () => {
      expect(resolvePkgUrl('file:///C:/media/intro.mp4')).toBe('file:///C:/media/intro.mp4')
    })

    it('preserves exhi-pkg:// URLs (already resolved)', () => {
      expect(resolvePkgUrl('exhi-pkg://pkg/contents/video.mp4')).toBe(
        'exhi-pkg://pkg/contents/video.mp4'
      )
    })
  })

  describe('relative paths (converted to exhi-pkg://)', () => {
    it('converts a simple relative path', () => {
      expect(resolvePkgUrl('contents/video.mp4')).toBe('exhi-pkg://pkg/contents/video.mp4')
    })

    it('strips leading slashes', () => {
      expect(resolvePkgUrl('/contents/image.png')).toBe('exhi-pkg://pkg/contents/image.png')
    })

    it('strips multiple leading slashes', () => {
      expect(resolvePkgUrl('///assets/font.woff2')).toBe('exhi-pkg://pkg/assets/font.woff2')
    })

    it('normalizes backslashes to forward slashes', () => {
      expect(resolvePkgUrl('contents\\subdir\\file.html')).toBe(
        'exhi-pkg://pkg/contents/subdir/file.html'
      )
    })

    it('handles mixed slashes', () => {
      expect(resolvePkgUrl('/contents\\dir/file.js')).toBe('exhi-pkg://pkg/contents/dir/file.js')
    })
  })

  describe('edge cases', () => {
    it('returns empty string for empty input', () => {
      expect(resolvePkgUrl('')).toBe('')
    })

    it('handles filename only (no directory)', () => {
      expect(resolvePkgUrl('index.html')).toBe('exhi-pkg://pkg/index.html')
    })
  })
})
