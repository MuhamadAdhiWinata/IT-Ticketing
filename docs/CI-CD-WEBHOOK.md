# CI/CD GitHub Webhook

```
git push main -> GitHub -> https://<HOOK_HOST>/webhook (Cloudflare Tunnel)
  -> receiver 127.0.0.1:9000 (systemd user service, user adhinath)
  -> deploy.sh (flock, fetch + reset --hard origin/main, docker compose up -d --build app)
```

## Komponen

| Item | Lokasi |
|---|---|
| Receiver | `scripts/webhook-receiver.mjs` (Node, tanpa dependency) |
| Unit systemd (user) | `scripts/it-ticketing-webhook.service` -> `~/.config/systemd/user/` |
| Secret | `~/.config/it-ticketing-webhook.env` (mode 600, tidak di Git) |
| Deploy | `deploy.sh` |
| Log | `~/deploy.log` dan `journalctl --user -u it-ticketing-webhook` |
| Tes lokal | `node --test scripts/webhook-receiver.test.mjs` |

Receiver hanya menerima `POST /webhook` dengan signature `X-Hub-Signature-256` valid, event `push`, repo `MuhamadAdhiWinata/IT-Ticketing`, ref `refs/heads/main`. Body maksimal 1 MB. Payload tidak pernah dipakai untuk membentuk perintah. `GET /healthz` untuk cek hidup.

## Instalasi di server

```bash
cd ~/Sistem-Tiketing && git pull origin main
umask 077
echo "WEBHOOK_SECRET=$(openssl rand -hex 32)" > ~/.config/it-ticketing-webhook.env
mkdir -p ~/.config/systemd/user
cp scripts/it-ticketing-webhook.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now it-ticketing-webhook
sudo loginctl enable-linger adhinath     # agar hidup setelah reboot tanpa login
curl -s http://127.0.0.1:9000/healthz
```

Tampilkan secret untuk dipasang di GitHub: `cut -d= -f2 ~/.config/it-ticketing-webhook.env`.

## Cloudflare Tunnel

Di dashboard Zero Trust, tambah Public Hostname `<HOOK_HOST>` dengan service `http://localhost:9000`. Isi `<HOOK_HOST>` dengan hostname yang Anda pilih.

## GitHub

Settings -> Webhooks -> Add webhook:
- Payload URL: `https://<HOOK_HOST>/webhook`
- Content type: `application/json`
- Secret: isi dari file env di atas
- Events: Just the push event
- SSL verification: Enable

## Operasional

```bash
systemctl --user status it-ticketing-webhook
journalctl --user -u it-ticketing-webhook -n 50
tail -n 50 ~/deploy.log
bash ~/Sistem-Tiketing/deploy.sh                 # deploy manual
systemctl --user disable --now it-ticketing-webhook   # nonaktifkan
```

Ganti secret: tulis ulang file env, `systemctl --user restart it-ticketing-webhook`, lalu perbarui secret di GitHub.

Rollback:
```bash
cd ~/Sistem-Tiketing && git reset --hard <commit-lama> && docker compose up -d --build app
```
Push berikutnya ke `main` menimpa rollback ini. Untuk rollback permanen, `git revert` di GitHub.

## Catatan

- `deploy.sh` menjalankan dirinya dari salinan di `/tmp`, jadi `reset --hard` yang menimpa `deploy.sh` tidak merusak proses yang berjalan.
- `git clean` tidak dipakai. `.env`, upload dan volume tidak disentuh.
- Event kedua saat deploy berjalan diantrikan satu kali dan dijalankan setelah yang pertama selesai.
- Tambahkan `NODE_ENV=production` ke `.env` server agar peringatan compose hilang.
