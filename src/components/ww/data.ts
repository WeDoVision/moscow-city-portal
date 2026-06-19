/**
 * Контент полного клона главной whitewill.ru.
 * Тексты/ссылки/изображения сняты с боевого whitewill.ru (server-rendered HTML)
 * и захардкожены здесь, чтобы корень визуально совпадал 1:1 с оригиналом.
 * Фото берём прямо с CDN whitewill (cdn.ww.estate разрешён в next.config).
 */

const CDN = "https://cdn.ww.estate/tp/s/whitewill.ru";

/** хелпер: добавить ?width= к картинке CDN */
export const img = (url: string, width?: number) =>
  width ? `${url}${url.includes("?") ? "&" : "?"}width=${width}` : url;

export const AGENCY = {
  name: "Whitewill",
  legal: "Агентство элитной недвижимости",
  phones: [
    { label: "+7 (495) 255-01-61", href: "tel:+74952550161" },
    { label: "+7 (499) 877-49-39", href: "tel:+74998774939" },
  ],
  email: "info@whitewill.ru",
  site: "https://whitewill.ru/",
};

export const NAV = [
  { title: "Новостройки", href: "https://whitewill.ru/developments" },
  { title: "Готовые квартиры", href: "https://whitewill.ru/buy" },
  { title: "Аренда квартир", href: "https://whitewill.ru/rent" },
  { title: "Загородная", href: "https://whitewill.ru/country-property/buy" },
  { title: "Коммерческая", href: "https://whitewill.ru/commercial-property" },
  { title: "Особняки", href: "https://whitewill.ru/mansions" },
  { title: "Агентство", href: "https://whitewill.ru/about" },
];

export const HERO = {
  bg: `${CDN}/uploads/common_pages/1/main.team_bg/komanda-3_1739363065.png`,
  titleTop: "эксперты",
  titleMid: "по недвижимости",
  badge: "ТОП 13 первых мест за 2024 год",
  cup: `${CDN}/images/illustrations/cup.png`,
  photoLabel: "Фото партнёров Whitewill",
  text:
    "Помогаем людям купить квартиру и апартаменты в новых жилых комплексах центра Москвы, коммерческую недвижимость и особняки, а также дома в элитных посёлках Подмосковья.",
};

export const TILES = [
  { title: "Новостройки", bg: `${CDN}/images/tile-categories/bg1.png`, href: "https://whitewill.ru/developments" },
  { title: "Готовые квартиры", bg: `${CDN}/images/tile-categories/bg2.png`, href: "https://whitewill.ru/buy?filters=is_secondary%2Fbool_filter%7C1" },
  { title: "Аренда квартир", bg: `${CDN}/images/tile-categories/bg3.png`, href: "https://whitewill.ru/rent" },
  { title: "Коммерческая недвижимость", bg: `${CDN}/images/tile-categories/bg4.png`, href: "https://whitewill.ru/commercial-property" },
  { title: "Загородная недвижимость", bg: `${CDN}/images/tile-categories/bg5.png`, href: "https://whitewill.ru/country-property/buy" },
  { title: "Особняки и усадьбы", bg: `${CDN}/images/tile-categories/mansion.png`, href: "https://whitewill.ru/mansions" },
];

export const LEAD_CARDS = [
  { title: "Продать недвижимость", img: `${CDN}/images/illustrations/lead-sale.png`, href: "https://whitewill.ru/sell" },
  { title: "Сдать недвижимость", img: `${CDN}/images/illustrations/lead-rent.png`, href: "https://whitewill.ru/lease" },
];

