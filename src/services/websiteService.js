// src/services/websiteService.js
// Central service for EDUCO LMS Public Website content & settings management

import { STORAGE_KEYS } from '@/lib/localStore';

const WEBSITE_KEYS = {
  SETTINGS: 'educo_db_website_settings',
  SLIDES: 'educo_db_website_slides',
  COURSES: 'educo_db_website_courses',
  SUBJECTS: 'educo_db_website_subjects',
  TEACHERS: 'educo_db_website_teachers',
  GALLERY: 'educo_db_website_gallery',
  VIDEOS: 'educo_db_website_videos',
  NEWS: 'educo_db_website_news',
  TESTIMONIALS: 'educo_db_website_testimonials',
};

// --- DEFAULT RICH REALISTIC CONTENT ---

export const DEFAULT_WEBSITE_SETTINGS = {
  site_name: 'EDUCO LMS',
  tagline: 'Kelajak kasblari va zamonaviy bilimlar akademiyasi',
  phone: '+998 (93) 610-17-74',
  secondary_phone: '+998 (90) 800-14-15',
  email: 'info@educo-lms.uz',
  address: 'Toshkent shahar, Yunusobod tumani, Amir Temur ko‘chasi, 107-B bino',
  working_hours: 'Dushanba - Shanba: 08:30 - 20:30',
  telegram: 'https://t.me/educo_lms',
  instagram: 'https://instagram.com/educo_lms',
  youtube: 'https://youtube.com/@educo_lms',
  facebook: 'https://facebook.com/educo.lms',
  stats_students: 1250,
  stats_teachers: 48,
  stats_courses: 24,
  stats_graduates: 3400,
  stats_rating: '4.9/5',
  hero_headline: 'Kelajak kasblarini EDUCO bilan birgalikda zabt eting!',
  hero_subheadline: 'IT dasturlash, zamonaviy dizayn, xorijiy tillar va aniq fanlar bo‘yicha xalqaro tajribaga ega ustozlardan amaliy bilim oling.',
  about_title: 'Biz haqimizda — EDUCO Ta’lim Ekotizimi',
  about_subtitle: 'Zamonaviy metodika, xalqaro tajriba va yuqori natijadorlik',
  about_description: 'EDUCO — bu ilg‘or xalqaro ta’lim standartlari asosida tashkil etilgan zamonaviy ta’lim ekotizimi. Biz har bir o‘quvchining individual iqtidorini kashf etish, chuqur amaliy ko‘nikmalar berish va zamonaviy IT hamda aniq fanlar sohasida yetakchi mutaxassis bo‘lib yetishishiga ko‘maklashamiz.',
  mission_title: 'Bizning Oliy Missiyamiz',
  mission_desc: 'Har bir yosh avlod vakiliga xalqaro standartlarga mos, amaliyotga yo‘naltirilgan zamonaviy ta’lim berish orqali ularni jahon miqyosidagi raqobatbardosh mutaxassisga aylantirish.',
  vision_title: 'Bizning Kelajak Viziyamiz',
  vision_desc: 'O‘zbekistondagi eng ilg‘or va texnologik ta’lim ekotizimi sifatida yangi avlod kadrlarini tayyorlashda yetakchi brendga aylanish.',
  cta_headline: 'Orzularingizdagi kasb sari ilk qadamni tashlang!',
  cta_subheadline: 'Hoziroq ro‘yxatdan o‘ting va 1-bepul sinov darsimizda qatnashing. Safimizga qo‘shiling!',
  footer_text: 'EDUCO LMS — zamonaviy o‘quv markazlari va talabalar uchun yagona innovatsion ta’lim boshqaruv platformasi.',
};

