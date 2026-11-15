
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
      profile: { ...defaultData.profile, ...(saved.profile || {}) },
      projects: Array.isArray(saved.projects) ? saved.projects : [],
      achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
      route: Array.isArray(saved.route) ? saved.route : []
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


function showNotice(message, type = "success") {
  const root = document.getElementById("app");
  if (!root) return;
  let notice = root.querySelector("#app-notice");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "app-notice";
    notice.className = "app-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    root.prepend(notice);
  }
  notice.className = "app-notice" + (type === "error" ? " is-error" : type === "warning" ? " is-warning" : "");
  notice.textContent = String(message || "");
}

function confirmInPage(message) {
  return new Promise(resolve => {
    const root = document.getElementById("app");
    if (!root) return resolve(false);
    root.querySelector("#app-inline-confirm")?.remove();
    const panel = document.createElement("div");
    panel.id = "app-inline-confirm";
    panel.className = "app-inline-confirm";
    panel.setAttribute("role", "alertdialog");
    panel.setAttribute("aria-modal", "true");
    const text = document.createElement("p");
    text.textContent = message;
    const actions = document.createElement("div");
    actions.className = "app-inline-confirm-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "secondary-button";
    cancel.textContent = "Отмена";
    const approve = document.createElement("button");
    approve.type = "button";
    approve.className = "danger-button";
    approve.textContent = "Удалить данные";
    const finish = value => { panel.remove(); resolve(value); };
    cancel.addEventListener("click", () => finish(false));
    approve.addEventListener("click", () => finish(true));
    actions.append(cancel, approve);
    panel.append(text, actions);
    root.prepend(panel);
    cancel.focus();
  });
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Не удалось сохранить данные:", error);
    showNotice("Браузер не смог сохранить изменения. Проверь свободное место и настройки хранения сайта.");
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
  { name: "Робототехник", field: "Инженерия и IT", description: "Разрабатывает робототехнические системы.", skills: "Программирование, физика, электроника" },
  { name: "Инженер-строитель", field: "Строительство", description: "Проектирует и контролирует строительство зданий и сооружений.", skills: "Математика, физика, черчение, расчёты" },
  { name: "Инженер-электроник", field: "Электроника", description: "Разрабатывает электронные устройства и схемы.", skills: "Физика, схемотехника, программирование" },
  { name: "Инженер-энергетик", field: "Энергетика", description: "Проектирует системы производства и распределения энергии.", skills: "Физика, математика, электротехника" },
  { name: "Авиаконструктор", field: "Авиация", description: "Разрабатывает конструкции самолётов и летательных аппаратов.", skills: "Физика, математика, 3D-моделирование" },
  { name: "Инженер-робототехник", field: "Робототехника", description: "Создаёт роботов и системы автоматического управления.", skills: "Математика, физика, электроника, код" },
  { name: "Специалист по мехатронике", field: "Инженерия", description: "Объединяет механику, электронику и программное управление.", skills: "Физика, математика, автоматика" },
  { name: "Разработчик игр", field: "IT", description: "Создаёт игровые механики, системы и интерактивные миры.", skills: "Программирование, математика, командная работа" },
  { name: "Веб-разработчик", field: "IT", description: "Создаёт сайты и веб-приложения.", skills: "HTML, CSS, JavaScript, логика" },
  { name: "Разработчик мобильных приложений", field: "IT", description: "Создаёт приложения для смартфонов и планшетов.", skills: "Программирование, UX, тестирование" },
  { name: "Специалист по кибербезопасности", field: "IT", description: "Помогает защищать информационные системы и данные.", skills: "Сети, операционные системы, программирование" },
  { name: "Аналитик данных", field: "IT и аналитика", description: "Изучает данные и находит закономерности для принятия решений.", skills: "Математика, статистика, SQL, визуализация" },
  { name: "Специалист по искусственному интеллекту", field: "IT и наука", description: "Разрабатывает и исследует системы машинного обучения.", skills: "Математика, Python, статистика" },
  { name: "Системный аналитик", field: "IT", description: "Описывает требования и проектирует взаимодействие частей системы.", skills: "Логика, моделирование процессов, коммуникация" },
  { name: "Тестировщик программного обеспечения", field: "IT", description: "Проверяет программы и помогает находить ошибки.", skills: "Внимательность, логика, основы программирования" },
  { name: "Администратор баз данных", field: "IT", description: "Организует хранение, доступность и защиту данных.", skills: "SQL, базы данных, системное мышление" },
  { name: "Геолог", field: "Наука", description: "Изучает строение Земли, горные породы и природные ресурсы.", skills: "География, химия, физика, наблюдательность" },
  { name: "Астроном", field: "Наука", description: "Исследует небесные объекты и процессы во Вселенной.", skills: "Физика, математика, анализ данных" },
  { name: "Физик-исследователь", field: "Наука", description: "Изучает физические явления и проверяет научные гипотезы.", skills: "Математика, физика, эксперимент" },
  { name: "Химик-технолог", field: "Наука и производство", description: "Разрабатывает и улучшает химические производственные процессы.", skills: "Химия, математика, лабораторные методы" },
  { name: "Микробиолог", field: "Наука и медицина", description: "Изучает микроорганизмы и их свойства.", skills: "Биология, химия, аккуратность" },
  { name: "Генетик", field: "Наука и медицина", description: "Исследует наследственность и работу генов.", skills: "Биология, химия, статистика" },
  { name: "Нейробиолог", field: "Наука и медицина", description: "Изучает нервную систему и работу мозга.", skills: "Биология, химия, математика" },
  { name: "Ветеринарный врач", field: "Медицина", description: "Занимается здоровьем и лечением животных.", skills: "Биология, химия, наблюдательность" },
  { name: "Фармацевт", field: "Медицина", description: "Работает с лекарственными средствами и правилами их применения.", skills: "Химия, биология, точность" },
  { name: "Стоматолог", field: "Медицина", description: "Диагностирует и лечит заболевания зубов и полости рта.", skills: "Биология, химия, точность, коммуникация" },
  { name: "Психолог", field: "Социальные науки", description: "Изучает поведение и помогает людям решать психологические задачи.", skills: "Психология, коммуникация, анализ" },
  { name: "Учитель", field: "Образование", description: "Объясняет учебный материал и помогает ученикам развивать знания.", skills: "Знание предмета, коммуникация, организация" },
  { name: "Преподаватель университета", field: "Образование и наука", description: "Преподаёт дисциплины и участвует в научной работе.", skills: "Профильная наука, исследования, публичные выступления" },
  { name: "Юрист", field: "Право", description: "Работает с законами, документами и правовыми вопросами.", skills: "Обществознание, логика, работа с текстами" },
  { name: "Журналист", field: "Медиа", description: "Находит информацию, проверяет факты и готовит материалы для аудитории.", skills: "Русский язык, исследование, коммуникация" },
  { name: "Переводчик", field: "Языки", description: "Передаёт смысл устной и письменной речи на другом языке.", skills: "Иностранные языки, грамотность, культурный кругозор" },
  { name: "Архитектор городской среды", field: "Архитектура", description: "Проектирует общественные пространства и городскую инфраструктуру.", skills: "Геометрия, дизайн, черчение, экология" },
  { name: "Графический дизайнер", field: "Дизайн", description: "Создаёт визуальные материалы для брендов и коммуникаций.", skills: "Композиция, типографика, графические редакторы" },
  { name: "Промышленный дизайнер", field: "Дизайн и инженерия", description: "Проектирует внешний вид и удобство физических продуктов.", skills: "Рисунок, 3D-моделирование, эргономика" },
  { name: "Аниматор", field: "Медиа и дизайн", description: "Создаёт движение и визуальные истории для видео и игр.", skills: "Рисунок, композиция, основы анимации" },
  { name: "Фотограф", field: "Медиа", description: "Создаёт фотографии для художественных, информационных и коммерческих задач.", skills: "Композиция, свет, визуальное мышление" },
  { name: "Продюсер", field: "Медиа и бизнес", description: "Организует создание и выпуск творческих или медиапроектов.", skills: "Планирование, бюджетирование, коммуникация" },
  { name: "Маркетолог", field: "Бизнес", description: "Изучает аудиторию и помогает продвигать продукты и услуги.", skills: "Аналитика, коммуникация, экономика" },
  { name: "Финансовый аналитик", field: "Финансы", description: "Анализирует финансовые показатели и оценивает экономические решения.", skills: "Математика, статистика, экономика" },
  { name: "Менеджер проектов", field: "Управление", description: "Планирует работу команды, сроки, задачи и ресурсы проекта.", skills: "Организация, коммуникация, аналитика" },
  { name: "Логист", field: "Бизнес и транспорт", description: "Планирует перемещение товаров и управление поставками.", skills: "Математика, аналитика, планирование" },
  { name: "Специалист по персоналу", field: "Управление", description: "Помогает организациям находить и развивать сотрудников.", skills: "Коммуникация, психология, организация" },
  { name: "Предприниматель в технологиях", field: "Бизнес и технологии", description: "Создаёт компании и продукты на основе новых технологий.", skills: "Планирование, экономика, командная работа" },
  { name: "Агроном", field: "Сельское хозяйство", description: "Разрабатывает подходы к выращиванию сельскохозяйственных культур.", skills: "Биология, химия, экология" },
  { name: "Специалист по климату", field: "Наука и экология", description: "Исследует климатические процессы и изменения окружающей среды.", skills: "География, физика, математика, анализ данных" },
  { name: "Гидролог", field: "Наука и экология", description: "Изучает водные ресурсы и движение воды в природе.", skills: "География, физика, математика" },
  { name: "Специалист по беспилотным системам", field: "Инженерия и IT", description: "Проектирует и исследует гражданские беспилотные системы.", skills: "Программирование, электроника, физика" },
  { name: "Инженер по автоматизации", field: "Промышленность", description: "Создаёт системы автоматического управления оборудованием.", skills: "Физика, программирование, электроника" },
  { name: "Специалист по качеству", field: "Промышленность", description: "Проверяет соответствие продукции установленным требованиям.", skills: "Аналитика, точность, технические стандарты" },
  { name: "Специалист по устойчивому развитию", field: "Экология и бизнес", description: "Помогает организациям учитывать экологические и социальные последствия решений.", skills: "Экология, аналитика, экономика" }
];

