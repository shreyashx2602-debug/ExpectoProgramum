import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(__file__), "sample_datasets")
os.makedirs(DATA_DIR, exist_ok=True)

PROFILES = [
    {
        "id": "APP-2026-081",
        "name": "Priya Sharma",
        "occupation": "Street Food Vendor",
        "business_name": "Sharma Chaat & Snacks",
        "location": "Indore, Madhya Pradesh",
        "years_in_business": 4.5,
        "daily_tx_count_range": (35, 75),
        "ticket_size_range": (30, 220),
        "inventory_relevant": False,
        "base_monthly_income": 32000,
        "base_expenses": 18000,
        "utility_on_time_prob": 0.94,
        "volatility_factor": 0.12,
        "buffer_ratio": 0.45
    },
    {
        "id": "APP-2026-142",
        "name": "Ramesh Kumar",
        "occupation": "Kirana Shopkeeper",
        "business_name": "Ramesh Provision & General Store",
        "location": "Jaipur, Rajasthan",
        "years_in_business": 7.0,
        "daily_tx_count_range": (20, 50),
        "ticket_size_range": (80, 1200),
        "inventory_relevant": True,
        "base_monthly_income": 58000,
        "base_expenses": 39000,
        "utility_on_time_prob": 0.88,
        "volatility_factor": 0.28,
        "buffer_ratio": 0.32
    },
    {
        "id": "APP-2026-295",
        "name": "Amit Patel",
        "occupation": "Gig Delivery Partner",
        "business_name": "Independent Fleet Operator",
        "location": "Ahmedabad, Gujarat",
        "years_in_business": 2.0,
        "daily_tx_count_range": (8, 22),
        "ticket_size_range": (150, 600),
        "inventory_relevant": False,
        "base_monthly_income": 26000,
        "base_expenses": 19500,
        "utility_on_time_prob": 0.76,
        "volatility_factor": 0.38,
        "buffer_ratio": 0.18
    }
]

