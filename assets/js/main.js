/* ==========================================================================
   VIDA'S ATTIC — behaviour
   Vanilla JS, no dependencies. Every effect is a no-op when the visitor has
   "reduce motion" turned on, and every effect is optional: if any single
   block fails, the page still reads and every link still works.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Opt in to the scroll-reveal start state only now that JS is confirmed
     running. Without this class the CSS never hides anything, so a JS error
     or a blocked script can't leave sections stuck at opacity 0. */
  document.documentElement.classList.add("js-reveal");

  /* ------------------------------------------------------------ current year */

  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---------------------------------------------- wordmark letter stagger */
  /* Split the heading into per-letter spans so CSS can stagger them in.
     The original text is kept as an aria-label so screen readers still read
     "Vida's Attic" as one phrase rather than letter by letter. */

  var split = document.querySelector("[data-split]");
  if (split) {
    var text = split.textContent.trim();
    split.setAttribute("aria-label", text);
    split.textContent = "";

    // Letters are grouped per word inside a nowrap wrapper, so the heading can
    // only ever break at a space. Without this it wraps mid-word on narrow
    // screens ("VIDA'S ATTI / C").
    var words = text.split(" ");
    var letterIndex = 0;

    for (var w = 0; w < words.length; w++) {
      var word = document.createElement("span");
      word.className = "wd";
      word.setAttribute("aria-hidden", "true");

      for (var c = 0; c < words[w].length; c++) {
        var span = document.createElement("span");
        span.className = "ltr";
        span.style.setProperty("--i", String(letterIndex++));
        span.textContent = words[w][c];
        word.appendChild(span);
      }

      split.appendChild(word);

      // A real space between words, so the gap can be a line-break opportunity
      if (w < words.length - 1) {
        var sep = document.createElement("span");
        sep.className = "wd-sep";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = " ";
        split.appendChild(sep);
      }
    }
  }

  /* --------------------------------------------------------- dust motes */
  /* Small drifting specks in the hero, as if light were catching dust. */

  var motes = document.getElementById("motes");
  if (motes && !reduceMotion) {
    var COUNT = 22;
    var frag = document.createDocumentFragment();

    for (var m = 0; m < COUNT; m++) {
      var mote = document.createElement("span");
      mote.className = "mote";
      mote.style.left = (Math.random() * 100).toFixed(2) + "%";
      mote.style.setProperty("--s", (2 + Math.random() * 4).toFixed(1) + "px");
      mote.style.setProperty("--dur", (18 + Math.random() * 22).toFixed(1) + "s");
      mote.style.setProperty("--delay", (-Math.random() * 30).toFixed(1) + "s");
      mote.style.setProperty("--dx", (Math.random() * 120 - 60).toFixed(0) + "px");
      frag.appendChild(mote);
    }

    motes.appendChild(frag);
  }

  /* -------------------------------------------------------- scroll reveals */
  /* Each [data-reveal] fades and rises once. Siblings inside the same parent
     get a small stagger so groups arrive as a sequence, not a block. */

  var revealables = Array.prototype.slice.call(
    document.querySelectorAll("[data-reveal]")
  );

  var revealAll = function () {
    revealables.forEach(function (el) {
      el.classList.add("is-in");
    });
    revealables = [];
  };

  if (reduceMotion) {
    // Motion is unwanted: show everything immediately, no transitions.
    revealAll();
  } else {
    var reveal = function (el) {
      var siblings = el.parentElement
        ? el.parentElement.querySelectorAll(":scope > [data-reveal]")
        : [el];
      var index = Array.prototype.indexOf.call(siblings, el);

      el.style.setProperty("--reveal-delay", Math.max(0, index) * 70 + "ms");
      el.classList.add("is-in");
    };

    /* A geometry sweep is the source of truth: anything inside the viewport
       gets revealed. Because these elements start at opacity 0, a missed
       trigger would mean invisible content — so this must not depend on any
       one API firing. It runs on scroll, resize and load, and detaches itself
       once every element has been revealed. */
    var sweep = function () {
      var vh = window.innerHeight;

      revealables = revealables.filter(function (el) {
        var rect = el.getBoundingClientRect();
        // Slightly inset at the bottom so items reveal just after entering
        if (rect.top < vh * 0.92 && rect.bottom > 0) {
          reveal(el);
          return false;
        }
        return true;
      });

      if (!revealables.length) {
        window.removeEventListener("scroll", sweep);
        window.removeEventListener("resize", sweep);
      }
    };

    /* Called straight from the scroll handler rather than via
       requestAnimationFrame: reading a handful of rects is cheap, the list only
       shrinks, and rAF is throttled in background tabs — which would leave
       content invisible on return. */
    window.addEventListener("scroll", sweep, { passive: true });
    window.addEventListener("resize", sweep, { passive: true });
    window.addEventListener("load", sweep);

    // IntersectionObserver, where available, catches entries the sweep would
    // only see on the next scroll tick — a small precision win, never the
    // only mechanism.
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          var hit = false;
          entries.forEach(function (entry) {
            if (entry.isIntersecting) hit = true;
          });
          if (hit) sweep();
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );

      revealables.forEach(function (el) {
        observer.observe(el);
      });
    }

    sweep();
  }

  /* ------------------------------------------------------ awning condense */

  var awning = document.getElementById("awning");
  if (awning) {
    var condensed = false;

    var onScroll = function () {
      var should = window.scrollY > 40;
      if (should !== condensed) {
        condensed = should;
        awning.classList.toggle("is-condensed", should);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* --------------------------------------------------------- hero parallax */
  /* Nudges decorative layers against the cursor. rAF-throttled so we never
     do layout work more than once per frame. Skipped on touch, where there
     is no hover cursor to track. */

  var parallaxLayers = document.querySelectorAll("[data-parallax]");
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (parallaxLayers.length && canHover && !reduceMotion) {
    var pointerX = 0;
    var pointerY = 0;
    var queued = false;

    var apply = function () {
      queued = false;
      for (var p = 0; p < parallaxLayers.length; p++) {
        var layer = parallaxLayers[p];
        var strength = parseFloat(layer.getAttribute("data-parallax")) || 0.02;
        var dx = (pointerX - window.innerWidth / 2) * strength;
        var dy = (pointerY - window.innerHeight / 2) * strength;
        layer.style.transform = "translate3d(" + dx.toFixed(2) + "px," + dy.toFixed(2) + "px,0)";
      }
    };

    window.addEventListener(
      "pointermove",
      function (event) {
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (!queued) {
          queued = true;
          window.requestAnimationFrame(apply);
        }
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------- Instagram embed slots */
  /* Each .frame[data-ig] carries a data-shortcode. We build the official
     Instagram embed URL from it and load the iframe lazily, only once the
     frame is close to the viewport — four embeds up front would otherwise
     cost more than the rest of the page combined.

     A slot with an empty data-shortcode is left as its styled placeholder,
     so an unfilled slot looks deliberate instead of broken. */

  var igFrames = document.querySelectorAll("[data-ig]");

  var hydrateFrame = function (frame) {
    var raw = (frame.getAttribute("data-shortcode") || "").trim();
    if (!raw) return; // empty slot: keep the placeholder

    // Accept a bare shortcode or a full post/reel URL pasted in by mistake.
    var match = raw.match(/(?:\/(?:p|reel|reels|tv)\/)([A-Za-z0-9_-]+)/);
    var shortcode = match ? match[1] : raw.replace(/[^A-Za-z0-9_-]/g, "");
    if (!shortcode) return;

    var iframe = document.createElement("iframe");
    iframe.src = "https://www.instagram.com/p/" + shortcode + "/embed/captioned/";
    iframe.title = "Instagram post by @vidasattic";
    iframe.loading = "lazy";
    iframe.allowFullscreen = true;
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("frameborder", "0");

    // Only fade the placeholder out once the embed has actually painted, so a
    // blocked embed (ad blocker, tracking protection) leaves the tile visible.
    iframe.addEventListener("load", function () {
      frame.classList.add("is-loaded");
    });

    frame.appendChild(iframe);
  };

  if (igFrames.length) {
    if ("IntersectionObserver" in window) {
      var igObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            hydrateFrame(entry.target);
            igObserver.unobserve(entry.target);
          });
        },
        { rootMargin: "300px 0px" }
      );

      for (var f = 0; f < igFrames.length; f++) {
        igObserver.observe(igFrames[f]);
      }
    } else {
      for (var g = 0; g < igFrames.length; g++) {
        hydrateFrame(igFrames[g]);
      }
    }
  }

  /* ------------------------------------------------------ copy the address */

  var copyButtons = document.querySelectorAll("[data-copy]");

  Array.prototype.forEach.call(copyButtons, function (button) {
    var stamp = button.querySelector(".copy__stamp");
    var timer;

    var confirm = function (message) {
      if (stamp) stamp.textContent = message;
      button.classList.add("is-copied");
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        button.classList.remove("is-copied");
      }, 1900);
    };

    button.addEventListener("click", function () {
      var value = button.getAttribute("data-copy") || "";

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(
          function () {
            confirm("Copied!");
          },
          function () {
            confirm("Copy failed");
          }
        );
        return;
      }

      // Fallback for non-secure contexts (e.g. plain http:// during local dev)
      var scratch = document.createElement("textarea");
      scratch.value = value;
      scratch.setAttribute("readonly", "");
      scratch.style.position = "fixed";
      scratch.style.top = "-1000px";
      document.body.appendChild(scratch);
      scratch.select();

      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }

      document.body.removeChild(scratch);
      confirm(ok ? "Copied!" : "Copy failed");
    });
  });
})();
