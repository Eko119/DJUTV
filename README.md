# DJUTV

The website for **DJ U TV** — Chicago's in-the-street interview channel, hosted by DJ U. Exclusive
conversations with entertainers, entrepreneurs and community leaders, running since October 2015.
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
assets/css/styles.css   design tokens + all component styles
assets/js/main.js       click-to-play embeds, halftone canvas, ticker, booking CTA
assets/img/             logo (full, small, favicon)
CNAME                   claims djugocrazy.com for GitHub Pages
.nojekyll               serve the files as-is instead of running them through Jekyll
```

## Naming

The brand is written two ways on purpose, so keep them straight when editing:

- **DJ U TV** in prose and metadata — the page title, headings, body copy, structured data.
- **DJUTV** only as the compact wordmark beside the logo (header and footer), and wherever it is a
  literal handle or URL: `@DJUTV`, `facebook.com/DJUTV`.

The host is **DJ U**. Earlier drafts credited a "DJ Univercity"; that name was wrong and should not
reappear.

## Keeping it current

Three things go stale. Each lives in exactly one place:

**Channel figures.** The four numbers in the hero (subscribers, total views, videos, years) sit in
the `<dl class="stats">` block in `index.html`, marked with a comment. They are a snapshot, not a
live feed — worth refreshing every few months.

**Videos.** Each video is an `<article>` carrying a `data-video="YOUTUBE_ID"` attribute. To swap
one out, change that ID, the thumbnail URL, the title, the date and the view count. Nothing else
references the video, so a straight find-and-replace on the old ID is safe.

The thumbnails come from `i.ytimg.com/vi/<ID>/hqdefault.jpg`, which exists for every YouTube video.
It is a 4:3 image with the 16:9 frame letterboxed inside it, and the CSS crops it back to 16:9 with
`object-fit: cover` — which lands exactly on the video frame. If a thumbnail ever fails to load,
the script hides it and a typographic poster underneath takes over, so a card never renders broken.

**Guest names in the ticker.** The scrolling strip under the hero is one `<span class="ticker__set">`
in `index.html`. The script clones it so the marquee loops seamlessly, which is why the CSS
animation translates by exactly `-50%` — add or remove names freely, but keep it to a single set in
the markup and let the script do the duplication.

Only names traceable to an actual upload belong there. The list was trimmed once already after
guests were added from an unverified summary rather than the channel's own feed.

## Booking address

`BOOKING_EMAIL` at the top of `assets/js/main.js` holds `booking@djugocrazy.com`, and the "Email
booking" button in the booking section is built from it. Clearing the constant removes the button
rather than leaving a dead `mailto:` on the page, so an address that stops working should be
emptied, not left in place.

The address is not a mailbox. Cloudflare Email Routing forwards it to a personal inbox, which means
mail can be received but not sent from it — replies come from whatever inbox it forwards to. Its
DNS records live in the Cloudflare zone alongside the site's.

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
Spotify, Apple Podcasts, iHeartRadio and Deezer listings. Nothing on the page is placeholder copy.
