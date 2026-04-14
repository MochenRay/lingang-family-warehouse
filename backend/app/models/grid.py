from sqlmodel import Field, SQLModel


class GridBase(SQLModel):
    id: str
    name: str = Field(index=True, max_length=120)
    parentId: str | None = Field(default=None, foreign_key="grids.id", index=True)
    managerName: str | None = Field(default=None, max_length=80)


class Grid(GridBase, table=True):
    __tablename__ = "grids"

    id: str = Field(primary_key=True, max_length=64)
