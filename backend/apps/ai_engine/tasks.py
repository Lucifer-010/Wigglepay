import os
from celery import shared_task
from .services.whisper_service import transcribe_audio_file
from .services.ollama_service import parse_settlement_prompt

@shared_task(queue='ai_queue')
def process_voice_prompt_task(audio_file_path: str, chat_id: int, merchant_id: str):
    """
    Celery task: Transcribes user voice note, parses payment attributes with Qwen,
    and returns a Telegram confirmation card.
    """
    try:
        transcript = transcribe_audio_file(audio_file_path)
        extracted = parse_settlement_prompt(transcript)
        
        # Clean up temporary audio file
        if os.path.exists(audio_file_path):
            try:
                os.remove(audio_file_path)
            except OSError:
                pass

        # Trigger Telegram Bot confirmation card
        from apps.telegram_bot.services.bot_service import send_invoice_review_card
        send_invoice_review_card(chat_id=chat_id, merchant_id=merchant_id, parsed_data=extracted, transcript=transcript)
        
        return {
            'status': 'SUCCESS',
            'transcript': transcript,
            'extracted': extracted
        }
    except Exception as e:
        return {'status': 'FAILED', 'error': str(e)}