export const BEST_OFFERS = {
  subtitle:
    "Подборка лучших предложений этой недели — выбор новостроек от Whitewill, новые старты продаж и квартиры в аренду.",
  complexes: [
    {
      label: "Жилой квартал",
      title: "Republic",
      desc: "Квартал, где история встречается с современностью.",
      info: "Квартиры от 35 290 000 ₽ · от 26 м²",
      img: `${CDN}/uploads/common_pages/1/best_offers.moscow_best_offers.moscow_1.image/repablik_1750264452.png`,
      href: "https://whitewill.ru/developments/republic",
    },
    {
      label: "Жилой комплекс",
      title: "Primavera",
      desc: "Квартиры от 26 500 000 ₽",
      info: "",
      img: `${CDN}/uploads/common_pages/1/best_offers.moscow_best_offers.moscow_2.image/primavera_1750265066.png`,
      href: "https://whitewill.ru/developments/primavera",
    },
    {
      label: "Жилой комплекс",
      title: "Shift",
      desc: "Жилой комплекс премиум-класса в Донском районе.",
      info: "Квартиры от 44 430 000 ₽ · от 45 м²",
      img: `${CDN}/uploads/common_pages/1/best_offers.moscow_best_offers.moscow_3.image/shift_1750265442.png`,
      href: "https://whitewill.ru/developments/shift",
    },
  ],
  lots: [
    {
      label: "Квартира в аренду",
      lot: "5135",
      title: "Видовые апартаменты в «Москва-Сити»",
      info: "1 спальня · 700 000 ₽/месяц",
      img: `${CDN}/uploads/common_pages/1/best_offers.moscow_best_offers.moscow_4.image/image-1-6_1781088309.jpeg`,
      href: "https://whitewill.ru/lots/show/rent/2242",
    },
    {
      label: "Квартира",
      lot: "300124",
      title: "Квартира с готовой отделкой рядом с парком «Усадьба Трубецких»",
      info: "2 спальни · 190 000 000 ₽ · 107 м²",
      img: `${CDN}/uploads/common_pages/1/best_offers.moscow_best_offers.moscow_5.image/interior_181_1750268099.jpg`,
      href: "https://whitewill.ru/lots/show/102803",
    },
    {
      label: "Квартира",
      lot: "313826",
      title: "Видовая квартира в стиле современной классики",
      info: "3 спальни · 74 000 000 ₽ · 96 м²",
      img: `${CDN}/uploads/common_pages/1/best_offers.moscow_best_offers.moscow_6.image/image-1-3_1775489573.jpeg`,
      href: "https://whitewill.ru/lots/show/114459",
    },
  ],
};

export const CATALOG = {
  title: "Авторские каталоги недвижимости",
  subtitle: "Выберите и скачайте pdf-каталог с лучшими предложениями компании.",
  cover: `${CDN}/uploads/common_pages/1/catalogs.img/catalogue-moscow-ru_1739874249.png`,
  previews: [
    `${CDN}/uploads/complexes/26/complex_preview/01_1776954367.jpg`,
    `${CDN}/uploads/complexes/37/complex_preview/1684923006_977.jpg`,
    `${CDN}/uploads/complexes/52/complex_preview/1671617114_4_1731932738.jpg`,
    `${CDN}/uploads/complexes/55/complex_preview/arch-01-kopiya_1772626666.jpg`,
    `${CDN}/uploads/complexes/90/complex_preview/1671102441_a11.jpg`,
    `${CDN}/uploads/complexes/155/complex_preview/1691588624_02.jpg`,
    `${CDN}/uploads/complexes/429/complex_preview/dvor-park-4_1747925140.jpg`,
  ],
};

export const AWARDS = {
  subtitle: "Ежегодно занимаем первые места по продажам у ключевых застройщиков Москвы.",
  items: [
    { desc: "Первое место по продажам за 2024 год в Capital Group", logo: `${CDN}/uploads/awards/68/photo/logo-capital_1738662733.svg` },
    { desc: "Лидер по продажам в Sminex за 2024 год", logo: `${CDN}/uploads/awards/67/photo/logo-sminex_1738662544.svg` },
    { desc: "Первое место в Pioneer за 2024 год среди всех агентств", logo: `${CDN}/uploads/awards/65/photo/logo-pioneer_1738662468.svg` },
    { desc: "Лидер по продажам в Optima Development за 2024 год", logo: `${CDN}/uploads/awards/64/photo/logo-optima_1738662440.svg` },
    { desc: "Первое место в Hutton Development за 2024 год", logo: `${CDN}/uploads/awards/63/photo/logo-hutton_1738662398.svg` },
  ],
};

export const RATINGS = [
  { platform: "Whitewill", icon: `${CDN}/images/icons/whitewill.svg`, score: "5.0", count: "24 оценки" },
  { platform: "Google", icon: `${CDN}/images/icons/google.svg`, score: "4.9", count: "129 оценок" },
  { platform: "Яндекс", icon: `${CDN}/images/icons/yandex.svg`, score: "4.9", count: "357 оценок" },
];

