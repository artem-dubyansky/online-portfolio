document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.tab-btn');
    const contentCard = document.getElementById('main-content');

    // PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(e => console.log('SW pass', e));
    }

    let deferredPrompt;
    const pwaBanner = document.getElementById('pwa-install-banner');
    const pwaBtn = document.getElementById('pwa-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (pwaBanner) pwaBanner.style.display = 'block';
    });

    if (pwaBtn) {
        pwaBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted' && pwaBanner) pwaBanner.style.display = 'none';
                deferredPrompt = null;
            } else {
                alert("Чтобы установить приложение на iPhone:\nВ Safari нажмите кнопку «Поделиться» (квадрат со стрелкой вверх) и выберите «На экран «Домой»».");
            }
        });
    }

    // Алгоритмическое ядро C++ WebAssembly
    let wasmCalculateMatch = null;
    let wasmActive = false;

    try {
        const wasmBytes = new Uint8Array([
            0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
            0x01, 0x09, 0x01, 0x60, 0x04, 0x7f, 0x7f, 0x7f, 0x7f, 0x01, 0x7f,
            0x03, 0x02, 0x01, 0x00,
            0x07, 0x17, 0x01, 0x13, 0x63, 0x61, 0x6c, 0x63, 0x75, 0x6c, 0x61, 0x74, 0x65, 0x4d, 0x61, 0x74, 0x63, 0x68, 0x53, 0x63, 0x6f, 0x72, 0x65, 0x00, 0x00,
            0x0a, 0x29, 0x01, 0x27, 0x00,
            0x41, 0x37,
            0x41, 0x10, 0x41, 0x05, 0x20, 0x00, 0x1b, 0x6a,
            0x20, 0x01, 0x41, 0x05, 0x6c, 0x6a,
            0x41, 0x05, 0x41, 0x00, 0x20, 0x02, 0x1b, 0x6a,
            0x41, 0x08, 0x41, 0x7c, 0x20, 0x03, 0x41, 0x00, 0x4c, 0x1b, 0x6a,
            0x0b
        ]);

        WebAssembly.instantiate(wasmBytes).then(wasmModule => {
            wasmCalculateMatch = wasmModule.instance.exports.calculateMatchScore;
            wasmActive = true;
            const badge = document.getElementById('wasm-status-badge');
            if (badge) {
                badge.textContent = '● WASM C++ Ядро активно';
                badge.style.color = '#10b981';
            }
        }).catch(err => {
            console.warn("WASM run pass:", err);
        });
    } catch (e) {
        console.warn("WASM init pass:", e);
    }

    const olympList = [
        "Научно-практическая конференция «Инженеры будущего»",
        "Всероссийская олимпиада школьников (ВсОШ)",
        "Олимпиада школьников «Шаг в будущее» (МГТУ Баумана)",
        "Московская олимпиада школьников (МОШ)",
        "Олимпиада «Курчатов»",
        "Олимпиада «Высшая проба» (НИУ ВШЭ)",
        "Предпрофессиональная олимпиада",
        "Олимпиада «Ломоносов» (МГУ)",
        "Хакатон / Конкурс инженерных проектов"
    ];

    const subjectList = [
        "Технология (робототехника/машиностроение)", 
        "Физика", "Информатика", "Математика", 
        "Схемотехника и пайка", "Экономика и предпринимательство", 
        "Биология и биомедицина", "Химия"
    ];

    const availableTech = [
        "Инженерия", "3D-моделирование (CAD)", "Схемотехника/Пайка", "Робототехника", 
        "C++", "Python", "Физика", "Математика", "Экономика/Финансы", 
        "Управление проектами", "Веб-дизайн", "Биоинженерия"
    ];

    const schoolsData = [
        { id: 1, name: "Бауманская инженерная школа № 1580", profile: "Инженерно-технологический", targetTrack: "eng", minScore: 88, requiredTech: ["Инженерия", "Физика", "3D-моделирование (CAD)"], description: "Базовый лицей при МГТУ им. Баумана. Проектирование, робототехника и прикладная физика." },
        { id: 2, name: "Лицей НИУ ВШЭ (Экономика и Бизнес)", profile: "Предпринимательские классы", targetTrack: "biz", minScore: 86, requiredTech: ["Экономика/Финансы", "Управление проектами", "Математика"], description: "Подготовка специалистов в сфере экономики, управления и прикладной аналитики." },
        { id: 3, name: "Колледж современных технологий (КСТ)", profile: "Прикладные технологии и мастерство", targetTrack: "craft", minScore: 75, requiredTech: ["Схемотехника/Пайка", "3D-моделирование (CAD)", "Инженерия"], description: "Мехатроника, обработка на станках ЧПУ, электромонтажные лаборатории." },
        { id: 4, name: "Школа № 179", profile: "Системное IT и алгоритмы C++", targetTrack: "it", minScore: 92, requiredTech: ["C++", "Математика", "Python"], description: "Специализированные классы теоретического и системного программирования." },
        { id: 5, name: "Школа № 1502 при МЭИ", profile: "Энергетика и прикладная инженерия", targetTrack: "eng", minScore: 84, requiredTech: ["Физика", "Инженерия", "Схемотехника/Пайка"], description: "Инженерные вертикали и лаборатории микроэлектроники." },
        { id: 6, name: "Сеченовский предуниверсарий", profile: "Биоинженерия и медицинские классы", targetTrack: "bio", minScore: 85, requiredTech: ["Биоинженерия", "Физика", "Математика"], description: "Подготовка по биотехнологиям, биофизике и медицине." },
        { id: 7, name: "Политехнический колледж № 8 им. Павлова", profile: "Робототехника и аппаратный монтаж", targetTrack: "craft", minScore: 74, requiredTech: ["Робототехника", "Схемотехника/Пайка", "3D-моделирование (CAD)"], description: "Практическая работа со станками, печатными платами и контроллерами." },
        { id: 8, name: "Школа № 1535 (IT-вертикаль)", profile: "Прикладная разработка ПО", targetTrack: "it", minScore: 89, requiredTech: ["Python", "C++", "Веб-дизайн"], description: "Информационные технологии, алгоритмы и архитектура приложений." }
    ];

    const quizQuestions = [
        {
            title: "1. Какой школьный предмет или занятие вам ближе всего?",
            options: [
                { text: "Физика, лабораторные опыты и конструкторы", track: "eng" },
                { text: "Информатика, написание программ и скриптов", track: "it" },
                { text: "Технология, черчение, 3D-печать и работа руками", track: "craft" },
                { text: "Обществознание, организация мероприятий и экономика", track: "biz" },
                { text: "Биология, строение организмов и медицина", track: "bio" },
                { text: "Чистая математика, теория чисел и сложные теоремы", track: "science" }
            ]
        },
        {
            title: "2. Чем бы вы предпочли заняться на практике?",
            options: [
                { text: "Собрать роботизированный узел и распаять плату", track: "eng" },
                { text: "Разработать полезное приложение или веб-сервис", track: "it" },
                { text: "Смоделировать в CAD деталь и выточить на станке", track: "craft" },
                { text: "Придумать бизнес-план стартапа и рассчитать бюджет", track: "biz" },
                { text: "Изучить биоматериалы и датчики пульса/давления", track: "bio" },
                { text: "Решить сложную олимпиадную задачу по геометрии", track: "science" }
            ]
        },
        {
            title: "3. Какая практическая задача вас увлекает сильнее?",
            options: [
                { text: "Создать механизм, решающий конкретную инженерную проблему", track: "eng" },
                { text: "Оптимизировать код алгоритма для максимальной скорости", track: "it" },
                { text: "Сделать прочный физический корпус прибора своими руками", track: "craft" },
                { text: "Собрать команду, распределить роли и презентовать проект", track: "biz" },
                { text: "Разработать бионический протез или систему экомониторинга", track: "bio" },
                { text: "Построить строгую математическую модель явления", track: "science" }
            ]
        },
        {
            title: "4. В какой лаборатории или мастерской вам комфортнее?",
            options: [
                { text: "Физико-техническая лаборатория с измерительными приборами", track: "eng" },
                { text: "Компьютерный класс с мощными рабочими станциями", track: "it" },
                { text: "Фаблаб с 3D-принтерами, лазерным станком и паяльниками", track: "craft" },
                { text: "Коворкинг для деловых встреч и проектной аналитики", track: "biz" },
                { text: "Химико-биологическая лаборатория с микроскопами", track: "bio" },
                { text: "Учебная аудитория с доской для формул и вычислений", track: "science" }
            ]
        },
        {
            title: "5. Кем вы видите себя после окончания вуза?",
            options: [
                { text: "Инженером-конструктором, разработчиком приборов или роботов", track: "eng" },
                { text: "Ведущим программистом или системным архитектором", track: "it" },
                { text: "Главным мастером производства, оператором станков ЧПУ", track: "craft" },
                { text: "Руководителем проектов, предпринимателем или директором", track: "biz" },
                { text: "Инженером медтехники или исследователем биотехнологий", track: "bio" },
                { text: "Ученым-исследователем, физиком или математиком", track: "science" }
            ]
        }
    ];

    function getSavedStack() {
        const raw = localStorage.getItem('portfolio_stack_v5');
        return raw ? JSON.parse(raw) : ["Инженерия", "3D-моделирование (CAD)", "Схемотехника/Пайка", "Физика", "C++"];
    }

    function getSavedOlymps() {
        const raw = localStorage.getItem('portfolio_olymps_v5');
        return raw ? JSON.parse(raw) : [
            {
                name: "Научно-практическая конференция «Инженеры будущего»",
                subject: "Технология (робототехника/машиностроение)",
                grade: "8",
                stage: "regional",
                status: "winner",
                image: ""
            }
        ];
    }

    function compressImage(file, callback) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 500;

                if (width > height && width > maxDim) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else if (height > maxDim) {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.68);
                callback(dataUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function calculateMatch(school) {
        const savedTrack = localStorage.getItem('portfolio_track_v5') || 'eng';
        const olymps = getSavedOlymps();
        const userStack = getSavedStack();

        const trackMatch = (savedTrack === school.targetTrack) ? 1 : 0;
        let matchedTech = 0;
        school.requiredTech.forEach(t => {
            if (userStack.includes(t)) matchedTech++;
        });
        if (matchedTech > 3) matchedTech = 3;

        const hasAchievements = olymps.some(o => o.status === 'winner' || o.status === 'prizewinner') ? 1 : 0;

        if (wasmCalculateMatch) {
            try {
                const rawScore = wasmCalculateMatch(trackMatch, matchedTech, hasAchievements, 3);
                return Math.max(50, Math.min(rawScore, 99));
            } catch (e) {
                console.warn("WASM run pass", e);
            }
        }
        let score = 55 + (trackMatch ? 18 : 6) + Math.min(matchedTech * 6, 18) + (hasAchievements ? 6 : 0);
        return Math.max(50, Math.min(score, 99));
    }

    // Четкая отрисовка радара
    function drawCrispRadar(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const displayWidth = 300;
        const displayHeight = 240;

        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        canvas.style.width = displayWidth + "px";
        canvas.style.height = displayHeight + "px";

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const cx = displayWidth / 2;
        const cy = displayHeight / 2 + 5;
        const rMax = 72;

        ctx.clearRect(0, 0, displayWidth, displayHeight);

        const stack = getSavedStack();
        const olymps = getSavedOlymps();

        const axes = [
            { label: "Инженерия", val: Math.min(1, 0.4 + (stack.includes("Инженерия") || stack.includes("Физика") ? 0.45 : 0)) },
            { label: "Мастерство/CAD", val: Math.min(1, 0.35 + (stack.includes("3D-моделирование (CAD)") || stack.includes("Схемотехника/Пайка") ? 0.45 : 0)) },
            { label: "C++ / IT", val: Math.min(1, 0.3 + (stack.includes("C++") || stack.includes("Python") ? 0.45 : 0)) },
            { label: "Олимпиады", val: Math.min(1, 0.3 + olymps.length * 0.25) },
            { label: "Бизнес/Управл.", val: Math.min(1, 0.3 + (stack.includes("Экономика/Финансы") || stack.includes("Управление проектами") ? 0.5 : 0)) },
            { label: "Био/Химия", val: Math.min(1, 0.3 + (stack.includes("Биоинженерия") ? 0.5 : 0)) }
        ];

        const n = axes.length;
        const step = (Math.PI * 2) / n;

        for (let l = 1; l <= 4; l++) {
            const r = (rMax / 4) * l;
            ctx.beginPath();
            for (let i = 0; i < n; i++) {
                const a = i * step - Math.PI / 2;
                const x = cx + r * Math.cos(a);
                const y = cy + r * Math.sin(a);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.font = "600 11px -apple-system, sans-serif";
        ctx.fillStyle = "#cbd5e1";
        ctx.textAlign = "center";

        for (let i = 0; i < n; i++) {
            const a = i * step - Math.PI / 2;
            const lx = cx + (rMax + 24) * Math.cos(a);
            const ly = cy + (rMax + 24) * Math.sin(a) + 4;
            ctx.fillText(axes[i].label, lx, ly);

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + rMax * Math.cos(a), cy + rMax * Math.sin(a));
            ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
            ctx.stroke();
        }

        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const a = i * step - Math.PI / 2;
            const r = rMax * axes[i].val;
            const x = cx + r * Math.cos(a);
            const y = cy + r * Math.sin(a);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(59, 130, 246, 0.38)";
        ctx.fill();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2.2;
        ctx.stroke();
    }

    // Генерация официального бланка
    function showInPageSheet() {
        const name = localStorage.getItem('portfolio_name_v5') || 'Дубянский Артём';
        const grade = localStorage.getItem('portfolio_grade_v5') || '8 «Д»';
        const school = localStorage.getItem('portfolio_school_v5') || 'ГБОУ «Бауманская инженерная школа № 1580»';
        const projTitle = localStorage.getItem('portfolio_proj_title_v5') || 'Стенд аппаратного прототипирования и навигатор поступления на C++ (WASM)';
        const projDesc = localStorage.getItem('portfolio_proj_desc_v5') || 'Сборка узлов на 3D-принтере, распайка модулей телеметрии, написание алгоритмов анализа на C++.';
        const motivation = localStorage.getItem('portfolio_motivation_v5') || 'Хочу углубленно изучать инженерное дело и робототехнику, чтобы создавать реальные приборы и аппараты.';
        const olymps = getSavedOlymps();
        const stack = getSavedStack();

        const stageNames = { school: "Школьный", municipal: "Муниципальный", regional: "Региональный", allros: "Заключительный" };
        const statusNames = { winner: "Победитель", prizewinner: "Призёр", participant: "Участник" };

        const olympsWithPhotos = olymps.filter(o => o.image);
        let diplomasHtml = '';
        if (olympsWithPhotos.length > 0) {
            diplomasHtml = `
                <div style="margin-top: 14px;">
                    <div style="font-weight: 700; color: #1e3a8a; border-bottom: 1px solid #93c5fd; padding-bottom: 2px; margin-bottom: 8px;">
                        ФОТОФИКСАЦИЯ ПРИКРЕПЛЕННЫХ ГРАМОТ:
                    </div>
                    <div class="print-diploma-grid">
                        ${olympsWithPhotos.map(o => `
                            <div class="print-diploma-item">
                                <img src="${o.image}" alt="Грамота">
                                <div style="font-size: 10px; font-weight: 600; margin-top: 3px; color: #1f2937;">${o.subject}</div>
                                <div style="font-size: 9px; color: #4b5563;">${statusNames[o.status] || o.status}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        const olympsRows = olymps.map((o, idx) => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 6px 8px;"><b>${idx + 1}. ${o.name}</b></td>
                <td style="padding: 6px 8px;">${o.subject} (${o.grade} кл.)</td>
                <td style="padding: 6px 8px;">${stageNames[o.stage] || o.stage}</td>
                <td style="padding: 6px 8px; font-weight: 700; color: #1d4ed8;">${statusNames[o.status] || o.status}</td>
            </tr>
        `).join('');

        const sheet = document.getElementById('print-sheet-content');
        if (!sheet) return;

        sheet.innerHTML = `
            <div style="border-bottom: 2px solid #1e40af; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 style="font-size: 18px; color: #111827; margin-bottom: 2px;">ОФИЦИАЛЬНОЕ ПОРТФОЛИО УЧЕНИКА</h1>
                    <div style="font-size: 12px; color: #4b5563;">Предпрофильная инженерная вертикаль • МГТУ им. Н.Э. Баумана</div>
                </div>
                <div style="text-align: right; font-size: 11px; color: #6b7280;">
                    Дата: ${new Date().toLocaleDateString('ru-RU')}
                </div>
            </div>

            <table style="width: 100%; margin-bottom: 14px; font-size: 12px;">
                <tr>
                    <td style="width: 130px; font-weight: 700; color: #374151;">Учащийся:</td>
                    <td style="font-size: 14px; font-weight: 700; color: #111827;">${name}</td>
                </tr>
                <tr>
                    <td style="font-weight: 700; color: #374151;">Класс и школа:</td>
                    <td>${grade}, ${school}</td>
                </tr>
                <tr>
                    <td style="font-weight: 700; color: #374151;">Стек навыков:</td>
                    <td>${stack.join(', ')}</td>
                </tr>
            </table>

            <div style="margin-bottom: 14px;">
                <div style="font-weight: 700; color: #1e3a8a; border-bottom: 1px solid #93c5fd; padding-bottom: 2px; margin-bottom: 4px;">
                    1. МОИ ПРАКТИЧЕСКИЕ И ИНЖЕНЕРНЫЕ ПРОЕКТЫ
                </div>
                <p style="margin-bottom: 3px;"><b>${projTitle}</b></p>
                <p style="color: #374151; font-size: 12px;">${projDesc}</p>
            </div>

            <div style="margin-bottom: 14px;">
                <div style="font-weight: 700; color: #1e3a8a; border-bottom: 1px solid #93c5fd; padding-bottom: 2px; margin-bottom: 4px;">
                    2. МОТИВАЦИЯ И ВЫБОР ПРОФИЛЯ
                </div>
                <p style="color: #374151; font-size: 12px;">${motivation}</p>
            </div>

            <div style="margin-bottom: 14px;">
                <div style="font-weight: 700; color: #1e3a8a; border-bottom: 1px solid #93c5fd; padding-bottom: 2px; margin-bottom: 6px;">
                    3. ОЛИМПИАДЫ И НАГРАДЫ (${olymps.length} зафиксировано)
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead style="background: #f3f4f6; text-align: left;">
                        <tr>
                            <th style="padding: 5px 6px;">Олимпиада/Конкурс</th>
                            <th style="padding: 5px 6px;">Предмет</th>
                            <th style="padding: 5px 6px;">Этап</th>
                            <th style="padding: 5px 6px;">Результат</th>
                        </tr>
                    </thead>
                    <tbody>${olympsRows}</tbody>
                </table>
            </div>

            ${diplomasHtml}

            <div style="margin-top: 20px; border-top: 1px solid #d1d5db; padding-top: 8px; display: flex; justify-content: space-between; font-size: 11px; color: #6b7280;">
                <div>Документ сформирован из веб-системы портфолио ученика</div>
                <div>Подпись учащегося: ___________________</div>
            </div>
        `;

        const modal = document.getElementById('print-modal');
        if (modal) modal.style.display = 'flex';
    }

    // Экспорт в Word (.doc)
    function downloadWordDoc() {
        const sheet = document.getElementById('print-sheet-content');
        if (!sheet) return;

        const name = localStorage.getItem('portfolio_name_v5') || 'Дубянский_Артём';
        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Портфолио</title>
            <style>
                body { font-family: "Times New Roman", serif; font-size: 12pt; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #999; padding: 6px; }
            </style>
            </head>
            <body>${sheet.innerHTML}</body></html>
        `;

        const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Портфолио_${name.replace(/\s+/g, '_')}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    const modalDocBtn = document.getElementById('modal-doc-action');
    if (modalDocBtn) modalDocBtn.onclick = downloadWordDoc;

    const modalCloseBtn = document.getElementById('modal-close-action');
    if (modalCloseBtn) modalCloseBtn.onclick = () => {
        const m = document.getElementById('print-modal');
        if (m) m.style.display = 'none';
    };

    const modalPrintBtn = document.getElementById('modal-print-action');
    if (modalPrintBtn) {
        modalPrintBtn.onclick = () => {
            setTimeout(() => {
                window.print();
            }, 50);
        };
    }

    // Экспорт в чистый TXT
    function exportPureTxt() {
        const name = localStorage.getItem('portfolio_name_v5') || 'Дубянский Артём';
        const grade = localStorage.getItem('portfolio_grade_v5') || '8 «Д»';
        const school = localStorage.getItem('portfolio_school_v5') || 'ГБОУ «Бауманская инженерная школа № 1580»';
        const olymps = getSavedOlymps();
        const stack = getSavedStack();

        const stageNames = { school: "Школьный", municipal: "Муниципальный", regional: "Региональный", allros: "Заключительный" };
        const statusNames = { winner: "Победитель", prizewinner: "Призёр", participant: "Участник" };

        const lines = [
            "==================================================",
            "          ОФИЦИАЛЬНОЕ ПОРТФОЛИО УЧЕНИКА           ",
            "==================================================",
            `ФИО: ${name}`,
            `Класс: ${grade}`,
            `Учебное заведение: ${school}`,
            `Стек навыков: ${stack.join(', ')}`,
            "",
            "ДОСТИЖЕНИЯ И ОЛИМПИАДЫ:",
            ...olymps.map((o, idx) => `  ${idx + 1}. ${o.name} | ${o.subject} (${o.grade} кл.) | ${stageNames[o.stage] || o.stage} | ${statusNames[o.status] || o.status}`),
            "",
            "Дата составления: " + new Date().toLocaleDateString('ru-RU')
        ];

        const blob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Портфолио_${name.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    function exportReportTxt() {
        const name = localStorage.getItem('portfolio_name_v5') || 'Дубянский Артём';
        const ranked = schoolsData
            .map(s => ({ ...s, matchScore: calculateMatch(s) }))
            .sort((a, b) => b.matchScore - a.matchScore);

        const lines = [
            "==================================================",
            "    АНАЛИТИЧЕСКИЙ ОТЧЕТ: НАВИГАТОР ПОСТУПЛЕНИЯ    ",
            "==================================================",
            `Кандидат: ${name}`,
            "",
            "РЕЗУЛЬТАТЫ РАСЧЕТА СОВМЕСТИМОСТИ (C++ / WASM):",
            ...ranked.map((s, idx) => `${idx + 1}. ${s.name} [${s.profile}] — ${s.matchScore}% (Порог: ${s.minScore})`)
        ];

        const blob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Отчет_Навигатора_${name.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    // Рендер вкладок
    function renderTab(tabIndex) {
        buttons.forEach((b, idx) => b.classList.toggle('active', idx === parseInt(tabIndex)));

        // Вкладка 0: Тест
        if (tabIndex === '0') {
            const savedTrack = localStorage.getItem('portfolio_track_v5') || 'eng';

            const trackNames = {
                eng: "Инженерия и робототехника (МГТУ Баумана)",
                it: "IT и программная инженерия (C++, Python)",
                craft: "Прикладные технологии и CAD-мастерство (3D-печать, станки)",
                biz: "Бизнес, экономика и управление проектами",
                bio: "Биоинженерия и медицинские технологии",
                science: "Фундаментальная математика и наука"
            };

            const questionsHtml = quizQuestions.map((q, qIdx) => `
                <div class="section-box" style="margin-bottom: 10px;">
                    <div style="font-size: 13px; font-weight: 700; color: #60a5fa; margin-bottom: 8px;">${q.title}</div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${q.options.map((opt, oIdx) => `
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #e2e8f0; cursor: pointer; background: rgba(0,0,0,0.25); padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color);">
                                <input type="radio" name="quiz_q_${qIdx}" value="${opt.track}" ${oIdx === 0 ? 'checked' : ''} style="accent-color: #3b82f6;">
                                <span>${opt.text}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `).join('');

            contentCard.innerHTML = `
                <h2>Профориентационный тест: Выбор профильного вектора</h2>
                <p>Ответьте на 5 вопросов, чтобы алгоритм определил ваш профиль для старших классов:</p>

                <form id="quiz-form">
                    ${questionsHtml}
                    <button type="submit" class="btn-primary" style="width: 100%; margin-top: 6px; padding: 12px;">Рассчитать мой профильный вектор</button>
                </form>

                <div id="quiz-result-box" class="section-box" style="margin-top: 14px; display: block; border-color: #3b82f6;">
                    <div style="font-size: 11px; color: var(--text-muted);">Текущий зафиксированный профиль:</div>
                    <div id="quiz-result-name" style="font-size: 15px; font-weight: 700; color: #60a5fa; margin-top: 2px;">
                        ${trackNames[savedTrack] || savedTrack}
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                        Вектор передан в C++ (WASM) навигатор школ и учитывается в расчете рейтинга.
                    </div>
                </div>
            `;

            document.getElementById('quiz-form').onsubmit = (e) => {
                e.preventDefault();
                const counts = { eng: 0, it: 0, craft: 0, biz: 0, bio: 0, science: 0 };
                quizQuestions.forEach((_, idx) => {
                    const sel = document.querySelector(`input[name="quiz_q_${idx}"]:checked`);
                    if (sel) counts[sel.value] = (counts[sel.value] || 0) + 1;
                });

                let bestTrack = 'eng';
                let maxVal = -1;
                for (const t in counts) {
                    if (counts[t] > maxVal) {
                        maxVal = counts[t];
                        bestTrack = t;
                    }
                }

                localStorage.setItem('portfolio_track_v5', bestTrack);
                document.getElementById('quiz-result-name').textContent = trackNames[bestTrack];
                alert("✓ Профиль определен: " + trackNames[bestTrack] + "\nРезультат сохранен в навигаторе!");
            };

        // Вкладка 1: Портфолио
        } else if (tabIndex === '1') {
            const name = localStorage.getItem('portfolio_name_v5') || 'Дубянский Артём';
            const grade = localStorage.getItem('portfolio_grade_v5') || '8 «Д»';
            const school = localStorage.getItem('portfolio_school_v5') || 'ГБОУ «Бауманская инженерная школа № 1580»';
            const projTitle = localStorage.getItem('portfolio_proj_title_v5') || 'Стенд аппаратного прототипирования и навигатор поступления на C++ (WASM)';
            const projDesc = localStorage.getItem('portfolio_proj_desc_v5') || 'Сборка узлов на 3D-принтере, распайка модулей телеметрии, написание алгоритмов анализа на C++.';
            const motivation = localStorage.getItem('portfolio_motivation_v5') || 'Хочу углубленно изучать инженерное дело и робототехнику, чтобы создавать реальные приборы и аппараты.';

            let currentStack = getSavedStack();
            let currentOlymps = getSavedOlymps();

            contentCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 14px;">
                    <div>
                        <h2>Моё портфолио и грамоты</h2>
                        <p style="margin-bottom: 0;">Реальные проекты, фото грамот и баланс компетенций</p>
                    </div>
                </div>

                <div class="portfolio-grid">
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        
                        <div class="section-box">
                            <div class="section-title">👤 Данные ученика</div>
                            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                                <div style="flex: 2;">
                                    <label class="form-label">ФИО</label>
                                    <input type="text" id="input-name" class="form-input" value="${name}">
                                </div>
                                <div style="flex: 1;">
                                    <label class="form-label">Класс</label>
                                    <input type="text" id="input-grade" class="form-input" value="${grade}">
                                </div>
                            </div>
                            <div>
                                <label class="form-label">Школа / Инженерный класс</label>
                                <input type="text" id="input-school" class="form-input" value="${school}">
                            </div>
                        </div>

                        <div class="section-box">
                            <div class="section-title">⚙️ Мои инженерные и учебные проекты</div>
                            <div style="margin-bottom: 8px;">
                                <label class="form-label">Название проекта</label>
                                <input type="text" id="input-proj-title" class="form-input" value="${projTitle}">
                            </div>
                            <div>
                                <label class="form-label">Что сделано своими руками</label>
                                <textarea id="input-proj-desc" class="form-textarea" rows="2">${projDesc}</textarea>
                            </div>
                        </div>

                        <div class="section-box">
                            <div class="section-title">🎯 Мотивация и цель поступления</div>
                            <textarea id="input-motivation" class="form-textarea" rows="2">${motivation}</textarea>
                        </div>

                        <div class="section-box">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <div class="section-title" style="margin-bottom: 0;">🏆 Олимпиады и грамоты (с фотофиксацией)</div>
                                <button id="add-olymp-btn" type="button" style="background: rgba(59, 130, 246, 0.2); border: 1px solid var(--accent-blue); color: #60a5fa; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
                                    + Добавить олимпиаду
                                </button>
                            </div>
                            <div id="olymps-container"></div>
                        </div>

                        <div class="section-box">
                            <div class="section-title">🛠️ Мой стек навыков и дисциплин (кликните для выбора):</div>
                            <div id="tech-chips" style="display: flex; flex-wrap: wrap; gap: 6px;"></div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <button id="save-all-btn" class="btn-primary" style="padding: 11px;">💾 Сохранить анкету и грамоты</button>
                            
                            <button id="preview-styled-portfolio-btn" class="btn-secondary" style="border-color: #3b82f6; color: #60a5fa; font-weight: 700; padding: 11px;">
                                📄 Открыть официальный бланк с фото (Word / PDF)
                            </button>

                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button id="export-pure-txt-btn" class="btn-secondary" style="flex: 1; min-width: 140px; font-size: 12px; border-color: #10b981; color: #10b981;">
                                    📄 Текст портфолио
                                </button>
                                <button id="export-report-txt-btn" class="btn-secondary" style="flex: 1; min-width: 140px; font-size: 12px;">
                                    📊 Отчёт навигатора
                                </button>
                            </div>
                        </div>
                        <span id="save-status" style="font-size: 12px; color: var(--success); display: none;">Данные успешно сохранены!</span>
                    </div>

                    <div class="radar-box">
                        <span style="font-size: 13px; font-weight: 700; color: #f0f4f8; margin-bottom: 6px;">Карта моих компетенций</span>
                        <canvas id="skills-radar"></canvas>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 8px; line-height: 1.4;">
                            Направления: Инженерия, Мастерство/CAD, C++/IT, Олимпиады, Бизнес/Управл., Био/Химия.
                        </div>
                    </div>
                </div>
            `;

            const olympsContainer = document.getElementById('olymps-container');

            function renderOlympsList() {
                olympsContainer.innerHTML = '';
                if (currentOlymps.length === 0) {
                    olympsContainer.innerHTML = '<p style="font-size: 12px; color: var(--text-muted);">Нет добавленных грамот. Нажмите «+ Добавить олимпиаду».</p>';
                    return;
                }

                currentOlymps.forEach((olymp, idx) => {
                    const card = document.createElement('div');
                    card.className = 'ach-card';

                    const olympOptions = olympList.map(o => `<option value="${o}" ${olymp.name === o ? 'selected' : ''}>${o}</option>`).join('');
                    const subjectOptions = subjectList.map(s => `<option value="${s}" ${olymp.subject === s ? 'selected' : ''}>${s}</option>`).join('');

                    card.innerHTML = `
                        <button type="button" class="ach-remove-btn" data-del="${idx}" title="Удалить">✕</button>
                        
                        <div>
                            <span class="form-label">Название олимпиады / конкурса:</span>
                            <select class="form-select ach-field" data-idx="${idx}" data-field="name">${olympOptions}</select>
                        </div>

                        <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 6px;">
                            <div>
                                <span class="form-label">Предмет:</span>
                                <select class="form-select ach-field" data-idx="${idx}" data-field="subject">${subjectOptions}</select>
                            </div>
                            <div>
                                <span class="form-label">Класс участия:</span>
                                <select class="form-select ach-field" data-idx="${idx}" data-field="grade">
                                    <option value="7" ${olymp.grade==='7'?'selected':''}>7 класс</option>
                                    <option value="8" ${olymp.grade==='8'?'selected':''}>8 класс</option>
                                    <option value="9" ${olymp.grade==='9'?'selected':''}>9 класс</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                            <div>
                                <span class="form-label">Этап / Уровень:</span>
                                <select class="form-select ach-field" data-idx="${idx}" data-field="stage">
                                    <option value="school" ${olymp.stage==='school'?'selected':''}>Школьный</option>
                                    <option value="municipal" ${olymp.stage==='municipal'?'selected':''}>Муниципальный</option>
                                    <option value="regional" ${olymp.stage==='regional'?'selected':''}>Региональный</option>
                                    <option value="allros" ${olymp.stage==='allros'?'selected':''}>Заключительный</option>
                                </select>
                            </div>
                            <div>
                                <span class="form-label">Результат:</span>
                                <select class="form-select ach-field" data-idx="${idx}" data-field="status">
                                    <option value="winner" ${olymp.status==='winner'?'selected':''}>Победитель</option>
                                    <option value="prizewinner" ${olymp.status==='prizewinner'?'selected':''}>Призёр</option>
                                    <option value="participant" ${olymp.status==='participant'?'selected':''}>Участник</option>
                                </select>
                            </div>
                        </div>

                        <div class="photo-preview-box">
                            <input type="file" accept="image/*" id="photo-input-${idx}" style="display: none;">
                            <button type="button" class="btn-secondary attach-photo-btn" data-idx="${idx}" style="font-size: 11px; padding: 6px 10px;">
                                📸 ${olymp.image ? 'Заменить грамоту' : 'Сфоткать / загрузить грамоту'}
                            </button>
                            ${olymp.image ? `
                                <img src="${olymp.image}" class="diploma-thumb" title="Открыть фото">
                                <span style="font-size: 11px; color: var(--success); font-weight: 600;">✓ Грамота прикреплена</span>
                                <button type="button" class="remove-photo-btn" data-idx="${idx}" style="background:none; border:none; color:var(--danger); font-size:11px; cursor:pointer; margin-left:auto;">Удалить фото</button>
                            ` : `
                                <span style="font-size: 11px; color: var(--text-muted);">Фото не прикреплено</span>
                            `}
                        </div>
                    `;
                    olympsContainer.appendChild(card);
                });

                document.querySelectorAll('.ach-field').forEach(el => {
                    el.onchange = (e) => {
                        const i = parseInt(e.target.dataset.idx);
                        const field = e.target.dataset.field;
                        currentOlymps[i][field] = e.target.value;
                        localStorage.setItem('portfolio_olymps_v5', JSON.stringify(currentOlymps));
                        drawCrispRadar('skills-radar');
                    };
                });

                document.querySelectorAll('.ach-remove-btn').forEach(btn => {
                    btn.onclick = (e) => {
                        const i = parseInt(e.target.dataset.del);
                        currentOlymps.splice(i, 1);
                        localStorage.setItem('portfolio_olymps_v5', JSON.stringify(currentOlymps));
                        renderOlympsList();
                        drawCrispRadar('skills-radar');
                    };
                });

                document.querySelectorAll('.attach-photo-btn').forEach(btn => {
                    btn.onclick = () => {
                        const idx = btn.dataset.idx;
                        const input = document.getElementById(`photo-input-${idx}`);
                        if (input) {
                            input.click();
                            input.onchange = (ev) => {
                                if (ev.target.files && ev.target.files[0]) {
                                    compressImage(ev.target.files[0], (compressedData) => {
                                        currentOlymps[idx].image = compressedData;
                                        localStorage.setItem('portfolio_olymps_v5', JSON.stringify(currentOlymps));
                                        renderOlympsList();
                                        drawCrispRadar('skills-radar');
                                    });
                                }
                            };
                        }
                    };
                });

                document.querySelectorAll('.remove-photo-btn').forEach(btn => {
                    btn.onclick = () => {
                        const idx = btn.dataset.idx;
                        currentOlymps[idx].image = "";
                        localStorage.setItem('portfolio_olymps_v5', JSON.stringify(currentOlymps));
                        renderOlympsList();
                    };
                });

                document.querySelectorAll('.diploma-thumb').forEach(img => {
                    img.onclick = () => {
                        const w = window.open("");
                        if (w) w.document.write(`<img src="${img.src}" style="max-width:100%; height:auto;">`);
                    };
                });
            }

            renderOlympsList();

            const addBtn = document.getElementById('add-olymp-btn');
            if (addBtn) {
                addBtn.onclick = () => {
                    currentOlymps.push({
                        name: olympList[0],
                        subject: subjectList[0],
                        grade: "8",
                        stage: "municipal",
                        status: "prizewinner",
                        image: ""
                    });
                    localStorage.setItem('portfolio_olymps_v5', JSON.stringify(currentOlymps));
                    renderOlympsList();
                    drawCrispRadar('skills-radar');
                };
            }

            // Чипы навыков
            const chipsBox = document.getElementById('tech-chips');
            function renderChips() {
                if (!chipsBox) return;
                chipsBox.innerHTML = '';
                availableTech.forEach(tech => {
                    const sel = currentStack.includes(tech);
                    const chip = document.createElement('button');
                    chip.type = 'button';
                    chip.textContent = tech;
                    chip.style.cssText = `
                        padding: 4px 9px; border-radius: 14px; font-size: 11px; font-weight: 600; cursor: pointer;
                        border: 1px solid ${sel ? 'var(--accent-blue)' : 'var(--border-color)'};
                        background: ${sel ? 'rgba(59, 130, 246, 0.25)' : '#090e18'};
                        color: ${sel ? '#fff' : 'var(--text-muted)'};
                    `;
                    chip.onclick = () => {
                        if (currentStack.includes(tech)) {
                            currentStack = currentStack.filter(t => t !== tech);
                        } else {
                            currentStack.push(tech);
                        }
                        localStorage.setItem('portfolio_stack_v5', JSON.stringify(currentStack));
                        renderChips();
                        drawCrispRadar('skills-radar');
                    };
                    chipsBox.appendChild(chip);
                });
            }

            renderChips();
            drawCrispRadar('skills-radar');

            const saveBtn = document.getElementById('save-all-btn');
            if (saveBtn) {
                saveBtn.onclick = () => {
                    localStorage.setItem('portfolio_name_v5', document.getElementById('input-name').value);
                    localStorage.setItem('portfolio_grade_v5', document.getElementById('input-grade').value);
                    localStorage.setItem('portfolio_school_v5', document.getElementById('input-school').value);
                    localStorage.setItem('portfolio_proj_title_v5', document.getElementById('input-proj-title').value);
                    localStorage.setItem('portfolio_proj_desc_v5', document.getElementById('input-proj-desc').value);
                    localStorage.setItem('portfolio_motivation_v5', document.getElementById('input-motivation').value);
                    localStorage.setItem('portfolio_olymps_v5', JSON.stringify(currentOlymps));

                    const s = document.getElementById('save-status');
                    if (s) {
                        s.style.display = 'block';
                        setTimeout(() => s.style.display = 'none', 2000);
                    }
                };
            }

            const previewBtn = document.getElementById('preview-styled-portfolio-btn');
            if (previewBtn) previewBtn.onclick = showInPageSheet;

            const pureBtn = document.getElementById('export-pure-txt-btn');
            if (pureBtn) pureBtn.onclick = exportPureTxt;

            const reportBtn = document.getElementById('export-report-txt-btn');
            if (reportBtn) reportBtn.onclick = exportReportTxt;

        // Вкладка 2: Навигатор школ
        } else if (tabIndex === '2') {
            const userStack = getSavedStack();

            contentCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <h2>Навигатор профильных школ (C++ WASM)</h2>
                        <p style="margin-bottom: 0;">Расчёт совместимости с учетом выбранного профильного вектора:</p>
                    </div>
                    <span id="wasm-status-badge" style="font-size: 11px; padding: 4px 8px; border-radius: 8px; background: rgba(16, 185, 129, 0.15); color: ${wasmActive ? '#10b981' : 'var(--text-muted)'}; border: 1px solid rgba(16, 185, 129, 0.35);">
                        ${wasmActive ? '● WASM C++ Ядро активно' : '● Алгоритмический расчет'}
                    </span>
                </div>

                <div id="schools-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
            `;

            const list = document.getElementById('schools-list');
            const ranked = schoolsData
                .map(s => ({ ...s, matchScore: calculateMatch(s) }))
                .sort((a, b) => b.matchScore - a.matchScore);

            ranked.forEach(school => {
                const card = document.createElement('div');
                card.style.cssText = "background: var(--card-inner); border: 1px solid var(--border-color); padding: 12px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; gap: 12px;";

                const badges = school.requiredTech.map(t => {
                    const m = userStack.includes(t);
                    return `<span style="display: inline-block; padding: 2px 6px; border-radius: 5px; font-size: 10px; margin-right: 4px; background: ${m ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.05)'}; color: ${m ? '#fff' : 'var(--text-muted)'}; border: 1px solid ${m ? 'var(--accent-blue)' : 'transparent'};">${t}</span>`;
                }).join('');

                card.innerHTML = `
                    <div style="flex: 1;">
                        <h3 style="font-size: 14px; color: #f0f4f8; margin-bottom: 3px;">${school.name}</h3>
                        <p style="font-size: 12px; color: var(--accent-blue); margin-bottom: 4px;">${school.profile} • Проходной: ${school.minScore}</p>
                        <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">${school.description}</p>
                        <div>${badges}</div>
                    </div>
                    <div style="min-width: 58px; height: 58px; border-radius: 50%; border: 3px solid ${school.matchScore >= 80 ? 'var(--accent-blue)' : '#64748b'}; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(59, 130, 246, 0.1);">
                        <span style="font-size: 13px; font-weight: 700; color: #fff;">${school.matchScore}%</span>
                        <span style="font-size: 8px; color: var(--text-muted);">C++ WASM</span>
                    </div>
                `;
                list.appendChild(card);
            });
        }
    }

    renderTab('1');
    buttons.forEach(btn => {
        btn.onclick = () => renderTab(btn.getAttribute('data-tab'));
    });
});
