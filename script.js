// LocalStorage key
const STORAGE_KEY = "college_queries_app_state_v2";

// DOM: Auth header
const authAreaEl = document.getElementById("auth-area");
const userInfoEl = document.getElementById("user-info");
const userNameLabelEl = document.getElementById("user-name-label");
const logoutBtn = document.getElementById("logout-btn");

// DOM: Auth card & forms
const authCardEl = document.getElementById("auth-card");
const tabLoginBtn = document.getElementById("tab-login");
const tabSignupBtn = document.getElementById("tab-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const signupNameInput = document.getElementById("signup-name");
const signupEmailInput = document.getElementById("signup-email");
const signupPasswordInput = document.getElementById("signup-password");
const showLoginBtn = document.getElementById("show-login");
const showSignupBtn = document.getElementById("show-signup");

// DOM: Questions
const questionForm = document.getElementById("question-form");
const qTitleInput = document.getElementById("q-title");
const qBodyInput = document.getElementById("q-body");
const questionListEl = document.getElementById("question-list");

// DOM: Question detail + answers
const detailEmptyEl = document.getElementById("detail-empty");
const detailPanelEl = document.getElementById("detail-panel");
const detailTitleEl = document.getElementById("detail-title");
const detailBodyEl = document.getElementById("detail-body");
const detailMetaEl = document.getElementById("detail-meta");
const detailStatusEl = document.getElementById("detail-status");
const answersListEl = document.getElementById("answers-list");
const answerForm = document.getElementById("answer-form");
const answerTextInput = document.getElementById("answer-text");
const solveBtn = document.getElementById("solve-btn");

// DOM: Help desk
const helpForm = document.getElementById("help-form");
const helpSubjectInput = document.getElementById("help-subject");
const helpMessageInput = document.getElementById("help-message");
const helpListEl = document.getElementById("help-list");

// App state
let state = {
  users: [],         // {id, name, email, password}
  currentUserId: null,
  questions: [],     // {id, title, body, createdAt, solved, askedByUserId, answers:[]}
  selectedId: null,
  tickets: []        // {id, subject, message, createdAt, userId}
};

// Utility: id generators
function uid(prefix = "id") {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}

// Save whole state to localStorage
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Load state from localStorage
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults
      state = {
        users: parsed.users || [],
        currentUserId: parsed.currentUserId || null,
        questions: parsed.questions || [],
        selectedId: parsed.selectedId || null,
        tickets: parsed.tickets || []
      };
    }
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
  }

  // If there is at least one question and no selection, select first
  if (!state.selectedId && state.questions.length > 0) {
    state.selectedId = state.questions[0].id;
  }
}

// Helpers: get current user and name
function getCurrentUser() {
  return state.users.find((u) => u.id === state.currentUserId) || null;
}

function getUserName(userId) {
  const u = state.users.find((x) => x.id === userId);
  return u ? u.name : "Unknown";
}

// UI: Auth area
function updateAuthUI() {
  const user = getCurrentUser();

  if (user) {
    // Logged in
    authAreaEl.classList.add("hidden");
    userInfoEl.classList.remove("hidden");
    userNameLabelEl.textContent = "Hi, " + user.name;
    authCardEl.classList.add("hidden");
  } else {
    // Not logged in
    authAreaEl.classList.remove("hidden");
    userInfoEl.classList.add("hidden");
    authCardEl.classList.remove("hidden");
  }
}

// UI: Toggle auth tabs
function showLoginTab() {
  tabLoginBtn.classList.add("active");
  tabSignupBtn.classList.remove("active");
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
}

function showSignupTab() {
  tabSignupBtn.classList.add("active");
  tabLoginBtn.classList.remove("active");
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
}