export const DEFAULT_WEBSITE_SLIDES = [
  {
    id: 'slide-1',
    title: 'Darslardan jonli lavhalar va amaliy mashg‘ulotlar',
    subtitle: 'Haqiqiy loyihalar ustida ishlash, zamonaviy iMac va i7 kompyuter sinflari, interaktiv muhit va jamoaviy darslar.',
    badge: 'Darslardan lavhalar',
    image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80',
    cta_text: 'Kurslarni ko‘rish',
    cta_link: '#courses',
    secondary_cta_text: 'Dars lavhalari',
    secondary_cta_link: '#gallery',
    is_active: true,
    order: 1,
  },
  {
    id: 'slide-2',
    title: 'Xalqaro sertifikatlarga ega professional ustozlar',
    subtitle: 'Google, EPAM va xalqaro IT kompaniyalarida ishlagan katta tajribaga ega ustoz-mentorlardan ta’lim oling.',
    badge: 'Professional ustozlar',
    image_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=80',
    cta_text: 'Ustozlar bilan tanishish',
    cta_link: '#teachers',
    secondary_cta_text: 'Biz haqimizda',
    secondary_cta_link: '#about',
    is_active: true,
    order: 2,
  },
  {
    id: 'slide-3',
    title: '98% natijadorlik va xalqaro sifat kafolati',
    subtitle: 'Har bir talabaning dars o‘zlashtirishini real-vaqt rejimida nazorat qiluvchi zamonaviy LMS monitoring tizimi.',
    badge: 'Sifatli ta’lim',
    image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=80',
    cta_text: 'Natijalarimiz',
    cta_link: '#stats',
    secondary_cta_text: 'Aloqa',
    secondary_cta_link: '#contact',
    is_active: true,
    order: 3,
  },
  {
    id: 'slide-4',
    title: 'Zamonaviy IT, Dizayn va Xorijiy tillar kurslari',
    subtitle: 'Frontend, Python, Grafik Dizayn, IELTS 8+, Robototexnika — barchasi noldan professional darajagacha.',
    badge: 'Barcha kurslar',
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    cta_text: 'Ro‘yxatdan o‘tish',
    cta_link: '#contact',
    secondary_cta_text: 'Kurslar katalogi',
    secondary_cta_link: '#courses',
    is_active: true,
    order: 4,
  },
];

export const DEFAULT_WEBSITE_COURSES = [
  {
    id: 'wc-1',
    title: 'Frontend Web Dasturlash',
    category: 'Dasturlash',
    duration: '6 oy',
    price: '850,000 so‘m/oy',
    level: 'Boshlang‘ich / O‘rta',
    lessons_count: 72,
    teacher_name: 'Abdulazizbek Orifjonov',
    image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    description: 'HTML5, CSS3, Tailwind CSS, JavaScript ES6+, React, Next.js, Git va Redux orqali zamonaviy veb-saytlar hamda interfeyslar yaratishni to‘liq o‘rganasiz.',
    is_featured: true,
    is_active: true,
    order: 1,
  },
  {
    id: 'wc-2',
    title: 'Python Backend & Sun‘iy Intellekt',
    category: 'Dasturlash',
    duration: '7 oy',
    price: '900,000 so‘m/oy',
    level: 'Boshlang‘ich / Katta',
    lessons_count: 84,
    teacher_name: 'Abbosbek Boshqaruvchi',
    image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    description: 'Python asoslari, Django, FastAPI, PostgreSQL, REST API, Docker va Sun‘iy Intellekt (AI/ML) integratsiyalarini o‘z ichiga olgan mukammal dastur.',
    is_featured: true,
    is_active: true,
    order: 2,
  },
  {
    id: 'wc-3',
    title: 'Grafik Dizayn & UI/UX',
    category: 'Dizayn',
    duration: '4 oy',
    price: '750,000 so‘m/oy',
    level: 'Boshlang‘ich',
    lessons_count: 48,
    teacher_name: 'Madinaxon Maxmudovna',
    image_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
    description: 'Adobe Photoshop, Illustrator, Figma, brending, logotip dizayni, veb va mobil ilovalar UI/UX dizaynini real keyslar asosida o‘rganing.',
    is_featured: true,
    is_active: true,
    order: 3,
  },
  {
    id: 'wc-4',
    title: 'Intensive English & IELTS (7.5+)',
    category: 'Xorijiy tillar',
    duration: '5 oy',
    price: '700,000 so‘m/oy',
    level: 'Barcha darajalar',
    lessons_count: 60,
    teacher_name: 'Jasurbek Aliyev',
    image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    description: 'General English, Speaking klublar, Listening mashqlari va IELTS imtihoniga yo‘naltirilgan maxsus intensiv darslar tizimi.',
    is_featured: true,
    is_active: true,
    order: 4,
  },
  {
    id: 'wc-5',
    title: 'Robototexnika & STEM Ta’lim',
    category: 'Muhandislik',
    duration: '4 oy',
    price: '800,000 so‘m/oy',
    level: 'Bolalar va O‘smirlar',
    lessons_count: 48,
    teacher_name: 'Otabek Shukurov',
    image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    description: 'Arduino, C++ mikrokontrollerlar dasturlash, elektron sxemalar, 3D modellashtirish va xalqaro robotlar musobaqasiga tayyorgarlik.',
    is_featured: true,
    is_active: true,
    order: 5,
  },
  {
    id: 'wc-6',
    title: 'Bolalar uchun IT Foundation',
    category: 'Bolalar akademiyasi',
    duration: '3 oy',
    price: '600,000 so‘m/oy',
    level: 'Boshlang‘ich (8-14 yosh)',
    lessons_count: 36,
    teacher_name: 'Nilufar Karimova',
    image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    description: 'Kompyuter savodxonligi, Scratch dasturlash, algoritmik fikrlash va kompyuter xavfsizligi asoslari qiziqarli o‘yin formatida.',
    is_featured: false,
    is_active: true,
    order: 6,
  },
];