const quiz = [
  {
    "section": "Интересы",
    "question": "Какая задача кажется тебе наиболее увлекательной?",
    "options": [
      [
        "Спроектировать механизм или устройство",
        "engineering",
        "technical"
      ],
      [
        "Создать сайт или приложение",
        "it",
        "logic"
      ],
      [
        "Поставить опыт и проверить гипотезу",
        "science",
        "research"
      ],
      [
        "Придумать и организовать полезный проект",
        "business",
        "organization"
      ],
      [
        "Разработать внешний вид продукта",
        "design",
        "creativity"
      ]
    ]
  },
  {
    "section": "Интересы",
    "question": "Какой результат работы тебе хотелось бы увидеть?",
    "options": [
      [
        "Работающую техническую конструкцию",
        "engineering",
        "technical"
      ],
      [
        "Программу, которой пользуются люди",
        "it",
        "logic"
      ],
      [
        "Объяснение научного явления",
        "science",
        "research"
      ],
      [
        "Успешно реализованную идею или мероприятие",
        "business",
        "communication"
      ],
      [
        "Удобный и красивый интерфейс",
        "design",
        "creativity"
      ]
    ]
  },
  {
    "section": "Интересы",
    "question": "Какую тему ты скорее выберешь для самостоятельного изучения?",
    "options": [
      [
        "Как устроены машины и приборы",
        "engineering",
        "technical"
      ],
      [
        "Как работают алгоритмы и цифровые сервисы",
        "it",
        "logic"
      ],
      [
        "Как устроены живые организмы и природа",
        "science",
        "research"
      ],
      [
        "Как создаются компании и продукты",
        "business",
        "organization"
      ],
      [
        "Как цвет, форма и композиция влияют на восприятие",
        "design",
        "creativity"
      ]
    ]
  },
  {
    "section": "Интересы",
    "question": "Какой проект ты бы хотел попробовать сделать?",
    "options": [
      [
        "Модель устройства или робота",
        "engineering",
        "technical"
      ],
      [
        "Небольшое приложение или игру",
        "it",
        "logic"
      ],
      [
        "Исследование с выводами",
        "science",
        "research"
      ],
      [
        "План запуска школьной инициативы",
        "business",
        "communication"
      ],
      [
        "Макет сайта, предмета или пространства",
        "design",
        "creativity"
      ]
    ]
  },
  {
    "section": "Интересы",
    "question": "С какими материалами или инструментами тебе интереснее работать?",
    "options": [
      [
        "Чертежи, детали и технические модели",
        "engineering",
        "technical"
      ],
      [
        "Код, данные и цифровые инструменты",
        "it",
        "logic"
      ],
      [
        "Наблюдения, измерения и научные материалы",
        "science",
        "research"
      ],
      [
        "Планы, бюджеты и командные задачи",
        "business",
        "organization"
      ],
      [
        "Эскизы, изображения и макеты",
        "design",
        "creativity"
      ]
    ]
  },
  {
    "section": "Мышление и навыки",
    "question": "Если задача кажется сложной, с чего ты обычно начинаешь?",
    "options": [
      [
        "Разбиваю её на логические шаги",
        "it",
        "logic"
      ],
      [
        "Рисую схему или придумываю несколько вариантов",
        "design",
        "creativity"
      ],
      [
        "Проверяю, как устроены детали и система",
        "engineering",
        "technical"
      ],
      [
        "Ищу дополнительные сведения и доказательства",
        "science",
        "research"
      ],
      [
        "Обсуждаю задачу с другими",
        "business",
        "communication"
      ]
    ]
  },
  {
    "section": "Мышление и навыки",
    "question": "Какое задание тебе было бы интереснее выполнить?",
    "options": [
      [
        "Найти закономерность в таблице данных",
        "it",
        "logic"
      ],
      [
        "Придумать необычное оформление",
        "design",
        "creativity"
      ],
      [
        "Собрать модель по инструкции",
        "engineering",
        "technical"
      ],
      [
        "Сравнить результаты наблюдений",
        "science",
        "research"
      ],
      [
        "Распределить роли в небольшой команде",
        "business",
        "organization"
      ]
    ]
  },
  {
    "section": "Мышление и навыки",
    "question": "Что у тебя вызывает больше интереса?",
    "options": [
      [
        "Головоломки и задачи с правилами",
        "it",
        "logic"
      ],
      [
        "Открытые задачи, где можно придумать своё решение",
        "design",
        "creativity"
      ],
      [
        "Понимание принципа работы устройств",
        "engineering",
        "technical"
      ],
      [
        "Поиск причин и проверка предположений",
        "science",
        "research"
      ],
      [
        "Объяснение идей и обмен мнениями",
        "business",
        "communication"
      ]
    ]
  },
  {
    "section": "Мышление и навыки",
    "question": "Какой способ работы тебе ближе?",
    "options": [
      [
        "Анализировать информацию и делать выводы",
        "it",
        "logic"
      ],
      [
        "Создавать эскизы и визуальные концепции",
        "design",
        "creativity"
      ],
      [
        "Работать с инструментами и техническими моделями",
        "engineering",
        "technical"
      ],
      [
        "Проводить наблюдения и фиксировать результаты",
        "science",
        "research"
      ],
      [
        "Координировать задачи и помогать команде",
        "business",
        "organization"
      ]
    ]
  },
  {
    "section": "Мышление и навыки",
    "question": "Какой результат ты считаешь самым убедительным?",
    "options": [
      [
        "Решение, которое можно логически доказать",
        "it",
        "logic"
      ],
      [
        "Оригинальная идея с понятным визуальным образом",
        "design",
        "creativity"
      ],
      [
        "Модель, которая работает на практике",
        "engineering",
        "technical"
      ],
      [
        "Вывод, подтверждённый наблюдениями",
        "science",
        "research"
      ],
      [
        "Результат, которого команда достигла вместе",
        "business",
        "communication"
      ]
    ]
  },
  {
    "section": "Предпочтения в работе",
    "question": "В какой обстановке тебе было бы комфортнее работать?",
    "options": [
      [
        "Спокойно решать задачи самостоятельно",
        "it",
        "logic"
      ],
      [
        "Свободно придумывать и экспериментировать",
        "design",
        "creativity"
      ],
      [
        "Работать с оборудованием и моделями",
        "engineering",
        "technical"
      ],
      [
        "Изучать информацию и проводить исследования",
        "science",
        "research"
      ],
      [
        "Общаться и взаимодействовать с людьми",
        "business",
        "communication"
      ]
    ]
  },
  {
    "section": "Предпочтения в работе",
    "question": "Что для тебя важнее в командном проекте?",
    "options": [
      [
        "Понятные задачи и последовательность действий",
        "it",
        "logic"
      ],
      [
        "Возможность предложить нестандартную идею",
        "design",
        "creativity"
      ],
      [
        "Создать и проверить работающий прототип",
        "engineering",
        "technical"
      ],
      [
        "Точность и обоснованность результата",
        "science",
        "research"
      ],
      [
        "Обсуждать решения и объединять участников",
        "business",
        "communication"
      ]
    ]
  },
  {
    "section": "Предпочтения в работе",
    "question": "Какую роль ты бы выбрал в небольшой команде?",
    "options": [
      [
        "Продумать логику и последовательность",
        "it",
        "logic"
      ],
      [
        "Отвечать за идеи и визуальную часть",
        "design",
        "creativity"
      ],
      [
        "Собирать и проверять техническую часть",
        "engineering",
        "technical"
      ],
      [
        "Искать информацию и проверять факты",
        "science",
        "research"
      ],
      [
        "Распределять задачи и следить за сроками",
        "business",
        "organization"
      ]
    ]
  },
  {
    "section": "Предпочтения в работе",
    "question": "Какой рабочий процесс тебе ближе?",
    "options": [
      [
        "Постепенно улучшать алгоритм или систему",
        "it",
        "logic"
      ],
      [
        "Пробовать разные идеи и менять концепцию",
        "design",
        "creativity"
      ],
      [
        "Создавать, тестировать и дорабатывать устройство",
        "engineering",
        "technical"
      ],
      [
        "Ставить вопросы и искать подтверждения",
        "science",
        "research"
      ],
      [
        "Планировать этапы и взаимодействие людей",
        "business",
        "organization"
      ]
    ]
  },
  {
    "section": "Предпочтения в работе",
    "question": "Что помогло бы тебе почувствовать, что проект удался?",
    "options": [
      [
        "Всё работает чётко и без лишних шагов",
        "it",
        "logic"
      ],
      [
        "Получилось выразительное и оригинальное решение",
        "design",
        "creativity"
      ],
      [
        "Идея превратилась в работающую конструкцию",
        "engineering",
        "technical"
      ],
      [
        "Удалось узнать что-то новое и подтвердить выводы",
        "science",
        "research"
      ],
      [
        "Команда достигла общей цели",
        "business",
        "communication"
      ]
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

const skillNames = {
  logic: "Логическое мышление",
  creativity: "Творческое мышление",
  technical: "Техническое мышление",
  communication: "Коммуникация",
  research: "Исследовательский подход",
  organization: "Организация и планирование"
};

const fieldDescriptions = {
  engineering: "конструирование, инженерия, робототехника и технические системы",
  it: "программирование, анализ данных и цифровые продукты",
  science: "естественные науки, исследования и эксперименты",
  business: "управление, предпринимательство и организация проектов",
  design: "дизайн, визуальные коммуникации и создание пользовательского опыта"
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
      <aside class="hero-summary" aria-label="О платформе">
        <span class="hero-summary-label">ТВОЯ ТРАЕКТОРИЯ</span>
        <strong>8 направлений</strong>
        <span>От первого знакомства с профессиями до подготовки к поступлению.</span>
        <div class="hero-summary-rule"></div>
        <span class="hero-summary-foot">Исследуй · Практикуйся · Планируй</span>
      </aside>
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
            <span class="feature-index">${String(index + 1).padStart(2, "0")}</span>
            <strong>${page.title}</strong>
            <span>${page.description}</span>
          </button>`).join("")}
      </div>
    </section>`;
}

function renderOrientation() {
  const result = data.testResult;
  const hasNewResult = result && result.version === 2;

  app.innerHTML = `<section class="page">${pageHeader("orientation")}
    ${hasNewResult ? `
      <div class="result-box diagnostic-result">
        <span class="eyebrow">ТВОЙ ПРОФИЛЬ ИНТЕРЕСОВ</span>
        <h2>${escapeHTML(result.name)}</h2>
        <p>По твоим ответам эти направления стоит исследовать в первую очередь. Это ориентир для знакомства с профессиями, а не оценка способностей и не окончательный выбор.</p>
        <h3>Направления, которые тебе интересны</h3>
        <div class="diagnostic-list">
          ${result.directions.map((item, index) => `
            <div class="diagnostic-row">
              <div class="diagnostic-row-label"><strong>${index + 1}. ${escapeHTML(item.name)}</strong><span>${item.percent}% ответов</span></div>
              <div class="progress-track"><div class="progress-fill" style="width:${item.percent}%"></div></div>
            </div>`).join("")}
        </div>
        <h3>Сильнее выраженные предпочтения</h3>
        <div class="diagnostic-tags">
          ${result.skills.map(item => `<span class="tag">${escapeHTML(item.name)}</span>`).join("")}
        </div>
        <p class="muted small">Проценты показывают долю выбранных ответов внутри этой анкеты. Это не научная диагностика и не измерение интеллекта или профессиональной пригодности.</p>
        <div class="notice"><strong>Что попробовать дальше:</strong> ${escapeHTML(result.nextStep)}</div>
        <button class="secondary-button" id="restart-quiz">Пройти диагностику заново</button>
        <button class="primary-button" data-page="professions">Посмотреть подходящие профессии</button>
      </div>` : result ? `
      <div class="result-box">
        <span class="eyebrow">ПРЕДЫДУЩИЙ РЕЗУЛЬТАТ</span>
        <h2>${escapeHTML(result.name)}</h2>
        <p>Это результат прежней короткой версии теста. Теперь доступна расширенная диагностика из трёх частей: интересы, мышление и навыки, предпочтения в работе.</p>
        <button class="primary-button" id="restart-quiz">Пройти расширенную диагностику</button>
      </div>` : `
      <div class="notice diagnostic-intro">
        <strong>15 вопросов · 3 части · около 5 минут</strong>
        <p>Изучим твои интересы, подход к решению задач и предпочтения в работе. В результате ты получишь несколько направлений для исследования и список выраженных предпочтений.</p>
      </div>
      <div id="quiz-container"></div>`}
  </section>`;

  if (!result) renderQuiz();
}

function renderQuiz() {
  const container = document.getElementById("quiz-container");
  if (!container) return;

  const index = Object.keys(quizAnswers).length;

  if (index >= quiz.length) {
    const interestScores = Object.fromEntries(Object.keys(fieldNames).map(key => [key, 0]));
    const skillScores = Object.fromEntries(Object.keys(skillNames).map(key => [key, 0]));

    Object.values(quizAnswers).forEach(answer => {
      const [interest, skill] = answer.split("|");
      if (Object.hasOwn(interestScores, interest)) interestScores[interest] += 1;
      if (Object.hasOwn(skillScores, skill)) skillScores[skill] += 1;
    });

    const directions = Object.entries(interestScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, score]) => ({
        key,
        name: fieldNames[key],
        score,
        percent: Math.round(score / quiz.length * 100)
      }));

    const skills = Object.entries(skillScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, score]) => ({ key, name: skillNames[key], score }));

    const best = directions[0];
    data.testResult = {
      version: 2,
      name: best.name,
      directions,
      skills,
      interestScores,
      skillScores,
      nextStep: fieldDescriptions[best.key] + ". Начни с одной профессии и попробуй небольшое практическое задание."
    };

    if (!saveData()) return;
    renderOrientation();
    return;
  }

  const question = quiz[index];
  const sectionStart = quiz.findIndex(item => item.section === question.section);
  const sectionEnd = quiz.findLastIndex(item => item.section === question.section) + 1;
  const sectionNumber = [...new Set(quiz.map(item => item.section))].indexOf(question.section) + 1;
  const sectionCount = new Set(quiz.map(item => item.section)).size;

  container.innerHTML = `
    <div class="form-card diagnostic-card">
      <div class="diagnostic-meta">
        <span class="tag">Часть ${sectionNumber} из ${sectionCount}: ${escapeHTML(question.section)}</span>
        <span class="muted">Вопрос ${index + 1} из ${quiz.length}</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${Math.round(index / quiz.length * 100)}%"></div></div>
      <p class="muted small">Прогресс всей диагностики: ${Math.round(index / quiz.length * 100)}%</p>
      <h2 class="question-title">${escapeHTML(question.question)}</h2>
      <div class="option-list">
        ${question.options.map(([label, interest, skill]) => `
          <label class="option">
            <input type="radio" name="quiz-answer" value="${interest}|${skill}">
            <span>${escapeHTML(label)}</span>
          </label>`).join("")}
      </div>
      <button class="primary-button" id="quiz-next">${index === quiz.length - 1 ? "Получить результат" : "Следующий вопрос →"}</button>
      ${index > 0 ? '<button class="secondary-button" id="quiz-back">← Предыдущий вопрос</button>' : ""}
    </div>`;

  document.getElementById("quiz-next").addEventListener("click", () => {
    const selected = container.querySelector('input[name="quiz-answer"]:checked');
    if (!selected) {
      showNotice("Выбери один вариант ответа.");
      return;
    }
    quizAnswers[index] = selected.value;
    renderQuiz();
  });

  const backButton = document.getElementById("quiz-back");
  if (backButton) {
    backButton.addEventListener("click", () => {
      delete quizAnswers[index - 1];
      renderQuiz();
    });
  }
}

