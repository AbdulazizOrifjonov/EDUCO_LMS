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

const SYNC_VERSION = 'educo_website_v7_contact_official';

// --- DEFAULT RICH REALISTIC CONTENT ---

export const DEFAULT_WEBSITE_SETTINGS = {
  site_name: 'EDUCO LMS',
  name: 'EDUCO LMS',
  tagline: 'Kelajak kasblari va zamonaviy bilimlar akademiyasi',
  phone: '+998 (99) 541-89-89',
  phonePrimary: '+998 (99) 541-89-89',
  secondary_phone: '+998 (99) 541-89-89',
  phoneSecondary: '+998 (99) 541-89-89',
  email: 'info@educo-lms.uz',
  address: 'Toshkent shahar, Yunusobod tumani, Amir Temur ko‘chasi, 107-B bino',
  working_hours: 'Dushanba - Shanba: 08:30 - 20:30',
  workingHours: 'Dushanba - Shanba: 08:30 - 20:30',
  telegram: 'https://t.me/educomarkaz36',
  telegram_admin: 'https://t.me/educomarkaz36',
  telegramHandle: '@educomarkaz36',
  instagram: 'https://www.instagram.com/educomarkaz?rpxt=MTFneWxqaHB1MjFmMg%3D%3D&utm_source=qr',
  instagramHandle: '@educomarkaz',
  youtube: 'https://youtube.com/@educo_lms',
  facebook: 'https://facebook.com/educo.lms',
  socials: {
    telegram: 'https://t.me/educomarkaz36',
    instagram: 'https://www.instagram.com/educomarkaz?rpxt=MTFneWxqaHB1MjFmMg%3D%3D&utm_source=qr',
    youtube: 'https://youtube.com/@educo_lms',
  },
  stats_students: 1250,
  stats_teachers: 48,
  stats_courses: 24,
  stats_graduates: 3400,
  stats_rating: '4.9/5',
  stats: {
    students: 1250,
    teachers: 48,
    courses: 24,
    graduates: 3400,
  },
  about: {
    mission: 'Har bir yoshga zamonaviy bilim, amaliy tajriba va mustahkam kelajak poydevorini taqdim etish.',
    vision: 'O‘zbekistonda xalqaro miqyosdagi eng ilg‘or va natijador ta’lim ekotizimiga aylanish.',
  },
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
    tag: 'Darslardan lavhalar',
    badge: 'Darslardan lavhalar',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80',
    image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80',
    cta_text: 'Kurslarni ko‘rish',
    cta_link: '#courses',
    primaryBtnText: 'Kurslarni ko‘rish',
    primaryBtnLink: '#courses',
    secondary_cta_text: 'Dars lavhalari',
    secondary_cta_link: '#gallery',
    secondaryBtnText: 'Dars lavhalari',
    secondaryBtnLink: '#gallery',
    is_active: true,
    isActive: true,
    order: 1,
  },
  {
    id: 'slide-2',
    title: 'Xalqaro sertifikatlarga ega professional ustozlar',
    subtitle: 'Google, EPAM va xalqaro IT kompaniyalarida ishlagan katta tajribaga ega ustoz-mentorlardan ta’lim oling.',
    tag: 'Professional ustozlar',
    badge: 'Professional ustozlar',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=80',
    image_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=80',
    cta_text: 'Ustozlar bilan tanishish',
    cta_link: '#teachers',
    primaryBtnText: 'Ustozlar bilan tanishish',
    primaryBtnLink: '#teachers',
    secondary_cta_text: 'Biz haqimizda',
    secondary_cta_link: '#about',
    secondaryBtnText: 'Biz haqimizda',
    secondaryBtnLink: '#about',
    is_active: true,
    isActive: true,
    order: 2,
  },
  {
    id: 'slide-3',
    title: '98% natijadorlik va xalqaro sifat kafolati',
    subtitle: 'Har bir talabaning dars o‘zlashtirishini real-vaqt rejimida nazorat qiluvchi zamonaviy LMS monitoring tizimi.',
    tag: 'Sifatli ta’lim',
    badge: 'Sifatli ta’lim',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=80',
    image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=80',
    cta_text: 'Natijalarimiz',
    cta_link: '#stats',
    primaryBtnText: 'Natijalarimiz',
    primaryBtnLink: '#stats',
    secondary_cta_text: 'Aloqa',
    secondary_cta_link: '#contact',
    secondaryBtnText: 'Aloqa',
    secondaryBtnLink: '#contact',
    is_active: true,
    isActive: true,
    order: 3,
  },
  {
    id: 'slide-4',
    title: 'Zamonaviy IT, Dizayn, Tillar, Matematika va Shaxmat',
    subtitle: 'Frontend, Python, Ingliz, Rus, Arab tili, Matematika, Shaxmat — barchasi noldan professional darajagacha 500,000 so‘m/oy.',
    tag: 'Barcha kurslar',
    badge: 'Barcha kurslar',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    cta_text: 'Ro‘yxatdan o‘tish',
    cta_link: '#contact',
    primaryBtnText: 'Ro‘yxatdan o‘tish',
    primaryBtnLink: '#contact',
    secondary_cta_text: 'Kurslar katalogi',
    secondary_cta_link: '#courses',
    secondaryBtnText: 'Kurslar katalogi',
    secondaryBtnLink: '#courses',
    is_active: true,
    isActive: true,
    order: 4,
  },
];

