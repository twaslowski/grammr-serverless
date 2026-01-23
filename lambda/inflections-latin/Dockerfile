FROM python:3.12-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv export --frozen --no-dev > requirements.txt && \
    pip install --no-cache-dir -r requirements.txt --target /app/dependencies


FROM python:3.12-slim

WORKDIR /app

# Copy dependencies from builder stage
COPY --from=builder /app/dependencies /usr/local/lib/python3.12/site-packages/

# Copy application code
ENV APP_DIR=/app

COPY inflections/ ${APP_DIR}/

# Expose the Flask port
EXPOSE 5000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=webserver.py

WORKDIR ${APP_DIR}

# Run the Flask application with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "webserver:app"]