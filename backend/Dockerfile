FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies including FFmpeg for Whisper audio transcoding
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    ffmpeg \
    libsndfile1 \
    netcat-openbsd \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . /app/

# Create directories for media and static files
RUN mkdir -p /app/staticfiles /app/media /app/data

EXPOSE 8000 8001

ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["gunicorn", "wigglepay.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]

