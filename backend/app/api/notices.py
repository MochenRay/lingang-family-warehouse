from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.notice import NoticeRecord
from app.schemas.notice import NoticeCreate, NoticeListRead, NoticeRead

router = APIRouter(prefix="/notices", tags=["notices"])


def _matches_query(notice: NoticeRecord, keyword: str, notice_type: str | None, status_value: str | None) -> bool:
    if keyword:
        haystack = f"{notice.title}||{notice.content}||{notice.publisher}||{notice.department}"
        if keyword.lower() not in haystack.lower():
            return False
    if notice_type and notice.type != notice_type:
        return False
    if status_value and notice.status != status_value:
        return False
    return True


def _sort_key(notice: NoticeRecord) -> tuple[str, str]:
    return notice.publishedAt, notice.id


@router.get("", response_model=NoticeListRead)
def list_notices(
    session: Session = Depends(get_session),
    q: str = Query(default=""),
    type: str | None = Query(default=None),
    status_value: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> NoticeListRead:
    notices = list(session.exec(select(NoticeRecord)).all())
    filtered = [notice for notice in notices if _matches_query(notice, q.strip(), type, status_value)]
    filtered.sort(key=_sort_key, reverse=True)
    items = filtered[offset: offset + limit]
    return NoticeListRead(items=[NoticeRead.model_validate(item) for item in items], total=len(filtered))


@router.get("/{notice_id}", response_model=NoticeRead)
def get_notice(notice_id: str, session: Session = Depends(get_session)) -> NoticeRead:
    notice = session.get(NoticeRecord, notice_id)
    if notice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Notice '{notice_id}' not found")
    return NoticeRead.model_validate(notice)


@router.post("", response_model=NoticeRead, status_code=status.HTTP_201_CREATED)
def create_notice(payload: NoticeCreate, session: Session = Depends(get_session)) -> NoticeRead:
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    notice = NoticeRecord(
        id=f"notice_{int(datetime.now().timestamp() * 1000)}",
        title=payload.title,
        type=payload.type,
        content=payload.content,
        scope=payload.scope,
        grids=payload.grids,
        status=payload.status,
        publishedAt=payload.publishedAt or payload.scheduledTime or now,
        publisher=payload.publisher,
        department=payload.department,
        scheduledTime=payload.scheduledTime,
        readCount=payload.readCount,
        attachments=[attachment.model_dump() for attachment in payload.attachments],
    )
    session.add(notice)
    session.commit()
    session.refresh(notice)
    return NoticeRead.model_validate(notice)


@router.delete("/{notice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notice(notice_id: str, session: Session = Depends(get_session)) -> Response:
    notice = session.get(NoticeRecord, notice_id)
    if notice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Notice '{notice_id}' not found")
    session.delete(notice)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
