
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
  const key = "navigator_education_v1";
  let items = readStorage(key, []);
  if (!Array.isArray(items)) items = [];
  const kinds = ["Курс", "Кружок", "Образовательная программа", "Летняя школа", "Самостоятельное обучение"];
  app.innerHTML = `<section class="page">${pageHeader("education")}
    <div class="notice">Добавляй только те программы, у которых ты проверил организатора, сроки и условия на официальной странице. Платформа пока не подключена к автоматическому каталогу.</div>
    <div class="form-card"><h2>Добавить обучение</h2>
      <div class="form-group"><label for="edu-title">Название</label><input id="edu-title" maxlength="140" placeholder="Название курса или программы"></div>
      <div class="form-group"><label for="edu-kind">Тип</label><select id="edu-kind">${kinds.map(x => `<option>${x}</option>`).join("")}</select></div>
      <div class="form-group"><label for="edu-organizer">Организатор</label><input id="edu-organizer" maxlength="120" placeholder="Школа, университет, образовательная платформа"></div>
      <div class="form-group"><label for="edu-direction">Направление</label><input id="edu-direction" maxlength="100" placeholder="Например: инженерия, программирование"></div>
      <div class="form-group"><label for="edu-age">Возраст или класс</label><input id="edu-age" maxlength="80" placeholder="Например: 8–11 класс"></div>
      <div class="form-group"><label for="edu-dates">Сроки проведения</label><input id="edu-dates" maxlength="100" placeholder="Даты или период"></div>
      <div class="form-group"><label for="edu-cost">Стоимость</label><input id="edu-cost" maxlength="80" placeholder="Бесплатно / стоимость / не указана"></div>
      <div class="form-group"><label for="edu-conditions">Условия участия</label><textarea id="edu-conditions" maxlength="700" placeholder="Отбор, регистрация, необходимые знания"></textarea></div>
      <div class="form-group"><label for="edu-source">Официальная страница</label><input id="edu-source" type="url" maxlength="500" placeholder="https://..."></div>
      <button class="primary-button" id="edu-add">Сохранить программу</button>
    </div>
    <div class="form-card"><h2>Мой список обучения</h2><div id="education-list"></div></div>
    <div class="card-grid">
      <article class="content-card"><h3>Школьное обучение</h3><p>Профильные классы, предметы и углублённая подготовка.</p></article>
      <article class="content-card"><h3>Дополнительное образование</h3><p>Курсы, кружки, образовательные центры и онлайн-программы.</p></article>
      <article class="content-card"><h3>Самостоятельное развитие</h3><p>Учебные материалы, видеоуроки и индивидуальные планы.</p></article>
      <article class="content-card"><h3>Образовательные программы</h3><p>Летние школы, интенсивы и профильные смены.</p></article>
    </div></section>`;
  const draw = () => {
    const list = document.getElementById("education-list");
    if (!list) return;
    list.innerHTML = items.length ? items.map((item, i) => `<article class="content-card">
      <div class="list-row"><h3>${escapeHTML(item.title)}</h3><span class="tag">${escapeHTML(item.kind)}</span></div>
      <p><strong>Организатор:</strong> ${escapeHTML(item.organizer || "Не указан")}</p>
      <p><strong>Направление:</strong> ${escapeHTML(item.direction || "Не указано")}</p>
      <p><strong>Возраст/класс:</strong> ${escapeHTML(item.age || "Не указано")} · <strong>Сроки:</strong> ${escapeHTML(item.dates || "Не указаны")}</p>
      <p><strong>Стоимость:</strong> ${escapeHTML(item.cost || "Не указана")}</p><p>${escapeHTML(item.conditions || "")}</p>
      <a href="${escapeHTML(item.source)}" target="_blank" rel="noopener noreferrer">Официальная страница</a>
      <button class="danger-button" data-edu-delete="${i}">Удалить из списка</button></article>`).join("") : '<p class="empty-state">Пока ничего не добавлено. Сохраняй проверенные курсы и программы.</p>';
  };
  document.getElementById("edu-add").addEventListener("click", () => {
    const get = id => document.getElementById(id).value.trim();
    const title = get("edu-title"), organizer = get("edu-organizer"), source = get("edu-source");
    let parsed; try { parsed = new URL(source); } catch { return alert("Укажи корректную ссылку на официальную страницу."); }
    if (!title || !organizer || !["https:", "http:"].includes(parsed.protocol)) return alert("Заполни название, организатора и официальную ссылку.");
    items.push({ id: createId(), title, kind: get("edu-kind"), organizer, direction: get("edu-direction"), age: get("edu-age"), dates: get("edu-dates"), cost: get("edu-cost"), conditions: get("edu-conditions"), source, addedAt: new Date().toISOString() });
    try { localStorage.setItem(key, JSON.stringify(items)); } catch { items.pop(); return alert("Не удалось сохранить запись. Возможно, закончилось место в браузере."); }
    ["edu-title","edu-organizer","edu-direction","edu-age","edu-dates","edu-cost","edu-conditions","edu-source"].forEach(id => document.getElementById(id).value = "");
    draw();
  });
  draw();
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
  const profile = { city: "", school: "", interests: "", skills: "", ...(data.profile || {}) };
  data.profile = profile;
  app.innerHTML = `<section class="page">${pageHeader("portfolio")}
    <div class="form-card">
      <h2>Анкета ученика</h2>
      <div class="form-group"><label for="profile-name">ФИО или имя для портфолио</label><input id="profile-name" maxlength="100" value="${escapeHTML(profile.name)}"></div>
      <div class="form-group"><label for="profile-grade">Класс или курс</label><input id="profile-grade" maxlength="30" value="${escapeHTML(profile.grade)}"></div>
      <div class="form-group"><label for="profile-school">Школа / учебное заведение</label><input id="profile-school" maxlength="160" value="${escapeHTML(profile.school)}"></div>
      <div class="form-group"><label for="profile-city">Город</label><input id="profile-city" maxlength="100" value="${escapeHTML(profile.city)}"></div>
      <div class="form-group"><label for="profile-interests">Интересующие направления</label><textarea id="profile-interests" maxlength="500">${escapeHTML(profile.interests)}</textarea></div>
      <div class="form-group"><label for="profile-skills">Навыки и дисциплины</label><textarea id="profile-skills" maxlength="500">${escapeHTML(profile.skills)}</textarea></div>
      <button class="primary-button" id="profile-save">Сохранить анкету и грамоты</button>
    </div>
    <div class="form-card">
      <h2>Добавить проект</h2>
      <div class="form-group"><label for="project-title">Название проекта</label><input id="project-title" maxlength="100"></div>
      <div class="form-group"><label for="project-description">Описание и личный вклад</label><textarea id="project-description" maxlength="1500"></textarea></div>
      <button class="primary-button" id="project-add">Добавить проект</button><div id="project-list"></div>
    </div>
    <div class="form-card">
      <h2>Олимпиады, конкурсы и грамоты</h2>
      <div class="form-group"><label for="achievement-title">Название олимпиады или конкурса</label><input id="achievement-title" maxlength="160" placeholder="Можно ввести своё название"></div>
      <div class="form-group"><label for="achievement-subject">Предмет / направление</label><select id="achievement-subject">
        <option>Математика</option><option>Физика</option><option>Информатика</option><option>Химия</option><option>Биология</option><option>Русский язык</option><option>Иностранный язык</option><option>История</option><option>Обществознание</option><option>Инженерия и технологии</option><option>Другое</option></select></div>
      <div class="form-group"><label for="achievement-grade">Класс участия</label><select id="achievement-grade">${Array.from({length:11},(_,i)=>`<option>${i+1} класс</option>`).join("")}</select></div>
      <div class="form-group"><label for="achievement-stage">Этап</label><select id="achievement-stage"><option>Школьный</option><option>Муниципальный</option><option>Региональный</option><option>Заключительный</option><option>Отборочный</option><option>Другой</option></select></div>
      <div class="form-group"><label for="achievement-result">Результат</label><select id="achievement-result"><option>Участник</option><option>Призёр</option><option>Победитель</option><option>Дипломант</option><option>Другое</option></select></div>
      <div class="form-group"><label for="achievement-year">Год участия</label><input id="achievement-year" maxlength="4" inputmode="numeric" placeholder="Например: 2026"></div>
      <div class="form-group"><label for="achievement-photo">Фото грамоты или диплома</label><input id="achievement-photo" type="file" accept="image/*"><span class="muted small">Изображение будет уменьшено перед сохранением. Храни также оригинал отдельно.</span></div>
      <button class="primary-button" id="achievement-add">Сохранить достижение</button><div id="achievement-list"></div>
    </div>
    <div class="form-card">
      <h2>Экспорт портфолио</h2>
      <p class="muted small">Word — редактируемый документ. PDF — откроется окно печати, где можно выбрать «Сохранить как PDF». TXT — простой читаемый текст. JSON оставлен только для резервной копии и восстановления.</p>
      <div class="export-actions">
        <button class="primary-button" id="portfolio-word">Открыть официальный бланк (Word)</button>
        <button class="secondary-button" id="portfolio-pdf">Открыть бланк для PDF / печати</button>
        <button class="secondary-button" id="portfolio-text">Скачать текст портфолио (TXT)</button>
        <button class="secondary-button" id="export-data">Скачать техническую резервную копию (JSON)</button>
      </div>
      <button class="danger-button" id="clear-data">Удалить все данные на этом устройстве</button>
    </div>
    <p class="notice">Данные сохраняются в этом браузере на текущем устройстве. Они не отправляются на сервер и не синхронизируются. Если очистить данные сайта, локальная копия может быть потеряна — регулярно скачивай резервный файл.</p>
  </section>`;
  document.getElementById("profile-save").addEventListener("click", () => {
    data.profile = {
      name: document.getElementById("profile-name").value.trim(),
      grade: document.getElementById("profile-grade").value.trim(),
      school: document.getElementById("profile-school").value.trim(),
      city: document.getElementById("profile-city").value.trim(),
      interests: document.getElementById("profile-interests").value.trim(),
      skills: document.getElementById("profile-skills").value.trim()
    };
    if (saveData()) alert("Анкета сохранена.");
  });
  document.getElementById("project-add").addEventListener("click", () => {
    const title = document.getElementById("project-title").value.trim();
    const description = document.getElementById("project-description").value.trim();
    if (!title) return alert("Укажи название проекта.");
    data.projects.push({ id: createId(), title, description });
    if (!saveData()) { data.projects.pop(); return; }
    drawProjects(); document.getElementById("project-title").value = ""; document.getElementById("project-description").value = "";
  });
  document.getElementById("achievement-add").addEventListener("click", async () => {
    const title = document.getElementById("achievement-title").value.trim();
    if (!title) return alert("Укажи название олимпиады или конкурса.");
    const file = document.getElementById("achievement-photo").files[0];
    let photo = "";
    if (file) {
      if (!file.type.startsWith("image/")) return alert("Выбери файл изображения.");
      if (file.size > 8 * 1024 * 1024) return alert("Файл слишком большой. Выбери изображение до 8 МБ.");
      try { photo = await compressCertificateImage(file); }
      catch { return alert("Не удалось обработать изображение. Попробуй другой файл."); }
    }
    const year = document.getElementById("achievement-year").value.trim();
    if (year && !/^(19|20)\d{2}$/.test(year)) return alert("Укажи год в формате 2026.");
    const item = {
      id: createId(), title,
      subject: document.getElementById("achievement-subject").value,
      grade: document.getElementById("achievement-grade").value,
      stage: document.getElementById("achievement-stage").value,
      result: document.getElementById("achievement-result").value,
      year, photo
    };
    data.achievements.push(item);
    if (!saveData()) { data.achievements.pop(); return; }
    ["achievement-title","achievement-year","achievement-photo"].forEach(id => document.getElementById(id).value = "");
    drawAchievements();
  });
  document.getElementById("portfolio-word").addEventListener("click", exportPortfolioWord);
  document.getElementById("portfolio-pdf").addEventListener("click", printPortfolio);
  document.getElementById("portfolio-text").addEventListener("click", exportPortfolioText);
  document.getElementById("export-data").addEventListener("click", exportData);
  document.getElementById("clear-data").addEventListener("click", () => {
    if (!confirm("Точно удалить все данные портфолио, маршрута, обучения и возможностей на этом устройстве? Сначала скачай резервную копию.")) return;
    data = JSON.parse(JSON.stringify(defaultData));
    ["navigator_universities_v1","navigator_education_v1","navigator_opportunities_v1"].forEach(key => { try { localStorage.removeItem(key); } catch {} });
    saveData(); renderPortfolio();
  });
  drawProjects(); drawAchievements();
}

function compressCertificateImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("Canvas unavailable"));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const result = canvas.toDataURL("image/jpeg", 0.65);
        if (result.length > 420000) return reject(new Error("Image too large after compression"));
        resolve(result);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function getAchievementDetails(item) {
  return {
    title: item.title || "Достижение",
    subject: item.subject || "Не указан",
    grade: item.grade || "Не указан",
    stage: item.stage || "Не указан",
    result: item.result || "Не указан",
    year: item.year || ""
  };
}

function buildPortfolioHTML() {
  const p = data.profile || {};
  const achievements = data.achievements.map(item => {
    const x = getAchievementDetails(item);
    return `<article class="achievement"><h3>${escapeHTML(x.title)}</h3><p>${escapeHTML([x.subject,x.grade,x.stage,x.result,x.year].filter(Boolean).join(" · "))}</p>${item.photo ? `<img class="certificate" src="${escapeHTML(item.photo)}" alt="Фото грамоты: ${escapeHTML(x.title)}">` : ""}</article>`;
  }).join("");
  const projects = data.projects.map(x => `<article><h3>${escapeHTML(x.title)}</h3><p>${escapeHTML(x.description || "")}</p></article>`).join("");
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Портфолио</title><style>
    body{font:14px Arial,sans-serif;color:#111;max-width:850px;margin:35px auto;line-height:1.5}
    h1{font-size:26px;border-bottom:2px solid #333;padding-bottom:10px}h2{font-size:19px;margin-top:28px;border-bottom:1px solid #aaa;padding-bottom:5px}
    h3{font-size:15px;margin-bottom:4px}.muted{color:#555}.achievement,article{break-inside:avoid;margin:12px 0;padding:10px;border:1px solid #ddd}
    .certificate{display:block;max-width:100%;max-height:650px;object-fit:contain;margin:10px auto}
    @media print{body{margin:12mm;max-width:none}.certificate{max-height:230mm}}
  </style></head><body><h1>Портфолио ученика</h1>
    <p><strong>ФИО:</strong> ${escapeHTML(p.name || "Не заполнено")}</p><p><strong>Класс:</strong> ${escapeHTML(p.grade || "Не заполнено")}</p>
    <p><strong>Школа:</strong> ${escapeHTML(p.school || "Не заполнено")}</p><p><strong>Город:</strong> ${escapeHTML(p.city || "Не заполнено")}</p>
    <p><strong>Интересы:</strong> ${escapeHTML(p.interests || "Не указаны")}</p><p><strong>Навыки:</strong> ${escapeHTML(p.skills || "Не указаны")}</p>
    <h2>Проекты</h2>${projects || "<p>Проекты не добавлены.</p>"}
    <h2>Олимпиады, конкурсы и достижения</h2>${achievements || "<p>Достижения не добавлены.</p>"}
    <p class="muted">Сформировано в «Навигаторе будущего» · ${new Date().toLocaleDateString("ru-RU")}</p></body></html>`;
}

function downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function exportPortfolioWord() {
  downloadBlob("\ufeff" + buildPortfolioHTML(), "application/msword;charset=utf-8", "portfolio-navigator-future.doc");
}

function printPortfolio() {
  const popup = window.open("", "_blank");
  if (!popup) return alert("Браузер заблокировал новое окно. Разреши всплывающие окна для печати портфолио.");
  popup.onload = () => popup.print();
  popup.document.open(); popup.document.write(buildPortfolioHTML()); popup.document.close();
}

function exportPortfolioText() {
  const p = data.profile || {};
  const lines = ["ПОРТФОЛИО УЧЕНИКА", "", `ФИО: ${p.name || "Не заполнено"}`, `Класс: ${p.grade || "Не заполнено"}`, `Школа: ${p.school || "Не заполнено"}`, `Город: ${p.city || "Не заполнено"}`, `Интересы: ${p.interests || "Не указаны"}`, `Навыки: ${p.skills || "Не указаны"}`, "", "ПРОЕКТЫ"];
  data.projects.forEach((x,i) => lines.push(`${i+1}. ${x.title}`, x.description || ""));
  lines.push("", "ОЛИМПИАДЫ, КОНКУРСЫ И ДОСТИЖЕНИЯ");
  data.achievements.forEach((item,i) => { const x=getAchievementDetails(item); lines.push(`${i+1}. ${x.title}`, [x.subject,x.grade,x.stage,x.result,x.year].filter(Boolean).join(" · ")); });
  downloadBlob("\ufeff" + lines.join("\n"), "text/plain;charset=utf-8", "portfolio-navigator-future.txt");
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
  list.innerHTML = data.achievements.length ? data.achievements.map(item => {
    const x = getAchievementDetails(item);
    return `<article class="content-card">
      <h3>${escapeHTML(x.title)}</h3>
      <p>${escapeHTML([x.subject,x.grade,x.stage,x.result,x.year].filter(Boolean).join(" · "))}</p>
      ${item.photo ? `<img class="certificate-preview" src="${escapeHTML(item.photo)}" alt="Фото грамоты">` : '<p class="muted small">Фото грамоты не приложено.</p>'}
      <button class="danger-button" data-achievement-delete="${escapeHTML(item.id || "")}">Удалить</button>
    </article>`;
  }).join("") : `<p class="empty-state">Достижений пока нет.</p>`;
}

function renderOpportunities() {
  const key = "navigator_opportunities_v1";
  let items = readStorage(key, []);
  if (!Array.isArray(items)) items = [];
  const categories = ["Олимпиада", "Конкурс", "Хакатон", "Мероприятие", "Летняя программа"];
  app.innerHTML = `<section class="page">${pageHeader("opportunities")}
    <div class="notice">Это личный каталог возможностей. Непроверенные события не показываются как актуальные: добавляй запись после проверки организатора, дат, дедлайна и правил на официальном сайте.</div>
    <div class="form-card"><h2>Добавить возможность</h2>
      <div class="form-group"><label for="opp-title">Название</label><input id="opp-title" maxlength="140"></div>
      <div class="form-group"><label for="opp-category">Категория</label><select id="opp-category">${categories.map(x => `<option>${x}</option>`).join("")}</select></div>
      <div class="form-group"><label for="opp-organizer">Организатор</label><input id="opp-organizer" maxlength="140"></div>
      <div class="form-group"><label for="opp-direction">Направление</label><input id="opp-direction" maxlength="100" placeholder="Инженерия, IT, наука..."></div>
      <div class="form-group"><label for="opp-age">Возраст или класс</label><input id="opp-age" maxlength="80"></div>
      <div class="form-group"><label for="opp-dates">Даты проведения</label><input id="opp-dates" maxlength="100"></div>
      <div class="form-group"><label for="opp-deadline">Дедлайн регистрации</label><input id="opp-deadline" maxlength="100"></div>
      <div class="form-group"><label for="opp-format">Формат и стоимость</label><input id="opp-format" maxlength="120" placeholder="Онлайн / очно, бесплатно / платно"></div>
      <div class="form-group"><label for="opp-source">Официальная страница</label><input id="opp-source" type="url" maxlength="500" placeholder="https://..."></div>
      <button class="primary-button" id="opp-add">Добавить в каталог</button></div>
    <div class="form-card"><h2>Каталог</h2><input class="search-input" id="opp-search" placeholder="Поиск по названию, организатору или направлению"><div id="opportunity-list"></div></div>
  </section>`;
  const draw = () => {
    const list = document.getElementById("opportunity-list"); if (!list) return;
    const q = (document.getElementById("opp-search")?.value || "").toLowerCase();
    const filtered = items.filter(x => `${x.title} ${x.organizer} ${x.direction} ${x.category}`.toLowerCase().includes(q));
    list.innerHTML = filtered.length ? filtered.map(item => {
      const index = items.findIndex(x => x.id === item.id);
      return `<article class="content-card"><div class="list-row"><h3>${escapeHTML(item.title)}</h3><span class="tag">${escapeHTML(item.category)}</span></div>
        <p><strong>Организатор:</strong> ${escapeHTML(item.organizer)}</p>
        <p><strong>Направление:</strong> ${escapeHTML(item.direction || "Не указано")} · <strong>Возраст:</strong> ${escapeHTML(item.age || "Не указано")}</p>
        <p><strong>Даты:</strong> ${escapeHTML(item.dates || "Не указаны")} · <strong>Дедлайн:</strong> ${escapeHTML(item.deadline || "Не указан")}</p>
        <p><strong>Формат/стоимость:</strong> ${escapeHTML(item.format || "Не указаны")}</p>
        <p class="small muted">Добавлено: ${escapeHTML(new Date(item.addedAt).toLocaleDateString("ru-RU"))}. Актуальность перепроверь у организатора.</p>
        <a href="${escapeHTML(item.source)}" target="_blank" rel="noopener noreferrer">Официальная страница</a><button class="danger-button" data-opp-delete="${index}">Удалить</button></article>`;
    }).join("") : '<p class="empty-state">Записей нет. Добавь событие после проверки официальных условий.</p>';
  };
  document.getElementById("opp-add").addEventListener("click", () => {
    const get = id => document.getElementById(id).value.trim();
    const title = get("opp-title"), organizer = get("opp-organizer"), source = get("opp-source");
    let parsed; try { parsed = new URL(source); } catch { return alert("Добавь ссылку на официальную страницу."); }
    if (!title || !organizer || !["http:", "https:"].includes(parsed.protocol)) return alert("Нужны название, организатор и официальная ссылка.");
    items.push({ id: createId(), title, category: get("opp-category"), organizer, direction: get("opp-direction"), age: get("opp-age"), dates: get("opp-dates"), deadline: get("opp-deadline"), format: get("opp-format"), source, addedAt: new Date().toISOString() });
    try { localStorage.setItem(key, JSON.stringify(items)); } catch { items.pop(); return alert("Не удалось сохранить запись. Проверь свободное место в браузере."); }
    ["opp-title","opp-organizer","opp-direction","opp-age","opp-dates","opp-deadline","opp-format","opp-source"].forEach(id => document.getElementById(id).value = "");
    draw();
  });
  document.getElementById("opp-search").addEventListener("input", draw); draw();
}

function renderAdmission() {
  const key = "navigator_universities_v1";
  let universities = readStorage(key, []);
  if (!Array.isArray(universities)) universities = [];
  const hadLegacyNames = universities.some(item => typeof item === "string");
  universities = universities.map(item => typeof item === "string" ? { id: createId(), name: item, city: "", country: "", direction: "", level: "Не указан", exams: "", deadline: "", source: "", status: "Интересует" } : item);
  if (hadLegacyNames) { try { localStorage.setItem(key, JSON.stringify(universities)); } catch { /* Старые названия остаются доступными в памяти текущего сеанса. */ } }
  app.innerHTML = `<section class="page">${pageHeader("admission")}
    <div class="notice">Требования, экзамены, сроки и проходные баллы меняются. Вноси их только после проверки официального сайта учебного заведения и указывай год приёма.</div>
    <div class="form-card"><h2>Добавить учебное заведение</h2>
      <div class="form-group"><label for="uni-name">Название</label><input id="uni-name" maxlength="150" placeholder="Школа, колледж или университет"></div>
      <div class="form-group"><label for="uni-city">Город и страна</label><input id="uni-city" maxlength="120"></div>
      <div class="form-group"><label for="uni-direction">Направление или специальность</label><input id="uni-direction" maxlength="140"></div>
      <div class="form-group"><label for="uni-level">Уровень образования</label><select id="uni-level"><option>Школа</option><option>Колледж</option><option>Бакалавриат</option><option>Специалитет</option><option>Другое</option></select></div>
      <div class="form-group"><label for="uni-exams">Экзамены и предметы</label><input id="uni-exams" maxlength="180" placeholder="Заполняй после проверки требований"></div>
      <div class="form-group"><label for="uni-deadline">Сроки подачи и год приёма</label><input id="uni-deadline" maxlength="120" placeholder="Например: приём 2027, сроки уточнить"></div>
      <div class="form-group"><label for="uni-source">Официальный сайт / страница приёма</label><input id="uni-source" type="url" maxlength="500" placeholder="https://..."></div>
      <div class="form-group"><label for="uni-status">Статус</label><select id="uni-status"><option>Интересует</option><option>Изучаю</option><option>Планирую поступать</option></select></div>
      <button class="primary-button" id="university-add">Сохранить учебное заведение</button></div>
    <div class="form-card"><h2>Мой список</h2><div id="university-list"></div></div></section>`;
  const list = document.getElementById("university-list");
  function save() { try { localStorage.setItem(key, JSON.stringify(universities)); return true; } catch { alert("Не удалось сохранить список. Проверь свободное место в браузере."); return false; } }
  function draw() {
    list.innerHTML = universities.length ? universities.map(item => `<article class="content-card">
      <div class="list-row"><h3>${escapeHTML(item.name)}</h3><span class="tag">${escapeHTML(item.status || "Интересует")}</span></div>
      <p>${escapeHTML([item.city,item.country].filter(Boolean).join(", ") || "Местоположение не указано")}</p>
      <p><strong>Направление:</strong> ${escapeHTML(item.direction || "Не указано")} · <strong>Уровень:</strong> ${escapeHTML(item.level || "Не указан")}</p>
      <p><strong>Экзамены:</strong> ${escapeHTML(item.exams || "Не указаны")} · <strong>Сроки:</strong> ${escapeHTML(item.deadline || "Не указаны")}</p>
      ${item.source ? `<a href="${escapeHTML(item.source)}" target="_blank" rel="noopener noreferrer">Официальный сайт</a>` : '<p class="status-error">Официальный источник ещё не добавлен.</p>'}
      <button class="danger-button" data-university-delete="${escapeHTML(item.id)}">Удалить</button></article>`).join("") : '<p class="empty-state">Список пока пуст. Добавь учебные заведения, которые хочешь изучить.</p>';
  }
  document.getElementById("university-add").addEventListener("click", () => {
    const get = id => document.getElementById(id).value.trim();
    const name = get("uni-name"), source = get("uni-source"); if (!name) return alert("Укажи название учебного заведения.");
    if (source) { try { if (!["http:", "https:"].includes(new URL(source).protocol)) throw Error(); } catch { return alert("Проверь ссылку на официальный сайт."); } }
    universities.push({ id: createId(), name, city: get("uni-city"), country: "", direction: get("uni-direction"), level: get("uni-level"), exams: get("uni-exams"), deadline: get("uni-deadline"), source, status: get("uni-status") });
    if (!save()) { universities.pop(); return; }
    ["uni-name","uni-city","uni-direction","uni-exams","uni-deadline","uni-source"].forEach(id => document.getElementById(id).value = ""); draw();
  }); draw();
}

function exportData() {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    portfolio: data,
    universities: readStorage("navigator_universities_v1", []),
    education: readStorage("navigator_education_v1", []),
    opportunities: readStorage("navigator_opportunities_v1", [])
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


function addSectionStepper() {
  const order = Object.keys(pages), index = order.indexOf(currentPage);
  if (index < 0 || document.querySelector(".section-stepper")) return;
  const previous = index > 0 ? order[index - 1] : "home";
  const next = index < order.length - 1 ? order[index + 1] : "home";
  app.insertAdjacentHTML("beforeend", `<nav class="section-stepper" aria-label="Переход между разделами">
    <button type="button" data-page="${previous}" >← Назад</button>
    <span class="step-caption">Раздел ${index + 1} из ${order.length}<br>${escapeHTML(pages[currentPage].title)}</span>
    <button type="button" data-page="${next}">${index === order.length - 1 ? "На главную" : "Далее →"}</button>
  </nav>`);
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

  if (currentPage !== "home") addSectionStepper();
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
    const key = "navigator_universities_v1"; let universities = readStorage(key, []);
    if (!Array.isArray(universities)) universities = [];
    universities = universities.filter(item => (typeof item === "string" ? item : item.id) !== universityDelete.dataset.universityDelete);
    try { localStorage.setItem(key, JSON.stringify(universities)); } catch { alert("Не удалось обновить список."); return; }
    renderAdmission(); return;
  }
  const educationDelete = event.target.closest("[data-edu-delete]");
  if (educationDelete) { const key = "navigator_education_v1"; let items = readStorage(key, []); items.splice(Number(educationDelete.dataset.eduDelete), 1); try { localStorage.setItem(key, JSON.stringify(items)); } catch { return alert("Не удалось обновить список."); } renderEducation(); return; }
  const opportunityDelete = event.target.closest("[data-opp-delete]");
  if (opportunityDelete) { const key = "navigator_opportunities_v1"; let items = readStorage(key, []); items.splice(Number(opportunityDelete.dataset.oppDelete), 1); try { localStorage.setItem(key, JSON.stringify(items)); } catch { return alert("Не удалось обновить каталог."); } renderOpportunities(); }
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
