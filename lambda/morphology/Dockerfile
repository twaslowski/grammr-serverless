FROM public.ecr.aws/lambda/python:3.12 AS builder

ARG SPACY_MODEL

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock ./
RUN uv export --frozen --no-dev > requirements.txt && \
    pip install -r requirements.txt --target ${LAMBDA_TASK_ROOT}


FROM public.ecr.aws/lambda/python:3.12

ARG SPACY_MODEL

COPY --from=builder ${LAMBDA_TASK_ROOT}/ ${LAMBDA_TASK_ROOT}/

COPY . ${LAMBDA_TASK_ROOT}

RUN python -m spacy download ${SPACY_MODEL}
ENV SPACY_MODEL=${SPACY_MODEL}

CMD [ "lambda_handler.handler" ]