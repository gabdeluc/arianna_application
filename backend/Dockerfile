FROM python:3.11-slim

WORKDIR /app

# Installa uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copia i file di configurazione del progetto
COPY pyproject.toml ./

# Installa le dipendenze usando uv
RUN uv pip install --system -r pyproject.toml

# Copia il codice sorgente
COPY . .

# Esponi la porta 8000
EXPOSE 8000

# Comando per avviare l'applicazione
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]