export const DEFAULT_WEBSITE_SUBJECTS = [
  {
    id: 'sub-1',
    name: 'Dasturlash & IT',
    icon_name: 'Code',
    color: 'from-blue-600 to-indigo-600',
    description: 'Frontend, Backend, Sun‘iy intellekt va mobil ilovalar yaratish.',
    courses_count: 6,
    is_active: true,
    order: 1,
  },
  {
    id: 'sub-2',
    name: 'Xorijiy Tillar',
    icon_name: 'Globe',
    color: 'from-emerald-600 to-teal-600',
    description: 'Ingliz tili (IELTS, CEFR), Nemis tili va so‘zlashuv klublari.',
    courses_count: 4,
    is_active: true,
    order: 2,
  },
  {
    id: 'sub-3',
    name: 'Dizayn & Media',
    icon_name: 'Palette',
    color: 'from-purple-600 to-pink-600',
    description: 'Grafik dizayn, UI/UX interfeyslar, 3D grafika va brending.',
    courses_count: 3,
    is_active: true,
    order: 3,
  },
  {
    id: 'sub-4',
    name: 'Aniq Fanlar',
    icon_name: 'Calculator',
    color: 'from-amber-600 to-orange-600',
    description: 'Oliy matematika, mantiq, fizika va olimpiadalarga tayyorgarlik.',
    courses_count: 4,
    is_active: true,
    order: 4,
  },
  {
    id: 'sub-5',
    name: 'Robototexnika',
    icon_name: 'Cpu',
    color: 'from-cyan-600 to-blue-600',
    description: 'Arduino, avtomatlashtirish, mikrosxemalar va STEM muhandislik.',
    courses_count: 3,
    is_active: true,
    order: 5,
  },
  {
    id: 'sub-6',
    name: 'Bolalar Akademiyasi',
    icon_name: 'Sparkles',
    color: 'from-rose-600 to-red-600',
    description: 'Mental arifmetika, tez o‘qish, Scratch va mantiqiy fikrlash.',
    courses_count: 4,
    is_active: true,
    order: 6,
  },
];

export const DEFAULT_WEBSITE_TEACHERS = [
  {
    id: 'wt-1',
    full_name: 'Abbosbek Boshqaruvchi',
    role: 'Asoschi & Bosh IT Arxitektor',
    specialization: 'Python, Django, FastAPI & Sun‘iy Intellekt',
    experience_years: '7+ yil',
    bio: 'Xalqaro IT loyihalari arxitektori, 10 dan ortiq yirik tizimlar yaratuvchisi va yuzlab yosh dasturchilar ustozi.',
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    telegram: 'https://t.me/abbosbek',
    is_featured: true,
    is_active: true,
    order: 1,
  },
  {
    id: 'wt-2',
    full_name: 'Madinaxon Maxmudovna',
    role: 'Bosh Dizayner & Art-Direktor',
    specialization: 'UI/UX Dizayn, Figma, Brending & Tipografika',
    experience_years: '5+ yil',
    bio: 'Xalqaro mukofotlar sovrindori, 50 dan ortiq veb va mobil ilovalar interfeyslari muallifi, tajribali mentor.',
    image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    telegram: 'https://t.me/madinaxon',
    is_featured: true,
    is_active: true,
    order: 2,
  },
  {
    id: 'wt-3',
    full_name: 'Abdulazizbek Orifjonov',
    role: 'Senior Frontend Dasturchi & Texnik Rahbar',
    specialization: 'JavaScript, React, Next.js, Redux & Arxitektura',
    experience_years: '6+ yil',
    bio: 'Murakkab veb-ilovalarni optimallashtirish va keng miqyosli frontend tizimlarini qurish bo‘yicha ekspert.',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    telegram: 'https://t.me/abdulazizbek',
    is_featured: true,
    is_active: true,
    order: 3,
  },
  {
    id: 'wt-4',
    full_name: 'Jasurbek Aliyev',
    role: 'Bosh Ingliz Tili Ustozi',
    specialization: 'IELTS 8.5, Academic Writing & Fluency',
    experience_years: '6+ yil',
    bio: 'Cambridge CELTA sertifikatiga ega, 200 dan ortiq o‘quvchisi 7.0 dan yuqori IELTS ballini qo‘lga kiritgan mohir o‘qituvchi.',
    image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    telegram: 'https://t.me/jasurbek',
    is_featured: true,
    is_active: true,
    order: 4,
  },
];

