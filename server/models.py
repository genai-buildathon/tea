from pydantic import BaseModel
from typing import Literal

class Hoge(BaseModel):
    type: Literal["HOGE"]
    session_id: str
    mode: list[str]