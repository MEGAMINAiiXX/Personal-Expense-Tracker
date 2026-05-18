from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date


# ─── Category ────────────────────────────────────────────────────────────────

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = "#6366f1"
    icon: str = "💰"

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True


# ─── Transaction ─────────────────────────────────────────────────────────────

class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0)
    type: str = Field(..., pattern="^(income|expense)$")
    date: date
    description: Optional[str] = None
    category_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    category: Optional[Category] = None

    class Config:
        from_attributes = True

class TransactionList(BaseModel):
    items: List[Transaction]
    total: int
