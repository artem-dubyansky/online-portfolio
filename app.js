
"use strict";

const STORAGE_KEY = "navigator_future_v2";

const defaultData = {
  profile: { name: "", grade: "" },
  projects: [],
  achievements: [],
  route: [],
  testResult: null
};

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return structuredClone(defaultData);

    return {
      ...structuredClone(defaultData),
      ...saved,
      profile: { ...defaultData.profile, ...(saved.profile || {}) }
    };
  } catch {
    return structuredClone(defaultData);
  }
}

let data = loadData();
let quizAnswers = {};
let currentPage = "home";

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Не удалось сохранить данные:", error);
    alert("Браузер не смог сохранить изменения. Проверь свободное место и настройки хранения сайта.");
    return false;
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;"
  })[char]);
}

const app = document.getElementById("app");
const pages = {
  orientation: { title: "Профориентация", description: "Ответь на вопросы о своих интересах и узнай, какие направления стоит исследовать." },
  professions: { title: "Мир профессий", description: "Изучай профессии, задачи специалистов и необходимые навыки." },
  practice: { title: "Практика и проекты", description: "Проверяй интерес к профессиям с помощью практических заданий." },
  education: { title: "Образование", description: "Изучай образовательные направления и планируй развитие навыков." },
  route: { title: "Мой маршрут", description: "Создай личный план и отмечай выполненные шаги." },
  portfolio: { title: "Портфолио", description: "Собирай проекты, достижения и результаты своей работы." },
  opportunities: { title: "Возможности", description: "Раздел для поиска олимпиад, конкурсов и мероприятий." },
  admission: { title: "Поступление", description: "Подготовь список интересующих учебных заведений и направлений." }
};

const professions = [
  { name: "Инженер-конструктор", field: "Инженерия", description: "Разрабатывает конструкции, механизмы и технические решения.", skills: "Физика, математика, черчение, 3D-моделирование" },
  { name: "Программист", field: "IT", description: "Создаёт программы, сайты и цифровые сервисы.", skills: "Алгоритмы, логика, языки программирования" },
  { name: "Архитектор", field: "Проектирование", description: "Проектирует здания и пространства.", skills: "Черчение, пространственное мышление, дизайн" },
  { name: "Биотехнолог", field: "Наука", description: "Применяет биологические процессы для решения практических задач.", skills: "Биология, химия, исследовательские навыки" },
  { name: "Врач", field: "Медицина", description: "Занимается диагностикой, профилактикой и лечением заболеваний.", skills: "Биология, химия, коммуникация" },
  { name: "Экономист", field: "Экономика", description: "Анализирует финансовые и экономические процессы.", skills: "Математика, анализ данных, экономика" },
  { name: "Дизайнер интерфейсов", field: "Дизайн и IT", description: "Проектирует удобные цифровые продукты.", skills: "Дизайн, исследование пользователей, логика" },
  { name: "Эколог", field: "Наука", description: "Изучает окружающую среду и способы её сохранения.", skills: "Биология, география, анализ данных" },
  { name: "Предприниматель", field: "Бизнес", description: "Создаёт и развивает продукты и организации.", skills: "Планирование, коммуникация, экономика" },
  { name: "Робототехник", field: "Инженерия и IT", description: "Разрабатывает робототехнические системы.", skills: "Программирование, физика, электроника" }
];

const quiz = [
  {
    question: "Какие задачи тебе интереснее?",
    options: [
      ["Создавать устройства и механизмы", "engineering"],
      ["Работать с программами и технологиями", "it"],
      ["Исследовать природу и проводить эксперименты", "science"],
      ["Организовывать людей и проекты", "business"],
      ["Создавать визуальные решения", "design"]
    ]
  },
  {
    question: "Какой школьный предмет тебе ближе?",
    options: [
      ["Математика и физика", "engineering"],
      ["Информатика", "it"],
      ["Биология и химия", "science"],
      ["Обществознание и экономика", "business"],
      ["Искусство и черчение", "design"]
    ]
  },
  {
    question: "Какой результат работы тебе приятнее?",
    options: [
      ["Работающий механизм", "engineering"],
      ["Работающая программа", "it"],
      ["Научное открытие", "science"],
      ["Успешно организованный проект", "business"],
      ["Красивый и удобный дизайн", "design"]
    ]
  },
  {
    question: "В какой деятельности ты хотел бы попробовать себя?",
    options: [
      ["Собирать и проектировать", "engineering"],
      ["Программировать", "it"],
      ["Проводить исследования", "science"],
      ["Руководить командой", "business"],
      ["Создавать дизайн", "design"]
    ]
  },
  {
    question: "Что тебе интереснее изучать самостоятельно?",
    options: [
      ["Устройство техники", "engineering"],
      ["Новые цифровые технологии", "it"],
      ["Законы природы", "science"],
      ["Работу компаний и рынков", "business"],
      ["Визуальные стили и композицию", "design"]
    ]
  },
  {
    question: "Какой проект ты бы выбрал?",
    options: [
      ["Создать модель устройства", "engineering"],
      ["Разработать приложение", "it"],
      ["Провести исследование", "science"],
      ["Запустить собственный проект", "business"],
      ["Создать дизайн продукта", "design"]
    ]
  }
];