const PROFESSION_GROUPS = [
  "Все направления",
  "Технологии и инженерия",
  "Наука и медицина",
  "Бизнес и управление",
  "Дизайн и медиа",
  "Общество и образование"
];

let professionActiveGroup = "Все направления";
let professionVisibleCount = 8;
let professionSearchQuery = "";

function getProfessionGroup(item) {
  const text = `${item.name} ${item.field}`.toLowerCase();

  if (/бизнес|эконом|финанс|управлен|маркет|логист|предприним|персонал|продюсер/.test(text)) {
    return "Бизнес и управление";
  }
  if (/дизайн|медиа|фотограф|аниматор|журналист|переводчик|язык/.test(text)) {
    return "Дизайн и медиа";
  }
  if (/медицин|врач|стоматолог|ветеринар|фармацевт|психолог|образован|учител|преподавател|юрист|право|социальн/.test(text)) {
    return "Общество и образование";
  }
  if (/наук|эколог|биотех|биолог|генет|нейро|геолог|астроном|физик|химик|микробиолог|агроном|климат|гидролог/.test(text)) {
    return "Наука и медицина";
  }
  return "Технологии и инженерия";
}

function getProfessionMatches() {
  return professions.filter(item => {
    const matchesGroup = professionActiveGroup === "Все направления" ||
      getProfessionGroup(item) === professionActiveGroup;
    const searchable = `${item.name} ${item.field} ${item.description} ${item.skills}`.toLowerCase();
    return matchesGroup && searchable.includes(professionSearchQuery);
  });
}

