// Full Names for Productive
// Shows the full text of a CSS-truncated element (text-overflow: ellipsis or
// -webkit-line-clamp) in a tooltip after a short hover. Runs entirely locally:
// no network requests, no storage.
(() => {
  "use strict";

  const SHOW_DELAY_MS = 400;
  const MAX_ANCESTOR_HOPS = 4; // hover target may be a child of the truncated element
  const GAP_PX = 6;
  const VIEWPORT_MARGIN_PX = 8;

  let hoverTimer = 0;
  let candidate = null; // element waiting for the delay to pass
  let shownFor = null; // element the tooltip is currently showing for
  let hoverTarget = null; // element under the mouse (may be a child/parent of the truncated one)
  let titleEl = null; // element whose native title we temporarily removed
  let suppressedTitle = null; // that title's value, restored on hide

  // ---------------------------------------------------------------------------
  // Tooltip element: lives in a shadow root so Productive's CSS can't touch it,
  // and uses the Popover API (when available) so it renders in the top layer,
  // above Productive's own menus and dropdowns.
  // ---------------------------------------------------------------------------
  const host = document.createElement("div");
  host.setAttribute("data-full-names-for-productive", "");
  const supportsPopover = typeof host.showPopover === "function";
  if (supportsPopover) host.setAttribute("popover", "manual");

  const shadow = host.attachShadow({ mode: "closed" });
  shadow.innerHTML = `
    <style>
      /* No !important on inset: :host !important would beat the inline
         top/left set in position(). Plain inset still beats the UA popover
         default (inset: 0). */
      :host {
        all: initial;
        position: fixed !important;
        inset: auto;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
        overflow: visible !important;
        pointer-events: none !important;
        z-index: 2147483647;
      }
      :host(:not(:popover-open)[popover]) { display: none; }
      .tip {
        box-sizing: border-box;
        max-width: min(480px, calc(100vw - 16px));
        padding: 6px 10px;
        border-radius: 6px;
        background: #1f2330;
        color: #fff;
        font: 500 13px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        white-space: normal;
        overflow-wrap: anywhere;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        opacity: 0;
        transition: opacity 120ms ease-out;
      }
      .tip.visible { opacity: 1; }
      @media (prefers-reduced-motion: reduce) { .tip { transition: none; } }
    </style>
    <div class="tip" role="tooltip"></div>
  `;
  const tip = shadow.querySelector(".tip");

  function mountHost() {
    if (!host.isConnected) document.documentElement.appendChild(host);
  }

  // ---------------------------------------------------------------------------
  // Truncation detection
  // ---------------------------------------------------------------------------
  function isTruncated(el) {
    if (!(el instanceof HTMLElement) || el === host) return false;
    const cs = getComputedStyle(el);
    const ellipsis = cs.textOverflow === "ellipsis";
    const clamped = cs.webkitLineClamp && cs.webkitLineClamp !== "none";
    if (!ellipsis && !clamped) return false;
    if (!el.textContent || !el.textContent.trim()) return false;

    if (clamped && el.scrollHeight > el.clientHeight + 1) return true;
    if (el.scrollWidth > el.clientWidth + 1) return true;

    // scrollWidth is rounded to whole pixels; catch sub-pixel overflow too.
    if (ellipsis) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const contentWidth = range.getBoundingClientRect().width;
      return contentWidth - el.getBoundingClientRect().width > 0.5;
    }
    return false;
  }

  function findTruncated(start) {
    let el = start instanceof Element ? start : start && start.parentElement;
    for (let i = 0; el && i <= MAX_ANCESTOR_HOPS; i++, el = el.parentElement) {
      if (el === document.body) break;
      if (isTruncated(el)) return el;
    }
    return null;
  }

  function fullTextOf(el) {
    const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    const title = (suppressedTitle ?? "").trim();
    // Prefer the native title when it carries more than the visible text.
    return title.length > text.length ? title : text;
  }

  // The browser shows the title of the nearest ancestor-or-self of the hovered
  // node, which is often a wrapping link rather than the truncated label
  // (e.g. Productive's sidebar). Remove that one so only our tooltip shows.
  function suppressNativeTitle(el) {
    const start = hoverTarget && hoverTarget.isConnected ? hoverTarget : el;
    const owner = start.closest("[title]");
    if (!owner) return;
    titleEl = owner;
    suppressedTitle = owner.getAttribute("title");
    owner.removeAttribute("title");
  }

  // ---------------------------------------------------------------------------
  // Show / hide
  // ---------------------------------------------------------------------------
  function show(el) {
    if (!el.isConnected) return;
    mountHost();

    suppressNativeTitle(el);
    tip.textContent = fullTextOf(el);
    tip.classList.remove("visible");
    if (supportsPopover) {
      // Re-show so we land on top of any popover Productive opened after us.
      if (host.matches(":popover-open")) host.hidePopover();
      host.showPopover();
    }
    position(el);
    shownFor = el;
    requestAnimationFrame(() => tip.classList.add("visible"));
  }

  function position(el) {
    const anchor = el.getBoundingClientRect();
    const box = tip.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    let top = anchor.bottom + GAP_PX;
    if (top + box.height > vh - VIEWPORT_MARGIN_PX) {
      top = Math.max(VIEWPORT_MARGIN_PX, anchor.top - GAP_PX - box.height);
    }
    let left = anchor.left;
    left = Math.min(left, vw - VIEWPORT_MARGIN_PX - box.width);
    left = Math.max(VIEWPORT_MARGIN_PX, left);

    host.style.setProperty("top", `${Math.round(top)}px`, "important");
    host.style.setProperty("left", `${Math.round(left)}px`, "important");
  }

  function restoreTitle() {
    // Skip if the app re-rendered and set a (possibly new) title meanwhile.
    if (titleEl && suppressedTitle !== null && !titleEl.hasAttribute("title")) {
      titleEl.setAttribute("title", suppressedTitle);
    }
    titleEl = null;
    suppressedTitle = null;
  }

  function hide() {
    clearTimeout(hoverTimer);
    candidate = null;
    hoverTarget = null;
    if (!shownFor) return;
    restoreTitle();
    shownFor = null;
    tip.classList.remove("visible");
    if (supportsPopover && host.matches(":popover-open")) host.hidePopover();
  }

  // ---------------------------------------------------------------------------
  // Events (delegated on document, so dynamically rendered menus just work)
  // ---------------------------------------------------------------------------
  document.addEventListener(
    "mouseover",
    (event) => {
      const el = findTruncated(event.target);
      if (el && (el === shownFor || el === candidate)) return;
      hide();
      if (!el) return;
      candidate = el;
      hoverTarget = event.target instanceof Element ? event.target : el;
      hoverTimer = setTimeout(() => {
        if (candidate === el) {
          candidate = null;
          show(el);
        }
      }, SHOW_DELAY_MS);
    },
    { capture: true, passive: true }
  );

  document.addEventListener(
    "mouseout",
    (event) => {
      const active = shownFor || candidate;
      if (!active) return;
      // Still inside the same truncated element? Keep it.
      if (event.relatedTarget instanceof Node && active.contains(event.relatedTarget)) return;
      hide();
    },
    { capture: true, passive: true }
  );

  document.addEventListener("mousedown", hide, { capture: true, passive: true });
  document.addEventListener("wheel", hide, { capture: true, passive: true });
  document.addEventListener("scroll", hide, { capture: true, passive: true });
  document.addEventListener("keydown", hide, { capture: true, passive: true });
  window.addEventListener("blur", hide);
  document.addEventListener("visibilitychange", hide);
})();
