from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List
from datetime import date, datetime
import csv
import io

from database import get_db, engine
import models
import schemas

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finance Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Categories ─────────────────────────────────────────────────────────────

@app.get("/categories", response_model=List[schemas.Category])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).order_by(models.Category.name).all()

@app.post("/categories", response_model=schemas.Category, status_code=201)
def create_category(cat: schemas.CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Category).filter(models.Category.name == cat.name).first()
    if existing:
        raise HTTPException(400, "Category already exists")
    db_cat = models.Category(**cat.dict())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@app.put("/categories/{cat_id}", response_model=schemas.Category)
def update_category(cat_id: int, cat: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not db_cat:
        raise HTTPException(404, "Category not found")
    db_cat.name = cat.name
    db_cat.color = cat.color
    db_cat.icon = cat.icon
    db.commit()
    db.refresh(db_cat)
    return db_cat

@app.delete("/categories/{cat_id}", status_code=204)
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    db_cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not db_cat:
        raise HTTPException(404, "Category not found")
    db.delete(db_cat)
    db.commit()

# ─── Transactions ────────────────────────────────────────────────────────────

@app.get("/transactions", response_model=schemas.TransactionList)
def get_transactions(
    skip: int = 0,
    limit: int = 50,
    category_id: Optional[int] = None,
    type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Transaction)
    if category_id:
        q = q.filter(models.Transaction.category_id == category_id)
    if type:
        q = q.filter(models.Transaction.type == type)
    if date_from:
        q = q.filter(models.Transaction.date >= date_from)
    if date_to:
        q = q.filter(models.Transaction.date <= date_to)
    if search:
        q = q.filter(models.Transaction.description.ilike(f"%{search}%"))
    total = q.count()
    items = q.order_by(models.Transaction.date.desc(), models.Transaction.id.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total}

@app.post("/transactions", response_model=schemas.Transaction, status_code=201)
def create_transaction(tx: schemas.TransactionCreate, db: Session = Depends(get_db)):
    if tx.category_id:
        cat = db.query(models.Category).filter(models.Category.id == tx.category_id).first()
        if not cat:
            raise HTTPException(404, "Category not found")
    db_tx = models.Transaction(**tx.dict())
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

@app.put("/transactions/{tx_id}", response_model=schemas.Transaction)
def update_transaction(tx_id: int, tx: schemas.TransactionCreate, db: Session = Depends(get_db)):
    db_tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
    if not db_tx:
        raise HTTPException(404, "Transaction not found")
    for k, v in tx.dict().items():
        setattr(db_tx, k, v)
    db.commit()
    db.refresh(db_tx)
    return db_tx

@app.delete("/transactions/{tx_id}", status_code=204)
def delete_transaction(tx_id: int, db: Session = Depends(get_db)):
    db_tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
    if not db_tx:
        raise HTTPException(404, "Transaction not found")
    db.delete(db_tx)
    db.commit()

# ─── Analytics ───────────────────────────────────────────────────────────────

@app.get("/analytics/summary")
def get_summary(
    year: int = Query(default=datetime.now().year),
    month: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Transaction).filter(
        extract("year", models.Transaction.date) == year
    )
    if month:
        q = q.filter(extract("month", models.Transaction.date) == month)

    income = q.filter(models.Transaction.type == "income").with_entities(
        func.coalesce(func.sum(models.Transaction.amount), 0)
    ).scalar()

    expense = q.filter(models.Transaction.type == "expense").with_entities(
        func.coalesce(func.sum(models.Transaction.amount), 0)
    ).scalar()

    return {
        "income": float(income),
        "expense": float(expense),
        "balance": float(income) - float(expense),
        "year": year,
        "month": month,
    }

@app.get("/analytics/by-category")
def get_by_category(
    year: int = Query(default=datetime.now().year),
    month: Optional[int] = None,
    type: str = "expense",
    db: Session = Depends(get_db),
):
    q = (
        db.query(
            models.Category.id,
            models.Category.name,
            models.Category.color,
            models.Category.icon,
            func.coalesce(func.sum(models.Transaction.amount), 0).label("total"),
        )
        .outerjoin(
            models.Transaction,
            (models.Transaction.category_id == models.Category.id)
            & (extract("year", models.Transaction.date) == year)
            & (models.Transaction.type == type)
        )
        .group_by(models.Category.id)
    )
    if month:
        q = (
            db.query(
                models.Category.id,
                models.Category.name,
                models.Category.color,
                models.Category.icon,
                func.coalesce(func.sum(models.Transaction.amount), 0).label("total"),
            )
            .outerjoin(
                models.Transaction,
                (models.Transaction.category_id == models.Category.id)
                & (extract("year", models.Transaction.date) == year)
                & (extract("month", models.Transaction.date) == month)
                & (models.Transaction.type == type)
            )
            .group_by(models.Category.id)
        )
    rows = q.all()
    return [
        {"id": r.id, "name": r.name, "color": r.color, "icon": r.icon, "total": float(r.total)}
        for r in rows if r.total > 0
    ]

@app.get("/analytics/monthly")
def get_monthly(
    year: int = Query(default=datetime.now().year),
    db: Session = Depends(get_db),
):
    results = []
    for m in range(1, 13):
        income = db.query(func.coalesce(func.sum(models.Transaction.amount), 0)).filter(
            models.Transaction.type == "income",
            extract("year", models.Transaction.date) == year,
            extract("month", models.Transaction.date) == m,
        ).scalar()
        expense = db.query(func.coalesce(func.sum(models.Transaction.amount), 0)).filter(
            models.Transaction.type == "expense",
            extract("year", models.Transaction.date) == year,
            extract("month", models.Transaction.date) == m,
        ).scalar()
        results.append({
            "month": m,
            "income": float(income),
            "expense": float(expense),
            "balance": float(income) - float(expense),
        })
    return results

# ─── Export ──────────────────────────────────────────────────────────────────

@app.get("/export/csv")
def export_csv(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Transaction).join(
        models.Category, models.Transaction.category_id == models.Category.id, isouter=True
    )
    if date_from:
        q = q.filter(models.Transaction.date >= date_from)
    if date_to:
        q = q.filter(models.Transaction.date <= date_to)
    txs = q.order_by(models.Transaction.date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Date", "Type", "Amount", "Category", "Description"])
    for tx in txs:
        writer.writerow([
            tx.id,
            tx.date,
            tx.type,
            tx.amount,
            tx.category.name if tx.category else "",
            tx.description or "",
        ])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )

@app.get("/health")
def health():
    return {"status": "ok"}
