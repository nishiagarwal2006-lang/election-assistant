// ============================================================
// ElectionIQ — Frontend Application v3
// Enhanced: smoother UX, better message rendering, auto-scroll,
//           stream-ready typing indicator, debounced input
// ============================================================

const state = {
  sessionId: generateSessionId(),
  isLoading: false,
  currentLanguage: "en",
  userContext: "",
  electionData: null,
};

function generateSessionId() {
  return "session_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
}

// ===== TOAST =====

let _toastTimer = null;
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { toast.className = "toast"; }, 3800);
}

// ===== SANITIZE & FORMAT =====

function sanitizeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatMessage(raw) {
  // Sanitize first, then apply safe markdown-like formatting
  let text = sanitizeHTML(raw);

  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Italic
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
  // Inline code
  text = text.replace(/`([^`]+)`/g, "<code style='background:rgba(59,130,246,0.12);padding:1px 5px;border-radius:4px;font-size:12px;'>$1</code>");
  // Bullet list lines: lines starting with "- " or "• "
  text = text.replace(/(?:^|\n)[•\-]\s+(.+)/g, (_, item) =>
    `<li style="margin:4px 0;padding-left:4px;">${item}</li>`
  );
  // Wrap consecutive <li> in <ul>
  text = text.replace(/(<li.*<\/li>)+/gs, (m) =>
    `<ul style="margin:8px 0;padding-left:18px;list-style:disc;">${m}</ul>`
  );
  // Paragraphs
  text = text.split(/\n\n+/).map(p => p.trim() ? `<p>${p.replace(/\n/g, "<br>")}</p>` : "").join("");
  if (!text.startsWith("<")) text = `<p>${text}</p>`;

  return text;
}

// ===== CHAT =====

function scrollToBottom(el, smooth = true) {
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}

function addMessage(role, content, isTyping = false) {
  const chatMessages = document.getElementById("chatMessages");

  const wrap = document.createElement("div");
  wrap.className = `message ${role === "user" ? "user-message" : "assistant-message"}${isTyping ? " typing-message" : ""}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "👤" : "🗳️";

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";

  if (isTyping) {
    contentDiv.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
  } else {
    contentDiv.innerHTML = formatMessage(content);
  }

  wrap.appendChild(avatar);
  wrap.appendChild(contentDiv);
  chatMessages.appendChild(wrap);
  scrollToBottom(chatMessages);
  return wrap;
}

async function sendMessage(messageText) {
  if (!messageText?.trim() || state.isLoading) return;

  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const quickChips = document.getElementById("quickChips");

  addMessage("user", messageText);
  quickChips.style.display = "none";

  const typingEl = addMessage("assistant", "", true);

  state.isLoading = true;
  input.value = "";
  input.style.height = "auto";
  sendBtn.disabled = true;
  updateCharCount(0);

  // Scroll chat into view on mobile
  if (window.innerWidth < 768) {
    document.querySelector(".chat-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: messageText,
        sessionId: state.sessionId,
        userContext: state.userContext,
      }),
    });

    const data = await response.json();
    typingEl.remove();

    if (data.success) {
      addMessage("assistant", data.message);
      if (state.currentLanguage !== "en") translateLastMessage(data.message);
    } else {
      addMessage("assistant", `Sorry, I encountered an error: ${data.error || "Unknown"}. Please try again.`);
      showToast(data.error || "Request failed", "error");
    }
  } catch {
    typingEl.remove();
    addMessage("assistant", "Connection error. Please check your internet and try again.");
    showToast("Connection error", "error");
  } finally {
    state.isLoading = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

async function translateLastMessage(text) {
  try {
    const res = await fetch("/api/google/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLanguage: state.currentLanguage }),
    });
    const data = await res.json();
    if (data.success) {
      const chatMessages = document.getElementById("chatMessages");
      const lastMsg = chatMessages.lastElementChild;
      const note = document.createElement("div");
      note.style.cssText = "font-size:11px;color:var(--text-muted);margin-top:8px;font-style:italic;padding-top:8px;border-top:1px solid var(--navy-border);";
      note.textContent = `🌐 ${data.translatedText}`;
      lastMsg.querySelector(".message-content")?.appendChild(note);
    }
  } catch {/* silent */}
}

// ===== TIMELINE =====

function renderTimeline(voterJourney) {
  const timeline = document.getElementById("voterTimeline");
  if (!timeline) return;
  timeline.innerHTML = "";

  voterJourney.forEach((step) => {
    const el = document.createElement("div");
    el.className = "timeline-step";
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", `Step ${step.step}: ${step.title}`);
    el.dataset.step = step.step;

    el.innerHTML = `
      <div class="step-connector"></div>
      <div class="step-icon">${step.icon}</div>
      <div class="step-info">
        <div class="step-title">Step ${step.step}: ${step.title}</div>
        <div class="step-time">${step.timeframe}</div>
      </div>
      <span class="step-arrow">›</span>`;

    el.addEventListener("click", () => openStepModal(step));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openStepModal(step); }
    });
    timeline.appendChild(el);
  });
}

