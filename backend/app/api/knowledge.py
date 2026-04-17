from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.knowledge import KnowledgeRecord
from app.schemas.knowledge import KnowledgeEntryListRead, KnowledgeEntryRead

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


def _matches_query(
    entry: KnowledgeRecord,
    keyword: str,
    entry_type: str | None,
    category: str | None,
) -> bool:
    if keyword:
        haystack = "||".join(
            [
                entry.title,
                entry.summary,
                entry.content,
                entry.author,
                entry.source or "",
                *entry.tags,
            ]
        ).lower()
        if keyword.lower() not in haystack:
            return False
    if entry_type and entry.type != entry_type:
        return False
    if category and entry.category != category:
        return False
    return True


def _sort_key(entry: KnowledgeRecord) -> tuple[str, str]:
    return entry.uploadDate, entry.id


@router.get("", response_model=KnowledgeEntryListRead)
def list_knowledge(
    session: Session = Depends(get_session),
    q: str = Query(default=""),
    type: str | None = Query(default=None),
    category: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> KnowledgeEntryListRead:
    entries = list(session.exec(select(KnowledgeRecord)).all())
    filtered = [
        entry
        for entry in entries
        if _matches_query(entry, q.strip(), type, category)
    ]
    filtered.sort(key=_sort_key, reverse=True)
    items = filtered[offset : offset + limit]
    return KnowledgeEntryListRead(
        items=[KnowledgeEntryRead.model_validate(item) for item in items],
        total=len(filtered),
    )


@router.get("/{entry_id}", response_model=KnowledgeEntryRead)
def get_knowledge_entry(entry_id: str, session: Session = Depends(get_session)) -> KnowledgeEntryRead:
    entry = session.get(KnowledgeRecord, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge entry '{entry_id}' not found",
        )
    return KnowledgeEntryRead.model_validate(entry)
