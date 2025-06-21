FROM python:3.10-slim
WORKDIR /code
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt
COPY ./app /code/app
COPY start.sh /code/start.sh
RUN chmod +x /code/start.sh
EXPOSE 8000
CMD ["sh", "/code/start.sh"]
