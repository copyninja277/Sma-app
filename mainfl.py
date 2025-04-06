from flask import Flask, request, jsonify
import pandas as pd
import math
from flask import Flask
from flask_cors import CORS
import praw
import csv
import os


# --- YouTube Data API Imports ---
from googleapiclient.discovery import build

app = Flask(__name__)
CORS(app) 

API_KEY = "AIzaSyAkt-1_IreQ8ML0U1VD0sESBMajftiCud0"
YOUTUBE = build('youtube', 'v3', developerKey=API_KEY)

reddit = praw.Reddit(
    client_id="Z496Fb4JKHhhsPEwQEQHiA",
    client_secret="SOSdm_mRb3GRaH9g65UCU8YOqy0mQw",
    user_agent="Regular_Command_9345",
)

@app.route('/scrape-comments', methods=['GET'])
def scrape_comments():
    """
    This endpoint can scrape comments from specified YouTube videos
    by either:
       1) Passing known video IDs via ?video_ids=VIDEO1,VIDEO2
       2) Passing a query via ?query=some+keywords
    You can also control:
       - How many videos to fetch from search (if using query) via ?search_limit=5
       - How many comments per page fetch (comment threads) via ?comment_limit=100
    If both query and video_ids are provided, we combine the IDs from both sources.
    """

    # 1. Grab parameters from URL
    query = request.args.get('query', '')  # e.g. ?query=Flask tutorial
    raw_video_ids = request.args.get('video_ids', '')  # e.g. ?video_ids=abc123,xyz456
    search_limit = int(request.args.get('search_limit', 5))  # how many videos to get from the search
    comment_limit = int(request.args.get('comment_limit', 100))  # how many comment threads per page
    
    # video_ids from query param (split on comma)
    video_ids = []
    if raw_video_ids.strip():
        video_ids = [vid.strip() for vid in raw_video_ids.split(',') if vid.strip()]

    # 2. If a query is provided, search for top N videos
    if query.strip():
        # Search for videos by query
        search_response = YOUTUBE.search().list(
            part="id",
            q=query,
            maxResults=search_limit,
            type="video"
        ).execute()

        # Extract video IDs from the search results
        for item in search_response.get('items', []):
            vid_id = item['id']['videoId']
            if vid_id not in video_ids:
                video_ids.append(vid_id)

    # If we still have no video IDs, return an error
    if not video_ids:
        return jsonify({
            "status": "error",
            "message": "No valid video IDs found. Provide ?video_ids=... or ?query=..."
        }), 400

    # Prepare a container for all scraped data
    # We'll store rows as lists: [video_id, name, comment, published_at, likes, reply_count]
    rows = [["video_id", "author_name", "comment", "published_at", "likes", "reply_count"]]

    # 3. Scrape comments for each video
    for vid_id in video_ids:
        scrape_comments_for_video(vid_id, rows, comment_limit=comment_limit)

    # 4. Convert to a DataFrame
    df = pd.DataFrame(rows[1:], columns=rows[0])

    # 5. Save to CSV
    df.to_csv('youtube-comments.csv', index=False)

    return jsonify({
        "status": "success",
        "video_count": len(video_ids),
        "total_comments": len(df),
        "message": "Comments scraped successfully. Saved to youtube-comments.csv"
    })


def scrape_comments_for_video(video_id, rows, comment_limit=100):
    """
    Fetch top-level comments and replies for the given video_id.
    `comment_limit` determines how many results per page (maxResults).
    """

    # 1. Make initial request for commentThreads
    data = YOUTUBE.commentThreads().list(
        part='snippet',
        videoId=video_id,
        maxResults=comment_limit,
        textFormat="plainText"
    ).execute()

    # 2. Process the first page
    process_comment_threads_response(data, rows, video_id)

    # 3. While there's a nextPageToken, keep fetching
    while 'nextPageToken' in data:
        data = YOUTUBE.commentThreads().list(
            part='snippet',
            videoId=video_id,
            maxResults=comment_limit,
            textFormat="plainText",
            pageToken=data['nextPageToken']
        ).execute()

        process_comment_threads_response(data, rows, video_id)


def process_comment_threads_response(data, rows, video_id):
    """
    Process each comment in the commentThreads() response,
    then fetch replies if they exist.
    """
    for item in data.get('items', []):
        top_comment_snippet = item['snippet']['topLevelComment']['snippet']

        author_name = top_comment_snippet['authorDisplayName']
        comment_text = top_comment_snippet['textDisplay']
        published_at = top_comment_snippet['publishedAt']
        likes = top_comment_snippet['likeCount']
        reply_count = item['snippet']['totalReplyCount']

        rows.append([video_id, author_name, comment_text, published_at, likes, reply_count])

        # If there are replies, fetch them
        if reply_count > 0:
            parent_id = item['snippet']['topLevelComment']['id']
            fetch_replies(parent_id, rows, video_id)