// USER REQUEST: All courses currently 500 000 so'm/oy.
// Courses included: Ingliz, Rus, Arab, IT (Frontend & Python), Matematika, Shaxmat, Dizayn, Robototexnika.
export const DEFAULT_WEBSITE_COURSES = [
  {
    id: 'wc-1',
    title: 'Intensiv Ingliz Tili & IELTS (7.5+)',
    category: 'Xorijiy tillar',
    duration: '5 oy',
    price: '500,000 so‘m/oy',
    level: 'Barcha darajalar (Beginner — IELTS)',
    lessons_count: 60,
    lessonsCount: 60,
    teacher_name: 'Jasurbek Aliyev',
    teacherName: 'Jasurbek Aliyev',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    description: 'General English, so‘zlashuv klublari, Listening, Reading, Writing hamda xalqaro IELTS 7.5+ imtihoniga tayyorgarlik.',
    is_featured: true,
    featured: true,
    is_active: true,
    isActive: true,
    order: 1,
  },
  {
    id: 'wc-2',
    title: 'Rus Tili — So‘zlashuv va Grammatika',
    category: 'Xorijiy tillar',
    duration: '4 oy',
    price: '500,000 so‘m/oy',
    level: 'Boshlang‘ich / Erkin nutq',
    lessons_count: 48,
    lessonsCount: 48,
    teacher_name: 'Svetlana Romanova',
    teacherName: 'Svetlana Romanova',
    image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=800&q=80',
    description: 'Kundalik va ishbilarmonlik rus tili, to‘g‘ri talaffuz, boy so‘z boyligi va erkin suhbatlashish ko‘nikmalari.',
    is_featured: true,
    featured: true,
    is_active: true,
    isActive: true,
    order: 2,
  },
  {
    id: 'wc-3',
    title: 'Arab Tili — Tajvid va Muallimi Soniy',
    category: 'Xorijiy tillar',
    duration: '5 oy',
    price: '500,000 so‘m/oy',
    level: 'Noldan mukammalgacha',
    lessons_count: 60,
    lessonsCount: 60,
    teacher_name: 'Ustoz Muhammadali',
    teacherName: 'Ustoz Muhammadali',
    image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80',
    description: 'Arab alifbosi, Tajvid qoidalari, Qur’oni Karim tilovati, asosiy sarf va nahv grammatikasi hamda jonli muloqot.',
    is_featured: true,
    featured: true,
    is_active: true,
    isActive: true,
    order: 3,
  },
  {
    id: 'wc-4',
    title: 'Frontend Web Dasturlash (HTML, CSS, React)',
    category: 'Dasturlash',
    duration: '6 oy',
    price: '500,000 so‘m/oy',
    level: 'Boshlang‘ich / O‘rta',
    lessons_count: 72,
    lessonsCount: 72,
    teacher_name: 'Abdulazizbek Orifjonov',
    teacherName: 'Abdulazizbek Orifjonov',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    description: 'HTML5, CSS3, Tailwind CSS, JavaScript ES6+, React, Next.js, Git va Redux orqali zamonaviy veb-saytlar yaratish.',
    is_featured: true,
    featured: true,
    is_active: true,
    isActive: true,
    order: 4,
  },
  {
    id: 'wc-5',
    title: 'Python Backend & Sun‘iy Intellekt (AI)',
    category: 'Dasturlash',
    duration: '7 oy',
    price: '500,000 so‘m/oy',
    level: 'Boshlang‘ich / Katta',
    lessons_count: 84,
    lessonsCount: 84,
    teacher_name: 'Abbosbek Boshqaruvchi',
    teacherName: 'Abbosbek Boshqaruvchi',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    description: 'Python asoslari, Django, FastAPI, PostgreSQL, REST API, Docker va Sun‘iy Intellekt (AI/ML) integratsiyalari.',
    is_featured: true,
    featured: true,
    is_active: true,
    isActive: true,
    order: 5,
  },
  {
    id: 'wc-6',
    title: 'Mental Arifmetika & Aniq Matematika',
    category: 'Aniq fanlar',
    duration: '6 oy',
    price: '500,000 so‘m/oy',
    level: 'Maktab va Olimpiada',
    lessons_count: 72,
    lessonsCount: 72,
    teacher_name: 'Farhod Tohirov',
    teacherName: 'Farhod Tohirov',
    image: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80',
    description: 'Soroban abakusi, miyaning ikki yarim sharlarini rivojlantirish, tezkor hisoblash hamda chuqurlashtirilgan maktab matematikasi.',
    is_featured: true,
    featured: true,
    is_active: true,
    isActive: true,
    order: 6,
  },
  {
    id: 'wc-7',
    title: 'Professional Shaxmat Maktabi (Mantiq va Strategiya)',
    category: 'Mantiq & Sport',
    duration: '4 oy',
    price: '500,000 so‘m/oy',
    level: 'Boshlang‘ichdan sport razryadigacha',
    lessons_count: 48,
    lessonsCount: 48,
    teacher_name: 'Rustam Qosimov',
    teacherName: 'Rustam Qosimov',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
    description: 'Shaxmat nazariyasi, mashhur debyutlar, taktik kombinatsiyalar, partiya tahlillari va professional turnirlar tayyorgarligi.',
    is_featured: true,
    featured: true,
    is_active: true,
    isActive: true,
    order: 7,
  },
  {
    id: 'wc-8',
    title: 'Grafik Dizayn & UI/UX (Figma, Photoshop)',
    category: 'Dizayn',
    duration: '4 oy',
    price: '500,000 so‘m/oy',
    level: 'Boshlang‘ich / Amaliy',
    lessons_count: 48,
    lessonsCount: 48,
    teacher_name: 'Madinaxon Maxmudovna',
    teacherName: 'Madinaxon Maxmudovna',
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
    description: 'Adobe Photoshop, Illustrator, Figma, brending, logotiplar va mobil ilovalar UI/UX interfeyslarini real keyslarda yaratish.',
    is_featured: true,
    featured: true,
    is_active: true,
    isActive: true,
    order: 8,
  },
  {
    id: 'wc-9',
    title: 'Robototexnika & STEM Ta’lim',
    category: 'Muhandislik',
    duration: '4 oy',
    price: '500,000 so‘m/oy',
    level: 'Bolalar va O‘smirlar',
    lessons_count: 48,
    lessonsCount: 48,
    teacher_name: 'Otabek Shukurov',
    teacherName: 'Otabek Shukurov',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    description: 'Arduino, elektron sxemalar, C++ mikrokontrollerlar dasturlash, sensorlar va avtonom robotlar yasash amaliyoti.',
    is_featured: true,
    featured: true,
    is_active: true,
    isActive: true,
    order: 9,
  },
];

