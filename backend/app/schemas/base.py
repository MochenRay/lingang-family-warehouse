from pydantic import ConfigDict
from sqlmodel import SQLModel


class ReadSchema(SQLModel):
    model_config = ConfigDict(from_attributes=True)
