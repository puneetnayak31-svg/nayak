# HIPL CMS + website server.
#   docker build -t hipl-cms hipl-website
#   docker run -p 8800:8800 -e HIPL_CMS_PASSWORD='a-long-password' hipl-cms
# In production use deploy/docker-compose.yml, which bind-mounts the checkout so
# content edits persist and can be committed back to git.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HIPL_CMS_HOST=0.0.0.0 \
    PORT=8800

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
 && useradd --uid 1000 --create-home hipl

COPY --chown=hipl:hipl . .
RUN mkdir -p cms/state assets/uploads && chown -R hipl:hipl cms/state assets/uploads
USER hipl

EXPOSE 8800
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD python -c "import urllib.request,os; urllib.request.urlopen('http://127.0.0.1:%s/api/health' % os.environ.get('PORT','8800'), timeout=4)"

CMD ["python", "cms/server.py", "--no-browser"]