// ===== MODAL =====

async function openStepModal(step) {
  const overlay = document.getElementById("stepModal");
  const content = document.getElementById("modalContent");
  if (!overlay || !content) return;

  overlay.classList.add("visible");
  overlay.setAttribute("aria-hidden", "false");
  document.getElementById("modalClose")?.focus();

  content.innerHTML = `
    <div class="modal-loading">
      <div class="spinner"></div>
      <p>Loading AI explanation…</p>
    </div>`;

  try {
    const res = await fetch("/api/chat/explain-step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepNumber: step.step }),
    });
    const data = await res.json();
    const explanation = data.success ? data.message : step.description || "Ask ElectionIQ about this step below.";

    content.innerHTML = `
      <div class="modal-step-header">
        <div class="modal-step-icon">${step.icon}</div>
        <div>
          <div class="modal-step-title">Step ${step.step}: ${step.title}</div>
          <div class="modal-step-subtitle">⏱ ${step.timeframe}</div>
        </div>
      </div>
      <div class="modal-ai-content">${formatMessage(explanation)}</div>
      <div class="modal-details">
        <h4>What you need to do</h4>
        <ul>${step.details.map((d) => `<li>${sanitizeHTML(d)}</li>`).join("")}</ul>
      </div>
      <div style="margin-top:20px;text-align:center;">
        <button onclick="askAboutStep('${sanitizeHTML(step.title)}')"
          style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border:none;padding:10px 24px;
                 border-radius:12px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;
                 box-shadow:0 4px 16px rgba(37,99,235,0.35);transition:transform .18s;">
          💬 Ask more about this step
        </button>
      </div>`;
  } catch {
    content.innerHTML = `
      <div class="modal-step-header">
        <div class="modal-step-icon">${step.icon}</div>
        <div><div class="modal-step-title">Step ${step.step}: ${step.title}</div></div>
      </div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">${sanitizeHTML(step.description || "")}</p>
      <div class="modal-details">
        <h4>What to do</h4>
        <ul>${step.details.map((d) => `<li>${sanitizeHTML(d)}</li>`).join("")}</ul>
      </div>`;
  }
}

function askAboutStep(stepTitle) {
  closeModal();
  const input = document.getElementById("chatInput");
  const question = `Tell me more about "${stepTitle}" in the voter journey`;
  input.value = question;
  input.focus();
  updateCharCount(question.length);
  document.getElementById("sendBtn").disabled = false;
}

function closeModal() {
  const overlay = document.getElementById("stepModal");
  overlay?.classList.remove("visible");
  overlay?.setAttribute("aria-hidden", "true");
}

// ===== FAQ =====

function renderFAQ(faqData) {
  const faqList = document.getElementById("faqList");
  if (!faqList) return;
  faqList.innerHTML = "";

  faqData.forEach((item, i) => {
    const el = document.createElement("div");
    el.className = "faq-item";
    el.innerHTML = `
      <button class="faq-question" aria-expanded="false" aria-controls="faq-ans-${i}">
        ${sanitizeHTML(item.question)}
        <span class="faq-toggle">▼</span>
      </button>
      <div class="faq-answer" id="faq-ans-${i}" role="region">${sanitizeHTML(item.answer)}</div>`;

    const btn = el.querySelector(".faq-question");
    btn.addEventListener("click", () => {
      const isOpen = el.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach((x) => {
        x.classList.remove("open");
        x.querySelector(".faq-question").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        el.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
    faqList.appendChild(el);
  });
}

// ===== GLOSSARY =====

function renderGlossary(glossaryData) {
  const list = document.getElementById("glossaryList");
  const searchInput = document.getElementById("glossarySearch");
  if (!list) return;

  function render(items) {
    list.innerHTML = items.length
      ? items.map((item) => `
          <div class="glossary-item">
            <div class="glossary-term">${sanitizeHTML(item.term)}</div>
            <div class="glossary-def">${sanitizeHTML(item.definition)}</div>
          </div>`).join("")
      : `<p style="font-size:11px;color:var(--text-muted);text-align:center;padding:16px 0;">No matches found</p>`;
  }

  render(glossaryData);

  let debounceTimer;
  searchInput?.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const q = e.target.value.toLowerCase().trim();
      render(!q ? glossaryData : glossaryData.filter(
        (x) => x.term.toLowerCase().includes(q) || x.definition.toLowerCase().includes(q)
      ));
    }, 160);
  });
}

