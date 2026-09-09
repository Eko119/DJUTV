# DJUTV

The website for **DJUTV** — DJ Univercity's Chicago interview channel. Exclusive in-the-street
conversations with entertainers, entrepreneurs and community leaders, running since October 2015.

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
The simplest route is **GitHub Pages**: in the repository's Settings → Pages, set the source to
the branch you want to publish and the root (`/`) folder. Netlify, Vercel and Cloudflare Pages all
work the same way — point them at the repository and set no build command.

## Structure

```
index.html              the whole page
assets/css/styles.css   design tokens + all component styles
assets/js/main.js       click-to-play embeds, halftone canvas, ticker, booking CTA
assets/img/             logo (full, small, favicon)
```

## Keeping it current

Four things go stale. Each lives in exactly one place:

**Booking email.** Line 3 of `assets/js/main.js` is an empty `BOOKING_EMAIL` constant. Fill it in
and an "Email booking" button appears next to the Instagram CTA. Left empty, the button never
renders — the site is deliberately built to show only links that actually work, rather than a dead
`mailto:` nobody reads.

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
