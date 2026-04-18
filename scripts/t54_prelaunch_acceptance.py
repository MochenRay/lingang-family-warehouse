from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Callable

from playwright.sync_api import Page, sync_playwright


BASE_URL = os.environ.get("T54_BASE_URL", "http://127.0.0.1:4173")
ARTIFACT_DIR = Path("/tmp/lingang-t54-artifacts")
RESULT_PATH = Path("/tmp/lingang-t54-acceptance-results.json")


def ensure_artifacts() -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)


def wait_for_text(page: Page, text: str, timeout: int = 15000) -> None:
    page.get_by_text(text, exact=False).first.wait_for(state="visible", timeout=timeout)


def capture(page: Page, name: str) -> str:
    path = ARTIFACT_DIR / f"{name}.png"
    page.screenshot(path=str(path), full_page=True)
    return str(path)


def open_root(page: Page) -> None:
    page.goto(BASE_URL, wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle")
    wait_for_text(page, "综合统计驾驶舱")


def ensure_sidebar_item_visible(page: Page, group_label: str, item_label: str) -> None:
    button = page.get_by_role("button", name=item_label)
    if button.count() and button.first.is_visible():
        return
    page.get_by_role("button", name=group_label).click()
    button.first.wait_for(state="visible", timeout=10000)


def run_step(page: Page, results: list[dict[str, object]], name: str, fn: Callable[[], None]) -> None:
    try:
        fn()
        results.append(
            {
                "name": name,
                "status": "passed",
                "screenshot": capture(page, name),
            }
        )
    except Exception as error:  # noqa: BLE001
        results.append(
            {
                "name": name,
                "status": "failed",
                "error": str(error),
                "screenshot": capture(page, f"{name}-failed"),
            }
        )


def free_browse_entry(page: Page) -> None:
    open_root(page)
    wait_for_text(page, "推荐浏览路径")
    wait_for_text(page, "打开移动端工作台")
    page.get_by_role("button", name="从人口管理开始").click()
    wait_for_text(page, "人口管理")


def directed_demo_mainline(page: Page) -> None:
    open_root(page)
    page.get_by_role("button", name="从人口管理开始").click()
    wait_for_text(page, "人口管理")

    ensure_sidebar_item_visible(page, "数据管理", "房屋管理")
    page.get_by_role("button", name="房屋管理").click()
    wait_for_text(page, "房屋管理")

    ensure_sidebar_item_visible(page, "网格事务", "矛盾调解")
    page.get_by_role("button", name="矛盾调解").click()
    wait_for_text(page, "矛盾调解")

    page.get_by_role("button", name="打开移动端工作台").click()
    wait_for_text(page, "首次体验建议")
    page.get_by_role("button", name="先看待办清单").click()
    wait_for_text(page, "今日待办")


def main() -> None:
    ensure_artifacts()
    results: list[dict[str, object]] = []
    console_errors: list[str] = []
    page_errors: list[str] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 960})
        page.on(
            "console",
            lambda message: console_errors.append(message.text)
            if message.type == "error"
            else None,
        )
        page.on("pageerror", lambda error: page_errors.append(str(error)))

        run_step(page, results, "free-browse-entry", lambda: free_browse_entry(page))
        run_step(page, results, "directed-demo-mainline", lambda: directed_demo_mainline(page))

        browser.close()

    RESULT_PATH.write_text(
        json.dumps(
            {
                "base_url": BASE_URL,
                "results": results,
                "console_errors": console_errors,
                "page_errors": page_errors,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
