# DJUTV

The website for **DJUTV** — Chicago's in-the-street interview channel, hosted by DJ U. Exclusive
conversations with entertainers, entrepreneurs and community leaders. Est. October 18, 2021.
The slogan is **#DJUGOCRAZY**.

A single static page with no build step, no framework and no dependencies to install. Open
`index.html` in a browser and it works.

## Running it locally

Because the page loads its stylesheet, script and images as separate files, opening it straight off
the filesystem works fine in most browsers, but a local server avoids any surprises:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploying

The site is plain HTML, CSS, JS and images, so anything that serves static files will host it.
It is published with **GitHub Pages** from the `gh-pages` branch (Settings → Pages, source
"Deploy from a branch", root `/` folder), and served at **https://djugocrazy.com**.

The `CNAME` file at the repository root is what claims that domain — GitHub Pages reads it on every
deploy, so it must stay in place and must stay in the branch Pages builds from. Deleting it reverts
the site to the `github.io` address.

DNS lives at Cloudflare, which is also the registrar. The apex and `www` both point at
`eko119.github.io` as CNAME records; Cloudflare flattens the apex one automatically. Two settings
matter and are easy to get wrong:

- The records must be **DNS only** (grey cloud) while GitHub provisions the TLS certificate.
  Proxying blocks the validation request, and GitHub's "Enforce HTTPS" box stays greyed out.
- Cloudflare's SSL/TLS mode must be **Full**, never **Flexible**. Flexible makes Cloudflare talk
  plain HTTP to GitHub, GitHub redirects to HTTPS, and the two loop until the browser gives up with
  `ERR_TOO_MANY_REDIRECTS`.

## Structure

```
index.html              the whole page
privacy.html            privacy policy, required for AdSense approval
assets/css/styles.css   design tokens + all component styles
assets/js/main.js       Google tags, click-to-play embeds, halftone canvas, ticker, booking CTA
assets/img/             logo (full, small, favicon), the link-preview card, the couch photo
CNAME                   claims djugocrazy.com for GitHub Pages
.nojekyll               serve the files as-is instead of running them through Jekyll
```

## Naming

The brand is **DJUTV**, written closed up everywhere — page title, headings, body copy, structured
data, the wordmark beside the logo, and the share card. Not "DJ U TV". The host is **DJ U**.

Two names have already been through a correction and should not come back: "DJ Univercity" was
never right, and a spaced-out "DJ U TV" was used briefly before being reverted.

The founding date is written exactly **Est. October 18, 2021**, and as `2021-10-18` in the
structured data's `foundingDate`, which requires that machine format. YouTube shows the channel as
joined in October 2015; that is when the account was created, not the founding date, so don't
"correct" the site back to it.

## Keeping it current

Three things go stale. Each lives in exactly one place:

**Channel figures.** The four numbers in the hero (subscribers, total views, videos, years) sit in
the `<dl class="stats">` block in `index.html`, marked with a comment. They are a snapshot, not a
live feed — worth refreshing every few months.

**Videos.** Each video is an `<article>` carrying a `data-video="YOUTUBE_ID"` attribute. To swap
one out, change that ID, the thumbnail URL, the title, the date and the view count. Nothing else
references the video, so a straight find-and-replace on the old ID is safe.

The Latest section shows the newest uploads from the channel's feed, skipping Shorts and keeping
one video per guest so the grid never repeats coverage. Below it, the "Next from DJUTV" teaser
(`lead--next`) features the second channel, DJU WORLDWIDE, and is updated the same way.

The thumbnails come from `i.ytimg.com/vi/<ID>/hqdefault.jpg`, which exists for every YouTube video.
It is a 4:3 image with the 16:9 frame letterboxed inside it, and the CSS crops it back to 16:9 with
`object-fit: cover` — which lands exactly on the video frame. If a thumbnail ever fails to load,
the script hides it and a typographic poster underneath takes over, so a card never renders broken.

**Guest names in the ticker.** The scrolling strip under the hero is one `<span class="ticker__set">`
in `index.html`. The script clones it so the marquee loops seamlessly, which is why the CSS
animation translates by exactly `-50%` — keep it to a single set in the markup and let the script
do the duplication.

The loop only stays seamless while one set is at least as wide as the screen; any narrower and a
blank gap opens at the end of each pass. The current 20 names render about 2,770px wide, which
covers 2560px monitors, so removing or shortening names can bring the gap back on wide screens.
The 48s loop is fixed, so a longer list also scrolls faster (about 58px/s now).

The names are the client's own list of notable guests, in the order he gave them.

## Provisional copy

The **About The Couch** section (`id="couch"` in `index.html`, between Follow and Booking) carries
placeholder copy drafted from the client's photo and messages. It has not been written or approved
by the client, and it is marked with a `PROVISIONAL COPY` comment in the markup.

When the approved bio arrives, replace the contents of `<div class="couch__copy">` — the eyebrow,
the `<h2>` heading and the paragraph — and delete the comment. Add or remove `<p class="prose">`
paragraphs freely; the layout grows with the copy and needs no CSS change. The photo is
`assets/img/couch.jpg`, supplied by the client.

## Link previews

