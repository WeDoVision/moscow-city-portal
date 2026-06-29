/**
 * Контент клона osobnyaki.com — каталог особняков и отдельно стоящих зданий
 * Москвы. Факты (бренд, контакты, числа, команда, подборки, блог) сверены с
 * оригиналом osobnyaki.com. Визуальный язык переосмыслен в тёплой
 * editorial-эстетике (кремовый фон, антиква, бронзовый акцент).
 *
 * Все фото — реальные снимки с osobnyaki.com (обычные <img>, мимо next/image),
 * под каждым лежит градиент-плейсхолдер на случай сетевого сбоя.
 */

export const brand = {
  name: "osobnyaki.com",
  logoTop: "osobnyaki",
  logoDot: ".com",
  tagline: "Все особняки Москвы",
  phone: "+7 (495) 320-95-45",
  phoneHref: "tel:+74953209545",
  email: "info@osobnyaki.com",
  address: "Москва, Пресненская набережная, 6с2, башня «Империя», офис 4315",
  hours: "Сейчас работаем",
  // реальный WhatsApp с оригинала osobnyaki.com
  whatsapp:
    "https://api.whatsapp.com/send?phone=79296021757&text=" +
    encodeURIComponent("Здравствуйте! Интересует особняк в Москве."),
  // число реально доступных объектов из живого API (mansions). На самом
  // osobnyaki.com headline-счётчик больше (944) — там собственная база.
  found: 429,
};

export const nav = [
  {
    label: "Купить",
    items: [
      { label: "Особняки в продаже", href: "#catalog", note: "от собственника" },
      { label: "Городские усадьбы", href: "#collections", note: "для жизни" },
      { label: "Памятники архитектуры", href: "#catalog", note: "ОКН" },
      { label: "С земельным участком", href: "#catalog", note: "с территорией" },
    ],
  },
  {
    label: "Аренда",
    items: [
      { label: "Аренда особняков", href: "#catalog", note: "особняки и здания" },
      { label: "Под офис / штаб-квартиру", href: "#catalog", note: "представительства" },
      { label: "Под ресторан и ритейл", href: "#catalog", note: "трафиковые места" },
      { label: "Под клинику и бьюти", href: "#catalog", note: "лицензируемые" },
    ],
  },
  {
    label: "Услуги",
    items: [
      { label: "Подбор за 25 минут", href: "#expert", note: "бесплатно, 2–5 особняков" },
      { label: "Продать особняк", href: "#sell", note: "от собственника" },
      { label: "Реставрация и ОКН", href: "#blog", note: "сопровождение" },
      { label: "Юридическая проверка", href: "#expert", note: "due diligence" },
    ],
  },
  {
    label: "О проекте",
    items: [
      { label: "Команда", href: "#team", note: "эксперты проекта" },
      { label: "Журнал особняков", href: "#magazine", note: "PDF, обновление" },
      { label: "Блог", href: "#blog", note: "истории и гиды" },
      { label: "Контакты", href: "#footer", note: "горячая линия" },
    ],
  },
];

/** Крупные метрики под героем — только проверяемые факты с оригинала. */
export const stats = [
  { value: "400+", label: "особняков в каталоге" },
  { value: "0 ₽", label: "комиссия для покупателя" },
  { value: "25 мин", label: "подбор 2–5 особняков" },
  { value: "58", label: "районов Москвы" },
];

/** Главный лот в герое — реальный объект с оригинала (лот №2728). */
export const heroLot = {
  badge: "Предложение недели",
  title: "Особняк на Спартаковской площади, 14",
  meta: "Бауманская · 1 775 м² · 4 этажа",
  price: "330 000 000 ₽",
  perM: "185 915 ₽/м²",
  img: "https://osobnyaki.com/assets/images/products/4564/1770318387-6984ea33e829f-spartakovskaya-ploshchad-14s2.png",
  model: "/osobnyaki/models/spartakovskaya.glb",
};

/** Лента районов центра — бегущая строка доверия. */
export const districts = [
  "Арбат",
  "Остоженка",
  "Хамовники",
  "Замоскворечье",
  "Тверской",
  "Басманный",
  "Пресненский",
  "Мещанский",
  "Таганский",
  "Красносельский",
];

