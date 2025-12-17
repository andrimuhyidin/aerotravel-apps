# Static Assets

## Required Files

This directory should contain the following static assets:

### Favicon
- `favicon.ico` - Browser favicon (16x16, 32x32, 48x48)

### Open Graph Images
- `og-image.jpg` - Default Open Graph image (1200x630px)
  - Used when sharing links on social media
  - Should represent your brand/app

### PWA Icons
- `icon-192x192.png` - PWA icon (192x192)
- `icon-512x512.png` - PWA icon (512x512)

See `ICONS_README.md` for PWA icon generation guide.

## Generating Assets

### Favicon
```bash
# Using online tool
# https://realfavicongenerator.net/
# https://favicon.io/
```

### Open Graph Image
```bash
# Using design tool (Figma, Photoshop, etc.)
# Size: 1200x630px
# Format: JPG or PNG
```

## Current Status

⚠️ **Placeholder files present. Replace with actual assets before production.**

---

**Note:** These files are referenced in:
- `app/layout.tsx` (metadata)
- `public/manifest.json` (PWA icons)

