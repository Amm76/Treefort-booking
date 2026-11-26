// =========================================================================
// [EDIT HERE] 1. TREEFORT CAFE MAIN SETTINGS (WHATSAPP, PDF LINK & GOOGLE REVIEWS)
// =========================================================================
const CAFE_CONFIG = {
  name: "Treefort Cafe",
  instagramUrl: "https://www.instagram.com/treefortcafe/",
  // [EDIT HERE] Cafe's WhatsApp number (format: 60123456789 without '+' or spaces)
  whatsappNumber: "60177397785",
  displayPhone: "+60 17-739 7785",
  // [EDIT HERE] Paste your Google Drive PDF link (or "menu.pdf" if hosted in same folder)
  menuPdfUrl: "https://drive.google.com/",
  // [EDIT HERE] Google Places API (New) credentials for automatic live reviews
  googlePlaceId: "",
  googleApiKey: "",
};

// [EDIT HERE] Fallback customer reviews shown before Google API key is connected
const FALLBACK_REVIEWS = [
  {
    author: "Ishkandar Shah (ISH)",
    rating: 5,
    relativeTime: "3 month ago",
    text: "Stunning just Stunning.First time coming here. Never thought such a perfect place exist.The food is tasty. Service fast. Unlike what was reviewed previously by others. Good to see that they've improved.AND THE VIEW IS AMAZING. GOING TO COME BACK AND MAKE PARTIES HERE. Oh BTW, before walking into the restaurant, you can dare your self to the test of heights. I wasn't brave enough.",
  },
  {
    author: "Marcus L.",
    rating: 5,
    relativeTime: "3 weeks ago",
    text: "Booked a table for 6 via WhatsApp and everything was ready when we arrived. Great coffee, friendly baristas, and cozy timber vibes.",
  },
  {
    author: "Siti H.",
    rating: 5,
    relativeTime: "1 month ago",
    text: "Brought my family for weekend brunch and shared the Harvest Platter. Generous portions and very comfortable seating.",
  },
  {
    author: "Rachel T.",
    rating: 5,
    relativeTime: "2 weeks ago",
    text: "Love spending quiet afternoons here with a Gula Melaka Latte. Beautiful natural light and relaxing music.",
  },
];

let currentLang = "en";

document.querySelectorAll("img[data-fallback-src]").forEach((image) => {
  image.addEventListener("error", () => {
    const fallbackSrc = image.dataset.fallbackSrc;
    if (!fallbackSrc) return;

    delete image.dataset.fallbackSrc;
    image.src = fallbackSrc;
  });
});

window.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  ["inline-date", "modal-date"].forEach((id) => {
    const dateInput = document.getElementById(id);
    if (dateInput) {
      dateInput.value = today;
      dateInput.min = today;
    }
  });

  const displayPhone = document.getElementById("displayPhone");
  if (displayPhone) displayPhone.textContent = CAFE_CONFIG.displayPhone;

  const pdfExternalLink = document.getElementById("pdfExternalLink");
  if (pdfExternalLink) pdfExternalLink.href = CAFE_CONFIG.menuPdfUrl;

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const mobileNavToggle = target.closest("[data-toggle-mobile-nav]");
    if (mobileNavToggle) {
      const mobileNav = document.getElementById("mobileNav");
      if (!mobileNav) return;

      const isOpen = mobileNav.classList.toggle("is-open");
      mobileNavToggle.setAttribute("aria-expanded", String(isOpen));
      mobileNavToggle.setAttribute("aria-label", isOpen ? "Close page navigation" : "Open page navigation");
      mobileNav.setAttribute("aria-hidden", String(!isOpen));
      return;
    }

    if (target.closest("#mobileNav a")) {
      const mobileNav = document.getElementById("mobileNav");
      const mobileNavToggle = document.querySelector("[data-toggle-mobile-nav]");
      if (mobileNav) {
        mobileNav.classList.remove("is-open");
        mobileNav.setAttribute("aria-hidden", "true");
      }
      if (mobileNavToggle) {
        mobileNavToggle.setAttribute("aria-expanded", "false");
        mobileNavToggle.setAttribute("aria-label", "Open page navigation");
      }
      return;
    }

    const languageButton = target.closest("#btn-en, #btn-bm");
    if (languageButton) {
      setLanguage(languageButton.id === "btn-en" ? "en" : "bm");
      return;
    }

    const bookingButton = target.closest("[data-booking-purpose]");
    if (bookingButton) {
      openBookingModal(bookingButton.dataset.bookingPurpose);
      return;
    }

    if (target.closest("[data-open-pdf]")) {
      openPdfModal();
      return;
    }

    if (target.closest("[data-book-pdf]")) {
      closePdfModal();
      openBookingModal("Table Reservation");
      return;
    }

    if (target.closest("[data-close-booking]")) {
      closeBookingModal();
      return;
    }

    if (target.closest("[data-close-pdf]")) {
      closePdfModal();
      return;
    }

    const menuTab = target.closest(".menu-tab");
    if (menuTab) filterMenu(menuTab.dataset.filter);
  });

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (form instanceof HTMLFormElement && form.dataset.bookingForm) {
      handleWhatsAppBooking(event, form.dataset.bookingForm);
    }
  });

  loadGoogleReviews();
});

