from sqlmodel import Field, SQLModel

from app.schemas.base import ReadSchema


class NoticeAttachmentRead(ReadSchema):
    name: str
    size: str


class NoticeRead(ReadSchema):
    id: str
    title: str
    type: str
    content: str
    scope: list[str] = Field(default_factory=list)
    grids: list[str] = Field(default_factory=list)
    status: str
    publishedAt: str
    publisher: str
    department: str
    scheduledTime: str | None = None
    readCount: int = 0
    attachments: list[NoticeAttachmentRead] = Field(default_factory=list)


class NoticeCreate(SQLModel):
    title: str
    type: str
    content: str
    scope: list[str] = Field(default_factory=list)
    grids: list[str] = Field(default_factory=list)
    status: str = "published"
    publishedAt: str | None = None
    publisher: str = "系统管理员"
    department: str = "临港区社会治理现代化指挥中心"
    scheduledTime: str | None = None
    readCount: int = 0
    attachments: list[NoticeAttachmentRead] = Field(default_factory=list)


class NoticeListRead(ReadSchema):
    items: list[NoticeRead] = Field(default_factory=list)
    total: int