/**
 * Карточки каталога — реальные лоты с оригинала osobnyaki.com
 * (номера лотов, площади, цены и аренда совпадают с порталом).
 */
export const listings = [
  {
    id: 2483,
    title: "Особняк на Большой Почтовой, 36",
    metro: "Электрозаводская",
    area: "2 035 м²",
    floors: "5 этажей",
    price: "750 000 000 ₽",
    perM: "368 550 ₽/м²",
    rent: "6 500 000 ₽/мес",
    tag: "Продажа · аренда",
    img: "https://osobnyaki.com/assets/images/products/4266/1763858628-692258c457128-bolshaya-pochtovaya-36s1.png",
  },
  {
    id: 1986,
    title: "Особняк на Гончарной набережной, 3",
    metro: "Таганская",
    area: "1 044 м²",
    floors: "2 этажа",
    price: "490 000 000 ₽",
    perM: "469 348 ₽/м²",
    rent: null,
    tag: "Продажа",
    img: "https://osobnyaki.com/assets/images/products/4633/1652888191-146.png",
  },
  {
    id: 2189,
    title: "Особняк в Романовом переулке, 3",
    metro: "Библиотека им. Ленина",
    area: "157 м²",
    floors: "3 этажа",
    price: "190 000 000 ₽",
    perM: "1 210 191 ₽/м²",
    rent: "900 000 ₽/мес",
    tag: "Продажа · аренда",
    img: "https://osobnyaki.com/assets/images/products/3981/1685977323-romanov-pereulok-3s2.png",
  },
];

/** Сортировки каталога. */
export const sorts = ["По цене", "По площади", "По дате добавления", "Сначала ОКН"];

/**
 * Авторские подборки особняков — стопка карточек со скролл-эффектом (как
 * pieterkoopt). Названия и счётчики совпадают с одноимёнными подборками
 * оригинального портала osobnyaki.com (по назначению).
 */
export const collections = [
  {
    kicker: "Авторская подборка",
    title: "Городские усадьбы для жизни",
    tag: "Для жизни",
    count: "31 особняк",
    desc: "Отдельно стоящие особняки под частную резиденцию — тихие переулки, свой двор и историческая архитектура.",
    img: "https://osobnyaki.com/assets/images/usadba.png",
    model: "/osobnyaki/models/usadba.glb",
  },
  {
    kicker: "Авторская подборка",
    title: "Особняки под ресторан",
    tag: "Под ресторан",
    count: "11 объектов",
    desc: "Здания с трафиком и отдельным входом под ресторан или кафе.",
    img: "https://osobnyaki.com/assets/images/products/4653/1766519803-694af3fb8bdcc-myasnitskaya-ulitsa-42s3.png",
    model: "/osobnyaki/models/restoran.glb",
  },
  {
    kicker: "Авторская подборка",
    title: "Особняки под отель",
    tag: "Под отель",
    count: "34 объекта",
    desc: "Просторные особняки под бутик-отель или апарт-формат.",
    img: "https://osobnyaki.com/assets/images/products/4447/1744826511-67fff08f7042b-volhovskiy-pereulok-16-20s1.png",
    model: "/osobnyaki/models/otel.glb",
  },
  {
    kicker: "Авторская подборка",
    title: "Особняки под клинику",
    tag: "Под клинику",
    count: "31 объект",
    desc: "Помещения под лицензируемую медицину — с подходящей планировкой и парковкой во дворе.",
    img: "https://osobnyaki.com/assets/images/products/4651/1766037618-69439872a9336-2-y-samotechny-pereulok-3.png",
    model: "/osobnyaki/models/klinika.glb",
  },
];

/** Команда проекта. */
export const team = [
  {
    name: "Ирина",
    role: "Руководитель проекта",
    note: "Ведёт проект и ключевые сделки",
    img: "https://osobnyaki.com/assets/images/irina-1.png",
  },
  {
    name: "Альберт",
    role: "Эксперт",
    note: "Подбор и проверка особняков",
    img: "https://osobnyaki.com/albert.jpg",
  },
  {
    name: "Артур",
    role: "Эксперт",
    note: "Аренда и коммерческие объекты",
    img: "https://osobnyaki.com/artyr300.jpg",
  },
];