export const DEFAULT_WEBSITE_SUBJECTS = [
  {
    id: 'sub-1',
    name: 'Xorijiy Tillar (Ingliz, Rus, Arab)',
    icon_name: 'Globe',
    color: 'from-emerald-600 to-teal-600',
    description: 'Ingliz tili (IELTS, CEFR), Rus tili so‘zlashuv va Arab tili tajvid kurslari.',
    courses_count: 3,
    coursesCount: 3,
    is_active: true,
    isActive: true,
    order: 1,
  },
  {
    id: 'sub-2',
    name: 'Dasturlash & IT Texnologiyalar',
    icon_name: 'Code',
    color: 'from-blue-600 to-indigo-600',
    description: 'Frontend, Python Backend, Sun‘iy intellekt va zamonaviy veb-ilovalarni yaratish.',
    courses_count: 2,
    coursesCount: 2,
    is_active: true,
    isActive: true,
    order: 2,
  },
  {
    id: 'sub-3',
    name: 'Aniq Fanlar & Matematika',
    icon_name: 'Calculator',
    color: 'from-amber-600 to-orange-600',
    description: 'Mental arifmetika, maktab va oliy matematika, olimpiadalarga tayyorgarlik.',
    courses_count: 1,
    coursesCount: 1,
    is_active: true,
    isActive: true,
    order: 3,
  },
  {
    id: 'sub-4',
    name: 'Professional Shaxmat Maktabi',
    icon_name: 'Sparkles',
    color: 'from-purple-600 to-indigo-700',
    description: 'Strategik fikrlash, kombinatsiyalar, xalqaro qoidalar va musobaqalar.',
    courses_count: 1,
    coursesCount: 1,
    is_active: true,
    isActive: true,
    order: 4,
  },
  {
    id: 'sub-5',
    name: 'Dizayn & UI/UX Media',
    icon_name: 'Palette',
    color: 'from-pink-600 to-rose-600',
    description: 'Grafik dizayn, Figma, Photoshop, brending va veb interfeyslar.',
    courses_count: 1,
    coursesCount: 1,
    is_active: true,
    isActive: true,
    order: 5,
  },
  {
    id: 'sub-6',
    name: 'Robototexnika & STEM Muhandislik',
    icon_name: 'Cpu',
    color: 'from-cyan-600 to-blue-600',
    description: 'Arduino mikrosxemalar, robotlar yig‘ish va avtomatlashtirish asoslari.',
    courses_count: 1,
    coursesCount: 1,
    is_active: true,
    isActive: true,
    order: 6,
  },
];

