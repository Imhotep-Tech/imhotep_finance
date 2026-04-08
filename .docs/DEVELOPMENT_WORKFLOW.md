# 💻 Development Workflow (Local Code Changes)

This guide is for developers who want to **modify the codebase locally**.

If you want to run pre-built production images without editing code, use [Self-Hosting Guide](SELF_HOSTING.md) instead.

---

## 🧰 Prerequisites

- Docker + Docker Compose
- Git
- Access to this repository (local clone)

---

## 1) Start Local Development Stack

From the project root, run:

```bash
docker compose up --build
```

This uses the standard `docker-compose.yml` file and:

- Builds frontend and backend images from local source
- Starts the PostgreSQL container
- Exposes backend on `http://localhost:8000`
- Exposes frontend on `http://localhost:3000`

---

## 2) Hot Reloading and Local Volumes

The local development compose setup mounts project directories as volumes, so code changes update quickly:

- **Backend** source is mounted into the backend container
- **Frontend** source is mounted into the frontend container
- Frontend also uses a dedicated container `node_modules` volume for stability

Result: frontend HMR and backend auto-reload work during development without rebuilding on every change.

---

## 3) Environment Setup

Create your backend env file from the example:

```bash
cp backend/imhotep_finance/.env.example backend/imhotep_finance/.env
```

Generate a valid field encryption key and place it in `FIELD_ENCRYPTION_KEY`:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## 4) Dependency Management

### Frontend Dependencies

- Managed with **npm** and defined in `frontend/imhotep_finance/package.json`
- Installed during Docker image build
- If you need to add/update packages, edit `package.json`/lockfile and rebuild

### Backend Dependencies

- Managed with **pip** and defined in backend requirements files
- Installed during Docker image build
- After changing Python dependencies, rebuild containers to apply updates

---

## 5) Typical Developer Loop

```bash
# Start or rebuild the full stack
docker compose up --build
```

```bash
# In another terminal: stop stack
docker compose down
```

```bash
# Rebuild only when dependency or Dockerfile changes require it
docker compose up --build
```

---

## 📚 Related Docs

- [🧪 Testing Guide](TESTING.md)
- [👥 Contributing Guide](CONTRIBUTING.md)
- [⚙️ Environment Variables](ENVIRONMENT_VARIABLES.md)