const fieldNames = {
  engineering: "Инженерия и технологии",
  it: "Информационные технологии",
  science: "Наука и исследования",
  business: "Бизнес и управление",
  design: "Дизайн и творчество"
};

function pageHeader(id) {
  return `<div class="page-header">
    <span class="eyebrow">НАВИГАТОР БУДУЩЕГО</span>
    <h1 class="page-title">${pages[id].title}</h1>
    <p class="page-intro">${pages[id].description}</p>
  </div>`;
}

function renderHome() {
  app.innerHTML = `
    <section class="hero">
      <div class="hero-content">
        <span class="eyebrow">ТВОЁ БУДУЩЕЕ НАЧИНАЕТСЯ ЗДЕСЬ</span>
        <h1>Найди своё направление.<br><span>Построй собственный путь.</span></h1>
        <p>Исследуй профессии, пробуй себя в разных направлениях, развивай навыки и создавай портфолио.</p>
        <button class="primary-button" data-page="orientation">Начать профориентацию →</button>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="hero-circle">Н</div><div class="orbit orbit-a"></div><div class="orbit orbit-b"></div>
      </div>
    </section>
    <section class="home-section">
      <div class="section-heading">
        <span class="eyebrow">ВОЗМОЖНОСТИ ПЛАТФОРМЫ</span>
        <h2>Твой путь к будущей профессии</h2>
        <p>Восемь разделов для исследования интересов и построения образовательного маршрута.</p>
      </div>
      <div class="feature-grid">
        ${Object.entries(pages).map(([id, page], index) => `
          <button class="feature-card" data-page="${id}">
            <span class="feature-number">${String(index + 1).padStart(2, "0")}</span>
            <span class="feature-icon">${["◎","◇","⌘","▤","⌁","▣","✳","↗"][index]}</span>
            <strong>${page.title}</strong>
            <span>${page.description}</span>
          </button>`).join("")}
      </div>
    </section>`;
}

function renderOrientation() {
  const result = data.testResult;

  app.innerHTML = `<section class="page">${pageHeader("orientation")}
    ${result ? `
      <div class="result-box">
        <span class="eyebrow">РЕЗУЛЬТАТ ТЕСТА</span>
        <h2>${escapeHTML(result.name)}</h2>
        <p>Это предварительная рекомендация по твоим ответам, а не окончательный выбор профессии. Изучи направление и попробуй практические задания.</p>
        <button class="secondary-button" id="restart-quiz">Пройти тест заново</button>
        <button class="primary-button" data-page="professions">Посмотреть профессии</button>
      </div>` : `<div id="quiz-container"></div>`}
  </section>`;

  if (!result) renderQuiz();
}