`assets/img/og-card.png` is what appears when the link is pasted into a message, and it has three
constraints that are easy to break by swapping in "a nicer picture":

- **1200×630.** Below roughly 600×315 most platforms downgrade to a small thumbnail or show nothing.
- **No transparency.** A PNG with an alpha channel gets composited against whatever the app feels
  like, usually white, which wrecks a dark card. Flatten onto an opaque background.
- **Absolute URL.** `og:image` must be a full `https://` address. Scrapers do not resolve relative
  paths, which is why the link previewed as bare text before this existed.

Replacing it means replacing the file at the same path and keeping the `og:image:width` and
`og:image:height` tags in `index.html` truthful.

Platforms cache aggressively. Once a URL has been scraped with no image, that result sticks, so a
new card will not appear on its own — Meta's Sharing Debugger forces a re-fetch for Facebook and
Instagram, and appending a throwaway query string (`?v=2`) works as a general nudge elsewhere.

## Booking address

`BOOKING_EMAIL` at the top of `assets/js/main.js` holds `booking@djugocrazy.com`, and the "Email
booking" button in the booking section is built from it. Clearing the constant removes the button
rather than leaving a dead `mailto:` on the page, so an address that stops working should be
emptied, not left in place.

The address is not a mailbox. Cloudflare Email Routing forwards it to a personal inbox, which means
mail can be received but not sent from it — replies come from whatever inbox it forwards to. Its
DNS records live in the Cloudflare zone alongside the site's.

## Analytics and ads

`GA4_MEASUREMENT_ID` and `ADSENSE_PUBLISHER_ID` sit at the top of `assets/js/main.js`, both empty.
Paste a real ID in and that service switches on; leave it empty and nothing is requested from
Google and no cookie is set. Neither is wired yet — the IDs come from accounts only the owner can
open.

**Analytics.** Create a GA4 property at analytics.google.com for `djugocrazy.com` and copy the
Measurement ID (`G-` followed by ten characters) into `GA4_MEASUREMENT_ID`.

Pageviews on a single-page site say very little, so three custom events carry the useful signal:

- `video_play` — fires when someone actually clicks a video, with its ID and title, so it is
  visible which interviews pull people in.
- `booking_click` — fires on the booking CTAs, labelled `email` or `instagram`.
- `outbound_click` — fires on the follow and podcast links, labelled with the destination host.

They are sent through a `track()` helper that does nothing when analytics is off, so the page
behaves identically either way.

**Ads.** AdSense is set up for **auto ads**: the one script is loaded with the publisher ID, and
placement and density are then controlled from the AdSense dashboard, so tuning them never needs a
code change. Manual ad units would mean hard-coding a slot ID per placement, which is worth doing
only if auto placement proves too intrusive for the design.

Two things are required before ads will actually serve, and neither is a code change:

- **Approval.** The site has to be added and reviewed in AdSense; the tag earns nothing until it
  passes. The privacy policy Google expects is at `privacy.html`, linked from the footer.
- **`ads.txt`.** Create a file named `ads.txt` at the repository root containing one line —
  `google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0`, with the publisher ID digits in
  place of the zeros. It is deliberately not committed with a placeholder, because an `ads.txt`
  with the wrong ID is treated as a real claim and is worse than having none.

Both services set cookies, so EU visitors need a consent prompt. AdSense has a built-in consent
message that covers both — turn it on under Privacy & messaging rather than building one here.

`privacy.html` describes analytics and advertising as active, because that is the state it exists
to disclose. Until the two IDs are filled in the page overstates what the site does, which is the
harmless direction to be wrong in, but the fix is to fill them in rather than to soften the policy.
The page is written from what the code actually loads, so anything added that talks to a third
party — a font host, an embed, a form — belongs in it.

## Design notes

The palette is sampled from the DJU logo itself rather than picked to taste: the gold of the
letterforms, the ember of the halftone shading, the steel blue of the comic panel behind it, on the
blue-black the logo already sits against. Every color is a CSS custom property in the `:root` block
at the top of `styles.css`, so retuning the whole site is a handful of edits in one place.

The display face is **Big Shoulders Display**, the typeface commissioned for the City of Chicago's
design system — a deliberate choice for a Chicago street-press brand, paired with Barlow for body
copy and Roboto Mono for data and labels. The recurring six-pointed star marking each section is
the star from the Chicago flag.

The page commits to a single dark theme rather than following the viewer's light/dark preference.
That is intentional: the brand lives on a black ground everywhere else it appears, and a light mode
would weaken it. Every color is painted explicitly so the page holds regardless of the host.

YouTube embeds do not load until someone clicks a video. Until then each card is a static image, so
the page carries no third-party player weight, sets no cookies before consent, and stays fast on the
phones most of the audience is using. When a video is clicked it loads through
`youtube-nocookie.com`.

## Where the content came from

Video IDs, titles, dates and view counts were taken from the channel's public feed. Channel and
follower figures came from the YouTube and Instagram profiles. Podcast links point at the real
Spotify, Apple Podcasts, iHeartRadio and Deezer listings. The second channel, DJU WORLDWIDE, was
confirmed against its own YouTube page; its "Food reviews" label comes from the client's description
of it and matches its first upload. The only unsourced copy is the provisional couch text above.
