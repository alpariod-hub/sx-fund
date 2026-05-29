# Security Checklist — trinityfund.io (Vultr Frankfurt)

## 🔴 КРИТИЧНО — исправить до деплоя

### 1. Webmin без Cloudflare proxy
**Запись:** `webmin.trinityfund.io → 45.32.158.100` (proxy OFF)

Webmin — это веб-интерфейс управления сервером (root-доступ).
Сейчас он доступен напрямую всему интернету на стандартном порту 10000.

**Исправление — выбери одно:**
```bash
# Вариант А (рекомендую): закрыть за IP whitelist через ufw
sudo ufw deny 10000
sudo ufw allow from ТВОЙ_IP to any port 10000

# Вариант Б: отключить Webmin полностью, использовать SSH
sudo systemctl disable webmin --now

# Вариант В: перенести на нестандартный порт + включить 2FA в Webmin
```
В Cloudflare: **оставить proxy OFF** для webmin (Cloudflare не проксирует порт 10000).

---

### 2. Portainer без Cloudflare proxy
**Запись:** `portainer.trinityfund.io → 45.32.158.100` (proxy OFF)

Portainer — управление Docker-контейнерами. Если скомпрометирован — полный контроль над сервером.

**Исправление:**
```bash
# Закрыть порт 9000/9443 для всех кроме твоего IP
sudo ufw deny 9000
sudo ufw deny 9443
sudo ufw allow from ТВОЙ_IP to any port 9000
sudo ufw allow from ТВОЙ_IP to any port 9443
```

---

### 3. GCP VM (34.141.93.227) — сиротливый сервер
IP засвечен в истории чата. Сервер пустой но работает и стоит деньги.

**Действие:**
1. Убедиться что ничего важного нет
2. Либо остановить VM (сохранить диск), либо удалить
3. GCP $300 кредит сгорает через 90 дней с момента регистрации — используй если нужен второй сервер

---

## ✅ Что уже хорошо

| Пункт | Статус |
|---|---|
| Cloudflare proxy на `@`, `api`, `app`, `bot` | ✅ |
| ProtonMail (MX, SPF, DKIM, DMARC) | ✅ |
| IP сервера не виден через Cloudflare | ✅ |
| IP `34.141.93.227` убран из кода | ✅ |
| Telegram webhook secret verification | ✅ (в коде) |
| Rate limiting API (30 req/min) | ✅ (в nginx.conf) |

---

## Cloudflare — правильная схема после деплоя

```
Запись        IP               Proxy    Причина
────────────────────────────────────────────────────────
@             45.32.158.100    ON ☁️    Скрыть реальный IP
www           45.32.158.100    ON ☁️    Скрыть реальный IP
api           45.32.158.100    ON ☁️    API + webhook
sed-hub       45.32.158.100    ON ☁️    SED-Hub фронтенд
bot           45.32.158.100    ON ☁️    (если используется)
app           45.32.158.100    ON ☁️    (если используется)
rwa           45.32.158.100    OFF ⚠️   → включить proxy
webmin        45.32.158.100    OFF      ОСТАВИТЬ OFF + закрыть ufw
portainer     45.32.158.100    OFF      ОСТАВИТЬ OFF + закрыть ufw
```

> **Важно:** Webmin и Portainer нельзя проксировать через Cloudflare
> (нестандартные порты). Защищать только через ufw/IP whitelist.
