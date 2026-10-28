import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOT_DIR = os.path.abspath("./screenshots_owner")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

PAGES = [
    {
        "key": "01_login",
        "url": "http://localhost:5173/login",
        "title": "Tizimga Kirish (Login)",
        "desc": "Telefon raqam (+998), username yoki email orqali kabinetga xavfsiz kirish sahifasi."
    },
    {
        "key": "02_dashboard",
        "url": "http://localhost:5173/owner/dashboard",
        "title": "Boshqaruv Paneli (Dashboard)",
        "desc": "O'quv markazining barcha asosiy statistikasi, talabalar, ustozlar, guruhlar va kunlik darslar."
    },
    {
        "key": "03_users",
        "url": "http://localhost:5173/owner/users",
        "title": "Foydalanuvchilar Boshqaruvi (Users)",
        "desc": "Barcha xodimlar va o'quvchilar ro'yxati, yangi akkaunt ochish, tahrirlash va statusni boshqarish."
    },
    {
        "key": "04_passwords",
        "url": "http://localhost:5173/owner/passwords",
        "title": "Parollar Boshqaruvi (Passwords)",
        "desc": "Barcha akkauntlar parolini ko'rish, bir bosishda nusxa olish (Copy) va yangi parol biriktirish."
    },
    {
        "key": "05_courses",
        "url": "http://localhost:5173/owner/courses",
        "title": "Kurslar Boshqaruvi (Courses)",
        "desc": "O'quv yo'nalishlari, kurs kodlari, oylik to'lov narxlari va faol guruhlar soni."
    },
    {
        "key": "06_groups",
        "url": "http://localhost:5173/owner/groups",
        "title": "Guruhlar Boshqaruvi (Groups)",
        "desc": "Guruhlar ro'yxati, o'qituvchi biriktirish, xona, dars vaqti, talabalar qabuli va transfer."
    },
    {
        "key": "07_schedule",
        "url": "http://localhost:5173/owner/schedule",
        "title": "Haftalik Dars Jadvali (Schedule)",
        "desc": "Dushanbadan Yakshanbagacha interaktiv jadval, xona va o'qituvchi to'qnashuvlarini avtomatik aniqlash."
    },
    {
        "key": "08_attendance",
        "url": "http://localhost:5173/owner/attendance",
        "title": "Kunlik Davomat (Attendance)",
        "desc": "Darslar bo'yicha talabalar davomati: Hozir (Present), Kech qoldi (Late), Sababli va Sababsiz."
    },
    {
        "key": "09_grades",
        "url": "http://localhost:5173/owner/grades",
        "title": "5-Ballik Baholash (Grades)",
        "desc": "O'quvchilarning darsdagi o'zlashtirishini 1 dan 5 gacha baholash va izohlar (Feedback) qoldirish."
    },
    {
        "key": "10_homework",
        "url": "http://localhost:5173/owner/homework",
        "title": "Uyga Vazifalar (Homework)",
        "desc": "Mavzu bo'yicha vazifa yaratish, muddat (deadline) belgilash, fayllar biriktirish va javoblarni tekshirish."
    },
    {
        "key": "11_materials",
        "url": "http://localhost:5173/owner/materials",
        "title": "O'quv Materiallari (Materials)",
        "desc": "Darsliklar, PDF qo'llanmalar, taqdimotlar va video darslarni guruhlar bo'yicha yuklash."
    },
    {
        "key": "12_announcements",
        "url": "http://localhost:5173/owner/announcements",
        "title": "Markaz E'lonlari (Announcements)",
        "desc": "Barcha xodimlar va o'quvchilar uchun umumiy yoki guruhga xos muhim xabarnomalar berish."
    },
    {
        "key": "13_chat",
        "url": "http://localhost:5173/owner/chat",
        "title": "Guruhli Chat va Media (Chat)",
        "desc": "Telegram uslubidagi guruhli muloqot, 60s to'rtburchak video xabar, audio xabarlar va fayllar."
    },
    {
        "key": "14_payroll",
        "url": "http://localhost:5173/owner/payroll",
        "title": "Ish Haqi va Oyliklar (Payroll)",
        "desc": "Faqat Boshliq uchun: Fiks, Soatbay va Darsbay stavkalarda xodimlar maoshini hisoblash va yopish."
    },
    {
        "key": "15_tuition",
        "url": "http://localhost:5173/owner/tuition",
        "title": "O'qish To'lovlari (Tuition)",
        "desc": "Talabalar to'lovlari: To'langan, Qisman to'langan, Qarzdorlar hisobi va kassa to'lovlarini qabul qilish."
    },
    {
        "key": "16_reports",
        "url": "http://localhost:5173/owner/reports",
        "title": "Hisobotlar Markazi (Reports)",
        "desc": "Davomat, baholar, o'qituvchilar yuklamasi va markaz moliyaviy aylanmasi bo'yicha umumiy hisobotlar."
    },
    {
        "key": "17_audit",
        "url": "http://localhost:5173/owner/audit",
        "title": "Audit Jurnali (Audit Log)",
        "desc": "Tizimdagi barcha amallar tarixi: kim qachon kirdi, nimalarni yaratdi yoki o'zgartirdi (To'liq xavfsizlik)."
    },
    {
        "key": "18_notifications",
        "url": "http://localhost:5173/owner/notifications",
        "title": "Bildirishnomalar (Notifications)",
        "desc": "Yangi to'lovlar, davomat o'zgarishlari, yangi xabarlar va vazifalar haqidagi tezkor bildirishnomalar."
    },
    {
        "key": "19_settings",
        "url": "http://localhost:5173/owner/settings",
        "title": "Tizim Sozlamalari (Settings)",
        "desc": "Markaz nomi, vaqt mintaqasi, davomat qoidalari, til, tungi/kunduzgi rejim va profil sozlamalari."
    }
]