export const DEFAULT_WEBSITE_TEACHERS = [
  {
    id: 'wt-1',
    full_name: 'Jasurbek Aliyev',
    name: 'Jasurbek Aliyev',
    role: 'Bosh Ingliz Tili Ustozi',
    specialization: 'IELTS 8.5, Academic Writing & Fluency',
    subject: 'Ingliz tili & IELTS',
    experience_years: '6+ yil',
    experience: '6+ yil',
    bio: 'Cambridge CELTA sertifikatiga ega, 200 dan ortiq o‘quvchisi 7.0+ IELTS ballini qo‘lga kiritgan mohir mentor.',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    telegram: 'https://t.me/jasurbek',
    rating: 5,
    is_featured: true,
    is_active: true,
    order: 1,
  },
  {
    id: 'wt-2',
    full_name: 'Svetlana Romanova',
    name: 'Svetlana Romanova',
    role: 'Rus Tili Filolog-Ustozi',
    specialization: 'Ritorika, Grammatika va So‘zlashuv',
    subject: 'Rus tili',
    experience_years: '8+ yil',
    experience: '8+ yil',
    bio: 'Rossiya Federatsiyasi oliy toifali mutaxassisi, yuzlab o‘quvchilarni rus tilida erkin so‘zlashish darajasiga olib chiqqan.',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    telegram: 'https://t.me/svetlana_ru',
    rating: 5,
    is_featured: true,
    is_active: true,
    order: 2,
  },
  {
    id: 'wt-3',
    full_name: 'Ustoz Muhammadali',
    name: 'Ustoz Muhammadali',
    role: 'Arab Tili va Tajvid Ustozi',
    specialization: 'Qur’on Tajvidi, Muallimi Soniy va Nahv',
    subject: 'Arab tili',
    experience_years: '7+ yil',
    experience: '7+ yil',
    bio: 'Misr Al-Azhar universiteti tayyorlov kursi bitiruvchisi, xattotlik va tajvid qoidalari bo‘yicha chuqur tajribaga ega.',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    telegram: 'https://t.me/muhammadali_arab',
    rating: 5,
    is_featured: true,
    is_active: true,
    order: 3,
  },
  {
    id: 'wt-4',
    full_name: 'Abdulazizbek Orifjonov',
    name: 'Abdulazizbek Orifjonov',
    role: 'Senior Frontend Dasturchi & Texnik Rahbar',
    specialization: 'JavaScript, React, Next.js, Redux & Arxitektura',
    subject: 'Frontend Dasturlash',
    experience_years: '6+ yil',
    experience: '6+ yil',
    bio: 'Murakkab veb-ilovalarni optimallashtirish va keng miqyosli frontend tizimlarini qurish bo‘yicha ekspert.',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    telegram: 'https://t.me/abdulazizbek',
    rating: 5,
    is_featured: true,
    is_active: true,
    order: 4,
  },
  {
    id: 'wt-5',
    full_name: 'Abbosbek Boshqaruvchi',
    name: 'Abbosbek Boshqaruvchi',
    role: 'Asoschi & Bosh IT Arxitektor',
    specialization: 'Python, Django, FastAPI & Sun‘iy Intellekt',
    subject: 'Python Backend & AI',
    experience_years: '7+ yil',
    experience: '7+ yil',
    bio: 'Xalqaro IT loyihalari arxitektori, 10 dan ortiq yirik tizimlar yaratuvchisi va yuzlab yosh dasturchilar ustozi.',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    telegram: 'https://t.me/abbosbek',
    rating: 5,
    is_featured: true,
    is_active: true,
    order: 5,
  },
  {
    id: 'wt-6',
    full_name: 'Farhod Tohirov',
    name: 'Farhod Tohirov',
    role: 'Matematika & Mental Arifmetika Eksperti',
    specialization: 'Mental arifmetika, Soroban va Olimpiada matematikasi',
    subject: 'Matematika',
    experience_years: '9+ yil',
    experience: '9+ yil',
    bio: 'Respublika olimpiadalari g‘oliblari ustozi, Soroban xalqaro assotsiatsiyasi a’zosi, 1000 dan ortiq yosh shogirdlar yetakchisi.',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    image_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    telegram: 'https://t.me/farhod_math',
    rating: 5,
    is_featured: true,
    is_active: true,
    order: 6,
  },
  {
    id: 'wt-7',
    full_name: 'Rustam Qosimov',
    name: 'Rustam Qosimov',
    role: 'Xalqaro Toifadagi Shaxmat Murabbiyi',
    specialization: 'FIDE Master, Taktik kombinatsiyalar va Blits',
    subject: 'Shaxmat',
    experience_years: '10+ yil',
    experience: '10+ yil',
    bio: 'FIDE ustasi, ko‘plab xalqaro musobaqalar sovrindori, o‘quvchilariga shaxmatda strategik va mantiqiy fikrlashni o‘rgatadi.',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
    image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
    telegram: 'https://t.me/rustam_chess',
    rating: 5,
    is_featured: true,
    is_active: true,
    order: 7,
  },
  {
    id: 'wt-8',
    full_name: 'Madinaxon Maxmudovna',
    name: 'Madinaxon Maxmudovna',
    role: 'Bosh Dizayner & Art-Direktor',
    specialization: 'UI/UX Dizayn, Figma, Brending & Tipografika',
    subject: 'Grafik Dizayn & UI/UX',
    experience_years: '5+ yil',
    experience: '5+ yil',
    bio: 'Xalqaro mukofotlar sovrindori, 50 dan ortiq veb va mobil ilovalar interfeyslari muallifi, tajribali mentor.',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    telegram: 'https://t.me/madinaxon',
    rating: 5,
    is_featured: true,
    is_active: true,
    order: 8,
  },
];