function renderProfessions() {
  professionActiveGroup = "Все направления";
  professionVisibleCount = 8;
  professionSearchQuery = "";

  app.innerHTML = `<section class="page">${pageHeader("professions")}
    <div class="profession-toolbar">
      <label class="profession-search-label" for="profession-search">Поиск по каталогу</label>
      <input class="search-input" id="profession-search" type="search" placeholder="Например, инженер, дизайн, математика...">
      <div class="profession-filter-heading">
        <strong>Направления</strong>
        <span class="muted small">Выбери интересующую область</span>
      </div>
      <div class="profession-filters" id="profession-filters" aria-label="Фильтр по направлениям">
        ${PROFESSION_GROUPS.map((group, index) => `
          <button type="button" class="profession-filter${index === 0 ? " active" : ""}" data-profession-filter="${escapeHTML(group)}">${escapeHTML(group)}</button>
        `).join("")}
      </div>
      <div class="profession-results-count" id="profession-results-count" aria-live="polite"></div>
    </div>
    <div class="card-grid" id="profession-list"></div>
  </section>`;

  document.getElementById("profession-search").addEventListener("input", event => {
    professionSearchQuery = event.target.value.trim().toLowerCase();
    professionVisibleCount = 8;
    drawProfessions(getProfessionMatches());
  });

  document.getElementById("profession-filters").addEventListener("click", event => {
    const button = event.target.closest("[data-profession-filter]");
    if (!button) return;
    professionActiveGroup = button.dataset.professionFilter;
    professionVisibleCount = 8;
    document.querySelectorAll("[data-profession-filter]").forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    drawProfessions(getProfessionMatches());
  });

  drawProfessions(getProfessionMatches());
}

