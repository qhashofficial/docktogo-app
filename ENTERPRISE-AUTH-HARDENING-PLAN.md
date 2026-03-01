# DockToGo – Enterprise Auth Hardening Plan

**Status:** Post-MVP → Production Hardening  
**Cel:** Podnieść system uwierzytelniania do poziomu enterprise-ready  
**Zakres:** Backend (docktogo-api)

---

# 1. Cel sprintu

Podnieść obecny system auth (JWT + refresh token rotation + DB sessions)  
z poziomu „dobry SaaS” do poziomu:

- audytowalny
- odporny na brute force
- odporny na refresh token reuse attack
- zgodny z wymaganiami firm enterprise

Zakładany czas: 1–2 tygodnie

---

# 2. Obecny stan (Baseline)

## ✔ Co działa poprawnie

- JWT access token (short TTL)
- Refresh token jako losowy string (nie JWT)
- Hash refresh tokena w DB
- Rotacja refresh tokenów
- Revoke sesji
- HttpOnly cookie
- CORS whitelist
- Oddzielne tabele:
  - users_auth
  - user_profiles
  - user_sessions

Architektura jest poprawna i stanowi solidny fundament.

---

# 3. Enterprise Hardening – Wymagane elementy

---

# ETAP 1 — Rate Limiting (KRYTYCZNE)

## 1.1 Login rate limiting

Wymagania:

- Limit: np. 5 prób / 15 minut
- Ograniczenie per:
  - IP
  - email
- Po przekroczeniu:
  - HTTP 429
- Opcjonalnie: exponential backoff

Cel:
Ochrona przed brute force.

Rekomendacja techniczna:
- Redis
- sliding window algorithm
- middleware przed `/auth/login`

---

## 1.2 Refresh rate limiting

Wymagania:

- Limit np. 20 refresh / 5 minut per user_id
- Ochrona przed token flooding

Middleware przed `/auth/refresh`.

---

# ETAP 2 — Refresh Token Reuse Detection (BARDZO WAŻNE)

## Problem

Obecnie:
- Refresh token jest revoke po użyciu
- Ale brak detekcji jego ponownego użycia

## Wymagane zachowanie

Jeśli:
- Refresh token został już użyty (is_revoked = true)

To:
1. Traktujemy to jako atak (token reuse attack)
2. Revoke wszystkich sesji użytkownika:
   ```sql
   UPDATE user_sessions
   SET is_revoked = true
   WHERE user_id = ?;
   ```
3. Logujemy security incident
4. Zwracamy 401

To jest wymagane w środowisku enterprise.

---

# ETAP 3 — Max Sessions Policy

## Wymagania

- Maksymalnie np. 5 aktywnych sesji per user
- Przy przekroczeniu:
  - usuwamy najstarszą
  LUB
  - blokujemy nową

Rekomendacja:
Automatycznie revoke najstarszą sesję.

---

# ETAP 4 — Revoke All Sessions on Password Change

Po zmianie hasła:

```sql
UPDATE user_sessions
SET is_revoked = true
WHERE user_id = ?;
```

Wymagane w politykach bezpieczeństwa.

---

# ETAP 5 — Security Logging

## Wdrożyć centralny logger (np. pino)

Logować:

- failed login
- invalid password
- refresh expired
- refresh reuse detected
- revoke all sessions
- suspicious activity (opcjonalnie)

Struktura loga:

- user_id
- ip_address
- user_agent
- timestamp
- event_type
- metadata (opcjonalnie)

Docelowo kompatybilne z SIEM.

---

# ETAP 6 — CSRF Strategy

W production:

- SameSite=None
- Secure=true
- Domain=.docktogo.com

Wymagane:

- Wszystkie mutujące endpointy wymagają Authorization header
- Refresh ograniczony do path `/auth`
- Rozważyć CSRF token przy rozbudowie

---

# ETAP 7 — Config Validation on Startup

Przy starcie aplikacji sprawdzić:

- JWT_SECRET
- JWT_REFRESH_SECRET
- DATABASE_URL
- NODE_ENV
- PORT

Jeśli brakuje → aplikacja nie startuje.

Enterprise standard.

---

# ETAP 8 — Health & Readiness

Rozdzielić endpointy:

- `/health/live` – serwer działa
- `/health/ready` – DB connection OK
- `/health` – ogólny status

Wymagane pod load balancer.

---

# ETAP 9 — Indeksy DB

Sprawdzić / dodać indeksy:

- user_sessions(refresh_token_hash)
- user_sessions(user_id, is_revoked)
- users_auth(email)

Cel:
Skalowalność przy 10k+ użytkowników.

---

# ETAP 10 — Dokumentacja polityki bezpieczeństwa

Utworzyć dokument opisujący:

- Lifecycle access token
- Lifecycle refresh token
- Rotację
- TTL
- Max sessions policy
- Revoke policy
- Password policy
- Incident handling (reuse detection)

Wymagane w rozmowach enterprise.

---

# 4. Priorytety

## Krytyczne (Sprint 1)

1. Rate limiting
2. Refresh reuse detection
3. Max sessions policy
4. Security logging

## Hardening (Sprint 2)

1. Config validation
2. Health split
3. Dokumentacja polityki
4. CSRF review

---

# 5. Ocena po wdrożeniu

Po wdrożeniu powyższych:

| Obszar | Ocena |
|--------|-------|
| Architektura tokenów | 9/10 |
| Bezpieczeństwo produkcyjne | 9/10 |
| Gotowość na audyt | Wysoka |
| Enterprise compliance | Akceptowalne |

---

# 6. Wniosek

Obecny system auth ma solidny fundament.

Nie wymaga przebudowy.

Wymaga hardeningu i polityki bezpieczeństwa.

Po wdrożeniu powyższych punktów system będzie gotowy do rozmów z poważnymi klientami i audytami bezpieczeństwa.