export const DEFAULT_WEBSITE_GALLERY = [
  {
    id: 'gal-1',
    title: 'Dasturlash darsidagi jonli muhit',
    category: 'Darslar',
    image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80',
    image_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80',
    caption: 'O‘quvchilar frontend loyihalarini taqdimot qilish jarayonida.',
    description: 'O‘quvchilar frontend loyihalarini taqdimot qilish jarayonida.',
    date: '2026-10-25',
    is_active: true,
    isActive: true,
    order: 1,
  },
  {
    id: 'gal-2',
    title: 'Robototexnika amaliy laboratoriyasi',
    category: 'Laboratoriya',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1000&q=80',
    image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1000&q=80',
    caption: 'Avtonom harakatlanuvchi robot modelini sinovdan o‘tkazish.',
    description: 'Avtonom harakatlanuvchi robot modelini sinovdan o‘tkazish.',
    date: '2026-10-20',
    is_active: true,
    isActive: true,
    order: 2,
  },
  {
    id: 'gal-3',
    title: 'Bitiruvchilarga xalqaro sertifikat topshirish',
    category: 'Tadbirlar',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
    image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
    caption: 'Python Backend kursi bitiruvchilarining quvonchli lahzalari.',
    description: 'Python Backend kursi bitiruvchilarining quvonchli lahzalari.',
    date: '2026-10-15',
    is_active: true,
    isActive: true,
    order: 3,
  },
  {
    id: 'gal-4',
    title: 'Shaxmat to‘garagi va turnir jarayoni',
    category: 'Tadbirlar',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1000&q=80',
    image_url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1000&q=80',
    caption: 'Yosh shaxmatchilar o‘rtasidagi do‘stona bahs va blits o‘yin.',
    description: 'Yosh shaxmatchilar o‘rtasidagi do‘stona bahs va blits o‘yin.',
    date: '2026-10-12',
    is_active: true,
    isActive: true,
    order: 4,
  },
  {
    id: 'gal-5',
    title: 'Zamonaviy jihozlangan kompyuter zali',
    category: 'Infratuzilma',
    image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1000&q=80',
    image_url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1000&q=80',
    caption: 'Yuqori tezlikdagi internet va qulay iMac o‘quv o‘rinlari.',
    description: 'Yuqori tezlikdagi internet va qulay iMac o‘quv o‘rinlari.',
    date: '2026-10-05',
    is_active: true,
    isActive: true,
    order: 5,
  },
  {
    id: 'gal-6',
    title: 'Ingliz tili Speaking klubi muhiti',
    category: 'Darslar',
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1000&q=80',
    image_url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1000&q=80',
    caption: 'Chet ellik mehmonlar bilan jonli muloqot va amaliyot.',
    description: 'Chet ellik mehmonlar bilan jonli muloqot va amaliyot.',
    date: '2026-09-28',
    is_active: true,
    isActive: true,
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
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_id: 'dQw4w9WgXcQ',
    description: 'Markazimizning o‘quv xonalari, texnik imkoniyatlari va ustozlarimiz haqida qisqacha video lavha.',
    is_active: true,
    isActive: true,
    order: 1,
  },
  {
    id: 'vid-2',
    title: 'O‘quvchilarimizning xalqaro IT kompaniyalardagi muvaffaqiyatlari',
    category: 'Natijalar',
    duration: '04:12',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80',
    video_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    youtube_id: 'ScMzIvxBSi4',
    description: 'Kursni tamomlab hozirda nufuzli IT korxonalarida ishlayotgan bitiruvchilarimiz intervyusi.',
    is_active: true,
    isActive: true,
    order: 2,
  },
  {
    id: 'vid-3',
    title: 'Dasturlash darsida real loyihani himoya qilish jarayoni',
    category: 'Darslar',
    duration: '03:45',
    thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80',
    image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80',
    video_url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    videoUrl: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    youtube_id: 'L_LUpnjgPso',
    description: 'Frontend va Backend kursimiz talabalari o‘zlari tayyorlagan LMS tizimini himoya qilishmoqda.',
    is_active: true,
    isActive: true,
    order: 3,
  },
];

export const DEFAULT_WEBSITE_NEWS = [
  {
    id: 'news-1',
    title: 'EDUCO yangi o‘quv mavsumi va grant o‘rinlari uchun qabul boshladi',
    slug: 'yangi-oquv-mavsumi-qabul-2026',
    category: 'Qabul va Yangiliklar',
    summary: 'Markazimiz yangi o‘quv yili uchun barcha yo‘nalishlarda ro‘yxatga olishni rasman ochiq deb e’lon qildi.',
    excerpt: 'Markazimiz yangi o‘quv yili uchun barcha yo‘nalishlarda ro‘yxatga olishni rasman ochiq deb e’lon qildi.',
    content: `EDUCO Ta’lim Markazi 2026-yilgi yangi o‘quv mavsumi munosabati bilan barcha yoshlar uchun IT dasturlash, grafik dizayn, xorijiy tillar, matematika va shaxmat sohalarida kengaytirilgan qabulni boshladi.\n\nUshbu mavsumda eng iqtidorli 50 nafar o‘quvchi uchun 100% va 50% li grant o‘rinlari ajratilgan. Hozirda barcha kurslar oylik to‘lovi 500,000 so‘m qilib belgilandi.`,
    cover_image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
    image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
    date: '2026-10-28',
    published_at: '2026-10-28',
    views: 480,
    is_published: true,
    isActive: true,
    order: 1,
  },
  {
    id: 'news-2',
    title: 'Talabalarimiz xalqaro dasturlash hakatonida faxrli 1-o‘rinni egalladi',
    slug: 'hakaton-1-orin-goliblik',
    category: 'Yutuqlarimiz',
    summary: 'Frontend va Python kurslarimiz o‘quvchilaridan iborat jamoa 48 soatlik nufuzli IT hakatonida g‘olib bo‘ldi.',
    excerpt: 'Frontend va Python kurslarimiz o‘quvchilaridan iborat jamoa 48 soatlik nufuzli IT hakatonida g‘olib bo‘ldi.',
    content: `O‘tgan haftada bo‘lib o‘tgan Xalqaro Talabalar Hakatonida EDUCO jamoasi o‘zining Sun’iy intellektga asoslangan ta’lim tizimi loyihasi bilan 120 dan ortiq jamoalar orasida mutlaq 1-o‘rinni qo‘lga kiritdi.`,
    cover_image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80',
    image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80',
    date: '2026-10-22',
    published_at: '2026-10-22',
    views: 620,
    is_published: true,
    isActive: true,
    order: 2,
  },
  {
    id: 'news-3',
    title: 'Ota-onalar va o‘quvchilar uchun ochiq eshiklar kuni bo‘lib o‘tdi',
    slug: 'ochiq-eshiklar-kuni-hisoboti',
    category: 'Tadbirlar',
    summary: 'Tadbirda yangi o‘quv dasturlari va robototexnika laboratoriyasi taqdimoti o‘tkazildi.',
    excerpt: 'Tadbirda yangi o‘quv dasturlari va robototexnika laboratoriyasi taqdimoti o‘tkazildi.',
    content: `Yakshanba kuni markazimizda ochiq eshiklar kuni bo‘lib o‘tdi. Unda 200 dan ortiq ota-onalar va yoshlar ishtirok etishdi. Mehmonlar o‘quv jarayonlari, iMac kompyuter zallari bilan tanishdilar.`,
    cover_image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80',
    image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80',
    date: '2026-10-18',
    published_at: '2026-10-18',
    views: 390,
    is_published: true,
    isActive: true,
    order: 3,
  },
];