export const REVIEWS = [
  { name: "Ирина Б.", text: "Благодарны Елене Гайнулиной за отличную работу и профессионализм, за полное сопровождение сделки, за ответы на все вопросы, за то, что была на связи 24/7. Мы максимально довольны процессом выбора квартиры, коммуникацией и результатом." },
  { name: "Игорь", text: "Здорово, когда испытываешь удовольствие от того, чем занимаешься! Я с удовольствием выбрал и купил квартиру вместе с Whitewill, с выбором и оформлением мне помогла брокер Рамиля. Аккуратно и ненавязчиво Рамиля провела на всех этапах." },
  { name: "Владислав", text: "Впервые работаю с такой профессиональной компанией! Хочу очень поблагодарить Анну Шейкину, которая от начала до конца вела сделку, помогала по всем вопросам, вела беседы и с застройщиком и с банком, была на связи." },
  { name: "Инна", text: "Первый раз я работала с агентством Whitewill, непосредственно с Алексеем Бурмистровым. Я человек взрослый, со многими агентствами и людьми работала в этой области. Мне есть с чем сравнить. Хочется сказать огромное спасибо." },
  { name: "Рада", text: "Хочу выразить огромную благодарность Шариповой Ольге! Выбор квартиры был не простым. Нужно было закрыть множество пожеланий. Разумные аргументы и искренняя вовлечённость сделали своё дело." },
  { name: "Дмитрий", text: "Был в офисе компании и увидел как встречают клиентов: как сотрудники помогают снять верхнюю одежду, предложили горячие напитки, проводили в уютные переговорные. С порога ощущаешь, что компания заботится." },
];

export const QUALITY = {
  title: "Оцените качество работы эксперта и компании",
  text: "Вы можете оставить анонимный отзыв про оказанные услуги или работу брокера нашему отделу контроля качества.",
  cta: "Оставить отзыв",
  person: "Роман Широких",
  position: "отдел контроля качества",
  photo: `${CDN}/images/illustrations/forms/roman_shirokih.png`,
  bookshelf: `${CDN}/images/illustrations/forms/bookshelf.png`,
  lamp: `${CDN}/images/illustrations/forms/lamp.png`,
};

export const PARTNER = {
  title: "Своя платформа для партнёров",
  text: "Передавайте клиентов через партнёрскую систему, как это делают 5000 партнёров по всему миру. Следите за статусами сделки в режиме реального времени, получайте регулярные отчёты и своё вознаграждение.",
  cta: "Стать партнёром",
  ipad: `${CDN}/uploads/common_pages/33/base-settings.partners_portal_photo/rxorlvzahwuvf8rv_1739783032.png`,
  cup: `${CDN}/images/illustrations/cup.png`,
};

export const OFFICES = [
  {
    city: "Москва",
    address: "Пресненская набережная, 6с2, башня «Империя», 3-й подъезд, офис 4315",
    phone: "+7 (495) 255-01-61",
  },
  {
    city: "Рублёвка",
    address: "Рублёво-Успенское шоссе, Усово, 100, ДЦ «Резиденция на Рублёвке», Блок В",
    phone: "+7 (499) 877-49-39",
  },
  {
    city: "Санкт-Петербург",
    address: "Каменноостровский проспект 56 к2",
    phone: "+7 (812) 214-19-19",
  },
];

export const FOOTER_MENU = {
  title: "Агентство",
  links: [
    { label: "Застройщикам", href: "https://whitewill.ru/developers" },
    { label: "Партнёрам", href: "https://whitewill.ru/partners" },
    { label: "Передать клиента", href: "https://whitewill.ru/partners" },
    { label: "Академия", href: "https://whitewill.ru/academy" },
    { label: "Вакансии", href: "https://whitewill.ru/vacancies" },
    { label: "Команда", href: "https://whitewill.ru/team" },
    { label: "Блог", href: "https://whitewill.ru/blog" },
    { label: "История", href: "https://whitewill.ru/history" },
  ],
};

export const PROJECTS = {
  subtitle:
    "Мы собрали лучшую жилую и коммерческую недвижимость Москвы на тематических порталах и маркетплейсах компании.",
  items: [
    { name: "КупитеКвартиру.com", bg: `${CDN}/uploads/projects/1/background/kupitekvartiru-fon.png`, logo: `${CDN}/uploads/projects/1/logo/home_logo_1663572549.svg`, href: "https://kupitekvartiru.com/" },
    { name: "kypitedom.com", bg: `${CDN}/uploads/projects/2/background/kupitedom2_1745434865.png`, logo: `${CDN}/uploads/projects/2/logo/kupitedom_1745434722.svg`, href: "https://kypitedom.com" },
    { name: "Арендатор.moscow", bg: `${CDN}/uploads/projects/3/background/arendator-fon.png`, logo: `${CDN}/uploads/projects/3/logo/logo-arendator.svg`, href: "https://arendator.moscow/" },
    { name: "Особняки", bg: `${CDN}/uploads/projects/4/background/osobnyaki-fon.png`, logo: `${CDN}/uploads/projects/4/logo/logo-osobnyaki.svg`, href: "https://osobnyaki.com/" },
    { name: "на Патриарших", bg: `${CDN}/uploads/projects/5/background/napatriarshih-fon.png`, logo: `${CDN}/uploads/projects/5/logo/na-patriarshih-logo.svg`, href: "https://napatriarshih.com/" },
    { name: "moscowcitysale.ru", bg: `${CDN}/uploads/projects/6/background/moskva-siti-fon.png`, logo: "", href: "https://moscowcitysale.ru/" },
  ],
};

