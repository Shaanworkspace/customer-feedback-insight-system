from pathlib import Path

import joblib
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)


BASE_DIR = Path(__file__).resolve().parents[3]

DATA_DIR = BASE_DIR / "dataset" / "mams"
MODEL_DIR = BASE_DIR / "models" / "mams_absa"

TRAIN_FILE = DATA_DIR / "train_absa.csv"
VAL_FILE = DATA_DIR / "val_absa.csv"
TEST_FILE = DATA_DIR / "test_absa.csv"


def load_data(file_path):
    df = pd.read_csv(file_path)

    X = (
        df["text"].fillna("")
        + " [ASPECT] "
        + df["aspect"].fillna("")
    )

    y = df["sentiment"]

    return X, y


def main():

    print("Loading MAMS dataset...")

    X_train, y_train = load_data(TRAIN_FILE)
    X_val, y_val = load_data(VAL_FILE)
    X_test, y_test = load_data(TEST_FILE)

    print(f"Train samples: {len(X_train)}")
    print(f"Validation samples: {len(X_val)}")
    print(f"Test samples: {len(X_test)}")

    print("\nTraining TF-IDF vectorizer...")

    vectorizer = TfidfVectorizer(
        max_features=30000,
        stop_words="english",
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=2,
    )

    X_train_vec = vectorizer.fit_transform(X_train)
    X_val_vec = vectorizer.transform(X_val)
    X_test_vec = vectorizer.transform(X_test)

    print(f"TF-IDF train shape: {X_train_vec.shape}")

    print("\nTraining Logistic Regression...")

    model = LogisticRegression(
        max_iter=2000,
        C=1.0,
        class_weight="balanced",
    )

    model.fit(X_train_vec, y_train)

    print("Training complete.")

    # =========================
    # VALIDATION
    # =========================

    val_pred = model.predict(X_val_vec)

    print("\n" + "=" * 50)
    print("VALIDATION RESULTS")
    print("=" * 50)

    print(f"Accuracy : {accuracy_score(y_val, val_pred):.4f}")

    print(
        f"Precision: "
        f"{precision_score(y_val, val_pred, average='macro', zero_division=0):.4f}"
    )

    print(
        f"Recall   : "
        f"{recall_score(y_val, val_pred, average='macro', zero_division=0):.4f}"
    )

    print(
        f"F1 Score : "
        f"{f1_score(y_val, val_pred, average='macro', zero_division=0):.4f}"
    )

    print("\nClassification Report:")

    print(
        classification_report(
            y_val,
            val_pred,
            zero_division=0
        )
    )

    # =========================
    # TEST
    # =========================

    test_pred = model.predict(X_test_vec)

    print("\n" + "=" * 50)
    print("TEST RESULTS")
    print("=" * 50)

    print(f"Accuracy : {accuracy_score(y_test, test_pred):.4f}")

    print(
        f"Precision: "
        f"{precision_score(y_test, test_pred, average='macro', zero_division=0):.4f}"
    )

    print(
        f"Recall   : "
        f"{recall_score(y_test, test_pred, average='macro', zero_division=0):.4f}"
    )

    print(
        f"F1 Score : "
        f"{f1_score(y_test, test_pred, average='macro', zero_division=0):.4f}"
    )

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            test_pred,
            zero_division=0
        )
    )

    # =========================
    # CONFUSION MATRIX
    # =========================

    print("\nConfusion Matrix:")

    labels = [
        "negative",
        "neutral",
        "positive",
    ]

    print(
        confusion_matrix(
            y_test,
            test_pred,
            labels=labels
        )
    )

    # =========================
    # SAVE MODEL
    # =========================

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    model_path = MODEL_DIR / "model.joblib"
    vectorizer_path = MODEL_DIR / "vectorizer.joblib"

    joblib.dump(model, model_path)
    joblib.dump(vectorizer, vectorizer_path)

    print("\nModel saved:")
    print(model_path)
    print(vectorizer_path)


if __name__ == "__main__":
    main()