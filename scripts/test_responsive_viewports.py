import asyncio
import os
import json
import sys
from playwright.async_api import async_playwright

VIEWPORTS = [
    {"name": "Mobile 320px (iPhone SE 1st)", "width": 320, "height": 568},
    {"name": "Mobile 375px (iPhone SE 2nd)", "width": 375, "height": 667},
    {"name": "Mobile 414px (iPhone 11/XR)", "width": 414, "height": 896},
    {"name": "Tablet 768px (iPad Portrait)", "width": 768, "height": 1024},
    {"name": "Tablet 1024px (iPad Landscape)", "width": 1024, "height": 768},
    {"name": "Desktop 1280px (Standard Laptop)", "width": 1280, "height": 800},
    {"name": "Desktop 1440px (Wide Screen)", "width": 1440, "height": 900},
    {"name": "Desktop 1920px (Full HD)", "width": 1920, "height": 1080},
]

ROLES_PAGES = {
    "owner": [
        "http://localhost:5173/owner/dashboard",
        "http://localhost:5173/owner/users",
        "http://localhost:5173/owner/groups",
        "http://localhost:5173/owner/courses",
        "http://localhost:5173/owner/schedule",
        "http://localhost:5173/owner/attendance",
        "http://localhost:5173/owner/grades",
        "http://localhost:5173/owner/homework",
        "http://localhost:5173/owner/materials",
        "http://localhost:5173/owner/announcements",
        "http://localhost:5173/owner/chat",
        "http://localhost:5173/owner/payroll",
        "http://localhost:5173/owner/tuition",
        "http://localhost:5173/owner/sms",
        "http://localhost:5173/owner/reports",
        "http://localhost:5173/owner/audit",
        "http://localhost:5173/owner/notifications",
        "http://localhost:5173/owner/settings",
        "http://localhost:5173/owner/passwords"
    ],
    "teacher": [
        "http://localhost:5173/teacher/dashboard",
        "http://localhost:5173/teacher/groups",
        "http://localhost:5173/teacher/students",
        "http://localhost:5173/teacher/attendance",
        "http://localhost:5173/teacher/schedule",
        "http://localhost:5173/teacher/grades",
        "http://localhost:5173/teacher/homework",
        "http://localhost:5173/teacher/materials"
    ],
    "student": [
        "http://localhost:5173/student/dashboard",
        "http://localhost:5173/student/attendance",
        "http://localhost:5173/student/schedule",
        "http://localhost:5173/student/homework",
        "http://localhost:5173/student/tuition"
    ],
    "public": [
        "http://localhost:5173/login",
        "http://localhost:5173/"
    ]
}

CHECK_OVERFLOW_JS = """() => {
    const docW = document.documentElement.clientWidth;
    const scrollW = document.documentElement.scrollWidth;
    const bodyW = document.body ? document.body.scrollWidth : 0;
    const winW = window.innerWidth;
    
    const overflowing = [];
    const all = document.querySelectorAll('*');
    for (const el of all) {
        if (['SCRIPT', 'STYLE', 'path', 'svg', 'BR', 'HEAD', 'META', 'TITLE'].includes(el.tagName)) continue;
        const rect = el.getBoundingClientRect();
        if (rect.right > winW + 2) {
            let parent = el.parentElement;
            let insideScrollContainer = false;
            while (parent && parent !== document.body && parent !== document.documentElement) {
                const style = window.getComputedStyle(parent);
                if (['auto', 'scroll', 'hidden'].includes(style.overflowX)) {
                    const pRect = parent.getBoundingClientRect();
                    if (pRect.right <= winW + 2) {
                        insideScrollContainer = true;
                        break;
                    }
                }
                parent = parent.parentElement;
            }
            if (!insideScrollContainer) {
                overflowing.push({
                    tag: el.tagName,
                    class: (el.className || '').toString().slice(0, 80),
                    id: el.id || '',
                    right: Math.round(rect.right),
                    overflow: Math.round(rect.right - winW),
                    text: (el.innerText || '').slice(0, 30).trim()
                });
            }
        }
    }
    
    return {
        winW,
        scrollW,
        hasDocOverflow: scrollW > winW + 2,
        overflowingElements: overflowing.slice(0, 5)
    };
}"""