// Render list of questions
function renderQuestionList() {
  questionListEl.innerHTML = "";

  if (state.questions.length === 0) {
    const li = document.createElement("li");
    li.className = "question-item";
    li.textContent = "No questions yet. Be the first to ask!";
    questionListEl.appendChild(li);
    return;
  }

  // Newest first
  const items = [...state.questions].sort((a, b) => b.createdAt - a.createdAt);

  items.forEach((q) => {
    const li = document.createElement("li");
    li.className = "question-item";
    if (q.id === state.selectedId) {
      li.classList.add("active");
    }

    const title = document.createElement("div");
    title.className = "question-title";
    title.textContent = q.title;

    const meta = document.createElement("div");
    meta.className = "question-meta";
    const date = new Date(q.createdAt).toLocaleString();
    const askerName = q.askedByUserId ? getUserName(q.askedByUserId) : "Anonymous";
    meta.textContent = `By ${askerName} • Answers: ${q.answers.length} • ${date}`;

    if (q.solved) {
      const badge = document.createElement("span");
      badge.className = "badge solved";
      badge.textContent = "Solved";
      meta.appendChild(badge);
    }

    li.appendChild(title);
    li.appendChild(meta);

    li.addEventListener("click", () => {
      state.selectedId = q.id;
      renderQuestionList();
      renderDetail();
      saveState();
    });

    questionListEl.appendChild(li);
  });
}

// Render selected question detail + answers
function renderDetail() {
  const question = state.questions.find((q) => q.id === state.selectedId);

  if (!question) {
    detailPanelEl.classList.add("hidden");
    detailEmptyEl.classList.remove("hidden");
    return;
  }

  detailEmptyEl.classList.add("hidden");
  detailPanelEl.classList.remove("hidden");

  const askerName = question.askedByUserId ? getUserName(question.askedByUserId) : "Anonymous";
  const date = new Date(question.createdAt).toLocaleString();

  detailTitleEl.textContent = question.title;
  detailBodyEl.textContent = question.body;
  detailMetaEl.textContent = `Asked by ${askerName} • ${date} • ${question.answers.length} answer(s)`;

  detailStatusEl.textContent = question.solved ? "Solved" : "Unsolved";
  detailStatusEl.classList.toggle("solved", question.solved);

  // Render answers
  answersListEl.innerHTML = "";
  if (question.answers.length === 0) {
    const li = document.createElement("li");
    li.className = "answer-item";
    li.textContent = "No solutions yet. Be the first to answer!";
    answersListEl.appendChild(li);
  } else {
    question.answers.forEach((ans) => {
      const li = document.createElement("li");
      li.className = "answer-item";

      const text = document.createElement("div");
      text.className = "answer-text";
      text.textContent = ans.text;

      const meta = document.createElement("div");
      meta.className = "answer-meta";
      const dateStr = new Date(ans.createdAt).toLocaleString();
      const byName = ans.userId ? getUserName(ans.userId) : "Anonymous";
      meta.textContent = `Answer by ${byName} • ${dateStr}`;

      li.appendChild(text);
      li.appendChild(meta);
      answersListEl.appendChild(li);
    });
  }
}

// Render help desk tickets
function renderHelpTickets() {
  helpListEl.innerHTML = "";

  if (state.tickets.length === 0) {
    const li = document.createElement("li");
    li.className = "answer-item";
    li.textContent = "No help desk tickets yet.";
    helpListEl.appendChild(li);
    return;
  }

  // Newest first
  const items = [...state.tickets].sort((a, b) => b.createdAt - a.createdAt);

  items.forEach((t) => {
    const li = document.createElement("li");
    li.className = "answer-item";

    const text = document.createElement("div");
    text.className = "answer-text";
    text.innerHTML = `<strong>${t.subject}</strong><br>${t.message}`;

    const meta = document.createElement("div");
    meta.className = "answer-meta";
    const dateStr = new Date(t.createdAt).toLocaleString();
    const byName = t.userId ? getUserName(t.userId) : "Anonymous";
    meta.textContent = `Ticket by ${byName} • ${dateStr}`;

    li.appendChild(text);
    li.appendChild(meta);
    helpListEl.appendChild(li);
  });
}

