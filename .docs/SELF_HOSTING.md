# 🚀 Self-Hosting Guide (Production)

This guide shows how to run **Imhotep Finance** in production using pre-built Docker images from Docker Hub.

## ✅ What You Need

You **do not need the source code** to self-host in production.

You only need:

- `docker-compose.prod.yml`
- `.env`
- A server with Docker + Docker Compose installed

---

## 1) Create a Clean Deployment Directory

```bash
mkdir -p imhotep-finance-prod
cd imhotep-finance-prod
```

---

## 2) Download Production Compose File

Use either `curl` or `wget`:

```bash
curl -fsSL -o docker-compose.prod.yml https://raw.githubusercontent.com/Imhotep-Tech/imhotep_finance/main/docker-compose.prod.yml
```

```bash
wget -O docker-compose.prod.yml https://raw.githubusercontent.com/Imhotep-Tech/imhotep_finance/main/docker-compose.prod.yml
```

---

## 3) Download Environment Template and Create `.env`

Download the backend `.env.example` and save it as `.env` in the same directory as `docker-compose.prod.yml`:

```bash
curl -fsSL -o .env https://raw.githubusercontent.com/Imhotep-Tech/imhotep_finance/main/backend/imhotep_finance/.env.example
```

```bash
wget -O .env https://raw.githubusercontent.com/Imhotep-Tech/imhotep_finance/main/backend/imhotep_finance/.env.example
```

---

## 4) Configure `.env` for Production

Open `.env` and update all required values before starting.

### 🔐 Required Security Values

- **`SECRET_KEY`**: Django secret key (must be unique and private)
- **`FIELD_ENCRYPTION_KEY`**: encryption key for sensitive fields (must be generated and kept safe)

Generate secure values:

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 🗄️ Required Database Values

The production stack uses PostgreSQL in Docker. Keep these values consistent:

- **PostgreSQL container values**:
  - `POSTGRES_DB`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
- **Backend Django values**:
  - `DATABASE_NAME`
  - `DATABASE_USER`
  - `DATABASE_PASSWORD`
  - `DATABASE_HOST`

Set them so the backend can connect to the DB container:

- `DATABASE_HOST=db`
- `DATABASE_NAME` should match `POSTGRES_DB`
- `DATABASE_USER` should match `POSTGRES_USER`
- `DATABASE_PASSWORD` should match `POSTGRES_PASSWORD`

### ⚙️ Important Production Recommendations

- Set `DEBUG=False`
- Set `SITE_DOMAIN` and `frontend_url` to your real public URLs
- Replace all placeholder credentials/tokens
- Keep `.env` private and never commit it

---

## 5) Start the Application

Run:

```bash
docker compose -f docker-compose.prod.yml up -d
```

This will start:

- `db` (PostgreSQL)
- `backend` (`kbassem10/imhotep-backend:latest`)
- `frontend` (`kbassem10/imhotep-frontend:latest`)

---

## 6) Verify the Deployment

```bash
docker compose -f docker-compose.prod.yml ps
```

```bash
docker compose -f docker-compose.prod.yml logs -f
```

By default:

- Frontend is exposed on port `80`
- Backend is exposed on port `8000`

---

## 7) Updating to New Releases

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## 🧯 Common Troubleshooting

- **Backend cannot connect to DB**: re-check `DATABASE_*` vs `POSTGRES_*` value alignment.
- **App starts but errors on secrets/encryption**: verify `SECRET_KEY` and `FIELD_ENCRYPTION_KEY` are set and valid.
- **Wrong domain/callback behavior**: verify `SITE_DOMAIN` and `frontend_url`.

You are now running a fully self-hosted production deployment with pre-built images. 🎉
