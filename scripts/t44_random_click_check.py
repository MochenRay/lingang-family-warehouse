from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Callable

from playwright.sync_api import Page, TimeoutError, sync_playwright


BASE_URL = os.environ.get("T44_BASE_URL", "http://127.0.0.1:4173")
ARTIFACT_DIR = Path("/tmp/lingang-t44-artifacts")
RESULT_PATH = Path("/tmp/lingang-t44-random-click-results.json")


def ensure_artifacts() -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)


def wait_for_text(page: Page, text: str, timeout: int = 15000) -> None:
    page.get_by_text(text, exact=False).first.wait_for(state="visible", timeout=timeout)


def open_root(page: Page) -> None:
    page.goto(BASE_URL, wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle")
    wait_for_text(page, "综合统计驾驶舱")


def ensure_sidebar_item_visible(page: Page, group_label: str, item_label: str) -> None:
    sidebar = page.locator("aside").first
    item_button = sidebar.get_by_role("button", name=item_label, exact=True)
    if item_button.count() and item_button.first.is_visible():
        return
    sidebar.get_by_role("button", name=group_label, exact=True).click()
    item_button.first.wait_for(state="visible", timeout=10000)


def click_sidebar_item(page: Page, group_label: str, item_label: str, expect_text: str) -> None:
    open_root(page)
    ensure_sidebar_item_visible(page, group_label, item_label)
    page.locator("aside").first.get_by_role("button", name=item_label, exact=True).click()
    wait_for_text(page, expect_text)
    page.wait_for_load_state("networkidle")


def capture(page: Page, name: str) -> str:
    path = ARTIFACT_DIR / f"{name}.png"
    page.screenshot(path=str(path), full_page=True)
    return str(path)


def click_first_visible_button(page: Page, labels: list[str]) -> None:
    for label in labels:
        button = page.get_by_role("button", name=label, exact=True)
        if button.count() and button.first.is_visible():
            button.first.click()
            return
    raise AssertionError(f"None of the expected buttons appeared: {labels}")


def first_visible_heading(page: Page, candidates: list[str], timeout: int = 10000) -> str:
    for candidate in candidates:
      try:
        wait_for_text(page, candidate, timeout=timeout)
        return candidate
      except TimeoutError:
        continue
    raise AssertionError(f"None of the expected texts appeared: {candidates}")


def main() -> None:
    ensure_artifacts()
    results: list[dict[str, object]] = []
    console_errors: list[str] = []
    page_errors: list[str] = []

    def run_step(page: Page, name: str, fn: Callable[[], None]) -> None:
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

        run_step(
            page,
            "desktop-home",
            lambda: open_root(page),
        )

        run_step(
            page,
            "desktop-sidebar-cross-nav",
            lambda: (
                click_sidebar_item(page, "数据管理", "人口管理", "人口管理"),
                ensure_sidebar_item_visible(page, "数据管理", "房屋管理"),
                page.get_by_role("button", name="房屋管理").click(),
                wait_for_text(page, "房屋管理"),
                page.wait_for_load_state("networkidle"),
                page.wait_for_timeout(1500),
            ),
        )

        def knowledge_search_jump() -> None:
            open_root(page)
            ensure_sidebar_item_visible(page, "数仓智能体", "知识沉淀")
            page.get_by_role("button", name="知识沉淀").click()
            wait_for_text(page, "知识沉淀")
            page.get_by_placeholder("搜索资料、通知、人员或房屋...").fill("社区")
            wait_for_text(page, "全局检索结果")
            first_jump_button = page.get_by_role("button").filter(has_text="进入").first
            first_jump_button.wait_for(state="visible", timeout=10000)
            first_jump_button.click()
            reached = first_visible_heading(page, ["人口管理", "房屋管理", "公告管理"])
            results.append(
                {
                    "name": "desktop-search-target",
                    "status": "passed",
                    "detail": f"搜索结果跳转到 {reached}",
                    "screenshot": capture(page, "desktop-search-target"),
                }
            )

        run_step(page, "desktop-search-jump", knowledge_search_jump)

        def notice_preview() -> None:
            open_root(page)
            ensure_sidebar_item_visible(page, "网格事务", "公告管理")
            page.get_by_role("button", name="公告管理").click()
            wait_for_text(page, "公告列表")
            first_preview_button = page.locator("table tbody tr").first.locator("button").first
            first_preview_button.click()
            page.locator('[role="dialog"]').first.wait_for(state="visible", timeout=10000)

        run_step(page, "desktop-notice-preview", notice_preview)

        def anomaly_export() -> None:
            open_root(page)
            ensure_sidebar_item_visible(page, "归因分析（示例）", "异常结果分析")
            page.get_by_role("button", name="异常结果分析").click()
            wait_for_text(page, "异常结果分析")
            with page.expect_download(timeout=10000) as download_info:
                page.get_by_role("button", name="导出").click()
            download = download_info.value
            if not download.suggested_filename.startswith("anomaly-analysis-"):
                raise AssertionError(f"unexpected export filename: {download.suggested_filename}")

        run_step(page, "desktop-analysis-export", anomaly_export)

        def mobile_people_browse() -> None:
            open_root(page)
            click_first_visible_button(
                page,
                [
                    "打开移动端工作台",
                    "体验移动端主链",
                    "直接体验移动端",
                    "移动端小程序入口（演示用）",
                ],
            )
            wait_for_text(page, "首次体验建议")
            page.get_by_text("人口台账", exact=True).first.click()
            page.get_by_placeholder("搜索姓名/身份证/地址...").wait_for(state="visible", timeout=10000)
            page.get_by_role("button", name="工作台").click()
            wait_for_text(page, "首次体验建议")

        run_step(page, "mobile-home-browse", mobile_people_browse)

        browser.close()

    summary = {
        "base_url": BASE_URL,
        "results": results,
        "console_errors": console_errors,
        "page_errors": page_errors,
    }
    RESULT_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