export const DEFAULT_WEBSITE_TESTIMONIALS = [
  {
    id: 'test-1',
    name: 'Sardorbek Rahimov',
    author: 'Sardorbek Rahimov',
    role: 'Frontend bitiruvchisi (Hozirda EPAM dasturchisi)',
    quote: 'EDUCO da o‘qib eng muhimi real loyihalar ustida ishlashni o‘rgandim. Kursni tugatiboq ishga joylashdim.',
    content: 'EDUCO da o‘qib eng muhimi real loyihalar ustida ishlashni o‘rgandim. Kursni tugatiboq ishga joylashdim.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    is_active: true,
    isActive: true,
  },
  {
    id: 'test-2',
    name: 'Dilnoza Karimova',
    author: 'Dilnoza Karimova',
    role: 'IELTS 8.0 sohibasi',
    quote: 'Ustoz Jasurbek Aliyev bilan 4 oy intensiv shug‘ullandim. Natijada bir urinishda IELTS 8.0 oldim!',
    content: 'Ustoz Jasurbek Aliyev bilan 4 oy intensiv shug‘ullandim. Natijada bir urinishda IELTS 8.0 oldim!',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    is_active: true,
    isActive: true,
  },
  {
    id: 'test-3',
    name: 'Bobur Mirzayev (Ota-ona)',
    author: 'Bobur Mirzayev (Ota-ona)',
    role: 'O‘quvchimiz otasi',
    quote: 'O‘g‘lim robototexnika va shaxmat to‘garaklariga boradi. Bolaning diqqati va qiziqishi ancha oshdi.',
    content: 'O‘g‘lim robototexnika va shaxmat to‘garaklariga boradi. Bolaning diqqati va qiziqishi ancha oshdi.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    is_active: true,
    isActive: true,
  },
];

// --- NORMALIZATION HELPERS ---
function normalizeCourse(c) {
  if (!c) return c;
  const img = c.image || c.image_url || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80';
  return {
    ...c,
    image: img,
    image_url: img,
    price: c.price || '500,000 so‘m/oy',
    teacher_name: c.teacher_name || c.teacherName || 'EDUCO Mentor',
    teacherName: c.teacherName || c.teacher_name || 'EDUCO Mentor',
    lessons_count: c.lessons_count || c.lessonsCount || 48,
    lessonsCount: c.lessonsCount || c.lessons_count || 48,
    is_featured: c.is_featured ?? c.featured ?? true,
    featured: c.featured ?? c.is_featured ?? true,
    is_active: c.is_active ?? c.isActive ?? true,
    isActive: c.isActive ?? c.is_active ?? true,
  };
}

function normalizeSlide(s) {
  if (!s) return s;
  const img = s.image || s.image_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80';
  const tag = s.tag || s.badge || 'Darslardan lavhalar';
  return {
    ...s,
    image: img,
    image_url: img,
    tag: tag,
    badge: tag,
    primaryBtnText: s.primaryBtnText || s.cta_text || 'Kurslarni ko‘rish',
    cta_text: s.cta_text || s.primaryBtnText || 'Kurslarni ko‘rish',
    primaryBtnLink: s.primaryBtnLink || s.cta_link || '#courses',
    cta_link: s.cta_link || s.primaryBtnLink || '#courses',
    secondaryBtnText: s.secondaryBtnText || s.secondary_cta_text || 'Biz haqimizda',
    secondary_cta_text: s.secondary_cta_text || s.secondaryBtnText || 'Biz haqimizda',
    secondaryBtnLink: s.secondaryBtnLink || s.secondary_cta_link || '#about',
    secondary_cta_link: s.secondary_cta_link || s.secondaryBtnLink || '#about',
    is_active: s.is_active ?? s.isActive ?? true,
    isActive: s.isActive ?? s.is_active ?? true,
  };
}

function normalizeTeacher(t) {
  if (!t) return t;
  const photo = t.photo || t.photo_url || t.image_url || t.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
  const name = t.name || t.full_name || 'EDUCO Mentor';
  const exp = t.experience || t.experience_years || '5+ yil';
  const subj = t.subject || t.specialization || 'Bosh mutaxassis';
  return {
    ...t,
    name: name,
    full_name: name,
    photo: photo,
    photo_url: photo,
    image_url: photo,
    experience: exp,
    experience_years: exp,
    subject: subj,
    specialization: subj,
    is_active: t.is_active ?? t.isActive ?? true,
    isActive: t.isActive ?? t.is_active ?? true,
  };
}

