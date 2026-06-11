import subprocess
import json
import sys
import re
import requests
from urllib.parse import quote
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}


def scrape_gaana_metadata(url):
    """Scrape Gaana song page for metadata using OG tags and structured data."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return None, f"Failed to fetch Gaana page (HTTP {resp.status_code})"

        html = resp.text

        title = ''
        artist = ''
        album = ''
        thumbnail = ''
        duration = 0
        release_date = ''
        language = ''
        song_id = ''

        # Extract OG meta tags (handle data-react-helmet and other attrs)
        og_title = re.search(r'<meta[^>]*property="og:title"[^>]*content="([^"]+)"', html)
        if og_title:
            raw = og_title.group(1)
            parts = raw.split('|')
            title = parts[0].replace(' Song', '').strip() if parts else raw.strip()

        og_image = re.search(r'<meta[^>]*property="og:image"[^>]*content="([^"]+)"', html)
        if og_image:
            thumbnail = og_image.group(1)
            thumbnail_hr = re.sub(r'/size_[msl]\.', '/size_l.', thumbnail)
            if thumbnail_hr != thumbnail:
                try:
                    check = requests.head(thumbnail_hr, headers=HEADERS, timeout=5)
                    if check.status_code == 200:
                        thumbnail = thumbnail_hr
                except Exception:
                    pass

        dur = re.search(r'<meta[^>]*property="music:duration"[^>]*content="(\d+)"', html)
        if dur:
            duration = int(dur.group(1))

        alb = re.search(r'<meta[^>]*property="music:album"[^>]*content="([^"]+)"', html)
        if alb:
            album = alb.group(1).rsplit('/', 1)[-1].replace('-', ' ').title()

        # Artist from twitter or og title
        tw_title = re.search(r'<meta[^>]*name="twitter:title"[^>]*content="([^"]+)"', html)
        if tw_title:
            parts = tw_title.group(1).split('|')
            if len(parts) > 1:
                artist = parts[1].strip()
        if not artist or artist == 'Unknown Artist':
            if og_title:
                parts = og_title.group(1).split('|')
                if len(parts) > 1:
                    artist = parts[1].strip()

        # Try JSON-LD for more details
        jsonld_blocks = re.findall(
            r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
            html, re.DOTALL
        )
        for block in jsonld_blocks:
            try:
                data = json.loads(block)
                if isinstance(data, dict):
                    if data.get('@type') == 'MusicPlaylist':
                        for item in data.get('itemListElement', []):
                            if isinstance(item, dict):
                                song_id = item.get('url', '').rsplit('/', 1)[-1]
            except json.JSONDecodeError:
                pass

        # Language from keywords
        keywords = re.search(r'<meta\s+name="keywords"\s+content="([^"]+)"', html)
        if keywords:
            kw = keywords.group(1)
            lang_match = re.search(r'(Hindi|Punjabi|Tamil|Telugu|Malayalam|Kannada|Bengali|Marathi|Gujarati|English|Bhojpuri|Haryanvi)\s', kw, re.IGNORECASE)
            if lang_match:
                language = lang_match.group(1).capitalize()

        # Extract song ID from URL
        url_match = re.search(r'/song/(?:[\w-]+-)?(\d+)', url)
        if url_match:
            song_id = url_match.group(1)

        if not title:
            title_match = re.search(r'<title>(.*?)</title>', html)
            if title_match:
                raw = title_match.group(1)
                title = raw.split('|')[0].replace(' Song', '').strip()

        return {
            'title': title or 'Unknown',
            'artist': artist or 'Unknown Artist',
            'album': album or '',
            'duration': duration,
            'thumbnail': thumbnail,
            'language': language,
            'release_date': release_date,
            'song_id': song_id,
            'source_url': url,
        }, None

    except requests.RequestException as e:
        return None, f"Network error: {str(e)}"
    except Exception as e:
        return None, str(e)


def search_youtube(query):
    """Search YouTube for a song and return video ID."""
    try:
        result = subprocess.run(
            ['yt-dlp', '--dump-json', '--no-warnings',
             '--default-search', 'ytsearch', f'ytsearch1:{query}'],
            capture_output=True, text=True, timeout=20
        )
        if result.returncode != 0:
            return None

        data = json.loads(result.stdout.strip().split('\n')[0])
        return {
            'video_id': data.get('id', ''),
            'yt_title': data.get('title', ''),
            'yt_duration': data.get('duration', 0),
        }
    except Exception:
        return None


def fetch_lyrics(title, artist):
    """Fetch lyrics from public lyrics API."""
    try:
        resp = requests.get(
            f'https://api.lyrics.ovh/v1/{quote(artist)}/{quote(title)}',
            headers=HEADERS, timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            return data.get('lyrics', '')
    except Exception:
        pass
    return ''


def extract_gaana(url, lyrics=False):
    metadata, error = scrape_gaana_metadata(url)
    if error:
        return None, error

    # Search YouTube for playable version
    search_query = f"{metadata['title']} {metadata['artist']}"
    yt_result = search_youtube(search_query)

    playable_link = ''
    video_id = ''
    if yt_result:
        video_id = yt_result['video_id']
        playable_link = f"https://www.youtube.com/watch?v={video_id}"

    song_data = {
        'title': metadata['title'],
        'artist': metadata['artist'],
        'album': metadata['album'],
        'duration': metadata['duration'],
        'bitrate': 0,
        'language': metadata['language'],
        'release_date': metadata['release_date'],
        'thumbnail': metadata['thumbnail'],
        'playable_link': playable_link,
        'video_id': video_id,
        'source_url': url,
        'lyrics': '',
    }

    if lyrics:
        song_data['lyrics'] = fetch_lyrics(metadata['title'], metadata['artist'])

    return song_data, None


@app.route('/api/gaana', methods=['GET'])
def gaana_info():
    url = request.args.get('url', '')
    lyrics = request.args.get('lyrics', '').lower() in ('true', '1', 'yes')

    if not url:
        return jsonify({'error': 'Missing required parameter: url'}), 400

    if 'gaana.com' not in url:
        return jsonify({'error': 'URL must be a Gaana.com link'}), 400

    data, error = extract_gaana(url, lyrics)
    if error:
        return jsonify({'error': error}), 500

    return jsonify(data)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
    print(f"Gaana API microservice running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