/** Облака навигации по каталогу. */
export const browse = {
  purpose: {
    title: "По назначению",
    tags: [
      "под реконструкцию",
      "банк",
      "отель",
      "представительство",
      "бизнес-центр",
      "клиника",
      "офис",
      "ресторан",
      "хостел",
      "посольство",
      "гостиница",
      "усадьба",
    ],
  },
  district: {
    title: "По районам",
    tags: [
      "Басманный",
      "Замоскворечье",
      "Мещанский",
      "Таганский",
      "Хамовники",
      "Арбат",
      "Остоженка",
      "Пресненский",
      "Тверской",
      "Красносельский",
    ],
  },
  type: {
    title: "По типу",
    tags: [
      "без ремонта",
      "реконструкция",
      "с территорией",
      "с ремонтом",
      "ОКН",
      "таунхаусы",
      "виллы",
      "усадьбы",
    ],
  },
};

/** Журнал. */
export const magazine = {
  title: "Скачайте журнал с лучшими особняками июня",
  desc: "Новые объекты, специальные цены от собственников, идеи реставрации и советы экспертов — в одном PDF.",
  size: "23,71 МБ",
  updated: "выпуск июня",
  // реальное фото особняка с osobnyaki.com вместо стокового
  cover:
    "https://osobnyaki.com/assets/images/products/4447/1744826511-67fff08f7042b-volhovskiy-pereulok-16-20s1.png",
};

/** Блог. */
/** Реальные статьи блога osobnyaki.com (заголовки и фото — с оригинала). */
export const posts = [
  {
    tag: "Усадьбы",
    title: "Усадьба Варвары Морозовой на Воздвиженке",
    href: "https://osobnyaki.com/blog/osobnyak-varvary-morozovoy",
    img: "https://osobnyaki.com/assets/components/phpthumbof/cache/article_4544_main_image_20250911_114330.3c915ef804c33374ab8b4125f8f3ec9f4544.jpg",
  },
  {
    tag: "История",
    title: "Петровский пассаж в Москве",
    href: "https://osobnyaki.com/blog/petrovskiy-passazh-v-moskve",
    img: "https://osobnyaki.com/assets/components/phpthumbof/cache/article_4506_main_image_20250703_131158.3c915ef804c33374ab8b4125f8f3ec9f4506.jpg",
  },
  {
    tag: "Гид",
    title: "Как купить усадьбу в Москве? Пошаговый гид и советы по реставрации",
    href: "https://osobnyaki.com/blog/kak-kupit-usadbu-v-moskve",
    img: "https://osobnyaki.com/assets/components/phpthumbof/cache/article_4479_main_image_20250520_122710.3c915ef804c33374ab8b4125f8f3ec9f4479.jpg",
  },
];

export const footerCols = [
  {
    title: "Покупка",
    links: [
      { label: "Продажа зданий", href: "#catalog" },
      { label: "Городские усадьбы", href: "#collections" },
      { label: "Памятники архитектуры", href: "#catalog" },
      { label: "С участком", href: "#catalog" },
    ],
  },
  {
    title: "Аренда",
    links: [
      { label: "Аренда особняков", href: "#catalog" },
      { label: "Под офис", href: "#catalog" },
      { label: "Под ресторан", href: "#catalog" },
      { label: "Под клинику", href: "#catalog" },
    ],
  },
  {
    title: "Сервис",
    links: [
      { label: "Подбор за 25 минут", href: "#expert" },
      { label: "Продать особняк", href: "#sell" },
      { label: "Команда", href: "#team" },
      { label: "Блог", href: "#blog" },
    ],
  },
  {
    title: "Информация",
    links: [
      { label: "Журнал PDF", href: "#magazine" },
      { label: "Карта сайта", href: "#footer" },
      { label: "Политика конфиденциальности", href: "#footer" },
      { label: "Контакты", href: "#footer" },
    ],
  },
];
