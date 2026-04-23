from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
from sklearn.cluster import KMeans

app = Flask(__name__)
CORS(app)

# Load model and vectorizer
model = pickle.load(open("model.pkl", "rb"))
vectorizer = pickle.load(open("vectorizer.pkl", "rb"))

@app.route("/")
def home():
    return "EchoScope Backend Running"

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    texts = data.get("texts", [])

    if len(texts) == 0:
        return jsonify({"error": "No input provided"})

    # Convert text to vectors
    X = vectorizer.transform(texts)

    # Predict risk
    probs = model.predict_proba(X)[:, 1]

    # Clustering
    k = min(3, len(texts))
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X)

    results = []

    for i in range(k):
        cluster_indices = np.where(clusters == i)[0]
        cluster_texts = [texts[j] for j in cluster_indices]
        cluster_probs = [probs[j] for j in cluster_indices]

        # Top keywords
        centroid = kmeans.cluster_centers_[i]
        top_indices = centroid.argsort()[-5:][::-1]
        keywords = [vectorizer.get_feature_names_out()[idx] for idx in top_indices]

        results.append({
            "echo_group": i + 1,
            "texts": cluster_texts,
            "avg_risk": round(float(np.mean(cluster_probs) * 100), 2),
            "keywords": keywords
        })

    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True)