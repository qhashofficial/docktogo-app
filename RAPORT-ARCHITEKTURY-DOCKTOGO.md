# Raport architektury: DockToGo (docktogo-api + docktogo-app)

**Data:** 2026-02-22  
**Zakres:** Backend (docktogo-api), Frontend (docktogo-app).  
**Cel:** Analiza architektury, mocne/słabe strony, ryzyka, rekomendacje pod Dock Management 2.0. Bez refaktoru i bez generowania kodu.

---

# 1️⃣ Backend (docktogo-api)

## 1.1 Struktura folderów

```
docktogo-api/
├── src/
│   ├── app.js              # Express app, CORS, cookie-parser, trasy, errorHandler
│   ├── server.js           # require env, listen, shutdown (SIGINT/SIGTERM)
│   ├── config/
│   │   └── env.js          # port, databaseUrl, jwt (secret, refreshSecret, expiresIn)
│   ├── core/
│   │   ├── db.js           # pg Pool
│   │   ├── errors.js       # AppError, errorHandler
│   │   └── transaction.js  # withTransaction(client => ...)
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.middleware.js  # requireAuth
│   │   ├── jwt.js              # signAccess, verifyAccess
│   │   ├── roles.js            # ROLE_NAMES, hasPermission, canManageRole, getPermissions
│   │   └── cookieOptions.js    # getRefreshCookieOptions, getRefreshClearOptions
│   └── users/
│       ├── users.routes.js
│       ├── users.controller.js
│       └── users.service.js
├── sql/
│   └── 001_auth_tables.sql
├── package.json
└── .env
```

Brak: `models/`, `repositories/`, `validators/`, osobnych modułów pod domeny (dock, planning, itd.).

---

## 1.2 Warstwy (controller, service, db, middleware)

- **Routes:** cienkie, tylko mapowanie HTTP → controller.
- **Controller:** walidacja wejścia (np. email/password required), wywołanie service, ustawienie cookie / clearCookie, format odpowiedzi. Część walidacji (np. kod 23505 → EMAIL_TAKEN) jest w controllerze.
- **Service:** logika biznesowa (rejestracja, logowanie, refresh, logout, getProfileById), SQL przez `pool` lub `withTransaction`. Brak warstwy repository – SQL jest w service.
- **DB:** `core/db.js` (pool), `core/transaction.js`. Brak migracji w kodzie (tylko ręczny skrypt SQL).
- **Middleware:** `requireAuth` (Bearer, JWT verify, profil, isActive), CORS i cookie-parser w app.js.

Separacja: controller ↔ service jest zachowana. Brak wyraźnej warstwy dostępu do danych (repository) – service bezpośrednio pisze SQL.

---

## 1.3 Separacja odpowiedzialności

- **Tak:** Auth vs Users jako dwa moduły; core (db, errors, transaction) współdzielone; cookie opcje wyciągnięte do cookieOptions.js.
- **Nie:** Brak warstwy walidacji wejścia (np. express-validator lub schemy) – walidacja ad hoc w controllerze. Brak warstwy repository – service zna szczegóły SQL. Logika „mapowania błędu 23505 na EMAIL_TAKEN” jest w controllerze zamiast w jednym miejscu obsługi błędów (np. w errorHandler lub mapperze błędów DB).

---

## 1.4 Auth (JWT + refresh cookie)

- **Access token:** JWT (signAccess/verifyAccess), krótki czas życia (env: 15m), przekazywany w nagłówku Authorization.
- **Refresh token:** wartość losowa (crypto), hash w DB (user_sessions), przechowywany w **HttpOnly cookie** (path `/auth`, domain w production `.docktogo.com`, sameSite/secure wg NODE_ENV). **Nie** wraca w body – tylko ustawienie cookie.
- **Flow:** login/register → cookie + body (access_token, profile, permissions). Refresh → odczyt z `req.cookies.refresh_token`, rotacja tokena, nowa cookie, body bez refresh_token. Logout → revoke po cookie, clearCookie.
- **Sesje:** user_sessions (user_id, refresh_token_hash, expires_at, is_revoked). Brak jawnego „revoke wszystkich sesji użytkownika” w API (jest revokeSession w service, ale nie wystawione w routes).

