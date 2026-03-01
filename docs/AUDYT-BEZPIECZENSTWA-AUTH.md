# Audyt bezpieczeństwa – Autentykacja (Auth)

**Data:** 2026-02-27  
**Zakres:** Autentykacja i autoryzacja (auth) – frontend (docktogo-app) i backend (docktogo-api).  
**Pominięto:** TLS/HTTPS (kontrola przez reverse proxy).

---

## 1. Podsumowanie wykonawcze

| Obszar              | Ocena  | Uwagi |
|---------------------|--------|--------|
| Hasła i logowanie   | Dobra  | bcrypt, rate limiting, brak wycieku „email nie istnieje” |
| Tokeny (JWT + refresh)| Dobra | Rotacja refresh, RRD, access tylko w pamięci po stronie frontu |
| Sesje i cookies     | Dobra  | HttpOnly, path, SameSite; brak walidacji body na login/register |
| Autoryzacja (RBAC)  | Średnia| Tylko część endpointów weryfikuje uprawnienia; brak middleware `requirePermission` |
| CORS i origin       | Dobra  | Whitelist originów; middleware `requireOriginMatch` nieużywany / niekompletny |
| Walidacja wejścia   | Średnia| Middleware `validateAuthBody` istnieje, ale **nie jest podpięty** do tras |

---

## 2. Backend (docktogo-api)

### 2.1 Logowanie i hasła

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Hashowanie haseł | ✅ | bcrypt, SALT_ROUNDS = 12 |
| Komunikat błędu | ✅ | Jednolity „Invalid email or password” – brak wycieku informacji o istnieniu konta |
| Rate limiting logowania | ✅ | 5 prób / 15 min na IP i na email (Redis, sliding window) |
| Timing attack | ⚠️ Średnie | Różnica czasu: brak użytkownika (brak bcrypt) vs złe hasło (bcrypt). Zalecenie: stało-czasowe dummy bcrypt.compare przed 401. |

### 2.2 JWT (access token)

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Algorytm | ⚠️ | Domyślny HS256 w bibliotece; brak jawnego `algorithm: 'HS256'` w `jwt.sign`/`jwt.verify` – zalecane jawne ustawienie. |
| Payload | ✅ | Tylko `sub` (user id), `exp` – brak wrażliwych danych |
| Czas życia | ✅ | Konfigurowalne (np. 15m z env) |
| Siła klucza | ⚠️ | Brak walidacji minimalnej długości JWT_SECRET przy starcie (np. min 32 znaki / 256 bitów). |

### 2.3 Refresh token i sesje

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Rotacja | ✅ | Przy każdym refresh: revoke starej sesji + nowa sesja w transakcji |
| Wykrywanie reuse (RRD) | ✅ | Wykryty reuse → revoke wszystkich sesji użytkownika + log SECURITY |
| Hash refresh tokena | ✅ | SHA-256 przed zapisem w DB |
| Wygaśnięcie | ✅ | `expires_at` sprawdzane; wygasły token → 401 bez eskalacji |
| Race przy podwójnym refresh | ✅ | UPDATE … AND is_revoked = false RETURNING – tylko jedna transakcja wygrywa |

### 2.4 Cookie (refresh_token)

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| HttpOnly | ✅ | Ustawione |
| Secure | ✅ | W production |
| SameSite | ✅ | `none` w production (cross-origin), `lax` w dev |
| Path | ✅ | `/auth` – cookie wysyłane tylko na ścieżki auth |
| Domain | ✅ | W production `.docktogo.com` (cross-subdomain) |

### 2.5 Walidacja body na endpointach auth

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Middleware | ❌ | `validateLoginBody` i `validateRegisterBody` (email, długość hasła, format) **nie są użyte** w `auth.routes.js`. Kontroler tylko sprawdza `!email \|\| !password` – brak limitu długości i regex email. |
| Zalecenie | Wysokie | Podłączyć `validateLoginBody` do POST `/login` i `validateRegisterBody` do POST `/register`. |

### 2.6 Rejestracja

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Rate limiting | ❌ | Endpoint `/auth/register` **nie ma** rate limitingu – możliwy spam rejestracji / wyczerpanie zasobów. |
| Zalecenie | Średnie | Dodać rate limit per IP (np. 5 rejestracji / 60 min) dla POST `/auth/register`. |

### 2.7 Ochrona przed nadużyciami refresh

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Rate limit refresh | ✅ | 20 prób / 5 min na user_id (na podstawie refresh tokena z cookie) |

### 2.8 Autoryzacja (RBAC)

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Role i uprawnienia | ✅ | `roles.js`: mapowanie roleType → permissions (read, warehouse_operations, office_operations, manage_team, manage_all, all) |
| Wymaganie auth | ✅ | Wszystkie chronione trasy używają `requireAuth` (Bearer JWT) |
| Sprawdzanie uprawnień | ⚠️ | Tylko `transports.controller.ingest` sprawdza `hasPermission(..., 'office_operations')`. Endpointy docks, branches, users, pozostałe transports **nie** weryfikują konkretnych uprawnień – każdy zalogowany użytkownik ma dostęp. |
| Zalecenie | Wysokie | Wprowadzić middleware `requirePermission('office_operations')` (lub inne) na trasach wrażliwych (np. tworzenie oddziałów, ingest, zarządzanie kolejką) i konsekwentnie stosować `hasPermission` w kontrolerach. |

### 2.9 CORS i Origin

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| CORS | ✅ | Whitelist originów (production: app.docktogo.com; dev: localhost:5174), credentials: true |
| requireOriginMatch | ⚠️ | Middleware istnieje w `requireOriginMatch.js`, ale **nie jest używany** na `/auth/refresh`. Dodatkowo wymaga `frontendUrl` z `config/env`, którego **nie ma** w eksporcie `env.js` – po podłączeniu trzeba dodać `frontendUrl` do konfiguracji. |

