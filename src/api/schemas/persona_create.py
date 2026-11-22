"""Vstupní data pro vytvoření persony."""

from pydantic import BaseModel, ConfigDict, Field


class PersonaCreate(BaseModel):
    """Povinné údaje pro vytvoření nové osobnosti."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)
    system_prompt: str = Field(min_length=1, max_length=20000)