function renderQuiz() {
  const container = document.getElementById("quiz-container");
  if (!container) return;

  const index = Object.keys(quizAnswers).length;

  if (index >= quiz.length) {
    const scores = {};
    Object.values(quizAnswers).forEach(field => {
      scores[field] = (scores[field] || 0) + 1;
    });

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const best = sorted[0][0];

    data.testResult = {
      name: fieldNames[best],
      scores
    };

    saveData();
    renderOrientation();
    return;
  }

  const question = quiz[index];

  container.innerHTML = `
    <div class="form-card">
      <div class="list-row">
        <strong>Вопрос ${index + 1} из ${quiz.length}</strong>
        <span class="muted">${Math.round(index / quiz.length * 100)}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${index / quiz.length * 100}%"></div>
      </div>
      <h2 class="question-title">${question.question}</h2>
      <div class="option-list">
        ${question.options.map(([label, value]) => `
          <label class="option">
            <input type="radio" name="quiz-answer" value="${value}">
            <span>${label}</span>
          </label>`).join("")}
      </div>
      <button class="primary-button" id="quiz-next">Следующий вопрос →</button>
    </div>`;

  document.getElementById("quiz-next").addEventListener("click", () => {
    const selected = container.querySelector('input[name="quiz-answer"]:checked');

    if (!selected) {
      alert("Выбери один вариант ответа.");
      return;
    }

    quizAnswers[index] = selected.value;
    renderQuiz();
  });
}

function renderProfessions() {
  app.innerHTML = `<section class="page">${pageHeader("professions")}
    <input class="search-input" id="profession-search" type="search" placeholder="Найти профессию...">
    <div class="card-grid" id="profession-list"></div>
  </section>`;

  drawProfessions(professions);

  document.getElementById("profession-search").addEventListener("input", event => {
    const query = event.target.value.toLowerCase();

    drawProfessions(professions.filter(item =>
      `${item.name} ${item.field} ${item.description}`.toLowerCase().includes(query)
    ));
  });
}

function drawProfessions(items) {
  const list = document.getElementById("profession-list");
  if (!list) return;

  list.innerHTML = items.length ? items.map(item => {
    const index = professions.indexOf(item);
    return `
      <button type="button" class="content-card profession-card" data-profession-open="${index}" aria-label="Подробнее о профессии: ${escapeHTML(item.name)}">
        <span class="tag">${escapeHTML(item.field)}</span>
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.description)}</p>
        <p class="small"><strong>Полезные навыки:</strong> ${escapeHTML(item.skills)}</p>
        <span class="profession-hint">Нажми, чтобы узнать подробнее →</span>
      </button>`;
  }).join("") : `<p class="empty-state">Ничего не найдено.</p>`;
}

function drawProfessionDetails(index) {
  const item = professions[index];
  const list = document.getElementById("profession-list");
  if (!item || !list) return;

  list.innerHTML = `
    <article class="form-card profession-details">
      <span class="tag">${escapeHTML(item.field)}</span>
      <h2>${escapeHTML(item.name)}</h2>
      <p>${escapeHTML(item.description)}</p>
      <h3>Какие навыки пригодятся</h3>
      <p>${escapeHTML(item.skills)}</p>
      <p class="muted">Чтобы лучше понять эту профессию, изучи реальные задачи специалистов, попробуй учебный проект и оцени, насколько тебе интересна такая деятельность.</p>
      <button type="button" class="secondary-button" data-profession-back>← Назад к профессиям</button>
      <button type="button" class="primary-button" data-add-route="${escapeHTML(item.name)}">Добавить знакомство с профессией в мой маршрут</button>
    </article>`;
}

const practiceTasks = [
  ["Инженерия", "Придумай устройство, которое решает бытовую проблему. Нарисуй схему и опиши принцип работы."],
  ["IT", "Продумай идею приложения для школьников. Запиши его основные функции и нарисуй экран."],
  ["Наука", "Сформулируй исследовательский вопрос, гипотезу и план безопасного наблюдения."],
  ["Бизнес", "Придумай полезный продукт. Определи аудиторию, задачу и способ представить идею."],
  ["Дизайн", "Создай макет интерфейса приложения и объясни, почему он удобен."]
];

function renderPractice() {
  app.innerHTML = `<section class="page">${pageHeader("practice")}
    <div class="card-grid">
      ${practiceTasks.map(([field, task]) => `
        <article class="content-card">
          <span class="tag">${field}</span>
          <h3>Практическое задание</h3>
          <p>${task}</p>
          <button class="secondary-button" data-add-route="${escapeHTML(field)}">Добавить в маршрут</button>
        </article>`).join("")}
    </div>
  </section>`;
}

