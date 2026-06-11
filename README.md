# WeGift

WeGift is a full-stack MERN-style platform with a React frontend, Express backend, Flask microservice for Gaana scraping, and MongoDB storage.

## Local development

1. Install dependencies:
   - `npm install` in repo root
   - `npm install --prefix server`
   - `npm install --prefix client`
2. Build the client:
   - `cd client && npm run build`
3. Run the app locally with Docker:
   - `docker compose up --build -d`
4. Visit `http://localhost:5001/` if port `5000` is occupied locally.

## Render deployment

This repository is configured for Render deployment using Docker.
It includes `render.yaml` and a GitHub Actions workflow at `.github/workflows/render-deploy.yml`.

### 1. Create a Render account

1. Go to https://render.com and sign up.
2. Connect your GitHub account to Render.
3. Grant access to the repository containing this project.

### 2. Create the Render service

1. In Render, click **New** → **Web Service**.
2. Choose **Connect a repository** and select this repo.
3. Under **Environment**, choose **Docker**.
4. For **Dockerfile Path** set `Dockerfile`.
5. For **Name** use `wegift` (or your preferred service name).
6. For **Branch** choose `main`.
7. Set the **Region** closest to your users.
8. Leave the **Build command** blank when using Docker.

### 3. Configure environment variables in Render

Add these keys in the Render service settings:

- `MONGODB_URI`
- `REACT_APP_API_URL` (example: `https://wegift.onrender.com`)
- `GAANA_FLASK_PORT` = `5001`
- `AI_API_KEY` = optional
- `AI_API_URL` = optional (example: `https://api.openai.com/v1/chat/completions`)
- `AI_MODEL` = optional (example: `gpt-3.5-turbo`)
- `JWT_SECRET` = optional

> Important: `REACT_APP_API_URL` must be available during the React build stage.
> Render will pass this value into Docker build if it is set in the service environment.

### 4. Set GitHub secrets

In your GitHub repository, add these secrets:

- `RENDER_API_KEY`
- `RENDER_SERVICE_ID`

These are used by the GitHub Actions workflow to trigger Render deployments.

### 5. Push to GitHub

1. Commit your changes.
2. Push to `main`.
3. The workflow `.github/workflows/render-deploy.yml` will run and deploy to Render.

### 6. Confirm the deployment

1. Open the Render dashboard.
2. Check the service logs.
3. Confirm the service is live.
4. Visit the public URL, e.g. `https://wegift.onrender.com`.

## GitHub Actions workflow

The workflow file `.github/workflows/render-deploy.yml` sends a deploy request to Render when you push to `main`.
It requires `RENDER_API_KEY` and `RENDER_SERVICE_ID` in GitHub secrets.

## Additional notes

- The `Dockerfile` now passes `REACT_APP_API_URL` into the React build stage.
- The app requires a Docker deployment because it runs both Node and Python components.
- `server/` contains the Express backend and `server/gaana_api/` contains the Flask microservice.
- `client/build/` is served by Express in production.
