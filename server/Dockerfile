from python:3.13-slim 

WORKDIR /app

COPY . .
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

ENV PORT=8080 \
    HOST=0.0.0.0

CMD exec uvicorn app:app --host ${HOST} --port ${PORT}