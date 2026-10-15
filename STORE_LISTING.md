# Chrome Web Store listing — copy & checklist

## Name
Full Names for Productive

## Summary (max 132 chars)
See the full project, budget and service name when Productive cuts it off with "…". Just hover for a moment.

## Description
Long client, project and budget names in Productive.io often get cut off with "…", so several entries in a list or dropdown can look identical.

Full Names for Productive fixes that: hover over any cut-off name for a moment and a tooltip shows the complete text.

• Works in the time-tracking service picker, pinned and recent services, the Project management menu, sidebars and lists. It works anywhere Productive cuts text off with "…".
• Only appears when text is actually cut off.
• Never gets in the way: the tooltip ignores the mouse, so menus stay open.
• Private by design: no data collection, no network requests, no storage. It only runs on app.productive.io.

Not affiliated with or endorsed by Productive.

## Category
Workflow & Planning (or: Productivity → Tools)

## Single purpose (Privacy practices tab)
Shows the full text of names that are visually truncated with an ellipsis on app.productive.io, in a tooltip on hover.

## Permission justification
- Host access `https://app.productive.io/*` (content script): needed to detect cut-off text on Productive pages and show the tooltip there. No other sites.
- No other permissions are requested.

## Data usage disclosures
- Collects no user data: tick nothing.
- Certify: not sold to third parties, not used for unrelated purposes, not used for creditworthiness.

## Privacy policy URL
Host PRIVACY.md publicly (e.g. the GitHub file URL or GitHub Pages) and paste the link.

## Assets
- [x] Icon 128×128: `extension/icons/icon-128.png`
- [ ] At least 1 screenshot, 1280×800 (or 640×400), PNG/JPEG. Show a tooltip over the service picker, using a test or dummy project if you don't want real client names public.
- [ ] Optional: small promo tile 440×280

## Before submitting
- [ ] Bump `version` in `extension/manifest.json` for every upload
- [ ] `powershell -ExecutionPolicy Bypass -File scripts/package.ps1` → upload `dist/full-names-for-productive-<version>.zip`
- [ ] Visibility: Public (or Unlisted if you only want to share the link with colleagues)
