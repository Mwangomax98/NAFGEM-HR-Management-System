# Hosting on Contabo (same VPS as nafgemtanzania.or.tz)

You already run the main site on Contabo. The HR portal runs **on the same server** as a second Nginx site (`hr.…`) that proxies to Docker on port **4000**. The main website is not replaced.

```
Internet
   │
   ├─ nafgemtanzania.or.tz     → existing Nginx site (unchanged)
   └─ hr.nafgemtanzania.or.tz  → new Nginx site → 127.0.0.1:4000 (HR Docker)
```

## 1. DNS (same Contabo IP)

In Contabo DNS / your registrar for `nafgemtanzania.or.tz`:

| Type | Name | Value |
|------|------|--------|
| A | `hr` | **Same public IP** as the main website |

Check from your PC:

```bash
ping nafgemtanzania.or.tz
ping hr.nafgemtanzania.or.tz
```

Both should show the Contabo IP.

## 2. SSH into Contabo

```bash
ssh root@YOUR_CONTABO_IP
# or: ssh youruser@YOUR_CONTABO_IP
```

## 3. Install Docker (if not already)

```bash
# Ubuntu/Debian Contabo VPS
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
```

Nginx and Certbot are usually already installed for the main site.

## 4. Put the HR app on the server

```bash
cd /var/www   # or /opt — keep it separate from the main site files
sudo git clone https://github.com/Mwangomax98/harmony-hrcore.git
cd harmony-hrcore
```

Create `.env` (do not commit):

```bash
sudo nano .env
```

```env
POSTGRES_USER=harmony
POSTGRES_PASSWORD=USE_A_STRONG_PASSWORD
POSTGRES_DB=harmony_hr
JWT_SECRET=USE_A_LONG_RANDOM_SECRET
PUBLIC_BASE_URL=https://hr.nafgemtanzania.or.tz
VITE_API_URL=
VITE_AUTH_DISABLED=false
VITE_MAIN_SITE_URL=https://nafgemtanzania.or.tz
VITE_HR_PORTAL_URL=https://hr.nafgemtanzania.or.tz
AUTH_DISABLED=false
SERVE_STATIC=true
```

## 5. Bind HR only to localhost (safe next to main site)

Edit `docker-compose.prod.yml` so the API is **not** public on the internet — only Nginx talks to it:

```yaml
    ports:
      - "127.0.0.1:4000:4000"
```

(Already preferred; if the file says `"4000:4000"`, change it to the line above.)

Then:

```bash
sudo docker compose -f docker-compose.prod.yml up -d --build
sudo docker compose -f docker-compose.prod.yml exec api node scripts/migrate.js
sudo docker compose -f docker-compose.prod.yml exec api node scripts/seed.js
```

Seed login: `admin@local.dev` / `admin123` — change immediately after first login.

## 6. Add Nginx site (do not touch the main site config)

```bash
sudo cp /var/www/harmony-hrcore/deploy/nginx-hr.nafgemtanzania.or.tz.conf \
  /etc/nginx/sites-available/hr.nafgemtanzania.or.tz

sudo ln -sf /etc/nginx/sites-available/hr.nafgemtanzania.or.tz \
  /etc/nginx/sites-enabled/

sudo nginx -t && sudo systemctl reload nginx
```

If Contabo uses `/etc/nginx/conf.d/` instead of `sites-available`, copy the file there as `hr.nafgemtanzania.or.tz.conf` and reload Nginx.

## 7. HTTPS for the subdomain only

```bash
sudo certbot --nginx -d hr.nafgemtanzania.or.tz
```

This adds TLS for **hr** only; your existing main-site certificate stays as-is.

## 8. Verify

- https://nafgemtanzania.or.tz — still works  
- https://hr.nafgemtanzania.or.tz/auth — HR login  
- Create staff under **User Management** (no public signup)

## 9. Link from the main website

Add a nav item **Staff Portal** → `https://hr.nafgemtanzania.or.tz`.

## Updates later

```bash
cd /var/www/harmony-hrcore
sudo git pull
sudo docker compose -f docker-compose.prod.yml up -d --build
sudo docker compose -f docker-compose.prod.yml exec api node scripts/migrate.js
```

## Contabo tips

- **RAM:** HR needs Postgres + Node. Prefer at least **2 GB** free; if the VPS is tight, stop unused containers and monitor with `htop` / `docker stats`.
- **Firewall:** Keep 80/443 open (already needed for the main site). Do **not** open 4000 publicly.
- **Backups:** Snapshot the Contabo VPS regularly, and back up the Docker volume `nafgem_hr_pg` (database).
- **Main site path:** Leave whatever serves `nafgemtanzania.or.tz` alone (static files, Node, etc.). HR is only an extra `server_name`.

## Checklist

- [ ] DNS `hr` A record → Contabo IP  
- [ ] Docker running; compose bound to `127.0.0.1:4000`  
- [ ] Nginx site for `hr.nafgemtanzania.or.tz`  
- [ ] Certbot SSL for `hr`  
- [ ] Main site still OK  
- [ ] Seed admin password changed  
- [ ] Staff users created by admin only  
