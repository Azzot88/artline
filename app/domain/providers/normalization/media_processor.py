import logging
import tempfile
import subprocess
import os
import requests
import io
from typing import Optional, Tuple
from PIL import Image

logger = logging.getLogger(__name__)

class MediaProcessor:
    """
    Handles media specific operations:
    - Thumbnail generation
    - Waveform generation
    - Image optimization/normalization
    """

    def generate_video_thumbnail(self, video_url: str) -> Optional[str]:
        """
        Downloads video, extracts a frame using ffmpeg, returns local path or URL.
        """
        try:
             with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_vid:
                 self._download_file(video_url, tmp_vid.name)
                 
                 out_path = tmp_vid.name + "_thumb.jpg"
                 
                 cmd = [
                     "ffmpeg", "-y",
                     "-ss", "00:00:01",
                     "-i", tmp_vid.name,
                     "-vframes", "1",
                     "-q:v", "2", 
                     out_path
                 ]
                 
                 subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                 
                 if os.path.exists(out_path):
                      return f"file://{out_path}" # In prod, upload this to S3
                 
                 return None
                     
        except Exception as e:
            logger.error(f"Thumbnail generation failed: {e}")
            return None

    def generate_audio_waveform(self, audio_url: str) -> Optional[str]:
        try:
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_audio:
                 self._download_file(audio_url, tmp_audio.name)
                 
                 out_path = tmp_audio.name + "_wave.png"
                 
                 cmd = [
                     "ffmpeg", "-y",
                     "-i", tmp_audio.name,
                     "-filter_complex", "aformat=channel_layouts=mono,showwavespic=s=600x120:colors=0x0000ff",
                     "-frames:v", "1",
                     out_path
                 ]
                 
                 subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                 
                 if os.path.exists(out_path):
                     return f"file://{out_path}"
                 
                 return None
                 
        except Exception as e:
            logger.error(f"Waveform generation failed: {e}")
            return None

    def optimize_image(self, content: bytes, target_format="JPEG") -> bytes:
        """
        Normalizes image content to specific format (default JPEG to save space/bandwidth).
        """
        try:
            with Image.open(io.BytesIO(content)) as img:
                if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                    img = img.convert('RGB')
                else:
                    img = img.convert('RGB')
                
                output_buffer = io.BytesIO()
                img.save(output_buffer, format=target_format, quality=95)
                return output_buffer.getvalue()
        except Exception as e:
            logger.error(f"Image optimization failed: {e}")
            raise e

    def get_image_dimensions(self, content: bytes) -> Tuple[int, int]:
        try:
            with Image.open(io.BytesIO(content)) as img:
                return img.size
        except Exception:
            return (0, 0)

    def _download_file(self, url: str, target_path: str):
        with requests.get(url, stream=True, timeout=30) as r:
            r.raise_for_status()
            with open(target_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
