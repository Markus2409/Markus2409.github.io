document.documentElement.classList.add("js");

/* ---------- Header: scrolled state + mobile menu + active link ---------- */
const topbar = document.querySelector(".topbar");
const onScroll = () => topbar.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav__toggle");
const closeMenu = () => { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); };
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("is-open")) { closeMenu(); toggle.focus(); } });
document.addEventListener("click", (e) => { if (!nav.contains(e.target)) closeMenu(); });

const links = [...document.querySelectorAll(".nav__list a")];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    links.forEach((a) => {
      if (a.getAttribute("href") === `#${entry.target.id}`) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  });
}, { rootMargin: "-45% 0px -50% 0px" });
links.forEach((a) => { const s = document.querySelector(a.getAttribute("href")); if (s) sectionObserver.observe(s); });
sectionObserver.observe(document.querySelector(".hero")); // clears the highlight back at the top

/* ---------- Hero name: scale to fill the available width without clipping ---------- */
const hero = document.querySelector(".hero");
const heroName = document.querySelector(".hero__name");
function fitName() {
  hero.style.removeProperty("--name-size");
  const cs = getComputedStyle(hero);
  const available = hero.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const current = parseFloat(getComputedStyle(heroName).fontSize);
  // widest line (two lines on mobile, one on desktop); small margin for the outline stroke
  const rects = [...heroName.children].map((s) => s.getBoundingClientRect());
  const stacked = getComputedStyle(heroName).flexDirection === "column";
  const textWidth = stacked
    ? Math.max(...rects.map((r) => r.width))
    : rects[rects.length - 1].right - rects[0].left;
  const max = window.matchMedia("(max-width: 899px)").matches ? 120 : 150;
  const size = Math.min(max, (current * available) / textWidth * 0.97);
  hero.style.setProperty("--name-size", `${size}px`);
}
let fitFrame;
const scheduleFit = () => { cancelAnimationFrame(fitFrame); fitFrame = requestAnimationFrame(fitName); };
document.fonts.ready.then(fitName);
window.addEventListener("resize", scheduleFit);

/* ---------- Scroll reveal ---------- */
const revealTargets = document.querySelectorAll(".section__head, .timeline__item, .edu__card, .thesis, .projects > li, .skills, .about__intro, .story__item, .feature, .insta, .strip__grid > div");
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add("is-in"); revealObserver.unobserve(entry.target); }
  });
}, { rootMargin: "0px 0px -10% 0px" });
revealTargets.forEach((el, i) => {
  el.classList.add("reveal");
  el.style.transitionDelay = `${(i % 3) * 50}ms`;
  revealObserver.observe(el);
});

/* ---------- PDF viewers (PDF.js, lazy) ---------- */
const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

async function initViewer(viewer) {
  const url = viewer.dataset.pdf;
  const pagesEl = viewer.querySelector(".pdf-viewer__pages");
  const countEl = viewer.querySelector(".pdf-viewer__count");
  const lib = window.pdfjsLib;

  if (!lib) return showError(viewer, url);
  lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;

  try {
    const pdf = await lib.getDocument({ url, disableAutoFetch: true, disableStream: false }).promise;
    const first = await pdf.getPage(1);
    const base = first.getViewport({ scale: 1 });
    const total = pdf.numPages;

    // Placeholders sized from page 1 so the scrollbar is right from the start
    const frag = document.createDocumentFragment();
    for (let n = 1; n <= total; n++) {
      const page = document.createElement("div");
      page.className = "pdf-page";
      page.dataset.page = n;
      page.style.aspectRatio = `${base.width} / ${base.height}`;
      page.setAttribute("aria-label", `Page ${n} of ${total}`);
      frag.appendChild(page);
    }
    pagesEl.appendChild(frag);
    countEl.textContent = `1 / ${total}`;

    const rendering = new Set();
    const render = async (el) => {
      const n = Number(el.dataset.page);
      if (rendering.has(n)) return;
      rendering.add(n);
      const page = n === 1 ? first : await pdf.getPage(n);
      const vp1 = page.getViewport({ scale: 1 });
      el.style.aspectRatio = `${vp1.width} / ${vp1.height}`;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale = (el.clientWidth / vp1.width) * dpr;
      const vp = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      await page.render({ canvasContext: canvas.getContext("2d", { alpha: false }), viewport: vp }).promise;
      el.appendChild(canvas);
      el.classList.add("is-rendered");
    };

    const pageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { render(entry.target); pageObserver.unobserve(entry.target); }
      });
    }, { root: viewer, rootMargin: "600px 0px" });

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) countEl.textContent = `${entry.target.dataset.page} / ${total}`; });
    }, { root: viewer, rootMargin: "-45% 0px -54% 0px" });

    pagesEl.querySelectorAll(".pdf-page").forEach((p) => { pageObserver.observe(p); counterObserver.observe(p); });
  } catch (err) {
    console.error(err);
    showError(viewer, url);
  }
}

function showError(viewer, url) {
  viewer.querySelector(".pdf-viewer__count").textContent = "Unavailable";
  viewer.querySelector(".pdf-viewer__pages").innerHTML =
    `<p class="pdf-viewer__error">The preview couldn't load here. <a href="${url}" target="_blank" rel="noopener">Open the PDF</a> instead.</p>`;
}

const viewerObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) { viewerObserver.unobserve(entry.target); initViewer(entry.target); }
  });
}, { rootMargin: "400px 0px" });
const startViewers = () => document.querySelectorAll(".pdf-viewer").forEach((v) => viewerObserver.observe(v));
if (window.pdfjsLib) startViewers(); else window.addEventListener("load", startViewers);

/* ---------- Footer year ---------- */
document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