export const DEFAULT_WEBSITE_GALLERY = [
  {
    id: 'gal-1',
    title: 'Dasturlash darsidagi jonli muhit',
    category: 'Darslar',
    image_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80',
    caption: 'O‘quvchilar frontend loyihalarini taqdimot qilish jarayonida.',
    date: '2026-10-25',
    is_active: true,
    order: 1,
  },
  {
    id: 'gal-2',
    title: 'Robototexnika amaliy laboratoriyasi',
    category: 'Laboratoriya',
    image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1000&q=80',
    caption: 'Avtonom harakatlanuvchi robot modelini sinovdan o‘tkazish.',
    date: '2026-10-20',
    is_active: true,
    order: 2,
  },
  {
    id: 'gal-3',
    title: 'Bitiruvchilarga xalqaro sertifikat topshirish',
    category: 'Tadbirlar',
    image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
    caption: 'Python Backend kursi bitiruvchilarining quvonchli lahzalari.',
    date: '2026-10-15',
    is_active: true,
    order: 3,
  },
  {
    id: 'gal-4',
    title: 'Grafik dizayn masterklassi',
    category: 'Masterklass',
    image_url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1000&q=80',
    caption: 'Zamonaviy UI/UX prototiplari bo‘yicha ochiq seminar.',
    date: '2026-10-10',
    is_active: true,
    order: 4,
  },
  {
    id: 'gal-5',
    title: 'Zamonaviy jihozlangan kompyuter zali',
    category: 'Infratuzilma',
    image_url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1000&q=80',
    caption: 'Yuqori tezlikdagi internet va qulay o‘quv o‘rinlari.',
    date: '2026-10-05',
    is_active: true,
    order: 5,
  },
  {
    id: 'gal-6',
    title: 'Ingliz tili Speaking klubi muhiti',
    category: 'Darslar',
    image_url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1000&q=80',
    caption: 'Chet ellik mehmonlar bilan jonli muloqot va amaliyot.',
    date: '2026-09-28',
    is_active: true,
    order: 6,
  },
];

export const DEFAULT_WEBSITE_VIDEOS = [
  {
    id: 'vid-1',
    title: 'EDUCO Ta’lim Markazi bilan 2 daqiqada tanishing',
    category: 'Tanishtiruv',
    duration: '02:35',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_id: 'dQw4w9WgXcQ',
    description: 'Markazimizning o‘quv xonalari, texnik imkoniyatlari va ustozlarimiz haqida qisqacha video lavha.',
    is_active: true,
    order: 1,
  },
  {
    id: 'vid-2',
    title: 'O‘quvchilarimizning xalqaro IT kompaniyalardagi muvaffaqiyatlari',
    category: 'Natijalar',
    duration: '04:12',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80',
    video_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    youtube_id: 'ScMzIvxBSi4',
    description: 'Kursni tamomlab hozirda nufuzli IT korxonalarida ishlayotgan bitiruvchilarimiz intervyusi.',
    is_active: true,
    order: 2,
  },
  {
    id: 'vid-3',
    title: 'Dasturlash darsida real loyihani himoya qilish jarayoni',
    category: 'Darslar',
    duration: '03:45',
    thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80',
    video_url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    youtube_id: 'L_LUpnjgPso',
    description: 'Frontend va Backend kursimiz talabalari o‘zlari tayyorlagan LMS tizimini himoya qilishmoqda.',
    is_active: true,
    order: 3,
  },
];

