from app.schemas.base import ReadSchema


class GridRead(ReadSchema):
    id: str
    name: str
    parentId: str | None = None
    managerName: str | None = None
