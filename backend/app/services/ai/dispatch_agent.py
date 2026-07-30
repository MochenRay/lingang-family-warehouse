from __future__ import annotations

from sqlmodel import Session

from app.services.ai.context_builder import build_grid_context


def risk_scan(session: Session, context_id: str | None = None) -> dict[str, object]:
    context = build_grid_context(session, context_id)
    if context.get("status") != "ready":
        return {
            "status": "missing",
            "agent_type": "dispatch_agent",
            "action": "risk-scan",
            "context_id": context_id,
            "summary": "未找到可用于风险扫描的网格对象。",
            "items": [],
            "context_cards": [],
        }

    counts = context.get("counts") if isinstance(context.get("counts"), dict) else {}
    risk_counts = context.get("risk_counts") if isinstance(context.get("risk_counts"), dict) else {}
    top_signals = context.get("top_signals") if isinstance(context.get("top_signals"), list) else []
    active_conflicts = context.get("active_conflicts") if isinstance(context.get("active_conflicts"), list) else []
    grid = context.get("grid") if isinstance(context.get("grid"), dict) else {}

    items: list[dict[str, object]] = []
    if int(risk_counts.get("High", 0)) > 0:
        items.append({
            "level": "high",
            "title": "高风险对象复核",
            "description": f"当前网格有 {risk_counts.get('High', 0)} 名高风险对象，建议优先安排走访或电话核验。",
        })
    if int(counts.get("active_conflicts", 0)) > 0:
        items.append({
            "level": "medium",
            "title": "矛盾纠纷跟进",
            "description": f"当前仍有 {counts.get('active_conflicts', 0)} 起未化解纠纷，建议按更新时间排序复盘。",
        })
    if top_signals:
        first_signal = top_signals[0]
        if isinstance(first_signal, dict):
            items.append({
                "level": "medium",
                "title": "标签聚集信号",
                "description": f"{first_signal.get('name')} 命中 {first_signal.get('count')} 次，可作为本轮研判主题。",
            })

    if not items:
        items.append({
            "level": "ok",
            "title": "暂无突出风险",
            "description": "当前演示数据未出现需要立即处置的突出风险。",
        })

    content = "\n".join(
        [
            f"网格：{grid.get('name', context.get('context_id'))}",
            f"人口 / 房屋 / 走访 / 纠纷：{counts.get('people', 0)} / {counts.get('houses', 0)} / {counts.get('visits', 0)} / {counts.get('conflicts', 0)}",
            f"风险分布：高风险={risk_counts.get('High', 0)}，中风险={risk_counts.get('Medium', 0)}，低风险={risk_counts.get('Low', 0)}",
            f"未化解纠纷：{counts.get('active_conflicts', 0)}",
        ]
    )

    return {
        "status": "ready",
        "agent_type": "dispatch_agent",
        "action": "risk-scan",
        "context_id": context["context_id"],
        "summary": "网格风险扫描已基于当前演示数据生成。",
        "content": content,
        "items": items,
        "active_conflicts": active_conflicts,
        "context_cards": [context],
    }