function renderEducation() {
  app.innerHTML = `<section class="page">${pageHeader("education")}
    <div class="notice">Актуальные курсы и программы нужно добавлять после проверки организатора, даты и условий участия.</div>
    <div class="card-grid">
      <article class="content-card"><h3>Школьная подготовка</h3><p>Определи предметы, которые важны для выбранного направления.</p></article>
      <article class="content-card"><h3>Дополнительное обучение</h3><p>Собирай курсы, кружки и образовательные программы.</p></article>
      <article class="content-card"><h3>Самостоятельное развитие</h3><p>Составляй список навыков и материалов для изучения.</p></article>
    </div>
  </section>`;
}

function renderRoute() {
  app.innerHTML = `<section class="page">${pageHeader("route")}
    <div class="form-card">
      <h2>Добавить шаг</h2>
      <div class="inline-form">
        <input id="route-input" maxlength="120" placeholder="Например: изучить основы программирования">
        <button class="primary-button" id="route-add">Добавить</button>
      </div>
    </div>
    <div class="form-card">
      <h2>Мой план</h2>
      <div id="route-list"></div>
    </div>
  </section>`;

  drawRoute();

  document.getElementById("route-add").addEventListener("click", () => {
    const input = document.getElementById("route-input");
    const title = input.value.trim();
    if (!title) return;

    data.route.push({ id: createId(), title, done: false });
    saveData();
    input.value = "";
    drawRoute();
  });
}

function drawRoute() {
  const list = document.getElementById("route-list");
  if (!list) return;

  list.innerHTML = data.route.length ? data.route.map(item => `
    <div class="list-row">
      <label class="check-row">
        <input type="checkbox" data-route-check="${item.id}" ${item.done ? "checked" : ""}>
        <span>${escapeHTML(item.title)}</span>
      </label>
      <button class="danger-button" data-route-delete="${item.id}">Удалить</button>
    </div>`).join("") : `<p class="empty-state">Пока нет шагов. Добавь первый пункт своего маршрута.</p>`;
}

function renderPortfolio() {
  app.innerHTML = `<section class="page">${pageHeader("portfolio")}
    <div class="form-card">
      <h2>Мой профиль</h2>
      <div class="form-group"><label for="profile-name">Имя или псевдоним</label><input id="profile-name" maxlength="80" value="${escapeHTML(data.profile.name)}"></div>
      <div class="form-group"><label for="profile-grade">Класс или курс (необязательно)</label><input id="profile-grade" maxlength="30" value="${escapeHTML(data.profile.grade)}"></div>
      <button class="primary-button" id="profile-save">Сохранить профиль</button>
    </div>
    <div class="form-card">
      <h2>Добавить проект</h2>
      <div class="form-group"><label for="project-title">Название проекта</label><input id="project-title" maxlength="100"></div>
      <div class="form-group"><label for="project-description">Описание</label><textarea id="project-description" maxlength="1500"></textarea></div>
      <button class="primary-button" id="project-add">Добавить проект</button>
      <div id="project-list"></div>
    </div>
    <div class="form-card">
      <h2>Достижения</h2>
      <div class="inline-form">
        <input id="achievement-input" maxlength="150" placeholder="Название достижения">
        <button class="primary-button" id="achievement-add">Добавить</button>
      </div>
      <div id="achievement-list"></div>
    </div>
    <div class="form-card">
      <h2>Экспорт данных</h2>
      <p class="muted small">Резервная копия включает профиль, тест, проекты, достижения и маршрут. Файл хранится на твоём устройстве.</p>
      <button class="secondary-button" id="export-data">Скачать резервную копию</button>
      <button class="danger-button" id="clear-data">Удалить все данные на этом устройстве</button>
    </div>
    <p class="notice">Важно: сейчас данные сохраняются только в этом браузере. Они не синхронизируются с другими устройствами и не отправляются на сервер.</p>
  </section>`;

  document.getElementById("profile-save").addEventListener("click", () => {
    data.profile.name = document.getElementById("profile-name").value.trim();
    data.profile.grade = document.getElementById("profile-grade").value.trim();
    saveData();
    alert("Профиль сохранён.");
  });

  document.getElementById("project-add").addEventListener("click", () => {
    const title = document.getElementById("project-title").value.trim();
    const description = document.getElementById("project-description").value.trim();

    if (!title) return alert("Укажи название проекта.");

    data.projects.push({ id: createId(), title, description });
    saveData();
    drawProjects();

    document.getElementById("project-title").value = "";
    document.getElementById("project-description").value = "";
  });

  document.getElementById("achievement-add").addEventListener("click", () => {
    const input = document.getElementById("achievement-input");
    const title = input.value.trim();
    if (!title) return;

    data.achievements.push({ id: createId(), title });
    saveData();
    input.value = "";
    drawAchievements();
  });

  document.getElementById("export-data").addEventListener("click", exportData);

  document.getElementById("clear-data").addEventListener("click", () => {
    if (!confirm("Точно удалить все данные портфолио и маршрута на этом устройстве?")) return;

    data = JSON.parse(JSON.stringify(defaultData));
    try {
      localStorage.removeItem("navigator_universities_v1");
    } catch {}
    saveData();
    renderPortfolio();
  });

  drawProjects();
  drawAchievements();
}