Mocne: cookie HttpOnly, rotacja refresh, CORS z credentials. Słabe: brak blacklisty access tokenów (unieważnienie przed wygaśnięciem wymaga albo krótkiego TTL, albo dodatkowego mechanizmu).

---

## 1.5 CORS

- Whitelist originów: production `https://app.docktogo.com`, development `http://localhost:5174`. Opcjonalnie `EXTRA_CORS_ORIGINS` z env.
- `credentials: true`, metody i nagłówki jawne. Brak `app.options('*')` (usunięte pod Express 5).
- Preflight obsługiwany przez `app.use(cors(corsOptions))`.

Konfiguracja sensowna i bezpieczna (brak `*` przy credentials).

---

## 1.6 Obsługa błędów

- **AppError(message, code, statusCode)** – używane w controllerach i service.
- **errorHandler** – ostatni middleware: statusCode/code/message z err, odpowiedź JSON `{ status: 'error', message, code }`.
- Błędy JWT (JsonWebTokenError, TokenExpiredError) mapowane na 401 w requireAuth.
- Błąd 23505 (unique) mapowany w auth.controller na EMAIL_TAKEN 409.

Brak: globalnego mapowania błędów DB (np. 23505) w jednym miejscu; brak logowania błędów (np. do loggera); brak rozróżnienia „expose” message do klienta vs wewnętrzny log.

---

## 1.7 Logika biznesowa – miejsce

- W **service:** rejestracja, logowanie, refresh, logout, getProfileById, getMe, updateMe (users). To dobre miejsce.
- W **controllerze:** decyzja „brak refresh_token → 200 + data null” (refresh) – to już polityka API, akceptowalne w controllerze. Mapowanie 23505 → EMAIL_TAKEN – lepiej w jednym error mapperze.
- Role/permissions w **roles.js** – używane z auth (service, middleware). Spójne.

Nie ma jeszcze logiki domenowej dock/planning/realtime – backend jest w praktyce „auth + users”.

---

## 1.8 Elementy w złej warstwie / brakujące

- **Repository:** brak – SQL w service. Przy rozroście (dock, planning) lepiej wydzielić warstwę dostępu do danych.
- **Walidacja wejścia:** rozproszona (if !email w controllerze). Brak schematów (Joi/Zod/express-validator) – przy nowych endpointach łatwo o niespójność.
- **Konfiguracja cookie:** w osobnym pliku – ok. Konfiguracja CORS w app.js – przy rozroście można przenieść do config.
- **Błąd CORS:** `callback(new Error('Not allowed by CORS'))` – w errorHandler trafia jako 500. Dla CORS często oczekuje się 403 lub pozostawienia braku nagłówka Allow-Origin (obecne zachowanie i tak „blokuje” przeglądarkę).

---

## 1.9 Skalowanie pod dock management, planning, realtime

- **Struktura:** jeden app.js, trasy montowane liniowo. Dodanie `/docks`, `/planning` itd. jest proste, ale bez warstwy domen (modules/dock, modules/planning) wszystko będzie w jednym „głównym” drzewie – ryzyko rozrośnięcia się jednego pliku tras lub mieszania odpowiedzialności.
- **DB:** jeden pool, brak connection per request / multi-tenancy (destination_id) w warstwie dostępu – przy 20–100 użytkowników i wielu destynacjach warto od początku myśleć o filtrowaniu po destination_id i indeksach.
- **Realtime:** brak (brak WebSocket/Socket.io/SSE). Docelowo dock management 2.0 pewnie będzie wymagał realtime – to osobna warstwa (hub, rooms per destination, auth z JWT).
- **Transakcje:** withTransaction jest; przy operacjach wielotabelowych (np. dock + block + orders) trzeba będzie konsekwentnie go używać w service.

