/* Routed by Cloudflare Email Routing. Clearing this hides the "Email booking"
   button rather than leaving a dead mailto: on the page. */
const BOOKING_EMAIL = "booking@djugocrazy.com";

/* Google IDs — paste the real values in to switch each service on.
   While a value is empty nothing is requested from Google and no cookie is
   set, so the site stays clean rather than shipping a broken tag. */
const GA4_MEASUREMENT_ID = "";      // Google Analytics, looks like "G-XXXXXXXXXX"
const ADSENSE_PUBLISHER_ID = "";    // AdSense, looks like "ca-pub-0000000000000000"

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---- Google Analytics ---- */
if (GA4_MEASUREMENT_ID) {
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_MEASUREMENT_ID;
  document.head.append(tag);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA4_MEASUREMENT_ID);
}

/* One page means pageviews say almost nothing. These three events are the
   questions worth answering: do people watch, book, or follow? */
function track(event, params) {
  if (window.gtag) window.gtag("event", event, params);
}

/* ---- Google AdSense ----
   Auto ads: placement and density are controlled from the AdSense dashboard,
   so changing them never needs a code change. */
if (ADSENSE_PUBLISHER_ID) {
  const tag = document.createElement("script");
  tag.async = true;
  tag.crossOrigin = "anonymous";
  tag.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADSENSE_PUBLISHER_ID;
  document.head.append(tag);
}

/* ---- current year ---- */
const yearEl = document.querySelector("[data-year]");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

/* ---- booking CTA ---- */
const bookingActions = document.querySelector("[data-booking-actions]");
if (bookingActions && BOOKING_EMAIL) {
  const mail = document.createElement("a");
  mail.className = "btn btn--ghost";
  mail.href = "mailto:" + BOOKING_EMAIL + "?subject=" + encodeURIComponent("DJUTV interview request");
  mail.textContent = "Email booking";
  bookingActions.append(mail);
}
if (bookingActions) {
  bookingActions.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link) track("booking_click", { method: link.protocol === "mailto:" ? "email" : "instagram" });
  });
}

/* ---- follow clicks ---- */
document.querySelectorAll(".socials a, .platforms a").forEach((link) => {
  link.addEventListener("click", () => {
    track("outbound_click", { destination: new URL(link.href).hostname.replace(/^www\./, "") });
  });
});

/* ---- seamless ticker ----
   The CSS loop translates the track by -50%, so the marquee only lines up
   if the track holds exactly two copies of the name set. */
const tickerTrack = document.querySelector(".ticker__track");
const tickerSet = document.querySelector(".ticker__set");
if (tickerTrack && tickerSet) tickerTrack.append(tickerSet.cloneNode(true));

/* ---- click-to-play YouTube embeds ----
   Nothing loads from YouTube until someone actually asks for a video. */
document.querySelectorAll("[data-video]").forEach((item) => {
  const button = item.querySelector(".player");
  const thumb = item.querySelector(".player__thumb");
  const id = item.dataset.video;
  if (!button || !id) return;

  // A blocked or missing thumbnail reveals the typographic poster beneath it.
  if (thumb) thumb.addEventListener("error", () => { thumb.hidden = true; }, { once: true });

  button.addEventListener("click", () => {
    const frame = document.createElement("iframe");
    frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    frame.title = button.getAttribute("aria-label") || "DJUTV video";
    frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.allowFullscreen = true;
    button.replaceChildren(frame);
    button.disabled = true;
    button.style.cursor = "default";
    track("video_play", { video_id: id, video_title: item.querySelector("h3")?.textContent.trim() });
  }, { once: true });
});

/* ---- halftone dot field ----
   Echoes the benday dots in the DJU logo. Drawn once per resize; the dots
   fade out from a hot spot behind the badge so the headline stays clean. */
const canvas = document.querySelector(".hero__dots");
if (canvas) {
  const ctx = canvas.getContext("2d");
  const SPACING = 19;

  function draw() {
    const hero = canvas.parentElement;
    const w = hero.offsetWidth;
    const h = hero.offsetHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const hotX = w * 0.82;
    const hotY = h * 0.42;
    const reach = Math.hypot(w, h) * 0.62;

    for (let y = SPACING / 2; y < h; y += SPACING) {
      for (let x = SPACING / 2; x < w; x += SPACING) {
        const falloff = 1 - Math.min(Math.hypot(x - hotX, y - hotY) / reach, 1);
        if (falloff <= 0.02) continue;
        const eased = falloff * falloff;
        ctx.fillStyle = x > w * 0.6
          ? "rgba(224, 118, 42, " + (eased * 0.5).toFixed(3) + ")"
          : "rgba(124, 144, 180, " + (eased * 0.38).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(x, y, eased * 3.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  draw();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(draw, 150);
  });

  if (!reduceMotion) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        canvas.style.transform = "translateY(" + window.scrollY * 0.12 + "px)";
        ticking = false;
      });
    }, { passive: true });
  }
}
