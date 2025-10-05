import os
import shutil
import argparse
from yt_dlp import YoutubeDL


OUTPUT_DIR = "saves"
MP3_FORMAT = "mp3"
MAX_FILENAME_LENGTH = 25


def is_ffmpeg_installed():
    return shutil.which("ffmpeg") is not None


def download_youtube_as_mp3(url):
    if not is_ffmpeg_installed():
        print("Error: FFmpeg is not installed or not found in PATH.")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Downloading from URL: {url}")

    ydl_opts = {
        "format": "bestaudio/best",
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": MP3_FORMAT,
        }],
        "outtmpl": os.path.join(OUTPUT_DIR, f"%(title).{MAX_FILENAME_LENGTH}s.%(ext)s"),
        "quiet": False,
        "no_warnings": True,
        "noplaylist": True,
    }

    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        # Prepare filename based on the template, then switch extension to mp3
        filename_template = ydl.prepare_filename(info)
        base, _ = os.path.splitext(filename_template)
        final_filename = base + '.mp3'
        # Print the final filename with a unique delimiter for Node.js to parse
        print(f"__SUCCESS_FILENAME__{os.path.basename(final_filename)}__")

    print(f"Download complete! Files saved to the '{OUTPUT_DIR}' folder.")


def get_first_video_url(search_query):
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'format': 'bestaudio/best',
        'noplaylist': True,
        'default_search': 'ytsearch',
        'extract_flat': 'in_playlist',
        'skip_download': True,
    }
    with YoutubeDL(ydl_opts) as ydl:
        result = ydl.extract_info(search_query, download=False)
        if 'entries' in result and len(result['entries']) > 0:
            return result['entries'][0]['url']
        else:
            return None


def main():
    parser = argparse.ArgumentParser(description="YouTube MP3 downloader by search")
    parser.add_argument("-s", "--search", required=True, help="Search term for YouTube")
    args = parser.parse_args()

    try:
        video_url = get_first_video_url(args.search)
        if not video_url:
            print("No video found for the search term.")
            return
        download_youtube_as_mp3(video_url)
    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    main()
