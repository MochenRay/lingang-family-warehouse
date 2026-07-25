"""R50：公告演示数据按真实基层通知结构撰写的结构断言。

每条通知正文 = 引言段 + 七个「【模块名】内容」分区
（通知对象/工作任务/时间安排/覆盖范围/执行要求/反馈方式/责任分工），
与前端 NoticeManagement 详情弹窗的解析口径保持一致。
"""

import re

import pytest

from app.demo_data.notices import build_notice_records

EXPECTED_IDS = ["notice_001", "notice_002", "notice_003", "notice_004", "notice_005"]

REQUIRED_SECTION_TITLES = [
    "通知对象",
    "工作任务",
    "时间安排",
    "覆盖范围",
    "执行要求",
    "反馈方式",
    "责任分工",
]


def _parse_sections(content: str) -> tuple[str, dict[str, str]]:
    """与前端 parseNoticeContent 相同的解析逻辑：引言 + 【模块】分区。"""
    intro_lines: list[str] = []
    sections: dict[str, list[str]] = {}
    current_title: str | None = None

    for line in content.split("\n"):
        stripped = line.strip()
        if stripped.startswith("【") and "】" in stripped:
            title, _, rest = stripped[1:].partition("】")
            current_title = title
            sections[title] = [rest.strip()]
        elif current_title is not None:
            sections[current_title].append(stripped)
        else:
            intro_lines.append(line)

    intro = "\n".join(intro_lines).strip()
    return intro, {title: "\n".join(body_lines).strip() for title, body_lines in sections.items()}


def test_notice_seed_count_ids_and_types_unchanged() -> None:
    """条数、id、类型与日期口径不变，只重写了正文。"""
    records = build_notice_records()

    assert [record.id for record in records] == EXPECTED_IDS
    assert [record.type for record in records] == ["task", "urgent", "system", "guide", "info"]
    assert [record.publishedAt for record in records] == [
        "2026-01-07 09:00",
        "2026-01-11 18:30",
        "2026-01-05 22:00",
        "2026-01-03 10:30",
        "2026-01-12 14:00",
    ]


def test_notice_content_follows_grassroots_notice_structure() -> None:
    """每条正文都带引言和七个必备模块，且每个模块内容非空。"""
    for record in build_notice_records():
        intro, sections = _parse_sections(record.content)

        assert intro, f"{record.id} 缺少引言段"
        for title in REQUIRED_SECTION_TITLES:
            assert title in sections, f"{record.id} 缺少【{title}】模块"
            assert sections[title], f"{record.id} 的【{title}】模块内容为空"


def test_notice_content_keeps_original_time_anchors() -> None:
    """原文已有的时间口径必须保留（存在性断言）。"""
    contents = {record.id: record.content for record in build_notice_records()}

    assert "1月20日" in contents["notice_001"]
    assert "本周内" in contents["notice_002"]
    assert "12月21日凌晨1:00" in contents["notice_003"]
    assert "本周内" in contents["notice_004"]
    assert "本周五" in contents["notice_005"]


# 各通知正文允许出现的日期 / 频率 / 量化表述，与改写前原文口径逐一对应：
# notice_001：1月20日前完成、第一季度考核、三项任务、2026年度第一季度（标题与引言）
# notice_002：本周内完成
# notice_003：12月21日凌晨1:00-3:00 维护窗口（标题）、当天采集
# notice_004：本周入户、完成一次试用
# notice_005：本周五前提交、近一月案件
# 任何新增的日期、频率或量化要求都会使下方测试失败；
# 确需新增时，须经产品确认后在此同步登记，不得只在正文里加内容。
ALLOWED_TIME_ANCHORS: dict[str, set[str]] = {
    "notice_001": {"1月20日", "2026年度", "第一季度", "三项"},
    "notice_002": {"本周内"},
    "notice_003": {"12月21日", "1:00", "3:00", "当天"},
    "notice_004": {"本周内", "一次"},
    "notice_005": {"本周五前", "近一个月"},
}

