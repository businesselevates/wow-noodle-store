# W0W noodle store theme

Shopify theme for W0W, built on the HLT One theme (export of 25 Sep 2026, a Dawn-based theme with HLT One's `hlt-*` page sections). HLT One's layout, components and motion are kept; colours and type follow the KosmodeHealth Brand Book (26 Aug 2026), section 4, ProTEGO®:

- Colours: Deep Green `#3B4D38`, Olive `#8F9562`, Amber `#F0A81F`, Peach `#F0B189`, Cream `#F4DCB8`, Terracotta `#AE4425`. Large background washes use light tints of these; accents use the exact values. The tokens are at the top of `assets/hlt-home.css`.
- Type: Roca Two for headings, Montserrat for everything else. Roca Two is licensed, so headings use Fraunces until its files are uploaded (see below).

## The ProTEGO product page

Template: `templates/product.pdp-lander.json` ("pdp lander" in the theme editor), laid out like HLT One's bundle page (`product.bundle-lander-page.json`) with the copy from the ProTEGO wireframe (round 2, 24 Sep 2026), section for section:

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

Each pack card finds what it sells in one of two ways:

- **A product per card.** Pick it in "Product for this card". The 10-pack card is already set to the store's "10 Individual Pack, 80g" product.
- **A variant of the page's product.** With no product picked, the card takes the variant in its own position, or the one named in "Matching variant". A single product with four variants (10, 20, 40 and 100 packs, in that order) needs no other setup.

On the live store a card that finds nothing is left out, so shoppers never meet a pack that does not exist yet; the theme editor shows every card. If the 40-pack (selected on load) cannot be bought, the first card that can is selected instead.

Card and button prices come from the product or variant, and the per-pack line is worked out from the price and "Packs that arrive" (45 for 40 + 5 extra, 115 for 100 + 15). Leave "Price text" and "Per-pack line (typed)" empty so they stay in step.

Assign the template to a product under Products > the product > Theme template > `pdp-lander`, then upload images into the image slots in the theme editor. Gallery slots with no image of their own show the product's images in order.

### Roca Two

Upload `roca-two-regular.woff2`, `roca-two-bold.woff2` and `roca-two-black.woff2` under Content > Files in the Shopify admin, with exactly those names, then tick "Roca Two font files are uploaded" in the template's "HLT Page settings" section. Files uploaded there are not tied to one theme.

### Using the sections in Horizon

The store runs Horizon. The sections work there as they are; the layout needs one line in `<head>`, after Horizon's own stylesheets:

```liquid
{%- if request.design_mode or content_for_layout contains 'hlt-section' or content_for_layout contains 'elv-trusted-section' -%}
  {%- render 'hlt-assets' -%}
{%- endif -%}
```

Files to copy: `sections/hlt-{page-settings,buy-box,logos,hero,media-text,stats,compare,steps,reviews,faq}.liquid`, `sections/elv-trusted-marquee.liquid`, `snippets/hlt-{assets,icon,block}.liquid`, `assets/hlt-{home.css,home.js,buy-box.css}` and `templates/product.pdp-lander.json`. Add to cart goes through Horizon's `Shopify.actions.updateCart`, so the cart drawer and cart count update as they do for Horizon's own button.

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
