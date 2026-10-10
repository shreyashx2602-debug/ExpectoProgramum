import unittest
import numpy as np
import pandas as pd
from feature_engineering import extract_features_from_transactions, FEATURE_NAMES
from income_synthesizer import synthesize_informal_income
from model_service import credit_engine
from explainability_service import explain_service
from what_if_service import simulate_counterfactual

class TestCredExplainCalculations(unittest.TestCase):

    def setUp(self):
        records = []
        for i in range(1, 60):
            if i % 6 == 0:
                ttype = "DEBIT"
                desc = "Wholesale supply payment"
            elif i % 10 == 0:
                ttype = "CREDIT"
                desc = "Family transfer relative gift"
            elif i == 15:
                ttype = "CREDIT"
                desc = "Short term peer loan receipt"
            else:
                ttype = "CREDIT"
                desc = f"UPI/P2M QR Customer order #{i}"

            records.append({
                "transaction_id": f"TXN-TST-{i}",
                "datetime": f"2025-11-{(i % 28) + 1:02d} 11:30:00",
                "amount": 250.0 if ttype == "CREDIT" else 1200.0,
                "type": ttype,
                "description": desc,
                "counterparty": f"Party-{i}"
            })
        self.tx_df = pd.DataFrame(records)

    def test_feature_engineering_dimensions(self):
        feats = extract_features_from_transactions(self.tx_df, business_age_years=3.0)
        for f in FEATURE_NAMES:
            self.assertIn(f, feats, f"Missing engineered feature: {f}")
        self.assertGreater(feats["avg_monthly_income"], 0)
        self.assertGreaterEqual(feats["on_time_utility_ratio"], 0.0)
        self.assertLessEqual(feats["on_time_utility_ratio"], 1.0)

    def test_income_synthesizer_classification(self):
        result = synthesize_informal_income(self.tx_df)
        self.assertIn("estimated_monthly_income", result)
        self.assertIn("confidence_level", result)
        self.assertIn("indicative_affordable_emi_range", result)
        self.assertGreater(result["included_business_receipts_count"], 0)
        self.assertGreater(result["excluded_personal_or_loan_count"], 0)

    def test_credit_scoring_bounds_and_monotonicity(self):
        feats = extract_features_from_transactions(self.tx_df, business_age_years=3.0)
        score_res = credit_engine.score_features(feats)
        score = score_res["credit_score"]
        pd = score_res["probability_of_default"]

        self.assertGreaterEqual(score, 300)
        self.assertLessEqual(score, 900)
        self.assertGreaterEqual(pd, 0.0)
        self.assertLessEqual(pd, 1.0)
        self.assertIn(score_res["decision_band"], [
            "Lower-Risk Review Band",
            "Intermediate-Risk Review Band",
            "Higher-Risk Review Band"
        ])

    def test_explainability_attributions(self):
        feats = extract_features_from_transactions(self.tx_df, business_age_years=3.0)
        expl = explain_service.explain_prediction(feats)
        self.assertIn("top_positive_factors", expl)
        self.assertIn("top_negative_factors", expl)
        self.assertGreater(len(expl["top_positive_factors"]), 0)
        self.assertIn("shap_waterfall_data", expl)

    def test_counterfactual_what_if_direction(self):
        feats = extract_features_from_transactions(self.tx_df, business_age_years=3.0)
        sim = simulate_counterfactual(
            base_features={**feats, "on_time_utility_ratio": 0.50},
            scenario_deltas={"on_time_utility_ratio": 1.00}
        )
        self.assertGreater(sim["simulated_score"], sim["original_score"])
        self.assertLess(sim["simulated_pd"], sim["original_pd"])

if __name__ == "__main__":
    unittest.main()
