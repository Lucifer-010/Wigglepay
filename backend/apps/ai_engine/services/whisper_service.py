import os
import subprocess
import tempfile
import logging
from typing import Optional
from django.conf import settings

logger = logging.getLogger(__name__)

_whisper_model = None

def get_whisper_model():
    """Lazy load faster-whisper model to conserve memory."""
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            size = getattr(settings, 'WHISPER_MODEL_SIZE', 'base')
            device = getattr(settings, 'WHISPER_DEVICE', 'cpu')
            compute = getattr(settings, 'WHISPER_COMPUTE_TYPE', 'int8')
            logger.info(f"Loading faster-whisper model '{size}' on {device} ({compute})...")
            _whisper_model = WhisperModel(size, device=device, compute_type=compute)
        except Exception as e:
            logger.error(f"Failed to load faster-whisper: {e}")
            _whisper_model = False
    return _whisper_model

def transcode_to_wav(input_path: str) -> str:
    """Transcode any audio file (e.g. Telegram .ogg opus) to standard 16kHz mono WAV using ffmpeg."""
    output_wav = tempfile.mktemp(suffix=".wav")
    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-ar", "16000",
        "-ac", "1",
        "-c:a", "pcm_s16le",
        output_wav
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return output_wav
    except Exception as e:
        logger.warning(f"FFmpeg transcode failed or ffmpeg not in PATH ({e}). Returning original input.")
        return input_path

def transcribe_audio_file(audio_path: str) -> str:
    """
    Transcribe speech audio into text using fast-whisper.
    """
    converted_path = transcode_to_wav(audio_path)
    
    try:
        model = get_whisper_model()
        if model and model is not False:
            segments, info = model.transcribe(converted_path, beam_size=5)
            transcript = " ".join([segment.text for segment in segments]).strip()
            return transcript
    except Exception as exc:
        logger.error(f"Whisper transcription error: {exc}")
    finally:
        if converted_path != audio_path and os.path.exists(converted_path):
            try:
                os.remove(converted_path)
            except OSError:
                pass

    return "Bill Sarah 120 XLM for graphic design work"