// ===== NEWS =====

async function searchNews(query) {
  const results = document.getElementById("newsResults");
  if (!results) return;
  results.innerHTML = `<p class="news-placeholder">🔍 Searching…</p>`;

  try {
    const res = await fetch(`/api/google/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data.success || !data.results?.length) {
      results.innerHTML = `<p class="news-placeholder">No results found. Try a different term.</p>`;
      return;
    }

    results.innerHTML = data.results.map((item) => `
      <a href="${sanitizeHTML(item.url)}" target="_blank" rel="noopener noreferrer" class="news-item">
        <div class="news-item-title">${sanitizeHTML(item.title)}</div>
        <div class="news-item-snippet">${sanitizeHTML(item.snippet)}</div>
        <div class="news-item-source">🌐 ${sanitizeHTML(item.source)}</div>
      </a>`).join("");
  } catch {
    results.innerHTML = `<p class="news-placeholder">Search unavailable. Please try again.</p>`;
  }
}

// ===== INPUT HELPERS =====

function updateCharCount(count) {
  const el = document.getElementById("charCount");
  if (!el) return;
  el.textContent = `${count}/2000`;
  el.style.color = count > 1800 ? "var(--rose)" : "var(--text-muted)";
}

// ===== LOAD DATA =====

async function loadElectionData() {
  try {
    const res = await fetch("/api/election-data");
    const data = await res.json();
    if (data.success) {
      state.electionData = data;
      renderTimeline(data.voterJourney);
      renderFAQ(data.faq);
      renderGlossary(data.glossary);
    }
  } catch {
    showToast("Failed to load data. Please refresh.", "error");
  }
}

// ===== EVENT LISTENERS =====

function initEventListeners() {
  const input        = document.getElementById("chatInput");
  const sendBtn      = document.getElementById("sendBtn");
  const clearBtn     = document.getElementById("clearChatBtn");
  const newsBtn      = document.getElementById("newsSearchBtn");
  const newsInput    = document.getElementById("newsSearch");
  const langSelect   = document.getElementById("languageSelect");
  const ctxSelect    = document.getElementById("userContext");
  const modalClose   = document.getElementById("modalClose");
  const stepModal    = document.getElementById("stepModal");
  const heroInput    = document.getElementById("heroSearchInput");
  const heroBtn      = document.getElementById("heroSearchBtn");

  // Hero bar
  const fireHero = () => {
    const q = heroInput?.value.trim();
    if (q) { heroInput.value = ""; sendMessage(q); }
  };
  heroBtn?.addEventListener("click", fireHero);
  heroInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") fireHero(); });

  document.querySelectorAll(".hero-chip").forEach((chip) => {
    chip.addEventListener("click", () => { const q = chip.dataset.q; if (q) sendMessage(q); });
  });

  // Chat send
  sendBtn?.addEventListener("click", () => sendMessage(input.value.trim()));

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.value.trim() && !state.isLoading) sendMessage(input.value.trim());
    }
  });

  input?.addEventListener("input", () => {
    const len = input.value.length;
    updateCharCount(len);
    sendBtn.disabled = len === 0 || state.isLoading;
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  });

  // Quick chips
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const q = chip.dataset.question;
      if (q) sendMessage(q);
    });
  });

  // Clear chat
  clearBtn?.addEventListener("click", async () => {
    if (!confirm("Clear the conversation history?")) return;
    await fetch("/api/chat/clear", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: state.sessionId }),
    }).catch(() => {});

    document.getElementById("chatMessages").innerHTML = `
      <div class="message assistant-message">
        <div class="message-avatar">🗳️</div>
        <div class="message-content">
          <p>Conversation cleared! How can I help you with election questions?</p>
        </div>
      </div>`;
    document.getElementById("quickChips").style.display = "block";
    state.sessionId = generateSessionId();
    showToast("Conversation cleared", "success");
  });

  // News search
  const fireNews = () => { const q = newsInput?.value.trim(); if (q) searchNews(q); };
  newsBtn?.addEventListener("click", fireNews);
  newsInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") fireNews(); });

  // Language
  langSelect?.addEventListener("change", (e) => {
    state.currentLanguage = e.target.value;
    showToast(`Language: ${e.target.options[e.target.selectedIndex].text}`, "info");
  });

  // User context
  ctxSelect?.addEventListener("change", (e) => {
    state.userContext = e.target.value;
    if (e.target.value) showToast(`Mode: ${e.target.value}`, "success");
  });

  // Modal
  modalClose?.addEventListener("click", closeModal);
  stepModal?.addEventListener("click", (e) => { if (e.target === stepModal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}

// ===== INIT =====

async function init() {
  await loadElectionData();
  initEventListeners();
}

document.addEventListener("DOMContentLoaded", init);