function drawProfessions(items) {
  const list = document.getElementById("profession-list");
  if (!list) return;

  const count = document.getElementById("profession-results-count");
  if (count) {
    const label = professionActiveGroup === "Все направления"
      ? "Во всём каталоге"
      : professionActiveGroup;
    count.textContent = `${label} · найдено: ${items.length}`;
  }

  if (!items.length) {
    list.innerHTML = `<p class="empty-state">По этому запросу профессий не найдено. Попробуй изменить поиск или выбрать другое направление.</p>`;
    return;
  }

  const visibleItems = items.slice(0, professionVisibleCount);
  list.innerHTML = visibleItems.map(item => {
    const index = professions.indexOf(item);
    return `
      <button type="button" class="content-card profession-card" data-profession-open="${index}" aria-label="Подробнее о профессии: ${escapeHTML(item.name)}">
        <span class="tag">${escapeHTML(item.field)}</span>
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.description)}</p>
        <p class="small profession-skills"><strong>Полезные навыки:</strong> ${escapeHTML(item.skills)}</p>
        <span class="profession-hint">Подробнее о профессии →</span>
      </button>`;
  }).join("");

  if (visibleItems.length < items.length) {
    const more = document.createElement("button");
    more.type = "button";
    more.className = "secondary-button profession-more";
    more.textContent = `Показать ещё (${items.length - visibleItems.length})`;
    more.addEventListener("click", () => {
      professionVisibleCount += 8;
      drawProfessions(items);
    });
    list.appendChild(more);
  }
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
    <div class="form-card">
      <h2>Мой практический результат</h2>
      <p class="muted">Опиши выполненное задание или собственную разработку. Запись появится в разделе «Портфолио».</p>
      <div class="form-group"><label for="practice-project-title">Название проекта</label><input id="practice-project-title" maxlength="100" placeholder="Например: макет умного дома"></div>
      <div class="form-group"><label for="practice-project-description">Что сделал и какой результат получил</label><textarea id="practice-project-description" maxlength="1500" placeholder="Опиши идею, свою работу, использованные навыки и результат"></textarea></div>
      <button class="primary-button" id="practice-project-save">Сохранить в портфолио</button>
    </div>
  </section>`;
  document.getElementById("practice-project-save").addEventListener("click", () => {
    const title = document.getElementById("practice-project-title").value.trim();
    const description = document.getElementById("practice-project-description").value.trim();
    if (!title) return showNotice("Укажи название проекта.");
    data.projects.push({ id: createId(), title, description });
    if (!saveData()) { data.projects.pop(); return; }
    document.getElementById("practice-project-title").value = "";
    document.getElementById("practice-project-description").value = "";
    showNotice("Проект сохранён в портфолио.");
  });
}

function renderEducation() {
  const key = "navigator_education_v1";
  const officialStarterCatalog = [
    { id: "starter-code-future-2026", title: "Код будущего — программирование, ИИ и робототехника", kind: "Образовательная программа", organizer: "Операторы проекта «Код будущего»", direction: "Информатика, программирование, искусственный интеллект, робототехника", age: "8–11 класс; условия для граждан РФ", dates: "Учебный год 2026/27; наличие мест и приём заявок проверяй на странице проекта", cost: "Бесплатно при соответствии условиям проекта", conditions: "Заявка подаётся через Госуслуги. Доступны онлайн- и очные программы; проверь требования конкретного курса.", source: "https://futurecode.uchi.ru/", addedAt: "2026-09-01T00:00:00.000Z" },
    { id: "starter-sirius-courses", title: "Сириус.Курсы — предметные онлайн-курсы", kind: "Курс", organizer: "Образовательный центр «Сириус»", direction: "Математика, информатика, физика, химия, биология, лингвистика, искусственный интеллект", age: "Школьники; требования зависят от курса", dates: "Каталог доступен онлайн; сроки и доступность уточняй на странице курса", cost: "Бесплатно для представленных школьных курсов", conditions: "Выбери предмет и проверь уровень, расписание и условия регистрации на странице курса.", source: "https://edu.sirius.online/", addedAt: "2026-11-09T00:00:00.000Z" },
    { id: "starter-tbank-school", title: "Образовательные проекты Т-Банка для школьников", kind: "Курс", organizer: "Т-Банк", direction: "Математика, информатика, физика, анализ данных", age: "4–11 класс; уровень зависит от программы", dates: "Текущий каталог; даты отдельных программ проверяй на сайте", cost: "Бесплатно", conditions: "Есть онлайн- и офлайн-форматы; для некоторых программ предусмотрен отбор.", source: "https://education.tbank.ru/school/", addedAt: "2026-11-09T00:00:00.000Z" }
  ];
  const storedItems = readStorage(key, null);
  let items = Array.isArray(storedItems) ? storedItems : officialStarterCatalog;
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
    <div class="form-card"><h2>Подбор курсов по предмету или направлению</h2>
      <div class="form-group"><label for="edu-filter">Что выбрал ученик?</label><select id="edu-filter">
        <option value="all">Все направления</option><option value="math">Математика</option><option value="physics">Физика</option>
        <option value="informatics">Информатика и программирование</option><option value="biology">Биология</option><option value="chemistry">Химия</option>
        <option value="engineering">Инженерия и робототехника</option><option value="science">Наука</option><option value="business">Бизнес и экономика</option>
        <option value="design">Дизайн</option><option value="languages">Иностранные языки</option></select></div>
      <div id="education-recommendations" aria-live="polite"></div></div>
    <div class="form-card"><h2>Мой список обучения</h2><div id="education-list"></div></div>
    <div class="card-grid">
      <article class="content-card"><h3>Школьное обучение</h3><p>Профильные классы, предметы и углублённая подготовка.</p></article>
      <article class="content-card"><h3>Дополнительное образование</h3><p>Курсы, кружки, образовательные центры и онлайн-программы.</p></article>
      <article class="content-card"><h3>Самостоятельное развитие</h3><p>Учебные материалы, видеоуроки и индивидуальные планы.</p></article>
      <article class="content-card"><h3>Образовательные программы</h3><p>Летние школы, интенсивы и профильные смены.</p></article>
    </div></section>`;
  const draw = () => {
    const selected = document.getElementById("edu-filter").value;
    const termsBySubject = {
      math: ["математ", "алгебр", "геометр", "math"], physics: ["физик", "механик", "physics"],
      informatics: ["информат", "программ", "python", "c++", "javascript", "it"],
      biology: ["биолог", "биотех", "генет", "biology"], chemistry: ["хими", "chemistry"],
      engineering: ["инженер", "робот", "конструкт", "техник", "моделир"],
      science: ["наук", "исследован", "лаборатор", "science"],
      business: ["бизнес", "эконом", "предприним", "финанс", "управлен"],
      design: ["дизайн", "график", "интерфейс", "ux", "ui"],
      languages: ["англий", "иностран", "язык", "english"]
    };
    const terms = termsBySubject[selected] || [];
    const recommendations = document.getElementById("education-recommendations");
    const matching = items.filter(item => selected === "all" || terms.some(term =>
      [item.title, item.direction, item.organizer, item.conditions].join(" ").toLowerCase().includes(term)
    ));
    recommendations.innerHTML = matching.length
      ? matching.map(item => `<article class="content-card"><h3>${escapeHTML(item.title)}</h3><p><strong>Организатор:</strong> ${escapeHTML(item.organizer || "Не указан")}</p><p><strong>Направление:</strong> ${escapeHTML(item.direction || "Не указано")} · <strong>Сроки:</strong> ${escapeHTML(item.dates || "Не указаны")}</p><p><strong>Возраст/класс:</strong> ${escapeHTML(item.age || "Не указано")} · <strong>Стоимость:</strong> ${escapeHTML(item.cost || "Не указана")}</p><a href="${escapeHTML(item.source)}" target="_blank" rel="noopener noreferrer">Официальная страница</a></article>`).join("")
      : `<p class="empty-state">${items.length ? "В каталоге пока нет курсов по этому выбору." : "Проверенных курсов пока нет. После добавления они будут автоматически подбираться по предмету или направлению."}</p>`;
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
  document.getElementById("edu-filter").addEventListener("change", draw);
  document.getElementById("edu-add").addEventListener("click", () => {
    const get = id => document.getElementById(id).value.trim();
    const title = get("edu-title"), organizer = get("edu-organizer"), source = get("edu-source");
    let parsed; try { parsed = new URL(source); } catch { return showNotice("Укажи корректную ссылку на официальную страницу."); }
    if (!title || !organizer || !["https:", "http:"].includes(parsed.protocol)) return showNotice("Заполни название, организатора и официальную ссылку.");
    items.push({ id: createId(), title, kind: get("edu-kind"), organizer, direction: get("edu-direction"), age: get("edu-age"), dates: get("edu-dates"), cost: get("edu-cost"), conditions: get("edu-conditions"), source, addedAt: new Date().toISOString() });
    try { localStorage.setItem(key, JSON.stringify(items)); } catch { items.pop(); return showNotice("Не удалось сохранить запись. Возможно, закончилось место в браузере."); }
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
      <button class="primary-button" id="profile-save">Сохранить анкету</button>
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
      <p class="muted small">Скачай оформленное портфолио в редактируемом формате Word (.docx) или подготовь PDF. Для PDF откроется окно печати браузера — выбери «Сохранить как PDF». В документ попадут анкета, проекты, достижения и фотографии грамот. JSON — отдельная техническая резервная копия.</p>
      <div class="export-actions">
        <button class="primary-button" id="portfolio-word">Скачать Word (.docx)</button>
        <button class="secondary-button" id="portfolio-pdf">Подготовить PDF</button>
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
    if (saveData()) showNotice("Анкета сохранена.");
  });
  document.getElementById("project-add").addEventListener("click", () => {
    const title = document.getElementById("project-title").value.trim();
    const description = document.getElementById("project-description").value.trim();
    if (!title) return showNotice("Укажи название проекта.");
    data.projects.push({ id: createId(), title, description });
    if (!saveData()) { data.projects.pop(); return; }
    drawProjects(); document.getElementById("project-title").value = ""; document.getElementById("project-description").value = "";
  });
  document.getElementById("achievement-add").addEventListener("click", async () => {
    const title = document.getElementById("achievement-title").value.trim();
    if (!title) return showNotice("Укажи название олимпиады или конкурса.");
    const file = document.getElementById("achievement-photo").files[0];
    let photo = "";
    if (file) {
      if (!file.type.startsWith("image/")) return showNotice("Выбери файл изображения.");
      if (file.size > 8 * 1024 * 1024) return showNotice("Файл слишком большой. Выбери изображение до 8 МБ.");
      try { photo = await compressCertificateImage(file); }
      catch { return showNotice("Не удалось обработать изображение. Попробуй другой файл."); }
    }
    const year = document.getElementById("achievement-year").value.trim();
    if (year && !/^(19|20)\d{2}$/.test(year)) return showNotice("Укажи год в формате 2026.");
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
  document.getElementById("clear-data").addEventListener("click", async () => {
    if (!await confirmInPage("Удалить все данные портфолио, маршрута, обучения и возможностей на этом устройстве? Перед удалением скачай резервную копию.")) return;
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
  const field = (label, value, fallback) =>
    '<p class="profile-field"><strong>' + escapeHTML(label) + ':</strong> ' + escapeHTML(value || fallback || "Не заполнено") + '</p>';
  const projects = data.projects.map((item, i) =>
    '<article class="project-item"><h3>' + (i + 1) + '. ' + escapeHTML(item.title || "Проект") + '</h3><p>' +
    escapeHTML(item.description || "Описание не добавлено.") + '</p></article>'
  ).join("");
  const achievements = data.achievements.map((item, i) => {
    const x = getAchievementDetails(item);
    return '<article class="achievement-item"><h3>' + (i + 1) + '. ' + escapeHTML(x.title) + '</h3><p class="meta">' +
      escapeHTML([x.subject, x.grade, x.stage, x.result, x.year].filter(Boolean).join(" · ")) + '</p>' +
      (item.photo ? '<img class="certificate" src="' + escapeHTML(item.photo) + '" alt="Грамота или сертификат: ' + escapeHTML(x.title) + '">' : '') +
      '</article>';
  }).join("");

  return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Портфолио ученика</title><style>' +
  '*{box-sizing:border-box}body{font-family:Arial,"Segoe UI",sans-serif;font-size:11pt;line-height:1.55;color:#202a38;max-width:178mm;margin:0 auto}' +
  '.cover{min-height:245mm;display:flex;flex-direction:column;justify-content:center;page-break-after:always;padding:18mm 10mm}' +
  '.brand{font-size:10pt;letter-spacing:2px;text-transform:uppercase;color:#2457a6;font-weight:bold;margin-bottom:28mm}' +
  'h1{font-size:29pt;line-height:1.15;color:#1d2938;margin:0 0 12mm;border-bottom:4px solid #2457a6;padding-bottom:8mm}' +
  '.cover-subtitle{font-size:15pt;color:#687586;margin-bottom:18mm}.cover-name{font-size:20pt;font-weight:bold;color:#2457a6;margin-bottom:5mm}.cover-meta{font-size:11pt;color:#687586}' +
  'h2{font-size:17pt;color:#2457a6;margin:17mm 0 7mm;padding-bottom:3mm;border-bottom:1.5px solid #cbd8e9;page-break-after:avoid}' +
  'h3{font-size:12pt;color:#1d2938;margin:8mm 0 2mm;page-break-after:avoid}p{margin:2mm 0 4mm}.profile-field{padding:2mm 0;border-bottom:1px solid #e8edf3}' +
  '.project-item,.achievement-item{margin:5mm 0 8mm;padding-bottom:4mm;border-bottom:1px solid #e1e7ef;break-inside:avoid;page-break-inside:avoid}' +
  '.meta{color:#687586;font-size:10pt}.certificate{display:block;max-width:100%;width:auto;height:auto;max-height:145mm;object-fit:contain;margin:5mm auto 2mm;break-inside:avoid;page-break-inside:avoid}' +
  '.empty{color:#687586;font-style:italic}.generated{margin-top:18mm;padding-top:4mm;border-top:1px solid #dfe5ed;color:#687586;font-size:9pt}' +
  '@page{size:A4;margin:18mm 16mm}@media print{body{max-width:none}.cover{min-height:255mm}}' +
  '</style></head><body><section class="cover"><div class="brand">Навигатор будущего · Личное портфолио</div>' +
  '<h1>Портфолио ученика</h1><div class="cover-subtitle">Образовательные достижения, проекты и развитие навыков</div>' +
  '<div class="cover-name">' + escapeHTML(p.name || "Имя ученика") + '</div><div class="cover-meta">' +
  escapeHTML([p.grade, p.school, p.city].filter(Boolean).join(" · ") || "Класс · Учебное заведение · Город") +
  '</div></section><section><h2>1. Обо мне</h2>' +
  field("ФИО", p.name) + field("Класс или курс", p.grade) + field("Учебное заведение", p.school) + field("Город", p.city) +
  field("Интересующие направления", p.interests, "Не указаны") + field("Навыки и дисциплины", p.skills, "Не указаны") +
  '</section><section><h2>2. Проекты и практические работы</h2>' +
  (projects || '<p class="empty">Проекты пока не добавлены.</p>') +
  '</section><section><h2>3. Олимпиады, конкурсы и достижения</h2>' +
  (achievements || '<p class="empty">Достижения пока не добавлены.</p>') +
  '</section><p class="generated">Сформировано в образовательной платформе «Навигатор будущего» · ' +
  new Date().toLocaleDateString("ru-RU") + '</p></body></html>';
}

function loadDocxLibrary() {
  if (window.docx && window.docx.Document && window.docx.Packer) return Promise.resolve(window.docx);
  if (window.__navigatorDocxPromise) return window.__navigatorDocxPromise;
  window.__navigatorDocxPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/docx@9.15.3/dist/index.iife.js";
    script.async = true;
    script.onload = () => {
      if (window.docx && window.docx.Document && window.docx.Packer) resolve(window.docx);
      else {
        window.__navigatorDocxPromise = null;
        reject(new Error("Библиотека Word загрузилась некорректно. Обнови страницу и попробуй ещё раз."));
      }
    };
    script.onerror = () => {
      window.__navigatorDocxPromise = null;
      reject(new Error("Не удалось загрузить модуль создания Word. Проверь подключение к интернету и попробуй ещё раз."));
    };
    document.head.appendChild(script);
  });
  return window.__navigatorDocxPromise;
}

function wordParagraph(docx, text, options = {}) {
  return new docx.Paragraph({
    spacing: { after: options.after === undefined ? 150 : options.after },
    alignment: options.alignment,
    children: [new docx.TextRun({
      text: String(text || ""),
      font: "Arial",
      size: options.size || 22,
      bold: Boolean(options.bold),
      color: options.color || "202A38"
    })]
  });
}

function wordHeading(docx, text, pageBreakBefore = false) {
  return new docx.Paragraph({
    pageBreakBefore,
    spacing: { before: 260, after: 140 },
    children: [new docx.TextRun({ text, font: "Arial", size: 30, bold: true, color: "2457A6" })]
  });
}

function dataUrlToBytes(dataUrl) {
  const match = /^data:image\/(?:jpeg|png);base64,(.+)$/i.exec(dataUrl || "");
  if (!match) throw new Error("Неподдерживаемый формат изображения.");
  const binary = atob(match[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function createPortfolioDocx() {
  const docx = await loadDocxLibrary();
  const p = data.profile || {};
  const children = [
    wordParagraph(docx, "НАВИГАТОР БУДУЩЕГО", { size: 20, bold: true, color: "2457A6", alignment: docx.AlignmentType.CENTER, after: 500 }),
    wordParagraph(docx, "ПОРТФОЛИО УЧЕНИКА", { size: 38, bold: true, color: "1D2938", alignment: docx.AlignmentType.CENTER, after: 280 }),
    wordParagraph(docx, "Образовательные достижения, проекты и развитие навыков", { size: 22, color: "687586", alignment: docx.AlignmentType.CENTER, after: 900 }),
    wordParagraph(docx, p.name || "Имя ученика", { size: 30, bold: true, color: "2457A6", alignment: docx.AlignmentType.CENTER, after: 180 }),
    wordParagraph(docx, [p.grade, p.school, p.city].filter(Boolean).join(" · ") || "Класс · Учебное заведение · Город", { size: 20, color: "687586", alignment: docx.AlignmentType.CENTER, after: 300 }),
    wordHeading(docx, "1. Обо мне", true)
  ];

  const profileFields = [
    ["ФИО", p.name], ["Класс или курс", p.grade], ["Учебное заведение", p.school],
    ["Город", p.city], ["Интересующие направления", p.interests], ["Навыки и дисциплины", p.skills]
  ];
  profileFields.forEach(([label, value]) => {
    children.push(new docx.Paragraph({
      spacing: { after: 130 },
      children: [
        new docx.TextRun({ text: label + ": ", bold: true, font: "Arial", size: 22, color: "2457A6" }),
        new docx.TextRun({ text: value || "Не указано", font: "Arial", size: 22, color: "202A38" })
      ]
    }));
  });

  children.push(wordHeading(docx, "2. Проекты и практические работы"));
  if (!data.projects.length) children.push(wordParagraph(docx, "Проекты пока не добавлены.", { color: "687586" }));
  data.projects.forEach((item, index) => {
    children.push(wordParagraph(docx, (index + 1) + ". " + (item.title || "Проект"), { bold: true, color: "1D2938", after: 70 }));
    children.push(wordParagraph(docx, item.description || "Описание не добавлено.", { after: 220 }));
  });

  children.push(wordHeading(docx, "3. Олимпиады, конкурсы и достижения"));
  if (!data.achievements.length) children.push(wordParagraph(docx, "Достижения пока не добавлены.", { color: "687586" }));
  for (let index = 0; index < data.achievements.length; index++) {
    const item = data.achievements[index];
    const x = getAchievementDetails(item);
    children.push(wordParagraph(docx, (index + 1) + ". " + x.title, { bold: true, color: "1D2938", after: 70 }));
    children.push(wordParagraph(docx, [x.subject, x.grade, x.stage, x.result, x.year].filter(Boolean).join(" · "), { color: "687586", after: 100 }));
    if (item.photo) {
      try {
        const bytes = dataUrlToBytes(item.photo);
        const image = new Image();
        const dimensions = await new Promise((resolve, reject) => {
          image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
          image.onerror = reject;
          image.src = item.photo;
        });
        const scale = Math.min(1, 500 / dimensions.width, 620 / dimensions.height);
        children.push(new docx.Paragraph({
          alignment: docx.AlignmentType.CENTER,
          spacing: { before: 80, after: 220 },
          children: [new docx.ImageRun({
            data: bytes,
            transformation: {
              width: Math.max(1, Math.round(dimensions.width * scale)),
              height: Math.max(1, Math.round(dimensions.height * scale))
            }
          })]
        }));
      } catch (error) {
        console.warn("Не удалось добавить изображение достижения в DOCX:", error);
        children.push(wordParagraph(docx, "Изображение документа не удалось включить в файл.", { color: "687586" }));
      }
    }
  }

  children.push(wordParagraph(docx, "Сформировано в «Навигаторе будущего» · " + new Date().toLocaleDateString("ru-RU"), { size: 18, color: "687586", after: 0 }));
  const document = new docx.Document({
    creator: "Навигатор будущего",
    title: "Портфолио ученика",
    description: "Личное образовательное портфолио ученика",
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 900, right: 900, bottom: 900, left: 900 } } },
      children
    }]
  });
  return docx.Packer.toBlob(document);
}

async function exportPortfolioWord() {
  const button = document.getElementById("portfolio-word");
  if (button) { button.disabled = true; button.textContent = "Подготавливаю Word…"; }
  try {
    const blob = await createPortfolioDocx();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "portfolio-navigator-future.docx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } catch (error) {
    console.error("Ошибка экспорта DOCX:", error);
    showNotice(error.message || "Не удалось создать документ Word. Попробуй ещё раз.");
  } finally {
    if (button) { button.disabled = false; button.textContent = "Скачать Word (.docx)"; }
  }
}

function printPortfolio() {
  const popup = window.open("", "_blank");
  if (!popup) return showNotice("Браузер заблокировал окно печати. Для PDF используй разрешённое браузером скачивание или открой портфолио на компьютере.", "warning");
  popup.document.open();
  popup.document.write(buildPortfolioHTML());
  popup.document.close();
  const printWhenReady = async () => {
    try {
      if (popup.document.fonts && popup.document.fonts.ready) await popup.document.fonts.ready;
      await Promise.all(Array.from(popup.document.images).map(image => image.complete ? Promise.resolve() : new Promise(resolve => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      })));
    } catch (error) {
      console.warn("Не удалось дождаться загрузки элементов документа:", error);
    }
    popup.focus();
    popup.print();
  };
  if (popup.document.readyState === "complete") printWhenReady();
  else popup.addEventListener("load", printWhenReady, { once: true });
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
    let parsed; try { parsed = new URL(source); } catch { return showNotice("Добавь ссылку на официальную страницу."); }
    if (!title || !organizer || !["http:", "https:"].includes(parsed.protocol)) return showNotice("Нужны название, организатор и официальная ссылка.");
    items.push({ id: createId(), title, category: get("opp-category"), organizer, direction: get("opp-direction"), age: get("opp-age"), dates: get("opp-dates"), deadline: get("opp-deadline"), format: get("opp-format"), source, addedAt: new Date().toISOString() });
    try { localStorage.setItem(key, JSON.stringify(items)); } catch { items.pop(); return showNotice("Не удалось сохранить запись. Проверь свободное место в браузере."); }
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
  function save() { try { localStorage.setItem(key, JSON.stringify(universities)); return true; } catch { showNotice("Не удалось сохранить список. Проверь свободное место в браузере."); return false; } }
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
    const name = get("uni-name"), source = get("uni-source"); if (!name) return showNotice("Укажи название учебного заведения.");
    if (source) { try { if (!["http:", "https:"].includes(new URL(source).protocol)) throw Error(); } catch { return showNotice("Проверь ссылку на официальный сайт."); } }
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
  const order = Object.keys(pages);
  const index = order.indexOf(currentPage);
  const page = app.querySelector(".page");
  if (index < 0 || !page) return;
  const previous = index > 0 ? order[index - 1] : "home";
  const next = index < order.length - 1 ? order[index + 1] : "home";
  const oldStepper = page.querySelector(".section-stepper");
  if (oldStepper) oldStepper.remove();
  page.insertAdjacentHTML("beforeend", `<nav class="section-stepper" aria-label="Переход между разделами">
    <button type="button" data-page="${previous}">← Назад</button>
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
    showNotice("Задание добавлено в твой маршрут.");
    return;
  }

  const universityDelete = event.target.closest("[data-university-delete]");
  if (universityDelete) {
    const key = "navigator_universities_v1"; let universities = readStorage(key, []);
    if (!Array.isArray(universities)) universities = [];
    universities = universities.filter(item => (typeof item === "string" ? item : item.id) !== universityDelete.dataset.universityDelete);
    try { localStorage.setItem(key, JSON.stringify(universities)); } catch { showNotice("Не удалось обновить список."); return; }
    renderAdmission(); return;
  }
  const educationDelete = event.target.closest("[data-edu-delete]");
  if (educationDelete) { const key = "navigator_education_v1"; let items = readStorage(key, []); items.splice(Number(educationDelete.dataset.eduDelete), 1); try { localStorage.setItem(key, JSON.stringify(items)); } catch { return showNotice("Не удалось обновить список."); } renderEducation(); return; }
  const opportunityDelete = event.target.closest("[data-opp-delete]");
  if (opportunityDelete) { const key = "navigator_opportunities_v1"; let items = readStorage(key, []); items.splice(Number(opportunityDelete.dataset.oppDelete), 1); try { localStorage.setItem(key, JSON.stringify(items)); } catch { return showNotice("Не удалось обновить каталог."); } renderOpportunities(); }
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