Podsumowanie: architektura **wystarczy** na rozbudowę o kilka modułów (dock, planning), ale **bez refaktoru** (moduły domenowe, opcjonalnie repository, walidacja) kod szybko stanie się trudny w utrzymaniu. Pod realtime i większą skalę – brak przygotowania.

---

## 1.10 Technical debt (backend)

- Literówka w **app.js** (np. `ćconst` zamiast `const`) – może powodować błąd uruchomienia.
- Brak warstwy repository – SQL w service.
- Brak centralnego mapowania błędów DB (np. 23505) i brak strategii logowania błędów.
- Brak migracji w procesie (tylko ręczny SQL) – przy wielu wersjach schematu trudna wersjonowanie.
- users.service wywołuje authService.getProfileById – zależność users → auth; przy rozroście warto rozważyć wspólny „user profile” module lub shared kernel.
- Brak rate limiting / request ID – przy wystawieniu na internet warto dodać.

---

## 1.11 Backend – mocne strony

- Czysty podział controller / service w auth i users.
- Auth z HttpOnly refresh cookie i rotacją; CORS z whitelistą i credentials.
- Wspólny errorHandler i AppError; withTransaction do transakcji.
- Konfiguracja w env (port, JWT, DB); cookie options wyciągnięte do pliku.

---

## 1.12 Backend – słabe strony

- Brak repository i walidacji wejścia; SQL i walidacja rozproszone.
- Jeden „poziom” modułów (auth, users) – brak struktury pod wiele domen (dock, planning).
- Brak realtime, brak migracji w repozytorium, brak logowania błędów.

---

## 1.13 Backend – ryzyka

- Rozrost app.js i brak modułowości → trudne utrzymanie przy dock/planning.
- Brak rate limiting i audytu → ryzyko przy publicznym API.
- Jeden błąd w app.js (literówka) może unieruchomić cały backend.

---

## 1.14 Backend – braki

- Moduły: dock, planning, destinations, (opcjonalnie) reports/returns.
- Warstwa repository (lub przynajmniej „query” obok service).
- Walidacja wejścia (schematy).
- Migracje (np. node-pg-migrate, knex, prisma migrate).
- Realtime (WebSocket/SSE).
- Logging (np. pino) i request ID.
- Rate limiting, health rozszerzony (np. wersja, zależności).

---

# 2️⃣ Frontend (docktogo-app)

## 2.1 Struktura folderów

```
docktogo-app/src/
├── main.tsx           # StrictMode, BrowserRouter, AuthProvider, App
├── App.tsx            # Routes, gate: isInitializing / !accessToken / accessToken
├── index.css          # Tailwind + base
├── App.css
├── lib/
│   └── api.ts         # getApiUrl(), typy (AuthProfile, LoginResponse, RefreshResponse)
├── context/
│   └── AuthContext.tsx
├── components/
│   └── BackgroundSlider.tsx
├── LoginPage.tsx
├── Dashboard.tsx
└── assets/
```

Brak: `pages/`, `features/`, `hooks/`, `services/`, `api/` (jako warstwa wywołań HTTP), `types/` globalnych.

---

## 2.2 Warstwa API

- **lib/api.ts:** tylko `getApiUrl()` i typy TypeScript. **Brak** warstwy API w sensie „funkcje wywołujące endpointy” (np. `authApi.login()`, `usersApi.getMe()`).
- Wywołania HTTP: w **AuthContext** (refresh, logout, apiFetch) i w **LoginPage** (fetch do login). Login nie używa apiFetch – bezpośredni fetch. Dashboard nie wywołuje API (tylko logout z kontekstu).

Czyli: brak spójnej warstwy API; część w kontekście, część w komponencie.

---

## 2.3 AuthContext

