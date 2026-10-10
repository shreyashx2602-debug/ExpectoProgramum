import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from feature_engineering import FEATURE_NAMES

DATA_DIR = os.path.join(os.path.dirname(__file__), "sample_datasets")
MODEL_JSON_PATH = os.path.join(os.path.dirname(__file__), "trained_credit_model.json")

class PureNumpyLogisticRegression:
    def __init__(self, lr=0.15, l2_reg=0.005, epochs=1200):
        self.lr = lr
        self.l2_reg = l2_reg
        self.epochs = epochs
        self.weights = None
        self.bias = 0.0

    def fit(self, X: np.ndarray, y: np.ndarray):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = np.log(y.mean() / (1.0 - y.mean() + 1e-5))

        pos_weight = (1.0 - y.mean()) / (y.mean() + 1e-5)

        for epoch in range(self.epochs):
            linear = np.dot(X, self.weights) + self.bias
            linear_clipped = np.clip(linear, -12.0, 12.0)
            preds = 1.0 / (1.0 + np.exp(-linear_clipped))

            # Sample weight to balance positive class
            sample_w = np.where(y == 1, pos_weight, 1.0)
            errors = (preds - y) * sample_w

            dw = (np.dot(X.T, errors) / n_samples) + (self.l2_reg * self.weights)
            db = np.sum(errors) / n_samples

            self.weights -= self.lr * dw
            self.bias -= self.lr * db

    def predict_logits(self, X: np.ndarray) -> np.ndarray:
        linear = np.dot(X, self.weights) + self.bias
        return np.clip(linear, -12.0, 12.0)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        logits = self.predict_logits(X)
        return 1.0 / (1.0 + np.exp(-logits))

class PlattCalibrator:
    """Monotonic Platt scaling: P(y=1|f) = 1 / (1 + exp(-(a*f + b))) where a > 0"""
    def __init__(self):
        self.a = 1.0
        self.b = 0.0

    def fit(self, logits: np.ndarray, y: np.ndarray, epochs=500, lr=0.05):
        n = len(logits)
        a = 1.0
        b = 0.0

        for _ in range(epochs):
            # p = 1 / (1 + exp(-(a*f + b)))
            z = np.clip(a * logits + b, -12.0, 12.0)
            p = 1.0 / (1.0 + np.exp(-z))
            err = p - y

            da = np.sum(err * logits) / n
            db = np.sum(err) / n

            a -= lr * da
            b -= lr * db
            a = max(0.1, a) # preserve monotonic direction

        self.a = float(a)
        self.b = float(b)

    def predict_proba(self, logits: np.ndarray) -> np.ndarray:
        z = np.clip(self.a * logits + self.b, -12.0, 12.0)
        return 1.0 / (1.0 + np.exp(-z))

def compute_auc_roc(y_true: np.ndarray, y_score: np.ndarray) -> float:
    n_pos = int(np.sum(y_true == 1))
    n_neg = int(np.sum(y_true == 0))
    if n_pos == 0 or n_neg == 0:
        return 0.5
    ranks = pd.Series(y_score).rank().values
    sum_ranks_pos = np.sum(ranks[y_true == 1])
    auc = (sum_ranks_pos - (n_pos * (n_pos + 1)) / 2.0) / (n_pos * n_neg)
    return float(np.clip(auc, 0.0, 1.0))

