# Dr Hauschka Singapore: Horizon cart files

These files belong to the **unpublished "Horizon" theme** on the Dr Hauschka Singapore store (theme ID 188937994418), not to the W0W theme in the rest of this repo. They are kept here until Dr Hauschka has a repo of its own. Only the files the cart work touches are copied, so this is not a full theme.

The live theme ("Dawn Aug 2026 Theme") is not touched.

## Task P2-22g: cart drawer and cart page

Built to `cart-drawer-wireframe-2026-10-26.html` (Kennedy, 26 Oct 2026). The drawer and the cart page use the same blocks, top to bottom:

| # | Block | File |
|---|---|---|
| 1 | Header | Horizon, unchanged |
| 2 | Progress bar: free delivery at S$100, free 1-hour facial at S$200 | `snippets/dh-cart-progress.liquid` |
| 3 | Cart lines: the price shows once, on the right, with the compare-at price struck under it | `snippets/cart-products.liquid` |
| 4 | One add-on (Ice Plant Hand Cream) | `snippets/dh-cart-addon.liquid` |
| 5 | Discount: a link, or the field open when the theme setting is on; an applied code shows as a chip with its amount | `snippets/cart-summary.liquid` |
| 6 | Note: "Add a note to your order" link | `snippets/cart-summary.liquid` |
| 7 | Subtotal, Discount, Delivery (S$5 or Free), Total | `snippets/cart-summary.liquid` |
| 8 | Checkout button with a lock and the total | `snippets/cart-summary.liquid` |
| 9 | Shop Pay and Google Pay | Horizon, unchanged |
| 10 | Trust line: live Judge.me numbers | `snippets/cart-summary.liquid` |

Everything is rendered in Liquid. Horizon already re-renders the cart section after every quantity change, add, and discount code, so the bar, the totals, and the button update without a page reload. The Add button reuses the `[data-dh-add]` handler in `assets/dh.js`.

Other files changed:

- `snippets/dh-cart-basis.liquid`: the amount that counts toward the thresholds. The bar and the delivery row both read it, so they always agree.
- `snippets/dh-money.liquid`: prints S$79, S$72.15.
- `snippets/cart-drawer.liquid`: places the bar and the add-on, and removes the white gap above the footer.
- `sections/main-cart.liquid`: places the bar and the add-on on the cart page.
- `assets/dh.js`: Add on the cart page no longer reloads the page.
- `config/settings_schema.json`: a new "Dr Hauschka cart" group under Theme settings > Cart.

## Theme settings (Theme settings > Cart > Dr Hauschka cart)

| Setting | Default | Notes |
|---|---|---|
| Show discount field open | Off | Turn on for code campaigns (11.11, code 1111, live by Mon 9 Nov) and off when they end. |
| Show free delivery and facial progress bar | On | |
| Free delivery from (S$) | 100 | Must match the shipping rate "FREE SHIPPING with $100 purchase". |
| Standard delivery fee (S$) | 5 | |
| Free 1-hour facial from (S$) | 200 | Must match what Rivo counts (P2-26b). |
| Count toward free delivery and the facial | After discount codes | Switch to "before" if the checkout test shows Shopify counts the total before codes. |
| Cart add-on product | Empty, which uses Ice Plant Hand Cream 50ml | |
| Add-on name / line | "Ice Plant Hand Cream" / "For very dry hands" | |
| Show "Official Dr. Hauschka distributor in Singapore" | Off | Leave off until Lyne confirms the wording. |

## Still to check on the store

- **Free delivery after a discount code** (task note 4): place a test order of S$110 with code 1111 (15%, S$93.50 after the code) and see whether checkout charges S$5 or gives free delivery. Set "Count toward free delivery and the facial" to match, then tell Kennedy before 9 Nov.
- **Rivo**: confirm Rivo counts the S$200 facial on the same amount.
