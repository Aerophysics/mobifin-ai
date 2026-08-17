FROM python:3.9-slim

WORKDIR /workspace

# Install system compilation packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

COPY . ./backend

WORKDIR /workspace/backend
ENV PYTHONPATH=/workspace

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && python -m backend.app.ml.train && uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"]