function drawProjects() {
  const list = document.getElementById("project-list");
  if (!list) return;

  list.innerHTML = data.projects.length ? data.projects.map(item => `
    <article class="content-card">
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.description)}</p>
      <button class="danger-button" data-project-delete="${item.id}">Удалить</button>
    </article>`).join("") : `<p class="empty-state">Проектов пока нет.</p>`;
}

function drawAchievements() {
  const list = document.getElementById("achievement-list");
  if (!list) return;

  list.innerHTML = data.achievements.length ? data.achievements.map(item => `
    <div class="list-row">
      <span>${escapeHTML(item.title)}</span>
      <button class="danger-button" data-achievement-delete="${item.id}">Удалить</button>
    </div>`).join("") : `<p class="empty-state">Достижений пока нет.</p>`;
}

function renderOpportunities() {
  app.innerHTML = `<section class="page">${pageHeader("opportunities")}
    <div class="notice">Здесь пока нет подключённого каталога актуальных мероприятий. Информацию нужно проверять по официальным источникам.</div>
    <div class="card-grid">
      <article class="content-card"><h3>Олимпиады</h3><p>Каталог олимпиад с организаторами, годом и сроками.</p></article>
      <article class="content-card"><h3>Конкурсы проектов</h3><p>Каталог исследовательских и инженерных конкурсов.</p></article>
      <article class="content-card"><h3>Мероприятия</h3><p>Выставки, экскурсии, лекции и мастер-классы.</p></article>
    </div>
  </section>`;
}

function renderAdmission() {
  const key = "navigator_universities_v1";
  let universities = readStorage(key, []);
  if (!Array.isArray(universities)) universities = [];

  app.innerHTML = `<section class="page">${pageHeader("admission")}
    <div class="notice">Правила приёма, экзамены и проходные баллы необходимо проверять на официальном сайте каждого учебного заведения.</div>
    <div class="form-card">
      <h2>Мои интересующие учебные заведения</h2>
      <div class="inline-form">
        <input id="university-input" maxlength="150" placeholder="Название учебного заведения">
        <button class="primary-button" id="university-add">Добавить</button>
      </div>
      <div id="university-list"></div>
    </div>
  </section>`;

  const list = document.getElementById("university-list");

  function draw() {
    list.innerHTML = universities.length ? universities.map((name, index) => `
      <div class="list-row">
        <span>${escapeHTML(name)}</span>
        <button class="danger-button" data-university-delete="${index}">Удалить</button>
      </div>`).join("") : `<p class="empty-state">Список пока пуст.</p>`;
  }

  document.getElementById("university-add").addEventListener("click", () => {
    const input = document.getElementById("university-input");
    const name = input.value.trim();
    if (!name) return;

    universities.push(name);
    try {
      localStorage.setItem(key, JSON.stringify(universities));
    } catch {
      universities.pop();
      alert("Не удалось сохранить список. Проверь настройки хранения браузера.");
      return;
    }
    input.value = "";
    draw();
  });

  draw();
}

function exportData() {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    portfolio: data,
    universities: readStorage("navigator_universities_v1", [])
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "navigator-future-portfolio.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function navigate(page) {
  const allowed = page === "home" || Object.hasOwn(pages, page);
  currentPage = allowed ? page : "home";

  document.querySelectorAll(".nav [data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === currentPage);
  });

  const nav = document.getElementById("navigation");
  nav.classList.remove("open");
  document.getElementById("menu-toggle").setAttribute("aria-expanded", "false");

  switch (currentPage) {
    case "home": renderHome(); break;
    case "orientation": renderOrientation(); break;
    case "professions": renderProfessions(); break;
    case "practice": renderPractice(); break;
    case "education": renderEducation(); break;
    case "route": renderRoute(); break;
    case "portfolio": renderPortfolio(); break;
    case "opportunities": renderOpportunities(); break;
    case "admission": renderAdmission(); break;
  }

  app.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Надёжная навигация в capture-фазе: не зависит от обработчиков вложенных элементов.