export const DEFAULT_WEBSITE_NEWS = [
  {
    id: 'news-1',
    title: 'EDUCO yangi o‘quv mavsumi va grant o‘rinlari uchun qabul boshladi',
    slug: 'yangi-oquv-mavsumi-qabul-2026',
    category: 'Qabul va Yangiliklar',
    excerpt: 'Markazimiz yangi o‘quv yili uchun barcha yo‘nalishlarda ro‘yxatga olishni rasman ochiq deb e’lon qildi.',
    content: `EDUCO Ta’lim Markazi 2026-yilgi yangi o‘quv mavsumi munosabati bilan barcha yoshlar uchun IT dasturlash, grafik dizayn, xorijiy tillar va robototexnika sohalarida kengaytirilgan qabulni boshladi.\n\nUshbu mavsumda eng iqtidorli 50 nafar o‘quvchi uchun 100% va 50% li grant o‘rinlari ajratilgan. Grant imtihoni mantiqiy fikrlash va matematika bo‘yicha o‘tkaziladi.\n\nBarcha xonalarda yangi avlod kompyuterlari o‘rnatildi va o‘quv dasturlari jahon andozalari asosida yangilandi.`,
    cover_image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
    published_at: '2026-10-28',
    views: 480,
    is_published: true,
    order: 1,
  },
  {
    id: 'news-2',
    title: 'Talabalarimiz xalqaro dasturlash hakatonida faxrli 1-o‘rinni egalladi',
    slug: 'hakaton-1-orin-goliblik',
    category: 'Yutuqlarimiz',
    excerpt: 'Frontend va Python kurslarimiz o‘quvchilaridan iborat jamoa 48 soatlik nufuzli IT hakatonida g‘olib bo‘ldi.',
    content: `O‘tgan haftada bo‘lib o‘tgan Xalqaro Talabalar Hakatonida EDUCO jamoasi o‘zining Sun’iy intellektga asoslangan ta’lim tizimi loyihasi bilan 120 dan ortiq jamoalar orasida mutlaq 1-o‘rinni qo‘lga kiritdi.\n\nTalabalarimiz 25,000,000 so‘mlik mukofot jamg‘armasi va nufuzli kompaniyalarda amaliyot o‘tash huquqiga ega bo‘lishdi.`,
    cover_image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80',
    published_at: '2026-10-22',
    views: 620,
    is_published: true,
    order: 2,
  },
  {
    id: 'news-3',
    title: 'Ota-onalar va o‘quvchilar uchun ochiq eshiklar kuni bo‘lib o‘tdi',
    slug: 'ochiq-eshiklar-kuni-hisoboti',
    category: 'Tadbirlar',
    excerpt: 'Ota-onalar markaz sharoitlari, dars xonalari va ustozlarimiz bilan shaxsan tanishish imkoniyatiga ega bo‘ldilar.',
    content: `Yakshanba kuni EDUCO markazida ochiq eshiklar kuni tantanali tarzda o‘tkazildi. Unda 300 dan ziyod ota-onalar va bo‘lajak talabalar ishtirok etdilar.\n\nBoshqaruvchi Abbosbek va yetakchi ustozlar zamonaviy kasblar istiqboli, markazimizning yangilangan EDUCO LMS platformasi va ota-onalar monitoring tizimi haqida batafsil ma’lumot berishdi.`,
    cover_image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80',
    published_at: '2026-10-15',
    views: 390,
    is_published: true,
    order: 3,
  },
];

export const DEFAULT_WEBSITE_TESTIMONIALS = [
  {
    id: 'test-1',
    author_name: 'Diyorbek Karimov',
    author_role: 'Frontend kursi bitiruvchisi (Hozirda EPAM dasturchisi)',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    text: 'EDUCO markazida o‘qish hayotimdagi eng to‘g‘ri qaror bo‘ldi. Abdulazizbek ustozimiz darslarni faqat real keyslar bilan tushuntirdilar. Kurs tugamasidanoq o‘z portfolioyimni yaratib ishga qabul qilindim!',
    rating: 5,
    is_active: true,
  },
  {
    id: 'test-2',
    author_name: 'Zilola Rahimova',
    author_role: 'IELTS 8.0 sohibasi',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    text: 'Jasurbek ustozning metodikasi nihoyatda o‘zgacha. Writing va Speakingdagi barcha xatolarimni aniq ko‘rsatib, 5 oy ichida 6.0 dan 8.0 natijaga erishishimga yordam berdilar. Rahmat, EDUCO!',
    rating: 5,
    is_active: true,
  },
  {
    id: 'test-3',
    author_name: 'Nodirbek Rustamov',
    author_role: 'O‘quvchimiz Sanjarbekning otasi',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    text: 'O‘g‘lim Robototexnika va Python kursida o‘qiydi. Har bir darsdan ko‘zlari yonib qaytadi. Eng quvonarlisi, markazning LMS tizimi orqali farzandimning darsga qatnashi va baholarini doimiy ko‘rib turaman.',
    rating: 5,
    is_active: true,
  },
];

// --- STORAGE HELPER CLASS ---

class WebsiteService {
  constructor() {
    this._initStore();
  }