def fetch_replies(parent_id, rows, video_id):
    """
    Fetch replies for a given parent comment ID.
    """
    data = YOUTUBE.comments().list(
        part='snippet',
        parentId=parent_id,
        maxResults=100,       # You can set a limit for replies too
        textFormat='plainText'
    ).execute()

    for item in data.get('items', []):
        reply_snippet = item['snippet']
        author_name = reply_snippet['authorDisplayName']
        comment_text = reply_snippet['textDisplay']
        published_at = reply_snippet['publishedAt']
        likes = reply_snippet['likeCount']
        # For replies, there's no 'Reply Count' concept
        rows.append([video_id, author_name, comment_text, published_at, likes, None])

@app.route('/get-csv-head', methods=['GET'])
def get_csv_head():
    limit = int(request.args.get('limit', 10))
    try:
        df = pd.read_csv('youtube-comments.csv')
        # Convert top N rows to JSON
        data = df.head(limit).to_dict(orient='records')
        return jsonify(data), 200
    except FileNotFoundError:
        return jsonify({"error": "CSV file not found"}), 404
    
@app.route('/scrape-reddit', methods=['GET'])
def scrape_reddit_comments():
    """
    Dynamically discover subreddits by a query, then search each
    for relevant posts, and extract comments to a CSV.
    
    query          => search terms to find subreddits (and also post titles)
    sub_limit      => how many subreddits to discover
    post_limit     => how many posts per subreddit
    comment_limit  => how many comments per post
    """
    # 1) Grab parameters
    query = request.args.get('query', '').strip()
    if not query:
        return jsonify({"status": "error", "message": "No query provided."}), 400

    sub_limit     = int(request.args.get('sub_limit', 5))      # how many subreddits to discover
    post_limit    = int(request.args.get('post_limit', 5))     # how many posts to fetch per subreddit
    comment_limit = int(request.args.get('comment_limit', 20)) # how many comments per post

    # 2) Discover subreddits matching the query
    discovered_subreddits = []
    try:
        # returns generator of Subreddit objects
        for sr in reddit.subreddits.search(query, limit=sub_limit):
            discovered_subreddits.append(sr.display_name)
    except Exception as e:
        print(f"Error searching subreddits: {e}")

    if not discovered_subreddits:
        return jsonify({"status": "success",
                        "message": "No subreddits found for query.",
                        "file": None}), 200

    # 3) Collect post URLs
    posts_data = []
    for sub_name in discovered_subreddits:
        try:
            subreddit_obj = reddit.subreddit(sub_name)
            for submission in subreddit_obj.search(query, limit=post_limit, sort="relevance"):
                posts_data.append({
                    "url": submission.url,
                    "num_comments": submission.num_comments
                })
        except Exception as e:
            print(f"❌ Error fetching posts from r/{sub_name}: {e}")

    # Remove duplicates by URL
    unique_posts = {}
    for p in posts_data:
        unique_posts[p["url"]] = p
    unique_posts_list = list(unique_posts.values())

    # 4) Fetch comments for each post
    comments_data = {}
    for post in unique_posts_list:
        if post["num_comments"] > 0:
            post_url = post["url"]
            try:
                submission = reddit.submission(url=post_url)
                submission.comments.replace_more(limit=0)
                all_comments = submission.comments.list()
                truncated = all_comments[:comment_limit]  # only first N
                comments_data[post_url] = [c.body for c in truncated]
            except Exception as e:
                print(f"❌ Error fetching comments for {post_url}: {e}")

    # 5) Save all comments to CSV
    filename = "reddit_comments.csv"
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Post URL", "Comment"])
        for post_url, comments_list in comments_data.items():
            for cmt in comments_list:
                writer.writerow([post_url, cmt])

    return jsonify({
        "status": "success",
        "message": f"Scraped {len(unique_posts_list)} unique posts from {len(discovered_subreddits)} subreddits.",
        "file": filename
    }), 200


@app.route('/get-reddit-csv-head', methods=['GET'])
def get_reddit_csv_head():
    """
    Return the top N lines of reddit_comments.csv as JSON.
    ?limit=10
    """
    limit = int(request.args.get('limit', 10))
    try:
        df = pd.read_csv('reddit_comments.csv')
        data = df.head(limit).to_dict(orient='records')
        return jsonify(data), 200
    except FileNotFoundError:
        return jsonify({"error": "reddit_comments.csv not found."}), 404

@app.route('/delete-file', methods=['DELETE'])
def delete_file():
    # We expect a query param like ?platform=youtube or ?platform=reddit
    platform = request.args.get('platform', '').lower()
    if not platform:
        return jsonify({"error": "No platform specified"}), 400

    # Decide which file to delete
    filename = None
    if platform == 'youtube':
        filename = 'youtube-comments.csv'
    elif platform == 'reddit':
        filename = 'reddit_comments.csv'
    else:
        return jsonify({"error": f"Unknown platform: {platform}"}), 400

    # Attempt to remove the file
    if not os.path.exists(filename):
        return jsonify({"error": f"{filename} does not exist"}), 404

    try:
        os.remove(filename)
        return jsonify({"status": "success", "message": f"Deleted {filename}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
     app.run(debug=True, port=5001)