// =========================================================================
// 2. LIVE GOOGLE REVIEWS INTEGRATION (PLACES API NEW + FALLBACK)
// =========================================================================
async function loadGoogleReviews() {
  if (!document.getElementById("google-reviews-container")) return;

  const statusBadge = document.getElementById("google-sync-status");
  renderReviews(FALLBACK_REVIEWS);

  if (CAFE_CONFIG.googlePlaceId && CAFE_CONFIG.googleApiKey) {
    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${CAFE_CONFIG.googlePlaceId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": CAFE_CONFIG.googleApiKey,
            "X-Goog-FieldMask": "rating,userRatingCount,reviews",
          },
        },
      );
      if (!response.ok) throw new Error("Places API error");
      const data = await response.json();

      if (data.rating) {
        const averageRating = document.getElementById("reviews-avg-rating");
        if (averageRating)
          averageRating.textContent = `${data.rating.toFixed(1)} ★`;

        const heroRatingBadge = document.getElementById("hero-rating-badge");
        if (heroRatingBadge)
          heroRatingBadge.textContent = `★ ${data.rating.toFixed(1)} Google Rating`;
      }
      if (data.userRatingCount) {
        const countEl = document.getElementById("reviews-total-count");
        if (countEl) {
          countEl.setAttribute(
            "data-en",
            `from ${data.userRatingCount} Google Reviews`,
          );
          countEl.setAttribute(
            "data-bm",
            `daripada ${data.userRatingCount} Ulasan Google`,
          );
          countEl.textContent = countEl.getAttribute(`data-${currentLang}`);
        }
      }
      if (Array.isArray(data.reviews) && data.reviews.length > 0) {
        const live = data.reviews
          .filter((r) => r.rating >= 4 && r.text && r.text.text)
          .map((r) => ({
            author: r.authorAttribution?.displayName || "Google Guest",
            rating: r.rating || 5,
            relativeTime: r.relativePublishTimeDescription || "Recent",
            text: r.text.text,
          }));
        if (live.length > 0) {
          renderReviews(live);
          if (statusBadge) {
            statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span>Live Google Sync</span>`;
          }
        }
      }
    } catch (err) {
      console.warn("Using fallback reviews:", err.message);
    }
  }
}

function renderReviews(list) {
  const container = document.getElementById("google-reviews-container");
  if (!container) return;

  container.innerHTML = list
    .map((rev) => {
      const stars = "★".repeat(Math.round(rev.rating));
      const safeText = escapeHtml(rev.text);
      const safeAuthor = escapeHtml(rev.author);
      const safeTime = escapeHtml(rev.relativeTime);
      return `
            <article class="bg-linen/70 p-5 rounded-3xl border border-bark/10 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2.5">
                  <span class="text-cedar text-sm tracking-tight">${stars}</span>
                  <span class="text-[11px] text-stone-400">${safeTime}</span>
                </div>
                <p class="text-xs sm:text-sm text-stone-700 leading-relaxed">“${safeText}”</p>
              </div>
              <div class="mt-4 pt-3 border-t border-bark/10 flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-moss text-oat text-xs font-bold flex items-center justify-center">
                  ${safeAuthor.charAt(0).toUpperCase()}
                </span>
                <span class="text-xs font-semibold text-bark">${safeAuthor}</span>
              </div>
            </article>
          `;
    })
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// =========================================================================
// 3. WHATSAPP BOOKING REDIRECT
// =========================================================================
function handleWhatsAppBooking(event, source) {
  event.preventDefault();
  const name = document.getElementById(`${source}-name`).value.trim();
  const purpose = document.getElementById(`${source}-purpose`).value;
  const date = document.getElementById(`${source}-date`).value;
  const time = document.getElementById(`${source}-time`).value;
  const pax = document.getElementById(`${source}-pax`).value;
  const notes = document.getElementById(`${source}-notes`).value.trim() || "-";

  const message =
    `Hi ${CAFE_CONFIG.name}! I would like to reserve a table.\n\n` +
    `Name: ${name}\n` +
    `Type: ${purpose}\n` +
    `Date: ${date}\n` +
    `Time: ${time}\n` +
    `Guests: ${pax} pax\n` +
    `Notes: ${notes}\n\n` +
    `Please let me know if this slot is available. Thank you!`;

  window.open(
    `https://wa.me/${CAFE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener",
  );
  if (source === "modal") closeBookingModal();
}

// =========================================================================
// 4. MODAL, MENU FILTER & LANGUAGE TOGGLE
// =========================================================================
function openBookingModal(defaultPurpose) {
  const modal = document.getElementById("bookingModal");
  const select = document.getElementById("modal-purpose");
  if (defaultPurpose) {
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value === defaultPurpose) {
        select.selectedIndex = i;
        break;
      }
    }
  }
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeBookingModal() {
  const modal = document.getElementById("bookingModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function openPdfModal() {
  const modal = document.getElementById("pdfModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closePdfModal() {
  const modal = document.getElementById("pdfModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

window.addEventListener("click", (e) => {
  if (e.target === document.getElementById("bookingModal")) closeBookingModal();
  if (e.target === document.getElementById("pdfModal")) closePdfModal();
});

function filterMenu(category) {
  document.querySelectorAll(".menu-tab").forEach((tab) => {
    const active = tab.dataset.filter === category;
    tab.classList.toggle("bg-moss", active);
    tab.classList.toggle("text-oat", active);
    tab.classList.toggle("text-stone-600", !active);
  });

  document.querySelectorAll(".menu-card").forEach((card) => {
    card.classList.toggle(
      "hidden",
      category !== "all" && card.dataset.category !== category,
    );
  });
}

function setLanguage(lang) {
  currentLang = lang;
  ["en", "bm"].forEach((code) => {
    const btn = document.getElementById(`btn-${code}`);
    if (!btn) return;

    const active = code === lang;
    btn.classList.toggle("bg-moss", active);
    btn.classList.toggle("text-oat", active);
    btn.classList.toggle("text-stone-600", !active);
  });

  document.querySelectorAll("[data-en]").forEach((el) => {
    const text = el.getAttribute(`data-${lang}`) || el.getAttribute("data-en");
    if (text) el.innerHTML = text;
  });
}