async def capture_all():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        # 1920x1080 viewport for ultra crisp screenshot
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=1
        )
        page = await context.new_page()

        # Step 1: Capture Login page first
        print("Capturing 01_login...")
        await page.goto("http://localhost:5173/login", timeout=15000)
        await page.wait_for_timeout(1500)
        # Ensure dark mode
        await page.evaluate("() => { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }")
        await page.wait_for_timeout(500)
        login_img = os.path.join(SCREENSHOT_DIR, "01_login.png")
        await page.screenshot(path=login_img)
        print("01_login captured!")

        # Step 2: Log in as Owner
        print("Logging in as Owner...")
        # Inject owner demo session directly into localStorage
        await page.evaluate("""() => {
            const mockUser = {
                id: 'usr-owner-1',
                email: 'owner@educo.app',
                phone: '+998901112233',
                user_metadata: {
                    role: 'owner',
                    full_name: 'Alisher Qodirov',
                    username: 'owner'
                }
            };
            const mockProfile = {
                id: 'usr-owner-1',
                username: 'owner',
                first_name: 'Alisher',
                last_name: 'Qodirov',
                full_name: 'Alisher Qodirov',
                role: 'owner',
                email: 'owner@educo.app',
                phone: '+998901112233',
                is_active: true
            };
            localStorage.setItem('educo_demo_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
            localStorage.setItem('theme', 'dark');
            document.documentElement.classList.add('dark');
        }""")

        # Navigate through all owner pages
        for item in PAGES[1:]:
            key = item["key"]
            url = item["url"]
            print(f"Navigating to {key}: {url}...")
            try:
                await page.goto(url, timeout=15000)
                await page.evaluate("() => { document.documentElement.classList.add('dark'); }")
                await page.wait_for_timeout(1500)
                out_path = os.path.join(SCREENSHOT_DIR, f"{key}.png")
                await page.screenshot(path=out_path)
                print(f"Captured {key} -> {out_path}")
            except Exception as e:
                print(f"Error capturing {key}: {e}")

        await browser.close()
        print("All screenshots successfully captured!")

if __name__ == "__main__":
    asyncio.run(capture_all())
