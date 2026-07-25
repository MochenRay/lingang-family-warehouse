"""R50：公告演示数据按真实基层通知结构撰写的结构断言。

每条通知正文 = 引言段 + 七个「【模块名】内容」分区
（通知对象/工作任务/时间安排/覆盖范围/执行要求/反馈方式/责任分工），
与前端 NoticeManagement 详情弹窗的解析口径保持一致。
"""

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
    """时间表述沿用原有口径，不新增未出现过的截止节点。"""
    contents = {record.id: record.content for record in build_notice_records()}

    assert "1月20日" in contents["notice_001"]
    assert "本周内" in contents["notice_002"]
    assert "12月21日凌晨1:00" in contents["notice_003"]
    assert "本周内" in contents["notice_004"]
    assert "本周五" in contents["notice_005"]