- **Stan:** accessToken (useState + useRef dla apiFetch), isInitializing.
- **Przechowywanie access_token:** wyłącznie w pamięci (state + ref). Nie w localStorage – po odświeżeniu strony token znika, sesja odtwarzana przez tryRefresh() (cookie).
- **tryRefresh:** POST /auth/refresh z credentials; przy sukcesie zwraca access_token, ustawiany w state. Przy starcie useEffect wywołuje tryRefresh() i po zakończeniu ustawia isInitializing = false.
- **apiFetch(path, options):** dopina Authorization: Bearer, credentials: include; przy 401 wywołuje tryRefresh(), po sukcesie ponawia request raz. Nie eksportuje się go do „warstwy API” – komponenty muszą używać useAuth().apiFetch.
- **logout:** POST /auth/logout, credentials, potem setAccessToken(null).

Mocne: refresh z cookie, retry przy 401, brak refresh_token w localStorage. Słabe: cała logika auth i HTTP w jednym kontekście; brak wyodrębnionego „auth API” i możliwości testowania bez Reacta.

---

## 2.4 Refresh flow

- Wejście na stronę → AuthProvider mount → useEffect → tryRefresh() → brak cookie → 200 + data null → accessToken = null, isInitializing = false → App pokazuje Login.
- Po logowaniu: access_token w state, refresh w cookie; po odświeżeniu: tryRefresh() z cookie → nowy access_token w state.
- Przy wygaśnięciu access: dowolne apiFetch() dostaje 401 → tryRefresh() → ponowienie requestu. Logout czyści state i wywołuje backend (clearCookie).

Flow jest spójny i bezpieczny (brak refresh w localStorage).

---

## 2.5 UI vs logika

- **LoginPage:** formularz, stan (email, password, loading, error), handleSubmit z fetch i setAccessToken – logika i UI w jednym komponencie. Duży komponent (form + layout).
- **Dashboard:** tylko prezentacja + przycisk logout – cienki.
- **App:** routing + bramka auth (isInitializing, accessToken) – czytelne, ale cała logika „kto co widzi” w jednym pliku.

Brak: wydzielonych hooków (np. useLogin), serwisów API, kontenerów vs presentational components. Przy rozroście łatwo o „grube” komponenty z mieszaną logiką i UI.

---

## 2.6 Routing i ochrona

- **Router:** react-router-dom; Routes w App.
- **Ochrona:** brak osobnego `<ProtectedRoute>`. Decyzja w App: jeśli !accessToken → tylko /login i /, reszta → Navigate do /login. Jeśli accessToken → /dashboard i przekierowania z / oraz *.
- Brak ról w routingu (wszyscy zalogowani widzą to samo); brak trasy „tylko admin”.

Ochrona jest „na bramce” (jedna decyzja w App), co jest OK na mały zakres. Przy wielu rolach i trasach warto wydzielić ProtectedRoute i może role-based routes.

---

## 2.7 Skalowalność kodu

- Brak podziału na features (auth, dashboard, dock, planning). Wszystko w src/ płasko lub w 2–3 folderach.
- Brak warstwy API (moduły typu api/auth.ts, api/users.ts) – przy wielu endpointach fetch rozleje się po komponentach.
- AuthContext już jest „duży” (auth + refresh + apiFetch) – przy dodaniu np. cache’owania profilu, list użytkowników itd. stanie się jeszcze większy.
- Brak globalnych typów (poza lib/api.ts) i brak wspólnego kontraktu odpowiedzi API (np. ApiResponse<T>).

Pod rozbudowę (dock management, wiele ekranów): bez wprowadzenia features/, api/, hooks/ i ewentualnie state (np. React Query) – chaos w środku aplikacji jest prawdopodobny.

---

## 2.8 Frontend – mocne strony

- Auth oparty o cookie (refresh) i token w pamięci; apiFetch z retry przy 401.
- Jedna bramka dostępu (App + accessToken); czytelny flow inicjalizacji (isInitializing).
- Tailwind, jeden kontekst auth, TypeScript w kluczowych miejscach.

---

## 2.9 Frontend – słabe strony