def generate_synthetic_borrower_dataset(n_samples=5000, seed=42):
    """
    Generates a realistic synthetic borrower dataset of n_samples borrowers.
    Split into 70% Train, 15% Validation, 15% Test.
    """
    np.random.seed(seed)
    random.seed(seed)

    occupations = [
        ("Street Food Vendor", 0.30, False),
        ("Kirana Shopkeeper", 0.25, True),
        ("Gig Delivery Partner", 0.20, False),
        ("Tailor & Boutique", 0.15, True),
        ("Electrician / Plumber Trades", 0.10, False)
    ]

    records = []
    occ_names = [o[0] for o in occupations]
    occ_probs = [o[1] for o in occupations]
    inv_map = {o[0]: o[2] for o in occupations}

    for i in range(n_samples):
        b_id = f"BORR-{10000 + i}"
        occ = np.random.choice(occ_names, p=occ_probs)
        has_inv = inv_map[occ]
        age_biz = round(np.random.uniform(0.5, 12.0), 1)

        # Baseline financial scale
        if occ == "Street Food Vendor":
            income_base = np.random.normal(30000, 7000)
            margin = np.random.uniform(0.35, 0.55)
            volatility = np.random.uniform(0.10, 0.25)
            distinct_payers = np.random.randint(120, 450)
            tx_per_week = np.random.randint(150, 400)
        elif occ == "Kirana Shopkeeper":
            income_base = np.random.normal(60000, 18000)
            margin = np.random.uniform(0.18, 0.35)
            volatility = np.random.uniform(0.15, 0.35)
            distinct_payers = np.random.randint(80, 250)
            tx_per_week = np.random.randint(80, 260)
        elif occ == "Gig Delivery Partner":
            income_base = np.random.normal(25000, 6000)
            margin = np.random.uniform(0.25, 0.40)
            volatility = np.random.uniform(0.20, 0.45)
            distinct_payers = np.random.randint(15, 60)
            tx_per_week = np.random.randint(40, 140)
        elif occ == "Tailor & Boutique":
            income_base = np.random.normal(38000, 11000)
            margin = np.random.uniform(0.30, 0.50)
            volatility = np.random.uniform(0.22, 0.42)
            distinct_payers = np.random.randint(30, 110)
            tx_per_week = np.random.randint(25, 90)
        else: # Trades
            income_base = np.random.normal(32000, 9000)
            margin = np.random.uniform(0.40, 0.60)
            volatility = np.random.uniform(0.18, 0.38)
            distinct_payers = np.random.randint(20, 80)
            tx_per_week = np.random.randint(15, 65)

        income_base = max(12000, income_base)
        expenses_base = income_base * (1.0 - margin + np.random.normal(0, 0.05))
        expenses_base = max(7000, min(expenses_base, income_base * 0.95))

        # 12-month simulation for income volatility & lean month
        monthly_incomes = []
        for m in range(12):
            season_mult = 1.0
            if has_inv and m in [9, 10]: # Festive peak
                season_mult = np.random.uniform(1.25, 1.6)
            elif m in [6, 7]: # Monsoon lean
                season_mult = np.random.uniform(0.75, 0.95)
            noise_m = np.random.normal(0, volatility)
            m_inc = max(6000, income_base * season_mult * (1 + noise_m))
            monthly_incomes.append(m_inc)

        avg_monthly_income = float(np.mean(monthly_incomes))
        median_monthly_income = float(np.median(monthly_incomes))
        lean_month_income = float(np.min(monthly_incomes))
        conservative_income_p25 = float(np.percentile(monthly_incomes, 25))
        income_volatility_cv = float(np.std(monthly_incomes) / (avg_monthly_income + 1e-5))

        avg_monthly_expenses = float(expenses_base)
        estimated_surplus = max(0.0, avg_monthly_income - avg_monthly_expenses)
        surplus_ratio = estimated_surplus / (avg_monthly_income + 1e-5)

        # Count months with negative or near-zero surplus
        neg_surplus_months = sum(1 for inc in monthly_incomes if (inc - avg_monthly_expenses) < 0)

        # Utility bills behavior
        utility_discipline = np.random.beta(5, 1.5)
        on_time_utility_ratio = round(float(np.clip(utility_discipline, 0.4, 1.0)), 3)
        avg_utility_delay_days = round(float(max(0, (1.0 - on_time_utility_ratio) * 22 + np.random.normal(0, 2))), 1)
        missed_utility_count = int(max(0, np.random.poisson((1.0 - on_time_utility_ratio) * 3)))
        utility_consistency_score = round(float(max(0.2, on_time_utility_ratio - 0.03 * missed_utility_count)), 3)

        # Balance buffer & behavioral indicators
        buffer_ratio = float(np.clip(np.random.normal(0.35, 0.18), 0.05, 0.95))
        inflow_outflow_ratio = round(float(avg_monthly_income / (avg_monthly_expenses + 1e-5)), 2)
        income_concentration_ratio = round(float(np.clip(1.0 / (np.log(distinct_payers + 2) + 0.5), 0.12, 0.85)), 3)
        uncertain_inflow_pct = round(float(np.clip(np.random.beta(2, 12), 0.02, 0.35)), 3)

        if has_inv:
            inventory_turnover = round(float(np.clip(np.random.normal(4.2, 1.5), 1.0, 9.5)), 2)
            seasonal_swing_ratio = round(float(max(monthly_incomes) / (min(monthly_incomes) + 1e-5)), 2)
        else:
            inventory_turnover = 0.0
            seasonal_swing_ratio = 1.0

        affordable_emi_indicative = round(float(max(1500, estimated_surplus * 0.38)), 0)

        # Ground truth Default Event (Target for credit scoring)
        # Probabilistic, non-linear logit combination with realistic behavioral weights + noise
        logit = (
            - 1.4
            - 3.2 * (on_time_utility_ratio - 0.7)
            - 2.8 * (buffer_ratio - 0.3)
            - 2.5 * (surplus_ratio - 0.25)
            + 2.2 * (income_volatility_cv - 0.25)
            + 0.35 * neg_surplus_months
            + 1.8 * (uncertain_inflow_pct - 0.1)
            + 1.2 * (income_concentration_ratio - 0.3)
            - 0.08 * min(age_biz, 8.0)
            + np.random.normal(0, 0.45) # realistic stochastic unobserved variance
        )
        prob_default_true = 1.0 / (1.0 + np.exp(-logit))
        default_event = 1 if (np.random.rand() < prob_default_true) else 0

        # Synthetic demographic group for fairness audit (Disparate Impact & Parity analysis)
        geo_segment = np.random.choice(["Tier-1 Urban", "Tier-2/3 Semi-Urban", "Rural Outskirts"], p=[0.45, 0.40, 0.15])
        gender_group = np.random.choice(["Female Micro-Entrepreneur", "Male Micro-Entrepreneur"], p=[0.38, 0.62])

        records.append({
            "borrower_id": b_id,
            "occupation": occ,
            "business_age_years": age_biz,
            "has_inventory": int(has_inv),
            "avg_monthly_income": round(avg_monthly_income, 2),
            "median_monthly_income": round(median_monthly_income, 2),
            "lean_month_income": round(lean_month_income, 2),
            "conservative_income_p25": round(conservative_income_p25, 2),
            "income_volatility_cv": round(income_volatility_cv, 4),
            "avg_monthly_expenses": round(avg_monthly_expenses, 2),
            "estimated_surplus": round(estimated_surplus, 2),
            "surplus_ratio": round(surplus_ratio, 4),
            "neg_surplus_months": neg_surplus_months,
            "on_time_utility_ratio": on_time_utility_ratio,
            "avg_utility_delay_days": avg_utility_delay_days,
            "missed_utility_count": missed_utility_count,
            "utility_consistency_score": utility_consistency_score,
            "buffer_ratio": round(buffer_ratio, 4),
            "inflow_outflow_ratio": inflow_outflow_ratio,
            "tx_frequency_weekly": tx_per_week,
            "distinct_payers_count": distinct_payers,
            "income_concentration_ratio": income_concentration_ratio,
            "uncertain_inflow_pct": uncertain_inflow_pct,
            "inventory_turnover": inventory_turnover,
            "seasonal_swing_ratio": seasonal_swing_ratio,
            "affordable_emi_indicative": affordable_emi_indicative,
            "geo_segment": geo_segment,
            "demographic_group": gender_group,
            "prob_default_synthetic_ground_truth": round(prob_default_true, 4),
            "default_event": default_event
        })

    df = pd.DataFrame(records)
    # Train / Val / Test split
    n = len(df)
    n_train = int(n * 0.70)
    n_val = int(n * 0.15)
    
    train_df = df.iloc[:n_train]
    val_df = df.iloc[n_train:n_train + n_val]
    test_df = df.iloc[n_train + n_val:]

    train_df.to_csv(os.path.join(DATA_DIR, "synthetic_borrowers_train.csv"), index=False)
    val_df.to_csv(os.path.join(DATA_DIR, "synthetic_borrowers_val.csv"), index=False)
    test_df.to_csv(os.path.join(DATA_DIR, "synthetic_borrowers_test.csv"), index=False)

    print(f"Generated {len(df)} synthetic borrower records. Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}.")
    print(f"Overall Default Rate: {df['default_event'].mean():.2%}")
    return df

