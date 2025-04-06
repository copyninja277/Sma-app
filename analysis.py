from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os
from textblob import TextBlob
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import LatentDirichletAllocation
import networkx as nx
from collections import Counter
from wordcloud import WordCloud
import base64
from io import BytesIO
import matplotlib
matplotlib.use('Agg')  # Headless rendering
import matplotlib.pyplot as plt

app = Flask(__name__)
CORS(app)

DATA_FILES = {
    'youtube': 'youtube-comments.csv',
    'reddit': 'reddit_comments.csv'
}

@app.route('/analyze', methods=['POST'])
def analyze():
    platform = request.json.get('platform', '').lower()
    filename = DATA_FILES.get(platform)

    if not filename or not os.path.exists(filename):
        return jsonify({"error": "File not found or platform invalid"}), 400

    df = pd.read_csv(filename)
    possible_text_cols = ['text', 'comment', 'Comment', 'body', 'Body', 'message']
    text_col = next((col for col in df.columns if col.strip() in possible_text_cols), None)

    if not text_col:
        return jsonify({"error": "No valid text column found"}), 400

    texts = df[text_col].dropna().astype(str).tolist()

    # Sentiment analysis
    sentiments = [TextBlob(t).sentiment.polarity for t in texts]
    sentiment_labels = ['positive' if s > 0.05 else 'negative' if s < -0.05 else 'neutral' for s in sentiments]
    sentiment_counts = Counter(sentiment_labels)

    # TF-IDF
    tfidf_vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
    tfidf_matrix = tfidf_vectorizer.fit_transform(texts)
    tfidf_words = tfidf_vectorizer.get_feature_names_out()
    tfidf_scores = tfidf_matrix.sum(axis=0).A1
    tfidf_data = sorted(zip(tfidf_words, tfidf_scores), key=lambda x: x[1], reverse=True)[:20]

    # Topics
    lda = LatentDirichletAllocation(n_components=5, random_state=42)
    lda.fit(tfidf_matrix)
    topics = []
    for topic in lda.components_:
        top_words = [tfidf_words[i] for i in topic.argsort()[-10:]]
        topics.append(top_words)

    # Co-occurrence graph
    all_words = [word for text in texts for word in text.lower().split() if word.isalpha()]
    common_words = [word for word, _ in Counter(all_words).most_common(100)]
    G = nx.Graph()
    for text in texts:
        words = [w for w in text.lower().split() if w in common_words]
        for i in range(len(words)):
            for j in range(i + 1, len(words)):
                if G.has_edge(words[i], words[j]):
                    G[words[i]][words[j]]['weight'] += 1
                else:
                    G.add_edge(words[i], words[j], weight=1)

    centralities = nx.degree_centrality(G)
    centrality_sorted = sorted(centralities.items(), key=lambda x: x[1], reverse=True)[:10]

    network_data = {
        'nodes': [{'id': node} for node in G.nodes()],
        'edges': [{'source': u, 'target': v, 'weight': d['weight']} for u, v, d in G.edges(data=True)]
    }

    # Word cloud image
    wordcloud = WordCloud(width=800, height=400, background_color='white').generate(' '.join(all_words))
    wc_img = BytesIO()
    wordcloud.to_image().save(wc_img, format='PNG')
    wc_img.seek(0)
    wordcloud_base64 = base64.b64encode(wc_img.read()).decode('utf-8')

    # Co-occurrence graph image using spring_layout (pure matplotlib)
    pos = nx.spring_layout(G, seed=42, k=0.5)

    fig, ax = plt.subplots(figsize=(10, 8))
    nx.draw_networkx_nodes(G, pos, node_size=600, node_color='lightblue', ax=ax)
    nx.draw_networkx_edges(G, pos, width=[G[u][v]['weight'] * 0.1 for u, v in G.edges()], alpha=0.6, ax=ax)
    nx.draw_networkx_labels(G, pos, font_size=10, ax=ax)
    ax.set_title(" ", fontsize=14)
    ax.axis('off')

    co_img = BytesIO()
    plt.savefig(co_img, format='PNG', bbox_inches='tight')
    co_img.seek(0)
    cooccurrence_base64 = base64.b64encode(co_img.read()).decode('utf-8')
    co_img.close()
    plt.close()

    result = {
        'sentiments': sentiments,
        'sentiment_summary': dict(sentiment_counts),
        'topics': topics,
        'tfidf': tfidf_data,
        'network': network_data,
        'centralities': centrality_sorted,
        'wordcloud': wordcloud_base64,
        'cooccurrence_img': cooccurrence_base64
    }

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5002)