  _initStore() {
    if (typeof window === 'undefined') return;
    try {
      if (!localStorage.getItem(WEBSITE_KEYS.SETTINGS)) {
        localStorage.setItem(WEBSITE_KEYS.SETTINGS, JSON.stringify(DEFAULT_WEBSITE_SETTINGS));
      }
      if (!localStorage.getItem(WEBSITE_KEYS.SLIDES)) {
        localStorage.setItem(WEBSITE_KEYS.SLIDES, JSON.stringify(DEFAULT_WEBSITE_SLIDES));
      }
      if (!localStorage.getItem(WEBSITE_KEYS.COURSES)) {
        localStorage.setItem(WEBSITE_KEYS.COURSES, JSON.stringify(DEFAULT_WEBSITE_COURSES));
      }
      if (!localStorage.getItem(WEBSITE_KEYS.SUBJECTS)) {
        localStorage.setItem(WEBSITE_KEYS.SUBJECTS, JSON.stringify(DEFAULT_WEBSITE_SUBJECTS));
      }
      if (!localStorage.getItem(WEBSITE_KEYS.TEACHERS)) {
        localStorage.setItem(WEBSITE_KEYS.TEACHERS, JSON.stringify(DEFAULT_WEBSITE_TEACHERS));
      }
      if (!localStorage.getItem(WEBSITE_KEYS.GALLERY)) {
        localStorage.setItem(WEBSITE_KEYS.GALLERY, JSON.stringify(DEFAULT_WEBSITE_GALLERY));
      }
      if (!localStorage.getItem(WEBSITE_KEYS.VIDEOS)) {
        localStorage.setItem(WEBSITE_KEYS.VIDEOS, JSON.stringify(DEFAULT_WEBSITE_VIDEOS));
      }
      if (!localStorage.getItem(WEBSITE_KEYS.NEWS)) {
        localStorage.setItem(WEBSITE_KEYS.NEWS, JSON.stringify(DEFAULT_WEBSITE_NEWS));
      }
      if (!localStorage.getItem(WEBSITE_KEYS.TESTIMONIALS)) {
        localStorage.setItem(WEBSITE_KEYS.TESTIMONIALS, JSON.stringify(DEFAULT_WEBSITE_TESTIMONIALS));
      }
    } catch (_) {}
  }