ANCHOR_PATTERNS = [
    r"\d{1,2}月\d{1,2}日(?:\d{1,2}:\d{2})?",  # 具体日期（可带时刻）：1月20日、12月20日24:00
    r"\d{1,2}:\d{2}",  # 具体时刻：1:00、18:00、24:00
    r"\d{4}年度?",  # 年度：2026年度、2026年
    r"第[一二三四]季度",  # 季度
    r"[本每]?周[一二三四五六日天](?:以?前)?",  # 周五、周五前、本周五前、每周五前、周天前
    r"本周[之]?内",  # 本周内 / 本周之内
    r"近[一二两三四五六七八九十\d]+个?月",  # 近一月、近一个月、近两个月、近2个月
    r"当天|当日",  # 当天 / 当日
    r"每[日天月年周]",  # 频率：每日、每天、每月、每年、每周
    r"[一二两三四五六七八九十]+(?:个?工作日|[例项次条户份人名家])",  # 中文量化：三项、一次、两例、一个工作日
    r"\d+(?:个?工作日|[例项次条户份人名家])",  # 阿拉伯量化：2例、1个工作日
]


def _extract_time_anchors(content: str) -> set[str]:
    found: set[str] = set()
    for pattern in ANCHOR_PATTERNS:
        found.update(re.findall(pattern, content))
    return found


def _find_unexpected_anchors(notice_id: str, content: str) -> set[str]:
    """正文中未在 allowlist 登记的日期/频率/量化锚点。"""
    return _extract_time_anchors(content) - ALLOWED_TIME_ANCHORS[notice_id]


def test_notice_content_uses_only_allowlisted_time_anchors() -> None:
    """正文不得出现 allowlist 之外的日期、频率或量化表述（精确兜底，防 false-green）。"""
    for record in build_notice_records():
        unexpected = _find_unexpected_anchors(record.id, record.content)
        assert not unexpected, (
            f"{record.id} 出现未登记的日期/频率/量化表述：{sorted(unexpected)}；"
            "如需新增请先在 ALLOWED_TIME_ANCHORS 登记并说明依据"
        )


def test_allowlist_entries_are_all_present_in_content() -> None:
    """allowlist 中的每个锚点都必须真的被扫描器从正文提取到。

    防止两类 false-green：扫描器模式失效（如全角括号永远匹配不到），
    以及 allowlist 登记了正文里并不存在的内容。
    """
    for record in build_notice_records():
        found = _extract_time_anchors(record.content)
        missing = ALLOWED_TIME_ANCHORS[record.id] - found
        assert not missing, (
            f"{record.id} 的 allowlist 含有扫描器未在正文提取到的锚点：{sorted(missing)}；"
            "请检查 ANCHOR_PATTERNS 是否失效，或清理过期登记"
        )


# 直接 mutation 用例：均为历史上被剔除或典型的违规锚点，注入任何一条都必须变红。
# 注入目标选 allowlist 最小的 notice_002（仅「本周内」），保证注入物必然未登记。
MUTATION_ANCHORS = [
    "周五前",
    "1月21日",
    "每周五前",
    "12月20日24:00",
    "18:00",
    "两例",
    "一个工作日",
]


@pytest.mark.parametrize("anchor", MUTATION_ANCHORS)
def test_injected_unregistered_anchor_is_caught_and_flagged(anchor: str) -> None:
    """mutation test：向正文注入非 allowlist 锚点，扫描器必须提取到且闸门必须判违规。"""
    base_content = next(r.content for r in build_notice_records() if r.id == "notice_002")
    mutated = f"{base_content}\n补充要求：请在{anchor}完成补充登记。"

    found = _extract_time_anchors(mutated)
    assert any(anchor in item or item in anchor for item in found), (
        f"扫描器未能提取注入的锚点 {anchor!r}，提取结果：{sorted(found)}"
    )

    unexpected = _find_unexpected_anchors("notice_002", mutated)
    assert any(anchor in item or item in anchor for item in unexpected), (
        f"注入的锚点 {anchor!r} 未被闸门判为违规：{sorted(unexpected)}"
    )
