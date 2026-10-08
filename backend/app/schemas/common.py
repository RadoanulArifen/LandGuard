from typing import Literal, Optional

from pydantic import BaseModel

SignalName = Literal["double_sale", "over_transfer", "rapid_transfer", "ownership_chain_break",
                     "registration_mismatch", "mutation_mismatch", "temporal_inconsistency"]
LevelName = Literal["Low", "Medium", "High", "Critical"]


class HealthOut(BaseModel):
    status: str
    database: bool
    analysis_ready: bool
    model_ready: bool
    transactions: int
    parcels: int


class ErrorOut(BaseModel):
    detail: str
    code: Optional[str] = None
