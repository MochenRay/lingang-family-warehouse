from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Callable

from playwright.sync_api import Page, TimeoutError, sync_playwright


BASE_URL = os.environ.get("T46_BASE_URL", "http://127.0.0.1:4173")
ARTIFACT_DIR = Path("/tmp/lingang-t46-artifacts")
RESULT_PATH = Path("/tmp/lingang-t46-acceptance-results.json")


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
    item_button = page.get_by_role("button", name=item_label)
    if item_button.count() and item_button.first.is_visible():
        return
    page.get_by_role("button", name=group_label).click()
    item_button.first.wait_for(state="visible", timeout=10000)


def open_mobile_home(page: Page) -> None:
    open_root(page)
    page.get_by_role("button", name="移动端小程序入口（演示用）").click()
    wait_for_text(page, "治理总览")


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

        def batch_import_submission() -> None:
            open_root(page)
            ensure_sidebar_item_visible(page, "数据管理", "批量导入")
            page.get_by_role("button", name="批量导入").click()
            wait_for_text(page, "批量导入")
            file_input = page.locator('input[type="file"]').first
            file_input.set_input_files(
                {
                    "name": "demo-import.xlsx",
                    "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "buffer": b"sheet,data\n1,2\n",
                }
            )
            page.get_by_role("button", name="提交校验").click()
            wait_for_text(page, "最新受理记录")
            page.get_by_role("button", name="导入历史").click()
            wait_for_text(page, "待校验")

        def mobile_scan_sample() -> None:
            open_mobile_home(page)
            page.get_by_text("扫码核验", exact=True).first.click()
            wait_for_text(page, "居民二维码样例")
            page.get_by_role("button", name="居民二维码样例").click()
            wait_for_text(page, "人员详情")

        def mobile_house_collect() -> None:
            open_mobile_home(page)
            page.get_by_role("button", name="房屋").click()
            wait_for_text(page, "当前范围")
            page.locator("button:has(svg.lucide-plus)").first.click()
            wait_for_text(page, "房屋信息采集")
            page.get_by_placeholder("请输入社区名称").fill("海源社区")
            page.get_by_placeholder("1号楼").fill("8号楼")
            page.get_by_role("button").filter(has=page.locator("svg.lucide-qr-code")).first.click()
            page.get_by_role("button", name="提交审核").click()
            wait_for_text(page, "房屋台账")

        run_step(page, results, "desktop-batch-import", batch_import_submission)
        run_step(page, results, "mobile-scan-sample", mobile_scan_sample)
        run_step(page, results, "mobile-house-collect", mobile_house_collect)
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