function normalizeGalleryItem(g) {
  if (!g) return g;
  const img = g.image || g.image_url || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80';
  const desc = g.description || g.caption || '';
  return {
    ...g,
    image: img,
    image_url: img,
    description: desc,
    caption: desc,
    is_active: g.is_active ?? g.isActive ?? true,
    isActive: g.isActive ?? g.is_active ?? true,
  };
}

function normalizeVideo(v) {
  if (!v) return v;
  const thumb = v.thumbnail || v.image || v.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80';
  const vUrl = v.videoUrl || v.video_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  let ytId = v.youtube_id || v.youtubeId;
  if (!ytId && vUrl) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = vUrl.match(regExp);
    if (match && match[2].length === 11) ytId = match[2];
  }
  return {
    ...v,
    thumbnail: thumb,
    image: thumb,
    thumbnail_url: thumb,
    videoUrl: vUrl,
    video_url: vUrl,
    youtube_id: ytId,
    is_active: v.is_active ?? v.isActive ?? true,
    isActive: v.isActive ?? v.is_active ?? true,
  };
}

function normalizeNews(n) {
  if (!n) return n;
  const img = n.image || n.cover_image || n.image_url || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80';
  const sum = n.summary || n.excerpt || '';
  const dt = n.date || n.published_at || new Date().toISOString().split('T')[0];
  return {
    ...n,
    image: img,
    cover_image: img,
    image_url: img,
    summary: sum,
    excerpt: sum,
    date: dt,
    published_at: dt,
    is_published: n.is_published ?? n.isActive ?? true,
    isActive: n.isActive ?? n.is_published ?? true,
  };
}

function normalizeTestimonial(t) {
  if (!t) return t;
  const av = t.avatar || t.avatar_url || t.photo || t.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
  const nm = t.name || t.author || t.author_name || 'O‘quvchi';
  const rl = t.role || t.author_role || 'O‘quvchi';
  const qt = t.quote || t.content || '';
  return {
    ...t,
    avatar: av,
    avatar_url: av,
    photo: av,
    image: av,
    name: nm,
    author: nm,
    author_name: nm,
    role: rl,
    author_role: rl,
    quote: qt,
    content: qt,
    is_active: t.is_active ?? t.isActive ?? true,
    isActive: t.isActive ?? t.is_active ?? true,
  };
}

class WebsiteService {
  constructor() {
    this.initDefaults();
  }