### 2.10 IP i trust proxy

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Trust proxy | ✅ | `app.set('trust proxy', 1)` – poprawne odczytywanie IP za jednym proxy. Przy wielu hopach (LB + WAF) udokumentować i ewentualnie dostosować. |

### 2.11 Logowanie incydentów

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Security events | ✅ | `logSecurityEvent('REFRESH_TOKEN_REUSE', ...)` przy wykryciu reuse; format JSON, pola timestamp, event_type, user_id, ip, user_agent. |

### 2.12 Obsługa błędów

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Wyciek stosu | ✅ | errorHandler zwraca tylko message, code, status – bez stack trace. |
| Kody błędów | ✅ | Spójne kody (INVALID_CREDENTIALS, SESSION_COMPROMISED, RATE_LIMIT_EXCEEDED itd.). |

---

## 3. Frontend (docktogo-app)

### 3.1 Przechowywanie tokenów

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Access token | ✅ | Tylko w pamięci (useState + useRef) – **nie** w localStorage/sessionStorage, co ogranicza ryzyko XSS kradzieży tokena. |
| Refresh token | ✅ | Wysyłany tylko w cookie (credentials: 'include'); frontend nie ma do niego dostępu (HttpOnly). |

### 3.2 Logowanie

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Wysyłanie danych | ✅ | POST JSON email + hasło; credentials: 'include' (cookie przy odpowiedzi). |
| Obsługa odpowiedzi | ✅ | Zapis access_token w kontekście; przekierowanie po sukcesie. |
| Komunikat błędu | ✅ | Ogólny komunikat z API (brak rozróżnienia „email nie istnieje” po stronie UI). |

### 3.3 Odświeżanie sesji

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Refresh przy starcie | ✅ | AuthContext wywołuje `auth.refresh()` (POST z credentials) przed uznaniem użytkownika za zalogowanego. |
| Retry przy 401 | ✅ | ApiClient przy 401 wywołuje refresh i ponawia request z nowym tokenem; przy niepowodzeniu refresh czyści token. |

### 3.4 Wylogowanie

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Wywołanie API | ✅ | POST logout z credentials – backend czyści cookie i revoke sesji. |
| Stan lokalny | ✅ | setAccessToken(null) po logout. |

### 3.5 Ochrona tras

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| Trasy chronione | ✅ | Brak accessToken → przekierowanie na /login; zalogowany użytkownik nie ma dostępu do formularza logowania (redirect na dashboard). |

### 3.6 Inne

| Aspekt | Status | Szczegóły |
|--------|--------|-----------|
| localStorage | ⚠️ | Używany tylko do preferencji (np. ThemeContext) – **nie** do tokenów. OK. |

---

## 4. Rekomendacje (priorytet)

### Wysoki

1. **Podłączyć walidację body na auth**  
   W `auth.routes.js`: użyć `validateLoginBody` przy POST `/login` i `validateRegisterBody` przy POST `/register` (middleware z `validateAuthBody.js`).

2. **RBAC na chronionych endpointach**  
   Zdefiniować i stosować middleware `requirePermission('...')` oraz sprawdzenia `hasPermission` przy operacjach wrażliwych (tworzenie oddziałów, docków, ingest, zarządzanie kolejką itd.).

### Średni

3. **Rate limiting rejestracji**  
   Dodać rate limit (np. per IP) na POST `/auth/register`.

4. **JWT: jawny algorytm i walidacja klucza**  
   W `jwt.js`: jawnie ustawić `algorithm: 'HS256'` w sign/verify. W `config/env.js`: przy starcie sprawdzić długość JWT_SECRET (np. min 32 znaki) i nie uruchamiać aplikacji przy zbyt krótkim kluczu.

5. **Timing attack na login**  
   W ścieżce „użytkownik nie istnieje” wykonać stało-czasowe dummy bcrypt.compare (np. z stałym hashem), aby czas odpowiedzi był zbliżony do ścieżki „złe hasło”.

6. **requireOriginMatch na /auth/refresh**  
   Dodać `frontendUrl` do `config/env.js`; podłączyć `requireOriginMatch` do trasy POST `/auth/refresh` (szczególnie przy SameSite=None).

### Niski

7. **UNIQUE na refresh_token_hash**  
   Upewnić się, że w DB jest ograniczenie UNIQUE na `refresh_token_hash` w tabeli sesji (zgodnie z wcześniejszym audytem migracji).

8. **Dokumentacja proxy**  
   Udokumentować liczbę proxy przed aplikacją i ewentualne dostosowanie `trust proxy` lub ekstrakcji IP (np. CF-Connecting-IP).

---

## 5. Wykaz plików objętych audytem

**Backend:**  
`auth/auth.service.js`, `auth/auth.controller.js`, `auth/auth.routes.js`, `auth/auth.middleware.js`, `auth/jwt.js`, `auth/roles.js`, `auth/cookieOptions.js`, `config/env.js`, `config/redis.js`, `core/rateLimiter.js`, `core/securityLogger.js`, `core/errors.js`, `middleware/rateLimitLogin.js`, `middleware/rateLimitRefresh.js`, `middleware/validateAuthBody.js`, `middleware/requireOriginMatch.js`, `app.js`, `routes/api.v1.js`, moduły branches/docks/transports (routes + kontrolery).

**Frontend:**  
`api/auth.ts`, `api/client.ts`, `context/AuthContext.tsx`, `features/auth/LoginPage.tsx`, `App.tsx`.

---

*Raport uzyskany w ramach audytu bezpieczeństwa auth. TLS/HTTPS pominięto – kontrola przez warstwę reverse proxy.*