export const OFFICE = {
  tabs: ["Москва", "Рублёвка"],
  photos: [
    `${CDN}/uploads/offices/1/office_image/ofis-msk-4_1745435043.png`,
    `${CDN}/uploads/offices/1/office_image/ofis-msk-5_1745435043.png`,
    `${CDN}/uploads/offices/1/office_image/ofis-msk-6_1745435043.png`,
    `${CDN}/uploads/offices/1/office_image/ofis-msk-3_1745435104.png`,
    `${CDN}/uploads/offices/2/office_image/ofis-zagorodka-2_1745435189.png`,
    `${CDN}/uploads/offices/2/office_image/ofis-zagorodka-3_1745435190.png`,
  ],
  leavesLeft: `${CDN}/images/illustrations/office-leaves-left.png`,
  leavesRight: `${CDN}/images/illustrations/office-leaves-right.png`,
};

export const BLOG = [
  { title: "Рейтинг детских садов Москвы", img: `${CDN}/uploads/articles/24/photo/reiting-detskih-sadov_1761908036.png` },
  { title: "Самые перспективные районы Москвы", img: `${CDN}/uploads/articles/27/photo/raiony_1761908586.png` },
  { title: "Как выбрать планировку квартиры в Москве", img: `${CDN}/uploads/articles/29/photo/kak-vybrat-planirovku_1763009519.png` },
  { title: "«Золотой» – элитный дом на Балчуге", img: `${CDN}/uploads/articles/1045/photo/1-5255815694627500455_1755521900.jpg` },
  { title: "Понятие, виды и классификация сделок с недвижимостью", img: `${CDN}/uploads/articles/1120/photo/frame-5729_1765200374.png` },
];

export const NEWS = {
  subtitle:
    "Актуальные новости, ключевые события и тренды, а также всё, что важно знать о рынке премиальной недвижимости.",
  items: [
    { date: "2026-06-03", tag: "новостройки", title: "ЖК «Сторис» на Мосфильмовской получил ЗОС", text: "Флагманский проект OCTOBER GROUP под названием «Сторис» получил заключение о соответствии." },
    { date: "2026-06-05", tag: "новостройки", title: "Умные дома переходят на новый уровень: почему интеграция важнее количества опций", text: "Главное в умном доме сегодня — уже не число функций, а то, как быстро и слаженно они работают." },
    { date: "2026-06-09", tag: "новостройки", title: "BMS Development презентовал проект на «Минской»", text: "На месте ТПУ «Минская» появится многофункциональный комплекс высотой 33 этажа." },
    { date: "2026-06-06", tag: "аналитика", title: "Продали пентхаус в «Саввин Ривер Резиденс» за ₽800 миллионов", text: "Очередная рекордная сделка Whitewill на рынке премиальной недвижимости столицы." },
    { date: "2026-06-08", tag: "новостройки", title: "Золотые Хамовники — цена за метр в пентхаусах превысила 10 миллионов", text: "Хамовники продолжают удерживать статус самой дорогой локации Москвы." },
    { date: "2026-06-02", tag: "сделки", title: "Пульс сделок — продали на 3 миллиарда", text: "Итоги недели: команда Whitewill закрыла сделок на сумму более трёх миллиардов рублей." },
  ],
};

export const SOC = [
  { name: "Telegram", icon: `${CDN}/images/icons/telegram.svg`, href: "#" },
  { name: "WhatsApp", icon: `${CDN}/images/icons/whatsapp.svg`, href: "#" },
  { name: "VK", icon: `${CDN}/images/icons/vk.svg`, href: "#" },
  { name: "Дзен", icon: `${CDN}/images/icons/dzen.svg`, href: "#" },
];