/* ========== Event handlers ========== */

// Auth tab clicks
tabLoginBtn.addEventListener("click", showLoginTab);
tabSignupBtn.addEventListener("click", showSignupTab);

// Header buttons
showLoginBtn.addEventListener("click", () => {
  showLoginTab();
  authCardEl.scrollIntoView({ behavior: "smooth" });
});

showSignupBtn.addEventListener("click", () => {
  showSignupTab();
  authCardEl.scrollIntoView({ behavior: "smooth" });
});

// Signup form submit
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = signupNameInput.value.trim();
  const email = signupEmailInput.value.trim().toLowerCase();
  const password = signupPasswordInput.value;

  if (!name || !email || !password) {
    alert("Please fill all fields.");
    return;
  }

  const exists = state.users.some((u) => u.email === email);
  if (exists) {
    alert("An account with this email already exists. Please login instead.");
    return;
  }

  const newUser = {
    id: uid("u"),
    name,
    email,
    password  // NOTE: only for demo, not secure!
  };

  state.users.push(newUser);
  state.currentUserId = newUser.id;
  saveState();
  updateAuthUI();

  signupForm.reset();
  alert("Account created and logged in!");
});

// Login form submit
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = loginEmailInput.value.trim().toLowerCase();
  const password = loginPasswordInput.value;

  const user = state.users.find((u) => u.email === email && u.password === password);

  if (!user) {
    alert("Invalid email or password.");
    return;
  }

  state.currentUserId = user.id;
  saveState();
  updateAuthUI();

  loginForm.reset();
  alert("Logged in successfully!");
});

// Logout
logoutBtn.addEventListener("click", () => {
  state.currentUserId = null;
  saveState();
  updateAuthUI();
});

// New question submit
questionForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert("Please login or sign up before posting a question.");
    return;
  }

  const title = qTitleInput.value.trim();
  const body = qBodyInput.value.trim();

  if (!title || !body) {
    alert("Please fill in both Title and Description.");
    return;
  }

  const newQuestion = {
    id: uid("q"),
    title,
    body,
    createdAt: Date.now(),
    solved: false,
    askedByUserId: currentUser.id,
    answers: []
  };

  state.questions.push(newQuestion);
  state.selectedId = newQuestion.id;

  saveState();
  renderQuestionList();
  renderDetail();

  questionForm.reset();
});

// New answer submit
answerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert("Please login or sign up before posting a solution.");
    return;
  }

  const text = answerTextInput.value.trim();
  if (!text) {
    alert("Solution cannot be empty.");
    return;
  }

  const question = state.questions.find((q) => q.id === state.selectedId);
  if (!question) return;

  question.answers.push({
    id: uid("a"),
    text,
    createdAt: Date.now(),
    userId: currentUser.id
  });

  saveState();
  renderDetail();

  answerForm.reset();
});

// Toggle solved/unsolved
solveBtn.addEventListener("click", () => {
  const question = state.questions.find((q) => q.id === state.selectedId);
  if (!question) return;

  question.solved = !question.solved;
  saveState();
  renderQuestionList();
  renderDetail();
});

// Help desk submit
helpForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert("Please login or sign up before submitting a help desk ticket.");
    return;
  }

  const subject = helpSubjectInput.value.trim();
  const message = helpMessageInput.value.trim();

  if (!subject || !message) {
    alert("Please fill both subject and message.");
    return;
  }

  const ticket = {
    id: uid("t"),
    subject,
    message,
    createdAt: Date.now(),
    userId: currentUser.id
  };

  state.tickets.push(ticket);
  saveState();
  renderHelpTickets();

  helpForm.reset();
  alert("Help desk ticket submitted (saved locally).");
});

/* ========== Initial load ========== */

loadState();
updateAuthUI();
renderQuestionList();
renderDetail();
renderHelpTickets();