def log(msg):
    print(msg, flush=True)

async def run_audit():
    results = []
    total_checks = 0
    overflow_count = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        
        for vp in VIEWPORTS:
            log(f"\n=======================================================")
            log(f" TESTING VIEWPORT: {vp['name']} ({vp['width']}x{vp['height']})")
            log(f"=======================================================")
            
            context = await browser.new_context(
                viewport={"width": vp["width"], "height": vp["height"]},
                device_scale_factor=1
            )
            page = await context.new_page()

            for role, urls in ROLES_PAGES.items():
                await page.goto("http://localhost:5173/login", timeout=10000, wait_until="domcontentloaded")
                await page.wait_for_timeout(150)
                
                if role != "public":
                    session_payload = {
                        "user": {
                            "id": f"usr-{role}-1",
                            "email": f"{role}@educo.app",
                            "phone": "+998901112233",
                            "user_metadata": {
                                "role": role,
                                "full_name": f"Test {role.capitalize()}",
                                "username": role
                            }
                        },
                        "profile": {
                            "id": f"usr-{role}-1",
                            "username": role,
                            "first_name": "Test",
                            "last_name": role.capitalize(),
                            "full_name": f"Test {role.capitalize()}",
                            "role": role,
                            "email": f"{role}@educo.app",
                            "phone": "+998901112233",
                            "is_active": True
                        }
                    }
                    await page.evaluate(f"""() => {{
                        localStorage.setItem('educo_demo_session', JSON.stringify({json.dumps(session_payload)}));
                        localStorage.setItem('theme', 'light');
                    }}""")
                else:
                    await page.evaluate("() => { localStorage.removeItem('educo_demo_session'); }")

                for url in urls:
                    total_checks += 1
                    try:
                        await page.goto(url, timeout=10000, wait_until="domcontentloaded")
                        await page.wait_for_timeout(300)
                        
                        overflow_data = await page.evaluate(CHECK_OVERFLOW_JS)
                        
                        path_name = url.replace("http://localhost:5173", "")
                        if overflow_data["hasDocOverflow"] or len(overflow_data["overflowingElements"]) > 0:
                            overflow_count += 1
                            log(f"  ❌ OVERFLOW [{vp['width']}px] {role.upper()} {path_name}: scrollW={overflow_data['scrollW']}px > winW={overflow_data['winW']}px")
                            for el in overflow_data["overflowingElements"]:
                                log(f"     -> {el['tag']}.{el['class']} (+{el['overflow']}px, text: '{el['text']}')")
                            results.append({
                                "viewport": vp["name"],
                                "width": vp["width"],
                                "role": role,
                                "path": path_name,
                                "status": "FAIL",
                                "details": overflow_data
                            })
                        else:
                            log(f"  ✅ OK [{vp['width']}px] {role.upper()} {path_name}")
                            results.append({
                                "viewport": vp["name"],
                                "width": vp["width"],
                                "role": role,
                                "path": path_name,
                                "status": "PASS"
                            })
                    except Exception as e:
                        log(f"  ⚠️ ERROR [{vp['width']}px] {role.upper()} {url}: {str(e)[:80]}")
                        results.append({
                            "viewport": vp["name"],
                            "width": vp["width"],
                            "role": role,
                            "path": url,
                            "status": "ERROR",
                            "error": str(e)
                        })

            await context.close()

        await browser.close()

    log(f"\n=======================================================")
    log(f" AUDIT COMPLETE: {total_checks} total checks, {overflow_count} overflows found")
    log(f"=======================================================")
    
    with open("responsive_audit_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    asyncio.run(run_audit())
