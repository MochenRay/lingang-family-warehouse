from __future__ import annotations

from sqlmodel import Session

from app.services.ai.context_builder import build_person_context


RISK_LABELS = {"High": "高风险", "Medium": "中风险", "Low": "低风险"}


def _risk_label(value: object) -> str:
    normalized = str(value or "")
    return RISK_LABELS.get(normalized, normalized or "风险未评估")


def _person_name(context: dict[str, object]) -> str:
    person = context.get("person")
    if isinstance(person, dict):
        return str(person.get("name") or "该居民")
    return "该居民"


def _build_tag_suggestions(context: dict[str, object]) -> list[dict[str, object]]:
    person = context.get("person") if isinstance(context.get("person"), dict) else {}
    house = context.get("house") if isinstance(context.get("house"), dict) else {}
    visits = context.get("latest_visits") if isinstance(context.get("latest_visits"), list) else []
    signals = set(context.get("signals") if isinstance(context.get("signals"), list) else [])
    suggestions: list[dict[str, object]] = []

    if person.get("risk") == "High":
        suggestions.append({"tag": "重点关注", "reason": "当前为高风险，需进入重点跟进视图。"})
    if person.get("age", 0) and int(person.get("age", 0)) >= 65:
        suggestions.append({"tag": "老年人", "reason": "年龄达到老年人服务关注范围。"})
    if "独居老人" in signals:
        suggestions.append({"tag": "独居老人", "reason": "既有标签或关爱标签已命中独居老人。"})
    if house.get("type") == "出租" or "出租房" in set(house.get("tags") or []):
        suggestions.append({"tag": "出租房关联人员", "reason": "绑定房屋为出租或带出租标签，适合进入流动人口核验。"})
    if not person.get("phone_present"):
        suggestions.append({"tag": "信息待补齐", "reason": "联系电话缺失，后续走访前需补齐。"})
    if not visits:
        suggestions.append({"tag": "待首次走访", "reason": "当前未找到该居民或房屋的走访记录。"})

    seen: set[str] = set()
    unique: list[dict[str, object]] = []
    for item in suggestions:
        tag = str(item["tag"])
        if tag not in seen:
            seen.add(tag)
            unique.append(item)
    return unique[:5]


def profile_summary(session: Session, context_id: str | None = None) -> dict[str, object]:
    context = build_person_context(session, context_id)
    if context.get("status") != "ready":
        return {
            "status": "missing",
            "agent_type": "data_agent",
            "action": "profile-summary",
            "context_id": context_id,
            "summary": "未找到可用于画像摘要的居民对象。",
            "items": [],
            "context_cards": [],
        }

    person = context["person"]
    house = context.get("house")
    visits = context.get("latest_visits") if isinstance(context.get("latest_visits"), list) else []
    missing_fields = context.get("missing_fields") if isinstance(context.get("missing_fields"), list) else []
    name = _person_name(context)

    house_text = "未绑定房屋"
    if isinstance(house, dict):
        house_text = f"{house.get('address')}，{house.get('type')}，现住 {house.get('memberCount')} 人"

    content = "\n".join(
        [
            f"{name}，{person.get('age')} 岁，{person.get('type')}，风险等级 {_risk_label(person.get('risk'))}。",
            f"居住信息：{house_text}。",
            f"标签信号：{'、'.join(context.get('signals') or []) or '暂无显式标签'}。",
            f"最近走访：{visits[0].get('date') + ' ' + visits[0].get('content') if visits else '暂无走访记录'}",
            f"待补字段：{'、'.join(missing_fields) if missing_fields else '暂无关键缺口'}。",
        ]
    )

    return {
        "status": "ready",
        "agent_type": "data_agent",
        "action": "profile-summary",
        "context_id": context["context_id"],
        "summary": f"{name}画像摘要已基于当前演示数据生成。",
        "content": content,
        "items": _build_tag_suggestions(context),
        "context_cards": [context],
    }


def suggest_tags(session: Session, context_id: str | None = None) -> dict[str, object]:
    context = build_person_context(session, context_id)
    if context.get("status") != "ready":
        return {
            "status": "missing",
            "agent_type": "data_agent",
            "action": "suggest-tags",
            "context_id": context_id,
            "summary": "未找到可用于标签建议的居民对象。",
            "items": [],
            "context_cards": [],
        }

    suggestions = _build_tag_suggestions(context)
    return {
        "status": "ready",
        "agent_type": "data_agent",
        "action": "suggest-tags",
        "context_id": context["context_id"],
        "summary": f"已为{_person_name(context)}生成 {len(suggestions)} 条标签建议。",
        "items": suggestions,
        "context_cards": [context],
    }


def validate_profile(session: Session, context_id: str | None = None) -> dict[str, object]:
    context = build_person_context(session, context_id)
    if context.get("status") != "ready":
        return {
            "status": "missing",
            "agent_type": "data_agent",
            "action": "validate",
            "context_id": context_id,
            "summary": "未找到可用于质量检查的居民对象。",
            "items": [],
            "context_cards": [],
        }

    missing_fields = context.get("missing_fields") if isinstance(context.get("missing_fields"), list) else []
    items = [
        {"level": "warning", "field": field, "message": f"{field}缺失或未绑定。"}
        for field in missing_fields
    ]
    if not items:
        items.append({"level": "ok", "field": "profile", "message": "当前核心画像字段完整。"})

    return {
        "status": "ready",
        "agent_type": "data_agent",
        "action": "validate",
        "context_id": context["context_id"],
        "summary": f"{_person_name(context)}数据质量检查完成。",
        "items": items,
        "context_cards": [context],
    }
