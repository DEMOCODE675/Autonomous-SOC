# Stage 1: Build dependencies
FROM python:3.11-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends git gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Minimal runtime
FROM python:3.11-slim
WORKDIR /app

# Create unprivileged system user
RUN useradd -u 8888 appuser && chown -R appuser:appuser /app
COPY --from=builder /install /usr/local
COPY . /app

USER appuser
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers"]