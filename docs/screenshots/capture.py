"""App Store 截图 — 每页独立 context 截图"""
import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

BASE_URL = "http://localhost:8000"
OUTPUT_DIR = Path(__file__).parent
W, H = 428, 926
SCALE = 3

async def snap(page, name, wait=3):
    await page.wait_for_timeout(wait * 1000)
    await page.screenshot(path=str(OUTPUT_DIR / name), full_page=False)
    size = (OUTPUT_DIR / name).stat().st_size
    text = (await page.inner_text("body"))[:80].replace("\n", " ")
    print(f"  ✅ {name} ({size:,}B) | {text}")

async def guest_snap(browser, name, target_path, wait=5):
    """独立 context: 登录 → 游客 → 导航到 target_path → 截图"""
    ctx = await browser.new_context(viewport={"width": W, "height": H}, device_scale_factor=SCALE)
    page = await ctx.new_page()

    # 进入游客模式
    await page.goto(f"{BASE_URL}/", wait_until="networkidle")
    await page.wait_for_timeout(4000)
    if "/auth" in page.url:
        await page.click("text=跳过登录", timeout=5000)
        await page.wait_for_timeout(4000)

    # 导航到目标页面
    await page.goto(f"{BASE_URL}{target_path}", wait_until="networkidle")
    await page.wait_for_timeout(wait * 1000)

    # 如果被重定向回登录页，重试一次
    text = await page.inner_text("body")
    if "跳过登录" in text or "邮箱" in text[:30]:
        print(f"    ⚠️ 重定向到登录页，重试...")
        await page.click("text=跳过登录", timeout=5000)
        await page.wait_for_timeout(3000)
        await page.goto(f"{BASE_URL}{target_path}", wait_until="networkidle")
        await page.wait_for_timeout(wait * 1000)

    await snap(page, name)
    await ctx.close()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # 01 登录页
        print("1. 登录页")
        ctx = await browser.new_context(viewport={"width": W, "height": H}, device_scale_factor=SCALE)
        page = await ctx.new_page()
        await page.goto(f"{BASE_URL}/auth", wait_until="networkidle")
        await snap(page, "01-login.png")
        await ctx.close()

        # 02-05: 每个独立截图
        print("\n2. 首页")
        await guest_snap(browser, "02-home.png", "/")

        print("\n3. 打卡日历")
        await guest_snap(browser, "03-calendar.png", "/calendar")

        print("\n4. 微笑统计")
        await guest_snap(browser, "04-stats.png", "/stats")

        print("\n5. 设置页")
        await guest_snap(browser, "05-settings.png", "/settings")

        await browser.close()
        print("\n✅ 全部完成!")

asyncio.run(main())