  _get(key, fallback) {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  _set(key, value) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this._broadcast();
    } catch (_) {}
  }

  _broadcast() {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('educo-website-update'));
        window.dispatchEvent(new CustomEvent('educo-data-sync'));
      } catch (_) {}
    }
  }

  // --- SETTINGS ---
  getSettings() {
    return { ...DEFAULT_WEBSITE_SETTINGS, ...this._get(WEBSITE_KEYS.SETTINGS, DEFAULT_WEBSITE_SETTINGS) };
  }

  updateSettings(patch) {
    const current = this.getSettings();
    const updated = { ...current, ...patch };
    this._set(WEBSITE_KEYS.SETTINGS, updated);
    return updated;
  }

  // --- SLIDES ---
  getSlides(onlyActive = false) {
    const list = this._get(WEBSITE_KEYS.SLIDES, DEFAULT_WEBSITE_SLIDES);
    const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
    return onlyActive ? sorted.filter((s) => s.is_active) : sorted;
  }

  saveSlide(slideData) {
    const list = this.getSlides(false);
    let updated;
    if (slideData.id) {
      const idx = list.findIndex((s) => s.id === slideData.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...slideData };
        updated = list[idx];
      } else {
        const item = { ...slideData, id: slideData.id || `slide-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...slideData,
        id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order: list.length + 1,
        is_active: slideData.is_active ?? true,
      };
      list.push(item);
      updated = item;
    }
    this._set(WEBSITE_KEYS.SLIDES, list);
    return updated;
  }

  deleteSlide(id) {
    const list = this.getSlides(false).filter((s) => s.id !== id);
    this._set(WEBSITE_KEYS.SLIDES, list);
    return true;
  }

  // --- COURSES ---
  getCourses(onlyActive = false) {
    const list = this._get(WEBSITE_KEYS.COURSES, DEFAULT_WEBSITE_COURSES);
    const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
    return onlyActive ? sorted.filter((c) => c.is_active) : sorted;
  }

  saveCourse(courseData) {
    const list = this.getCourses(false);
    let updated;
    if (courseData.id) {
      const idx = list.findIndex((c) => c.id === courseData.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...courseData };
        updated = list[idx];
      } else {
        const item = { ...courseData, id: courseData.id || `wc-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...courseData,
        id: `wc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order: list.length + 1,
        is_active: courseData.is_active ?? true,
      };
      list.push(item);
      updated = item;
    }
    this._set(WEBSITE_KEYS.COURSES, list);
    return updated;
  }

  deleteCourse(id) {
    const list = this.getCourses(false).filter((c) => c.id !== id);
    this._set(WEBSITE_KEYS.COURSES, list);
    return true;
  }

  // --- SUBJECTS ---
  getSubjects(onlyActive = false) {
    const list = this._get(WEBSITE_KEYS.SUBJECTS, DEFAULT_WEBSITE_SUBJECTS);
    const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
    return onlyActive ? sorted.filter((s) => s.is_active) : sorted;
  }

  saveSubject(subjectData) {
    const list = this.getSubjects(false);
    let updated;
    if (subjectData.id) {
      const idx = list.findIndex((s) => s.id === subjectData.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...subjectData };
        updated = list[idx];
      } else {
        const item = { ...subjectData, id: subjectData.id || `sub-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...subjectData,
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order: list.length + 1,
        is_active: subjectData.is_active ?? true,
      };
      list.push(item);
      updated = item;
    }
    this._set(WEBSITE_KEYS.SUBJECTS, list);
    return updated;
  }

  deleteSubject(id) {
    const list = this.getSubjects(false).filter((s) => s.id !== id);
    this._set(WEBSITE_KEYS.SUBJECTS, list);
    return true;
  }

  // --- TEACHERS ---
  getTeachers(onlyActive = false) {
    const list = this._get(WEBSITE_KEYS.TEACHERS, DEFAULT_WEBSITE_TEACHERS);
    const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
    return onlyActive ? sorted.filter((t) => t.is_active) : sorted;
  }

  saveTeacher(teacherData) {
    const list = this.getTeachers(false);
    let updated;
    if (teacherData.id) {
      const idx = list.findIndex((t) => t.id === teacherData.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...teacherData };
        updated = list[idx];
      } else {
        const item = { ...teacherData, id: teacherData.id || `wt-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...teacherData,
        id: `wt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order: list.length + 1,
        is_active: teacherData.is_active ?? true,
      };
      list.push(item);
      updated = item;
    }
    this._set(WEBSITE_KEYS.TEACHERS, list);
    return updated;
  }

  deleteTeacher(id) {
    const list = this.getTeachers(false).filter((t) => t.id !== id);
    this._set(WEBSITE_KEYS.TEACHERS, list);
    return true;
  }

  // --- GALLERY ---
  getGallery(onlyActive = false) {
    const list = this._get(WEBSITE_KEYS.GALLERY, DEFAULT_WEBSITE_GALLERY);
    const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
    return onlyActive ? sorted.filter((g) => g.is_active) : sorted;
  }

  saveGalleryItem(itemData) {
    const list = this.getGallery(false);
    let updated;
    if (itemData.id) {
      const idx = list.findIndex((g) => g.id === itemData.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...itemData };
        updated = list[idx];
      } else {
        const item = { ...itemData, id: itemData.id || `gal-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...itemData,
        id: `gal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order: list.length + 1,
        is_active: itemData.is_active ?? true,
        date: itemData.date || new Date().toISOString().split('T')[0],
      };
      list.push(item);
      updated = item;
    }
    this._set(WEBSITE_KEYS.GALLERY, list);
    return updated;
  }

  deleteGalleryItem(id) {
    const list = this.getGallery(false).filter((g) => g.id !== id);
    this._set(WEBSITE_KEYS.GALLERY, list);
    return true;
  }

  // --- VIDEOS ---
  getVideos(onlyActive = false) {
    const list = this._get(WEBSITE_KEYS.VIDEOS, DEFAULT_WEBSITE_VIDEOS);
    const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
    return onlyActive ? sorted.filter((v) => v.is_active) : sorted;
  }

  saveVideo(videoData) {
    const list = this.getVideos(false);
    let updated;
    // Extract youtube_id if youtube URL
    let ytId = videoData.youtube_id || '';
    if (videoData.video_url && !ytId) {
      const match = videoData.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (match) ytId = match[1];
    }
    const cleanData = { ...videoData, youtube_id: ytId };

    if (cleanData.id) {
      const idx = list.findIndex((v) => v.id === cleanData.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...cleanData };
        updated = list[idx];
      } else {
        const item = { ...cleanData, id: cleanData.id || `vid-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...cleanData,
        id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order: list.length + 1,
        is_active: cleanData.is_active ?? true,
      };
      list.push(item);
      updated = item;
    }
    this._set(WEBSITE_KEYS.VIDEOS, list);
    return updated;
  }

  deleteVideo(id) {
    const list = this.getVideos(false).filter((v) => v.id !== id);
    this._set(WEBSITE_KEYS.VIDEOS, list);
    return true;
  }

  // --- NEWS ---
  getNews(onlyPublished = false) {
    const list = this._get(WEBSITE_KEYS.NEWS, DEFAULT_WEBSITE_NEWS);
    const sorted = [...list].sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
    return onlyPublished ? sorted.filter((n) => n.is_published) : sorted;
  }

  saveNews(newsData) {
    const list = this.getNews(false);
    let updated;
    if (newsData.id) {
      const idx = list.findIndex((n) => n.id === newsData.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...newsData };
        updated = list[idx];
      } else {
        const item = { ...newsData, id: newsData.id || `news-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...newsData,
        id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        published_at: newsData.published_at || new Date().toISOString().split('T')[0],
        views: newsData.views || 0,
        is_published: newsData.is_published ?? true,
      };
      list.unshift(item);
      updated = item;
    }
    this._set(WEBSITE_KEYS.NEWS, list);
    return updated;
  }

  deleteNews(id) {
    const list = this.getNews(false).filter((n) => n.id !== id);
    this._set(WEBSITE_KEYS.NEWS, list);
    return true;
  }

  incrementNewsViews(id) {
    const list = this.getNews(false);
    const idx = list.findIndex((n) => n.id === id);
    if (idx >= 0) {
      list[idx].views = (list[idx].views || 0) + 1;
      this._set(WEBSITE_KEYS.NEWS, list);
    }
  }

  // --- TESTIMONIALS ---
  getTestimonials(onlyActive = false) {
    const list = this._get(WEBSITE_KEYS.TESTIMONIALS, DEFAULT_WEBSITE_TESTIMONIALS);
    return onlyActive ? list.filter((t) => t.is_active) : list;
  }

  saveTestimonial(testData) {
    const list = this.getTestimonials(false);
    let updated;
    if (testData.id) {
      const idx = list.findIndex((t) => t.id === testData.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...testData };
        updated = list[idx];
      } else {
        const item = { ...testData, id: testData.id || `test-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...testData,
        id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        is_active: testData.is_active ?? true,
        rating: testData.rating || 5,
      };
      list.push(item);
      updated = item;
    }
    this._set(WEBSITE_KEYS.TESTIMONIALS, list);
    return updated;
  }

  deleteTestimonial(id) {
    const list = this.getTestimonials(false).filter((t) => t.id !== id);
    this._set(WEBSITE_KEYS.TESTIMONIALS, list);
    return true;
  }

  // --- OVERVIEW STATS ---
  getOverviewMetrics() {
    return {
      slidesCount: this.getSlides(true).length,
      coursesCount: this.getCourses(true).length,
      subjectsCount: this.getSubjects(true).length,
      teachersCount: this.getTeachers(true).length,
      galleryCount: this.getGallery(true).length,
      videosCount: this.getVideos(true).length,
      newsCount: this.getNews(true).length,
      testimonialsCount: this.getTestimonials(true).length,
    };
  }

  // --- COMPATIBILITY ALIASES ---
  getWebsiteSettings() {
    return this.getSettings();
  }
  updateWebsiteSettings(patch) {
    return this.updateSettings(patch);
  }

  getHeroSlides(onlyActive = false) {
    return this.getSlides(onlyActive);
  }
  saveHeroSlide(data) {
    return this.saveSlide(data);
  }
  deleteHeroSlide(id) {
    return this.deleteSlide(id);
  }

  getWebsiteCourses(onlyActive = false) {
    return this.getCourses(onlyActive);
  }
  saveWebsiteCourse(data) {
    return this.saveCourse(data);
  }
  deleteWebsiteCourse(id) {
    return this.deleteCourse(id);
  }

  getWebsiteSubjects(onlyActive = false) {
    return this.getSubjects(onlyActive);
  }
  saveWebsiteSubject(data) {
    return this.saveSubject(data);
  }
  deleteWebsiteSubject(id) {
    return this.deleteSubject(id);
  }

  getWebsiteTeachers(onlyActive = false) {
    return this.getTeachers(onlyActive);
  }
  saveWebsiteTeacher(data) {
    return this.saveTeacher(data);
  }
  deleteWebsiteTeacher(id) {
    return this.deleteTeacher(id);
  }

  getWebsiteGallery(onlyActive = false) {
    return this.getGallery(onlyActive);
  }
  saveWebsiteGalleryItem(data) {
    return this.saveGalleryItem(data);
  }
  deleteWebsiteGalleryItem(id) {
    return this.deleteGalleryItem(id);
  }

  getWebsiteVideos(onlyActive = false) {
    return this.getVideos(onlyActive);
  }
  saveWebsiteVideo(data) {
    return this.saveVideo(data);
  }
  deleteWebsiteVideo(id) {
    return this.deleteVideo(id);
  }

  getWebsiteNews(onlyPublished = false) {
    return this.getNews(onlyPublished);
  }
  saveWebsiteNews(data) {
    return this.saveNews(data);
  }
  deleteWebsiteNews(id) {
    return this.deleteNews(id);
  }

  getWebsiteTestimonials(onlyActive = false) {
    return this.getTestimonials(onlyActive);
  }
  saveWebsiteTestimonial(data) {
    return this.saveTestimonial(data);
  }
  deleteWebsiteTestimonial(id) {
    return this.deleteTestimonial(id);
  }
}

export const websiteService = new WebsiteService();

if (typeof window !== 'undefined') {
  try {
    window.websiteService = websiteService;
  } catch (_) {}
}

export default websiteService;
