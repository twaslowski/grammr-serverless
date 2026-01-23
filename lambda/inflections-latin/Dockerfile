FROM public.ecr.aws/lambda/python:3.12 AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock ./
RUN uv export --frozen --no-dev > requirements.txt && \
    pip install -r requirements.txt --target ${LAMBDA_TASK_ROOT}


FROM public.ecr.aws/lambda/python:3.12

COPY --from=builder ${LAMBDA_TASK_ROOT}/ ${LAMBDA_TASK_ROOT}/

COPY inflections/ ${LAMBDA_TASK_ROOT}

CMD [ "lambda_handler.handler" ]