- Brak warstwy API (moduły, funkcje); fetch w LoginPage i w AuthContext.
- Płaska struktura – brak features/pages; duży potencjał na „wszystko w jednym” przy rozroście.
- LoginPage łączy UI i logikę; brak hooków do ponownego użycia.
- Dashboard nie używa apiFetch (np. do /users/me) – brak wzorca „strona ładuje dane przez apiFetch”.

---

## 2.10 Gdzie może powstać chaos

- Dodawanie nowych ekranów (dock, planning) bez folderów features/ lub pages/ → pliki w jednym worku.
- Wielokrotne fetch w różnych komponentach z powieloną obsługą błędów i loading → niespójne UX i duplikacja.
- Rozbudowa AuthContext o profil, permissions, destination bez wydzielenia (np. useProfile, osobny kontekst) → monolit kontekstu.
- Brak wspólnego formatu błędów z API (np. code, message) i brak globalnej obsługi (toast/notification) → każda strona obsługuje błędy inaczej.

---

## 2.11 Co warto przebudować zanim system urośnie

- Wprowadzić **warstwę API:** np. `api/client.ts` (baza na apiFetch z kontekstu lub wrapper fetch), `api/auth.ts`, `api/users.ts` – żeby komponenty nie wywoływały surowego fetch.
- Wprowadzić **features/** (lub pages/): np. auth (LoginPage), dashboard, w przyszłości dock, planning – z własnymi komponentami i hookami.
- Rozważyć **hooki:** useLogin, useLogout, useProfile – i ewentualnie „cienki” AuthContext tylko ze stanem + apiFetch, a logika w hookach.
- Ujednolicić **obsługę błędów API** (format, np. toast) i loading (np. wspólny komponent lub konwencja).
- Dodać **ProtectedRoute** (lub rozszerzyć bramkę w App) z możliwością ról, gdy pojawią się uprawnienia w UI.
- Rozważyć **React Query (lub SWR)** przy wielu listach i danych z API – zamiast ręcznego stanu w każdym ekranie.

---

# 3️⃣ Globalnie

## 3.1 Monorepo vs osobne repozytoria

- **Obecnie:** API i APP w osobnych katalogach (prawdopodobnie osobne repozytoria lub jeden parent z dwoma folderami).
- **Rekomendacja:** Dla zespołu 1–3 osoby i jednego produktu (DockToGo) **monorepo** (np. `packages/api`, `packages/app`) daje: wspólną historię, wspólne PR-y, ewentualnie wspólne typy (kontrakt API), skrypty typu `dev:all`. Osobne repo ma sens przy oddzielnych teamach, oddzielnym cyklu wydań API i wielu klientach API. Dla Dock Management 2.0 z jednym frontem i jednym backendem – **monorepo jest korzystne**.

---

## 3.2 Czy obecna struktura nadaje się pod 20–100 użytkowników

- **Backend:** Tak pod obciążenie (pojedyncza instancja Node + Postgres zwykle wystarczy). Ograniczeniem będzie brak rate limitingu, brak skalowania poziomego (stateless jest, ale nie ma opisu deployu wielu instancji), brak cache’a (np. Redis) – na start 20–100 użytkowników to nie jest problem.
- **Frontend:** Tak pod liczbę użytkowników (statyczny build, CDN). Problemem jest **utrzymywalność i rozbudowa** (brak modularności, warstwy API, struktury features) – czyli skalowanie **zespołu i funkcji**, nie ruchu.
- **Podsumowanie:** Na 20–100 użytkowników **tak**, pod warunkiem że refaktor (moduły backend, warstwa API + struktura frontu) zrobi się w trakcie dodawania dock/planning, żeby uniknąć długu technicznego.

---

## 3.3 Czy wymaga refaktoru przed rozbudową

- **Backend:** Nie musi być „wielki” refaktor przed pierwszymi endpointami dock/planning, ale **warto:** (1) wydzielić moduły (np. `src/modules/dock`, `src/modules/planning`) z własnymi routes/controller/service; (2) wprowadzić walidację wejścia; (3) naprawić literówkę w app.js; (4) rozważyć repository przy nowych encjach. Bez tego rozbudowa zadziała, ale koszt utrzymania szybko urośnie.
- **Frontend:** Przed masowym dodawaniem ekranów **warto:** (1) warstwa API (api/); (2) folder features/ lub pages/; (3) konwencja ładowania danych i błędów. Bez tego nowe ekrany będą kopiować ad hoc fetch i struktura się rozleci.
- **Odpowiedź:** Tak – **rozsądny refaktor (moduły, warstwa API, struktura katalogów)** przed lub równolegle z rozbudową jest wskazany; nie trzeba przepisywać wszystkiego od zera.

---

## 3.4 Jak zaprojektowałbym strukturę pod Dock Management 2.0

**Backend:**

- **Struktura modułowa:** np. `src/modules/auth`, `users`, `destinations`, `dock`, `planning` – każdy z routes, controller, service; opcjonalnie repository (lub „queries”) przy skomplikowanym dostępie do danych.
- **Wspólne:** core (db, errors, transaction, logger), config (env, cors, cookie), middleware (requireAuth, opcjonalnie requireRole, requestId).
- **Walidacja:** jedna biblioteka (Joi/Zod/express-validator) i schematy przy trasach lub w controllerze.
- **Realtime:** osobny moduł (np. realtime lub ws) – Socket.io/SSE, autentykacja z JWT, pokoje np. per destination_id.
- **Migracje:** w repozytorium (np. katalog migrations/), uruchamiane przy starcie lub w CI; wersjonowanie schematu.
- **API:** wersjonowanie opcjonalne (np. /v1/...) od razu lub przy drugim kliencie.

**Frontend:**

- **Struktura:** np. `src/features/auth`, `dashboard`, `dock`, `planning` (lub pages/) + `src/api` (client, auth, users, dock, planning), `src/context` (AuthContext możliwie „cienki”), `src/hooks`, `src/components` (wspólne).
- **Warstwa API:** funkcje wywołujące endpointy (np. authApi.login(), dockApi.getBlocks()), używające jednego klienta (z kontekstu apiFetch / interceptorem 401). Typy odpowiedzi współdzielone (np. z backendu lub wygenerowane).
- **Dane:** React Query (lub SWR) do list i szczegółów (dock, planning) – cache, refetch, loading/error w jednym miejscu.
- **Routing:** ProtectedRoute z opcjonalnymi rolami; trasy pogrupowane po feature (lazy load).
- **Realtime:** osobny hook/provider (np. useRealtimeSubscription) podpinany pod WebSocket/SSE z API; aktualizacje stanu (np. invalidation React Query) w jednym miejscu.

**Wspólnie:**

- Kontrakt API (opcjonalnie współdzielone typy w monorepo); spójny format błędów (np. code, message) i ich obsługa po stronie frontu (toast/notification).
- Środowiska: dev (localhost), staging, production – z osobnymi CORS i cookie (domain).

Taki szkielet pozwala dodawać kolejne moduły (dock, planning, realtime) bez mieszania odpowiedzialności i z jasnym miejscem na nowe endpointy i ekrany.

---

# Podsumowanie

| Obszar | Mocne strony | Główne braki / ryzyka |
|--------|--------------|------------------------|
| **Backend** | Czysty auth (cookie + JWT), CORS, controller/service, transakcje | Brak modułów domenowych, repository, walidacji, migracji; literówka w app.js |
| **Frontend** | AuthContext z refresh i apiFetch, ochrona tras, brak refresh w storage | Brak warstwy API, płaska struktura, UI+logika w LoginPage |
| **Globalnie** | Rozdzielenie API vs APP, sensowny stack | Przed Dock 2.0: refaktor modularny (backend + front) i warstwa API (front); monorepo zalecane |

Raport można wykorzystać jako podstawę do **PROMPT 2 – przebudowa architektury** (konkretne kroki refaktoru, bez pisania kodu w tym dokumencie).
