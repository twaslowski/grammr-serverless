FROM public.ecr.aws/lambda/python:3.12 AS builder

ARG LANGUAGE_CODE

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock ./
RUN uv export --frozen --no-dev > requirements.txt && \
    pip install --no-cache-dir -r requirements.txt --target ${LAMBDA_TASK_ROOT}


FROM public.ecr.aws/lambda/python:3.12

ARG LANGUAGE_CODE

# Copy dependencies from first stage
COPY --from=builder ${LAMBDA_TASK_ROOT}/ ${LAMBDA_TASK_ROOT}/

# Copy application code
COPY inflections/ ${LAMBDA_TASK_ROOT}

# Copy pre-trained model, overwrite verbecc config (as the library exposes no way to provide configuration explicitly)
COPY models/trained_model-${LANGUAGE_CODE}.zip ${LAMBDA_TASK_ROOT}/verbecc/data/models
COPY logging_config.yaml ${LAMBDA_TASK_ROOT}/verbecc/config/logging_config.yaml

ENV LANGUAGE_CODE=${LANGUAGE_CODE}

# Run the Flask application with gunicorn for production
CMD [ "lambda_handler.handler" ]