class CreditScoringEngine:
    def __init__(self):
        self.feature_names = FEATURE_NAMES
        self.base_model = PureNumpyLogisticRegression()
        self.calibrator = PlattCalibrator()
        self.scaler_mean = None
        self.scaler_scale = None
        self.model_version = "v1.4.2-platt-calibrated"
        self.performance_metrics = {}
        self._initialize_or_load()

    def _initialize_or_load(self):
        if os.path.exists(MODEL_JSON_PATH):
            try:
                with open(MODEL_JSON_PATH, "r") as f:
                    data = json.load(f)
                if data.get("metrics", {}).get("auc_roc", 0) > 0.65:
                    self.scaler_mean = np.array(data["mean"])
                    self.scaler_scale = np.array(data["scale"])
                    self.base_model.weights = np.array(data["weights"])
                    self.base_model.bias = float(data["bias"])
                    self.calibrator.a = float(data["calib_a"])
                    self.calibrator.b = float(data["calib_b"])
                    self.performance_metrics = data["metrics"]
                    print("Loaded valid trained model parameters from JSON.")
                    return
            except Exception as e:
                print(f"Loading json failed: {e}")
        self.train_and_calibrate()

    def train_and_calibrate(self):
        train_path = os.path.join(DATA_DIR, "synthetic_borrowers_train.csv")
        val_path = os.path.join(DATA_DIR, "synthetic_borrowers_val.csv")
        test_path = os.path.join(DATA_DIR, "synthetic_borrowers_test.csv")

        train_df = pd.read_csv(train_path)
        val_df = pd.read_csv(val_path)
        test_df = pd.read_csv(test_path)

        X_train = train_df[self.feature_names].values.astype(float)
        y_train = train_df["default_event"].values.astype(int)
        X_val = val_df[self.feature_names].values.astype(float)
        y_val = val_df["default_event"].values.astype(int)
        X_test = test_df[self.feature_names].values.astype(float)
        y_test = test_df["default_event"].values.astype(int)

        self.scaler_mean = np.nanmean(X_train, axis=0)
        self.scaler_scale = np.nanstd(X_train, axis=0)
        self.scaler_scale[self.scaler_scale == 0] = 1.0

        X_train_s = (X_train - self.scaler_mean) / self.scaler_scale
        X_val_s = (X_val - self.scaler_mean) / self.scaler_scale
        X_test_s = (X_test - self.scaler_mean) / self.scaler_scale

        # Fit base model
        self.base_model.fit(X_train_s, y_train)

        # Fit Platt calibration
        val_logits = self.base_model.predict_logits(X_val_s)
        self.calibrator.fit(val_logits, y_val)

        # Evaluate on test set
        test_logits = self.base_model.predict_logits(X_test_s)
        test_probs = self.calibrator.predict_proba(test_logits)
        test_preds = (test_probs >= 0.22).astype(int)

        auc_roc = compute_auc_roc(y_test, test_probs)

        tn = int(np.sum((y_test == 0) & (test_preds == 0)))
        fp = int(np.sum((y_test == 0) & (test_preds == 1)))
        fn = int(np.sum((y_test == 1) & (test_preds == 0)))
        tp = int(np.sum((y_test == 1) & (test_preds == 1)))

        precision = tp / (tp + fp + 1e-5)
        recall = tp / (tp + fn + 1e-5)
        f1 = 2 * (precision * recall) / (precision + recall + 1e-5)

        # KS Statistic
        df_ks = pd.DataFrame({"score": test_probs, "target": y_test}).sort_values("score", ascending=False)
        total_def = max(1, (df_ks["target"] == 1).sum())
        total_non_def = max(1, (df_ks["target"] == 0).sum())
        df_ks["cum_def"] = (df_ks["target"] == 1).cumsum() / total_def
        df_ks["cum_non_def"] = (df_ks["target"] == 0).cumsum() / total_non_def
        ks_stat = float((df_ks["cum_def"] - df_ks["cum_non_def"]).max())

        # Calibration Curve (8 bins)
        bins = np.linspace(0.0, 1.0, 9)
        calib_points = []
        for b_start, b_end in zip(bins[:-1], bins[1:]):
            mask = (test_probs >= b_start) & (test_probs < b_end)
            if mask.sum() > 0:
                calib_points.append({
                    "predicted_prob": round(float(test_probs[mask].mean()), 3),
                    "empirical_default_rate": round(float(y_test[mask].mean()), 3)
                })

        self.performance_metrics = {
            "model_version": self.model_version,
            "training_samples": len(train_df),
            "test_samples": len(test_df),
            "auc_roc": round(float(auc_roc), 4),
            "ks_statistic": round(float(ks_stat), 4),
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "f1_score": round(float(f1), 4),
            "confusion_matrix": {
                "true_negative": tn,
                "false_positive": fp,
                "false_negative": fn,
                "true_positive": tp
            },
            "calibration_curve": calib_points,
            "test_default_rate": round(float(np.mean(y_test)), 4)
        }

        save_data = {
            "mean": self.scaler_mean.tolist(),
            "scale": self.scaler_scale.tolist(),
            "weights": self.base_model.weights.tolist(),
            "bias": float(self.base_model.bias),
            "calib_a": float(self.calibrator.a),
            "calib_b": float(self.calibrator.b),
            "metrics": self.performance_metrics
        }
        with open(MODEL_JSON_PATH, "w") as f:
            json.dump(save_data, f, indent=2)

        print(f"Credit model trained! AUC-ROC: {auc_roc:.4f}, KS: {ks_stat:.4f}")

    def score_features(self, features: Dict[str, float]) -> Dict[str, Any]:
        raw_vec = np.array([features.get(f, 0.0) for f in self.feature_names], dtype=float).reshape(1, -1)
        scaled_vec = (raw_vec - self.scaler_mean) / self.scaler_scale

        logits = self.base_model.predict_logits(scaled_vec)
        prob_default = float(self.calibrator.predict_proba(logits)[0])

        score = int(round(300 + (1.0 - prob_default) * 600))
        score = max(300, min(900, score))

        if score >= 750:
            band = "Lower-Risk Review Band"
            recommendation = "Low Risk / Recommended for Approval"
            badge_color = "success"
        elif score >= 600:
            band = "Intermediate-Risk Review Band"
            recommendation = "Moderate Risk / Manual Review Recommended"
            badge_color = "warning"
        else:
            band = "Higher-Risk Review Band"
            recommendation = "Higher Risk / Additional Evidence Required"
            badge_color = "danger"

        return {
            "credit_score": score,
            "probability_of_default": round(prob_default, 4),
            "probability_of_default_pct": f"{prob_default * 100:.1f}%",
            "decision_band": band,
            "illustrative_recommendation": recommendation,
            "badge_color": badge_color,
            "model_version": self.model_version,
            "score_scale": {"min": 300, "max": 900},
            "scaled_feature_vector": scaled_vec.flatten().tolist()
        }

credit_engine = CreditScoringEngine()