  initDefaults() {
    if (typeof window === 'undefined') return;
    try {
      const isSynced = localStorage.getItem(SYNC_VERSION);
      if (!isSynced) {
        // Upgrade / sync all items with 500k courses and normalized fields
        localStorage.setItem(WEBSITE_KEYS.COURSES, JSON.stringify(DEFAULT_WEBSITE_COURSES));
        localStorage.setItem(WEBSITE_KEYS.SUBJECTS, JSON.stringify(DEFAULT_WEBSITE_SUBJECTS));
        localStorage.setItem(WEBSITE_KEYS.TEACHERS, JSON.stringify(DEFAULT_WEBSITE_TEACHERS));
        localStorage.setItem(WEBSITE_KEYS.SLIDES, JSON.stringify(DEFAULT_WEBSITE_SLIDES));
        localStorage.setItem(WEBSITE_KEYS.GALLERY, JSON.stringify(DEFAULT_WEBSITE_GALLERY));
        localStorage.setItem(WEBSITE_KEYS.VIDEOS, JSON.stringify(DEFAULT_WEBSITE_VIDEOS));
        localStorage.setItem(WEBSITE_KEYS.NEWS, JSON.stringify(DEFAULT_WEBSITE_NEWS));
        localStorage.setItem(WEBSITE_KEYS.TESTIMONIALS, JSON.stringify(DEFAULT_WEBSITE_TESTIMONIALS));
        localStorage.setItem(WEBSITE_KEYS.SETTINGS, JSON.stringify(DEFAULT_WEBSITE_SETTINGS));
        localStorage.setItem(SYNC_VERSION, 'true');
        return;
      }

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
    const raw = this._get(WEBSITE_KEYS.SETTINGS, DEFAULT_WEBSITE_SETTINGS);
    const merged = { ...DEFAULT_WEBSITE_SETTINGS, ...raw };
    // Auto-migrate legacy placeholder contact info to user's real official details
    if (!merged.phone || merged.phone.includes('610-17-74')) {
      merged.phone = DEFAULT_WEBSITE_SETTINGS.phone;
      merged.phonePrimary = DEFAULT_WEBSITE_SETTINGS.phone;
    }
    if (!merged.telegram || merged.telegram.includes('educo_lms')) {
      merged.telegram = DEFAULT_WEBSITE_SETTINGS.telegram;
    }
    if (!merged.instagram || merged.instagram.includes('instagram.com/educo_lms')) {
      merged.instagram = DEFAULT_WEBSITE_SETTINGS.instagram;
    }
    return merged;
  }

  updateSettings(patch) {
    const current = this.getSettings();
    const updated = { ...current, ...patch };
    this._set(WEBSITE_KEYS.SETTINGS, updated);
    return updated;
  }

  // --- SLIDES ---
  getSlides(onlyActive = false) {
    const list = this._get(WEBSITE_KEYS.SLIDES, DEFAULT_WEBSITE_SLIDES).map(normalizeSlide);
    const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
    return onlyActive ? sorted.filter((s) => s.is_active && s.isActive !== false) : sorted;
  }

  saveSlide(slideData) {
    const norm = normalizeSlide(slideData);
    const list = this.getSlides(false);
    let updated;
    if (norm.id) {
      const idx = list.findIndex((s) => s.id === norm.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...norm };
        updated = list[idx];
      } else {
        const item = { ...norm, id: norm.id || `slide-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...norm,
        id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order: list.length + 1,
        is_active: norm.is_active ?? true,
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
    const list = this._get(WEBSITE_KEYS.COURSES, DEFAULT_WEBSITE_COURSES).map(normalizeCourse);
    const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
    return onlyActive ? sorted.filter((c) => c.is_active && c.isActive !== false) : sorted;
  }

  saveCourse(courseData) {
    const norm = normalizeCourse(courseData);
    const list = this.getCourses(false);
    let updated;
    if (norm.id) {
      const idx = list.findIndex((c) => c.id === norm.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...norm };
        updated = list[idx];
      } else {
        const item = { ...norm, id: norm.id || `wc-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...norm,
        id: `wc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order: list.length + 1,
        is_active: norm.is_active ?? true,
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
    const list = this._get(WEBSITE_KEYS.SUBJECTS, DEFAULT_WEBSITE_SUBJECTS).map((s) => ({
      ...s,
      courses_count: s.courses_count || s.coursesCount || 1,
      coursesCount: s.coursesCount || s.courses_count || 1,
    }));
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
    const list = this._get(WEBSITE_KEYS.TEACHERS, DEFAULT_WEBSITE_TEACHERS).map(normalizeTeacher);
    const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
    return onlyActive ? sorted.filter((t) => t.is_active && t.isActive !== false) : sorted;
  }

  saveTeacher(teacherData) {
    const norm = normalizeTeacher(teacherData);
    const list = this.getTeachers(false);
    let updated;
    if (norm.id) {
      const idx = list.findIndex((t) => t.id === norm.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...norm };
        updated = list[idx];
      } else {
        const item = { ...norm, id: norm.id || `wt-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...norm,
        id: `wt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order: list.length + 1,
        is_active: norm.is_active ?? true,
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
    const list = this._get(WEBSITE_KEYS.GALLERY, DEFAULT_WEBSITE_GALLERY).map(normalizeGalleryItem);
    const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
    return onlyActive ? sorted.filter((g) => g.is_active && g.isActive !== false) : sorted;
  }

  saveGalleryItem(itemData) {
    const norm = normalizeGalleryItem(itemData);
    const list = this.getGallery(false);
    let updated;
    if (norm.id) {
      const idx = list.findIndex((g) => g.id === norm.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...norm };
        updated = list[idx];
      } else {
        const item = { ...norm, id: norm.id || `gal-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...norm,
        id: `gal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order: list.length + 1,
        is_active: norm.is_active ?? true,
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
    const list = this._get(WEBSITE_KEYS.VIDEOS, DEFAULT_WEBSITE_VIDEOS).map(normalizeVideo);
    const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
    return onlyActive ? sorted.filter((v) => v.is_active && v.isActive !== false) : sorted;
  }

  saveVideo(videoData) {
    const norm = normalizeVideo(videoData);
    const list = this.getVideos(false);
    let updated;
    if (norm.id) {
      const idx = list.findIndex((v) => v.id === norm.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...norm };
        updated = list[idx];
      } else {
        const item = { ...norm, id: norm.id || `vid-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...norm,
        id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order: list.length + 1,
        is_active: norm.is_active ?? true,
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
    const list = this._get(WEBSITE_KEYS.NEWS, DEFAULT_WEBSITE_NEWS).map(normalizeNews);
    const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
    return onlyPublished ? sorted.filter((n) => n.is_published && n.isActive !== false) : sorted;
  }

  saveNews(newsData) {
    const norm = normalizeNews(newsData);
    const list = this.getNews(false);
    let updated;
    if (norm.id) {
      const idx = list.findIndex((n) => n.id === norm.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...norm };
        updated = list[idx];
      } else {
        const item = { ...norm, id: norm.id || `news-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...norm,
        id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        order: list.length + 1,
        is_published: norm.is_published ?? true,
        views: norm.views || 0,
      };
      list.push(item);
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
    const list = this._get(WEBSITE_KEYS.TESTIMONIALS, DEFAULT_WEBSITE_TESTIMONIALS).map(normalizeTestimonial);
    return onlyActive ? list.filter((t) => t.is_active && t.isActive !== false) : list;
  }

  saveTestimonial(testData) {
    const norm = normalizeTestimonial(testData);
    const list = this.getTestimonials(false);
    let updated;
    if (norm.id) {
      const idx = list.findIndex((t) => t.id === norm.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...norm };
        updated = list[idx];
      } else {
        const item = { ...norm, id: norm.id || `test-${Date.now()}` };
        list.push(item);
        updated = item;
      }
    } else {
      const item = {
        ...norm,
        id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        is_active: norm.is_active ?? true,
        rating: norm.rating || 5,
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
