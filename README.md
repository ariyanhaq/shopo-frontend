# Shopo Frontend

Modern, multi-tenant POS & Business Management Web Application built with **React 19**, **Vite**, **Tailwind CSS v4**, **Firebase Auth**, and **Lucide Icons**.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Authentication**: Firebase Authentication
- **State & Routing**: React Router v7
- **Image Storage**: ImgBB API
- **Deployment**: Docker + Nginx / Coolify / Netlify

---

## 🚀 Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Fill in your configuration:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend API URL (optional if using reverse proxy)
VITE_API_URL=http://localhost:8000

# ImgBB API Key
VITE_IMGBB_API_KEY=your_imgbb_api_key
```

### 3. Start Development Server

```bash
npm run dev
```

---

## 🐳 VPS Deployment Options

### Option 1: Deploy with Coolify (Recommended)

1. In your Coolify dashboard, click **+ Add Resource** -> **Public/Private Repository** (or **Docker-based**).
2. Select your `shopo-frontend` repository / subdirectory.
3. Choose **Dockerfile** as the build pack.
4. Set **Port Exposes** to `80`.
5. Under **Environment Variables**, add the `VITE_*` build arguments (Vite embeds them during build time):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_API_URL` (Set to your backend URL e.g. `http://your-backend-vps-url` or leave blank if proxied)
   - `VITE_IMGBB_API_KEY`
6. Click **Deploy**.

---

### Option 2: Deploy with Docker / Docker Compose

1. Copy `.env.example` to `.env` inside `shopo-frontend/` and configure your environment variables.
2. Build and run the container:
   ```bash
   docker compose up -d --build
   ```
3. Your application is live at `http://YOUR_VPS_IP` (Port 80).

To build manually with Docker:
```bash
docker build \
  --build-arg VITE_FIREBASE_API_KEY="your_api_key" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="your_auth_domain" \
  --build-arg VITE_FIREBASE_PROJECT_ID="your_project_id" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="your_storage_bucket" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id" \
  --build-arg VITE_FIREBASE_APP_ID="your_app_id" \
  --build-arg VITE_API_URL="http://your-backend-api" \
  --build-arg VITE_IMGBB_API_KEY="your_imgbb_key" \
  -t shopo-frontend .

docker run -d --name shopo-frontend -p 80:80 --restart unless-stopped shopo-frontend
```

---

### Option 3: Standalone Nginx on VPS (Without Docker)

1. Build the production bundle locally or on the server:
   ```bash
   npm ci
   npm run build
   ```
2. Copy the `dist/` directory to `/var/www/shopo-frontend`:
   ```bash
   sudo rsync -avz --delete dist/ /var/www/shopo-frontend/
   ```
3. Configure your host Nginx server block (`/etc/nginx/sites-available/shopo-frontend`):
   ```nginx
   server {
       listen 80;
       server_name your-frontend-domain.com;
       root /var/www/shopo-frontend;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location ~* \.(?:css|js|woff2?|svg|gif|png|jpe?g|webp|ico|avif)$ {
           expires 1y;
           add_header Cache-Control "public, max-age=31536000, immutable";
       }

       location = /index.html {
           add_header Cache-Control "no-store, no-cache, must-revalidate";
       }
   }
   ```
4. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/shopo-frontend /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

---

## 🔍 Health Check

The container includes a built-in health probe at `/healthz`:
```bash
curl http://localhost/healthz
# Returns: healthy
```
