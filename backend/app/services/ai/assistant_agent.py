from __future__ import annotations

from sqlmodel import Session

from app.services.ai.context_builder import build_person_context


def visit_outline(session: Session, context_id: str | None = None) -> dict[str, object]:
    context = build_person_context(session, context_id)
    if context.get("status") != "ready":
        return {
            "status": "missing",
            "agent_type": "assistant",
            "action": "visit-outline",
            "context_id": context_id,
            "summary": "未找到可用于走访提纲的居民对象。",
            "items": [],
            "context_cards": [],
        }

    person = context.get("person") if isinstance(context.get("person"), dict) else {}
    house = context.get("house") if isinstance(context.get("house"), dict) else {}
    missing_fields = context.get("missing_fields") if isinstance(context.get("missing_fields"), list) else []
    signals = context.get("signals") if isinstance(context.get("signals"), list) else []
    name = str(person.get("name") or "该居民")

    items = [
        {"title": "核实基本状态", "content": f"确认{name}近期居住、联系方式和家庭成员变化。"},
        {"title": "回看历史记录", "content": "对照最近一次走访摘要，确认上次问题是否闭环。"},
        {"title": "风险与服务需求", "content": f"围绕{'、'.join(signals[:3]) if signals else '现有标签'}询问是否存在新增风险或服务诉求。"},
    ]
    if missing_fields:
        items.append({"title": "补齐台账字段", "content": f"本次优先补齐：{'、'.join(missing_fields)}。"})
    if house:
        items.append({"title": "房屋侧核验", "content": f"同步核验房屋 {house.get('address')} 的居住状态和住户变化。"})

    content = "\n".join(f"{index + 1}. {item['title']}：{item['content']}" for index, item in enumerate(items))

    return {
        "status": "ready",
        "agent_type": "assistant",
        "action": "visit-outline",
        "context_id": context["context_id"],
        "summary": f"{name}走访提纲已基于当前演示数据生成。",
        "content": content,
        "items": items,
        "context_cards": [context],
    }
