"""Vstupní data jednoho porovnání."""

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ComparisonRequest(BaseModel):
    """Otázka a neprázdné výběry pro jedno porovnání."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    question: str = Field(min_length=1, max_length=20000)
    persona_ids: list[str] = Field(min_length=1)
    models: list[str] = Field(min_length=1)

    @field_validator("persona_ids", "models")
    @classmethod
    def validate_selection(cls, values: list[str]) -> list[str]:
        """Odmítne prázdné názvy a opakované položky výběru."""
        values = [value.strip() for value in values]
        if any(not value for value in values) or len(set(values)) != len(values):
            raise ValueError("Výběr nesmí obsahovat prázdné ani duplicitní položky.")
        return values
