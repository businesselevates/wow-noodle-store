# W0W noodle store theme

Shopify theme for W0W, built on the HLT One theme (export of 25 Sep 2026, a Dawn-based theme with HLT One's `hlt-*` page sections). HLT One's layout, components and motion are kept; the colours and type are W0W's.

## The ProTEGO product page

Template: `templates/product.protego-bundle.json`, laid out like HLT One's bundle page (`product.bundle-lander-page.json`) with the copy from the ProTEGO wireframe (round 2, 24 Sep 2026), section for section:

| # | Wireframe section | Theme section |
|---|---|---|
| 01 | Gallery and buy box | `hlt-buy-box`, "Pack sizes" mode |
| 02 | Served at | `hlt-logos`, one row |
| 03 | Hook | `hlt-hero`, text over image |
| 04 | The problem | `hlt-media-text` |
| 05 | The swap | `hlt-media-text` |
| 06 | The number | `hlt-stats` |
| 07 | Taste | `hlt-media-text` |
| 08 | Comparison | `hlt-compare` (bar chart and table) |
| 09 | How to cook it | `hlt-steps` |
| 10 | Real people eating it | `elv-trusted-marquee` |
| 11 | Reviews | `hlt-reviews` |
| 12 | What is in it | `hlt-media-text` |
| 13 | Second life | `hlt-media-text` |
| 14 | Awards | `hlt-logos`, grid |
| 15 | FAQ | `hlt-faq` |
| 16 | Final call to action | `hlt-hero`, centred text with the image underneath |

### Setting up the product

1. Create the product with one option (for example "Pack size") and four variants in this order: 10 packs, 20 packs, 40 packs, 100 packs.
2. Set the product's theme template to `protego-bundle`.
3. The pack cards pick their variant by position. To match by name instead, fill in "Matching variant" on each Pack card block.
4. Card and button prices come from the variants. The "Price text" field on a card overrides the card only, so leave it empty.
5. Upload images into the image slots in the theme editor (gallery images in the buy box, then each section).

"Choose your pack size" buttons scroll to `#hlt-buy-box-packs`, the pack cards, not the top of the page.

### Waiting on content

Everything below is in the template and needs only the asset or a switch in the theme editor:

- All images, including the real 80g pack render (gallery image 5) and the back-of-pack panel photo (gallery image 7, section 12).
- Videos and names for section 10. The cards still show `[Title]` and `[Name]`.
- Teats and 5 Star Chicken Rice (section 02) are switched off until each is confirmed as launched.
- Venue logos and award logos. Until they are uploaded, the names show as text.
- The "4.9 across 14 reviews" pill in the buy box and the section 11 heading depend on the Wix reviews being migrated.

## Other templates

The homepage, the pantry pages and the other HLT One templates are still in the theme with HLT One's content. Replace them with W0W's content or delete them before this theme is published.