document.addEventListener("click", event => {
  const target = event.target instanceof Element ? event.target : event.target?.parentElement;
  const pageButton = target?.closest("[data-page]");
  if (!pageButton) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  try {
    navigate(pageButton.dataset.page);
  } catch (error) {
    console.error("Ошибка перехода между разделами:", error);
    const appRoot = document.getElementById("app");
    if (appRoot) {
      appRoot.innerHTML = '<section class="page"><div class="status-error"><strong>Не удалось открыть раздел.</strong><p>Обнови страницу. Если ошибка повторится, сообщи об этом разработчику.</p></div></section>';
    }
  }
}, true);

document.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-page]");

  if (pageButton) {
    event.preventDefault();
    navigate(pageButton.dataset.page);
    return;
  }

  const professionOpen = event.target.closest("[data-profession-open]");
  if (professionOpen) {
    drawProfessionDetails(Number(professionOpen.dataset.professionOpen));
    return;
  }

  const professionBack = event.target.closest("[data-profession-back]");
  if (professionBack) {
    const query = (document.getElementById("profession-search")?.value || "").toLowerCase();
    drawProfessions(professions.filter(item =>
      `${item.name} ${item.field} ${item.description}`.toLowerCase().includes(query)
    ));
    return;
  }

  const routeCheck = event.target.closest("[data-route-check]");
  if (routeCheck) {
    const item = data.route.find(row => row.id === routeCheck.dataset.routeCheck);
    if (item) item.done = routeCheck.checked;
    saveData();
    drawRoute();
    return;
  }

  const routeDelete = event.target.closest("[data-route-delete]");
  if (routeDelete) {
    data.route = data.route.filter(row => row.id !== routeDelete.dataset.routeDelete);
    saveData();
    drawRoute();
    return;
  }

  const projectDelete = event.target.closest("[data-project-delete]");
  if (projectDelete) {
    data.projects = data.projects.filter(row => row.id !== projectDelete.dataset.projectDelete);
    saveData();
    drawProjects();
    return;
  }

  const achievementDelete = event.target.closest("[data-achievement-delete]");
  if (achievementDelete) {
    data.achievements = data.achievements.filter(row => row.id !== achievementDelete.dataset.achievementDelete);
    saveData();
    drawAchievements();
    return;
  }

  const addRoute = event.target.closest("[data-add-route]");
  if (addRoute) {
    data.route.push({
      id: createId(),
      title: `Практика: ${addRoute.dataset.addRoute}`,
      done: false
    });
    saveData();
    alert("Задание добавлено в твой маршрут.");
    return;
  }

  const universityDelete = event.target.closest("[data-university-delete]");
  if (universityDelete) {
    const key = "navigator_universities_v1";
    let universities = readStorage(key, []);
    if (!Array.isArray(universities)) universities = [];
    universities.splice(Number(universityDelete.dataset.universityDelete), 1);
    try {
      localStorage.setItem(key, JSON.stringify(universities));
    } catch {
      alert("Не удалось обновить список в хранилище браузера.");
      return;
    }
    renderAdmission();
  }
});

document.addEventListener("click", event => {
  if (event.target.id === "restart-quiz") {
    quizAnswers = {};
    data.testResult = null;
    saveData();
    renderOrientation();
  }
});

document.getElementById("menu-toggle").addEventListener("click", () => {
  const nav = document.getElementById("navigation");
  const isOpen = nav.classList.toggle("open");
  document.getElementById("menu-toggle").setAttribute("aria-expanded", String(isOpen));
});

renderHome();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.error("Service Worker registration failed:", error);
    });
  });
}

let installPrompt = null;

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
  document.getElementById("install-banner").hidden = false;
});

document.getElementById("install-button").addEventListener("click", async () => {
  if (!installPrompt) return;

  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  document.getElementById("install-banner").hidden = true;
});

document.getElementById("install-close").addEventListener("click", () => {
  document.getElementById("install-banner").hidden = true;
});
