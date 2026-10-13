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

The store runs Horizon. The sections work there without touching any of Horizon's own files: the "HLT Page settings" section at the top of the template, and the buy box, load the fonts, `hlt-home.css` and `hlt-home.js` themselves. Keep "HLT Page settings" at the top of any template that uses these sections.

Files to copy: `sections/hlt-{page-settings,buy-box,logos,hero,media-text,stats,compare,steps,reviews,faq}.liquid`, `sections/elv-trusted-marquee.liquid`, `snippets/hlt-{assets,icon,block}.liquid`, `assets/hlt-{home.css,home.js,buy-box.css}` and `templates/product.pdp-lander.json`. Add to cart goes through Horizon's `Shopify.actions.updateCart`, so the cart drawer and cart count update as they do for Horizon's own button.

"Choose your pack size" buttons scroll to `#hlt-buy-box-packs`, the pack cards, not the top of the page.

### Waiting on content

Everything below is in the template and needs only the asset or a switch in the theme editor:

- All images, including the real 80g pack render (gallery image 5) and the back-of-pack panel photo (gallery image 7, section 12).
- Videos and names for section 10. The cards still show `[Title]` and `[Name]`.
- Teats and 5 Star Chicken Rice (section 02) are switched off until each is confirmed as launched.
- Venue logos and award logos. Until they are uploaded, the names show as text.
- The "4.9 across 14 reviews" pill in the buy box and the section 11 heading depend on the Wix reviews being migrated.

## The Our story page

Template: `templates/page.our-story.json` ("our-story" in the theme editor), built from the About page wireframe (draft 1, 13 Oct 2026). The copy is the wireframe's, word for word.

| # | Wireframe section | Theme section |
|---|---|---|
| A01 | Hero | `hlt-hero`, text beside image, H1, text link to ProTEGO® |
| A02 | Why we started | `hlt-media-text` |
| A03 | Our name | `hlt-name` (new): two zero tiles, the W0W® logo, the ProTEGO® card |
| A04 | How we got here | `hlt-timeline` (new) |
| A05 | The people | `hlt-people` (new) |
| A06 | Recognition | `hlt-logos` twice, "Featured in" then the awards, wrapping rows; the awards carry the `awards` anchor |
| A07 | Where to find us | `hlt-media-text`, then `hlt-logos` for the venues |
| A08 | For food makers | `hlt-band` (new) |
| A09 | Final call to action | `hlt-hero`, centred, with Bella's line above the heading |

### Setting it up

1. Online Store > Pages > Add page: title "Our story", handle `our-story`, theme template `our-story`.
2. Search engine listing on the same page: title "Our story | W0W® ProTEGO® noodles, made in Singapore", description "W0W® is made in Singapore by KosmodeHealth, an NUS spin-off. ProTEGO® noodles carry 25g of protein a pack, made with second-life ingredients."
3. Online Store > Navigation > URL redirects: `/aboutus` to `/pages/our-story`.
4. Point the "Our story" menu item, the homepage's "Read our story" link and the footer's "Awards" link (`/pages/our-story#awards`) at the page.

Files to copy into Horizon, on top of the ProTEGO page's: `sections/hlt-{name,timeline,people,band}.liquid` and `templates/page.our-story.json`, plus the updated `sections/hlt-{hero,media-text,logos}.liquid`, `snippets/hlt-block.liquid` and `assets/hlt-home.css`.

### What fills in by itself

- The 31.9g in the ProTEGO® card comes from the product's `w0w.protein_per_100g` metafield (product: 10 Individual Pack), so it changes when Sunflower ProTEGO® replaces the recipe. 31.9 is used if the metafield is empty.
- Hero and final call to action link to the 10 Individual Pack product. It opens with the 40-pack selected once the product uses the `pdp-lander` template (it is on the default product template today).
- Images left empty: the A07 tasting photo and the A09 dishes band are left out on the live store until chosen; people without a photo show as text cards. The A01 hero and A02 diagram show a placeholder until uploaded.

### Waiting on KosmodeHealth

- Years for Barley Fresh and ProTEGO®: both entries have "Year still to confirm" ticked, so they show no year on the live store. Untick and type the year once known, then reorder the entries.
- "Work with KosmodeHealth" (A08): the band stays off the live store until its link is set.
- Instagram link (A07): the store has no Instagram address in its settings, so the link stays hidden until one is added to the button.
- Venues: Teats, Five Star Kampung Chicken Rice, Grand Mercure Roxy, Pasta Mama and TSquared Eats are switched off until they serve ProTEGO®.
- Logo files for the press, awards and venues; until uploaded each shows its name.
- Founders' photo (A01), portraits (A05), the W0W® logo and ProTEGO® lockup (A03).
- Florence's two or three sentences on why they started: they replace the A05 quote.

## Other templates

The homepage, the pantry pages and the other HLT One templates are still in the theme with HLT One's content. Replace them with W0W's content or delete them before this theme is published.