def generate_sample_applicant_csvs():
    """Generates realistic transaction, utility, and inventory CSVs for the 3 demo profiles."""
    start_date = datetime(2025, 10, 1)

    for prof in PROFILES:
        slug = prof["name"].lower().replace(" ", "_")
        tx_rows = []
        tx_id_counter = 1001

        # 90 days of transactions
        curr = start_date
        while curr <= datetime(2026, 1, 15):
            n_tx = random.randint(*prof["daily_tx_count_range"])
            for _ in range(n_tx):
                hr = random.randint(7, 21)
                mn = random.randint(0, 59)
                t_stamp = curr.replace(hour=hr, minute=mn)

                # Determine transaction type & description
                r = random.random()
                if r < 0.78:
                    ttype = "CREDIT"
                    amt = round(random.uniform(*prof["ticket_size_range"]), 2)
                    desc_templates = [
                        "UPI/P2M QR Payment Customer #{cid}",
                        "UPI Payment Ref #{cid} QuickPay",
                        "Cash Deposit Self Sale proceeds",
                        "Customer Order UPI-{cid}"
                    ]
                    desc = random.choice(desc_templates).format(cid=random.randint(100000, 999999))
                    payer = f"Customer-UPI-{random.randint(100, 999)}"
                    status = "VERIFIED_UPI" if random.random() < 0.94 else "UNVERIFIED_STATEMENT_ENTRY"
                elif r < 0.86:
                    ttype = "CREDIT"
                    amt = round(random.uniform(500, 5000), 2)
                    desc = random.choice(["Family Transfer NEFT from Relative", "Personal savings transfer", "Friend UPI Return"])
                    payer = "Relative / Personal"
                    status = "UNVERIFIED_PERSONAL"
                elif r < 0.90:
                    ttype = "CREDIT"
                    amt = round(random.uniform(2000, 15000), 2)
                    desc = "Short term peer loan receipt"
                    payer = "Community Lender"
                    status = "FLAGGED_LOAN_INFLOW"
                else:
                    ttype = "DEBIT"
                    if prof["inventory_relevant"]:
                        amt = round(random.uniform(400, 4500), 2)
                        desc = random.choice(["Wholesale Mandi supplier payment", "Inventory Restock NEFT", "Packaging material shop"])
                    else:
                        amt = round(random.uniform(150, 1800), 2)
                        desc = random.choice(["Raw ingredients market purchase", "Daily fuel / transport refill", "Cart electricity battery charge"])
                    payer = "Vendor Supplier"
                    status = "SETTLED_DEBIT"

                tx_rows.append({
                    "transaction_id": f"TXN-{slug[:3].upper()}-{tx_id_counter}",
                    "datetime": t_stamp.strftime("%Y-%m-%d %H:%M:%S"),
                    "amount": amt,
                    "type": ttype,
                    "description": desc,
                    "counterparty": payer,
                    "payment_mode": "UPI" if "UPI" in desc else "BANK_TRANSFER",
                    "verification_status": status,
                    "reference_number": f"REF{random.randint(10000000, 99999999)}"
                })
                tx_id_counter += 1
            curr += timedelta(days=1)

        tx_df = pd.DataFrame(tx_rows)
        tx_path = os.path.join(DATA_DIR, f"{slug}_transactions.csv")
        tx_df.to_csv(tx_path, index=False)
        print(f"Generated {len(tx_df)} transactions for {prof['name']} -> {tx_path}")

    # Generate sample utility bill records for 12 months
    utility_rows = []
    months = ["2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01"]
    for prof in PROFILES:
        slug = prof["name"].lower().replace(" ", "_")
        for m in months:
            bill_amt = random.randint(450, 1950) if not prof["inventory_relevant"] else random.randint(1800, 4200)
            is_on_time = random.random() < prof["utility_on_time_prob"]
            delay = 0 if is_on_time else random.randint(2, 14)
            status = "PAID_ON_TIME" if is_on_time else "PAID_LATE"
            utility_rows.append({
                "applicant_id": prof["id"],
                "applicant_name": prof["name"],
                "billing_month": m,
                "utility_type": "Electricity - Commercial/Shop",
                "bill_amount": bill_amt,
                "due_date": f"{m}-15",
                "payment_date": f"{m}-{15 + delay:02d}" if delay <= 13 else f"{m}-28",
                "days_late": delay,
                "status": status,
                "consumer_number": f"DISCOM-{random.randint(100000, 999999)}"
            })
    pd.DataFrame(utility_rows).to_csv(os.path.join(DATA_DIR, "sample_utility_bills.csv"), index=False)

    # Generate sample inventory analysis for Ramesh Kumar (Kirana shopkeeper)
    inventory_rows = [
        {"month": "2025-02", "opening_stock": 185000, "purchases": 92000, "sales": 115000, "closing_stock": 162000, "turnover_ratio": 0.66, "season": "Normal"},
        {"month": "2025-03", "opening_stock": 162000, "purchases": 105000, "sales": 122000, "closing_stock": 145000, "turnover_ratio": 0.79, "season": "Holi Festival Surge"},
        {"month": "2025-04", "opening_stock": 145000, "purchases": 98000, "sales": 118000, "closing_stock": 125000, "turnover_ratio": 0.87, "season": "Normal"},
        {"month": "2025-05", "opening_stock": 125000, "purchases": 110000, "sales": 120000, "closing_stock": 115000, "turnover_ratio": 1.00, "season": "Summer Marriage Rush"},
        {"month": "2025-06", "opening_stock": 115000, "purchases": 88000, "sales": 105000, "closing_stock": 98000, "turnover_ratio": 0.98, "season": "Monsoon Moderation"},
        {"month": "2025-07", "opening_stock": 98000, "purchases": 82000, "sales": 96000, "closing_stock": 84000, "turnover_ratio": 1.05, "season": "Monsoon Lean"},
        {"month": "2025-08", "opening_stock": 84000, "purchases": 95000, "sales": 102000, "closing_stock": 77000, "turnover_ratio": 1.26, "season": "Rakhi Uptick"},
        {"month": "2025-09", "opening_stock": 77000, "purchases": 140000, "sales": 130000, "closing_stock": 87000, "turnover_ratio": 1.58, "season": "Pre-Festive Stocking"},
        {"month": "2025-10", "opening_stock": 87000, "purchases": 195000, "sales": 185000, "closing_stock": 97000, "turnover_ratio": 2.01, "season": "Diwali Super Peak"},
        {"month": "2025-11", "opening_stock": 97000, "purchases": 110000, "sales": 128000, "closing_stock": 79000, "turnover_ratio": 1.45, "season": "Post-Diwali"},
        {"month": "2025-12", "opening_stock": 79000, "purchases": 98000, "sales": 116000, "closing_stock": 61000, "turnover_ratio": 1.65, "season": "Winter Normal"},
        {"month": "2026-01", "opening_stock": 61000, "purchases": 94000, "sales": 112000, "closing_stock": 43000, "turnover_ratio": 2.15, "season": "New Year Baseline"}
    ]
    pd.DataFrame(inventory_rows).to_csv(os.path.join(DATA_DIR, "sample_inventory_records.csv"), index=False)
    print("Sample datasets generated successfully.")

if __name__ == "__main__":
    generate_synthetic_borrower_dataset(5000)
    generate_sample_applicant_csvs()
