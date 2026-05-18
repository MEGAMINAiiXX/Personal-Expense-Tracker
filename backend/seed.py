"""Seed the database with default categories and sample transactions."""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
import models
from datetime import date, timedelta
import random

models.Base.metadata.create_all(bind=engine)

DEFAULT_CATEGORIES = [
    {"name": "Food & Dining",    "color": "#f97316", "icon": "🍽️"},
    {"name": "Transport",        "color": "#3b82f6", "icon": "🚗"},
    {"name": "Shopping",         "color": "#ec4899", "icon": "🛍️"},
    {"name": "Entertainment",    "color": "#8b5cf6", "icon": "🎬"},
    {"name": "Healthcare",       "color": "#10b981", "icon": "💊"},
    {"name": "Housing",          "color": "#6366f1", "icon": "🏠"},
    {"name": "Education",        "color": "#f59e0b", "icon": "📚"},
    {"name": "Salary",           "color": "#22c55e", "icon": "💼"},
    {"name": "Freelance",        "color": "#14b8a6", "icon": "💻"},
    {"name": "Investments",      "color": "#a855f7", "icon": "📈"},
    {"name": "Other",            "color": "#94a3b8", "icon": "📦"},
]

SAMPLE_DESCRIPTIONS = {
    "expense": [
        ("Grocery store", "Food & Dining"),
        ("Restaurant dinner", "Food & Dining"),
        ("Coffee shop", "Food & Dining"),
        ("Bus ticket", "Transport"),
        ("Taxi ride", "Transport"),
        ("Gas station", "Transport"),
        ("Amazon purchase", "Shopping"),
        ("Clothing store", "Shopping"),
        ("Netflix subscription", "Entertainment"),
        ("Cinema tickets", "Entertainment"),
        ("Gym membership", "Healthcare"),
        ("Pharmacy", "Healthcare"),
        ("Rent", "Housing"),
        ("Electricity bill", "Housing"),
        ("Online course", "Education"),
        ("Books", "Education"),
        ("Misc expense", "Other"),
    ],
    "income": [
        ("Monthly salary", "Salary"),
        ("Bonus", "Salary"),
        ("Freelance project", "Freelance"),
        ("Consulting fee", "Freelance"),
        ("Dividend", "Investments"),
        ("Stock profit", "Investments"),
    ],
}

def seed():
    db = SessionLocal()
    try:
        # Skip if already seeded
        if db.query(models.Category).count() > 0:
            print("Database already seeded. Skipping.")
            return

        # Create categories
        cat_map = {}
        for c in DEFAULT_CATEGORIES:
            obj = models.Category(**c)
            db.add(obj)
            db.flush()
            cat_map[c["name"]] = obj.id
        db.commit()
        print(f"Created {len(DEFAULT_CATEGORIES)} categories.")

        # Create sample transactions for last 6 months
        today = date.today()
        txs = []
        for days_back in range(180):
            d = today - timedelta(days=days_back)
            # ~2 expenses per day
            for _ in range(random.randint(0, 2)):
                desc, cat_name = random.choice(SAMPLE_DESCRIPTIONS["expense"])
                txs.append(models.Transaction(
                    amount=round(random.uniform(5, 500), 2),
                    type="expense",
                    date=d,
                    description=desc,
                    category_id=cat_map.get(cat_name),
                ))
            # ~2 income events per month (roughly every 15 days)
            if days_back % 15 == 0:
                desc, cat_name = random.choice(SAMPLE_DESCRIPTIONS["income"])
                txs.append(models.Transaction(
                    amount=round(random.uniform(500, 5000), 2),
                    type="income",
                    date=d,
                    description=desc,
                    category_id=cat_map.get(cat_name),
                ))

        db.bulk_save_objects(txs)
        db.commit()
        print(f"Created {len(txs)} sample transactions.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
