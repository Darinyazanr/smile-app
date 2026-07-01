"""App Store 截图生成脚本 — iPhone 6.7" (1284×2778)"""
import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

BASE_URL = "http://localhost:8000"
OUTPUT_DIR = Path(__file__).parent
IPHONE_WIDTH = 1284
IPHONE_HEIGHT = 2778
# Web 预览时缩小到 1/3 方便显示，截图时放大
SCALE = 3
VIEWPORT_WIDTH = IPHONE_WIDTH // SCALE  # 428
VIEWPORT_HEIGHT = IPHONE_HEIGHT // SCALE  # 926

SCREENS = [
    ("01-login", "/auth", "登录页"),
    ("02-home", "/", "首页-已打卡"),
    ("03-calendar", "/calendar", "打卡日历"),
    ("04-stats", "/stats", "微笑统计"),
    ("05-settings", "/settings", "设置页"),
]

async def capture_screens():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            viewport={"width": VIEWPORT_WIDTH, "height": VIEWPORT_HEIGHT},
            device_scale_factor=SCALE,
        )
        page = await context.new_page()

        # 1. 先截图登录页
        await page.goto(f"{BASE_URL}/auth", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=str(OUTPUT_DIR / "01-login.png"), full_page=False)
        print("✅ 01-login.png")

        # 2. 点击「跳过登录」进入首页
        guest_btn = page.locator("text=跳过登录")
        try:
            await guest_btn.click(timeout=3000)
            await page.wait_for_timeout(2000)
        except:
            print("⚠️ 未找到跳过登录按钮，尝试直接访问首页")
            await page.goto(f"{BASE_URL}/", wait_until="networkidle")
            await page.wait_for_timeout(2000)

        await page.screenshot(path=str(OUTPUT_DIR / "02-home.png"), full_page=False)
        print("✅ 02-home.png")

        # 3. 日历页
        cal_btn = page.locator("text=日历")
        try:
            await cal_btn.click(timeout=3000)
        except:
            await page.goto(f"{BASE_URL}/calendar", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(OUTPUT_DIR / "03-calendar.png"), full_page=False)
        print("✅ 03-calendar.png")

        # 4. 统计页
        stats_btn = page.locator("text=统计")
        try:
            await stats_btn.click(timeout=3000)
        except:
            await page.goto(f"{BASE_URL}/stats", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(OUTPUT_DIR / "04-stats.png"), full_page=False)
        print("✅ 04-stats.png")

        # 5. 设置页
        settings_btn = page.locator("text=设置")
        try:
            await settings_btn.click(timeout=3000)
        except:
            await page.goto(f"{BASE_URL}/settings", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(OUTPUT_DIR / "05-settings.png"), full_page=False)
        print("✅ 05-settings.png")

        await browser.close()
        print("\n全部截图完成！")

asyncio.run(capture_screens())
