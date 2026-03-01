# Plan kontrolowanej przebudowy pod Dock Management 2.0

Plan etapowy dla **docktogo-api** i **docktogo-app** – bez generowania kodu, bez automatycznego refaktoru. Realistyczny, możliwy do wdrożenia przez 1 osobę.

---

## 1. Backend (docktogo-api)

### 1.1 Docelowa struktura katalogów

```
docktogo-api/
├── src/
│   ├── server.js
│   ├── app.js
│   ├── config/
│   │   ├── env.js
│   │   ├── cors.js
│   │   └── cookieOptions.js
│   ├── core/
│   │   ├── db.js
│   │   ├── errors.js
│   │   └── transaction.js
│   ├── middleware/
│   │   ├── requireAuth.js
│   │   └── validate.js          # opcjonalnie
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── jwt.js
│   │   │   └── roles.js
│   │   ├── users/
│   │   │   ├── users.routes.js
│   │   │   ├── users.controller.js
│   │   │   └── users.service.js
│   │   ├── destinations/
│   │   │   ├── destinations.routes.js
│   │   │   ├── destinations.controller.js
│   │   │   └── destinations.service.js
│   │   ├── dock/
│   │   │   ├── dock.routes.js
│   │   │   ├── dock.controller.js
│   │   │   ├── dock.service.js
│   │   │   └── dock.repository.js   # opcjonalnie
│   │   └── planning/
│   │       ├── planning.routes.js
│   │       └── ...
│   ├── realtime/
│   │   └── ws.js lub sse.js
│   └── migrations/
│       └── 001_, 002_, ...
├── sql/
├── package.json
└── .env
```

---

### 1.2 Mapowanie: co przenieść gdzie

| Obecna lokalizacja | Docelowa |
|--------------------|----------|
| `src/auth/auth.routes.js` | `src/modules/auth/auth.routes.js` |
| `src/auth/auth.controller.js` | `src/modules/auth/auth.controller.js` |
| `src/auth/auth.service.js` | `src/modules/auth/auth.service.js` |
| `src/auth/auth.middleware.js` | `src/middleware/requireAuth.js` |
| `src/auth/jwt.js` | `src/modules/auth/jwt.js` |
| `src/auth/roles.js` | `src/modules/auth/roles.js` |
| `src/auth/cookieOptions.js` | `src/config/cookieOptions.js` |
| `src/users/*` | `src/modules/users/*` |
| CORS (fragment w app.js) | `src/config/cors.js` |
| `app.get('/health', ...)` | Zostaje w app.js lub `routes/health.js` |

**Bez zmian:** `server.js`, `core/db.js`, `core/errors.js`, `core/transaction.js`, logika w `config/env.js`.

---

### 1.3 Kolejność refaktoru (małe kroki)

#### Faza A – przygotowanie

| Krok | Działanie | Weryfikacja |
|------|-----------|-------------|
| **1** | Dodać `config/cors.js` – przenieść logikę CORS z app.js. W app.js tylko `require` i `app.use(cors(...))`. Przenieść `auth/cookieOptions.js` → `config/cookieOptions.js`, zaktualizować importy w auth.controller. | `npm run dev`, logowanie, refresh, logout |
| **2** | Utworzyć `middleware/requireAuth.js` – przenieść zawartość auth.middleware. W auth.routes podłączyć requireAuth z `../middleware/requireAuth`. Usunąć stary auth.middleware.js. | /auth/me, /users/me |
| **3** | Utworzyć `modules/auth/` – przenieść routes, controller, service, jwt, roles. Zaktualizować ścieżki (core → ../../core, config → ../../config). W app.js: `app.use('/auth', require('./modules/auth/auth.routes'))`. Usunąć `src/auth/`. | register, login, refresh, logout, /auth/me |
| **4** | Utworzyć `modules/users/` – przenieść routes, controller, service. Zaktualizować importy (auth.service, requireAuth). W app.js: `app.use('/users', ...)`. Usunąć `src/users/`. | /users/me, PATCH /users/me |
| **5** | (Opcjonalnie) Zainstalować narzędzie migracji (np. node-pg-migrate). Folder `migrations/`. Pierwsza migracja = obecny schemat z sql/001_auth_tables.sql. | Migracje na czystej DB, start aplikacji |

#### Faza B – przed pierwszym endpointem dock

| Krok | Działanie | Weryfikacja |
|------|-----------|-------------|
| **6** | Dodać walidację wejścia (np. express-validator lub Joi) w jednym miejscu – np. auth.controller (register/login). Ustalić konwencję (middleware validate(schema) lub funkcja w controllerze). | Endpointy auth z nieprawidłowym body |
| **7** | Utworzyć szkielet `modules/dock/`: dock.routes.js (pusty router), dock.controller.js (placeholder), dock.service.js (placeholder). Opcjonalnie dock.repository.js. W app.js: `app.use('/dock', ...)`. | GET /dock (np. 200 lub placeholder) |
| **8** | Pierwszy prawdziwy endpoint dock, np. GET /dock/docks (lista doków dla destination_id). Controller: requireAuth, wywołanie service; service (i ewentualnie repository) – SQL. Walidacja np. destinationId. | GET /dock/docks z Bearer |

**Później (nie blokuje MVP):** destinations (szkielet), planning (szkielet), realtime (folder `realtime/`), repository w auth/users (opcjonalnie).

---

### 1.4 Co zrobić przed pierwszym endpointem dock

- Zakończyć **kroki 1–5** (config, middleware, modules auth i users, ewentualnie migracje).
- Zakończyć **krok 6** (walidacja + konwencja).
- Zakończyć **krok 7** (szkielet modułu dock, opcjonalnie repository).
- Naprawić literówkę w app.js (`ćconst` → `const`).
- Mieć ustaloną konwencję odpowiedzi: `{ status: 'ok', data }` / `{ status: 'error', code, message }` i AppError.

---

## 2. Frontend (docktogo-app)

### 2.1 Docelowa struktura katalogów

```
docktogo-app/src/
├── main.tsx
├── App.tsx
├── index.css
├── App.css
├── api/
│   ├── client.ts
│   ├── auth.ts
│   ├── users.ts
│   └── dock.ts
├── context/
│   └── AuthContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── (później) useDock.ts, usePlanning.ts
├── features/
│   ├── auth/
│   │   └── LoginPage.tsx
│   ├── dashboard/
│   │   └── Dashboard.tsx
│   ├── dock/
│   │   └── DockPage.tsx
│   └── planning/
├── components/
│   └── ui/
│       └── BackgroundSlider.tsx
├── lib/
│   └── api.ts
└── types/
```

---

### 2.2 Oddzielenie UI od logiki

- **Warstwa API:** wszystkie wywołania HTTP w `api/*` (auth.login(), users.getMe(), dock.getDocks()). Komponenty nie wywołują `fetch` bezpośrednio.
- **AuthContext:** tylko stan (accessToken, isInitializing), setAccessToken, dostarczenie „klienta” do warstwy API (funkcja zwracająca fetch z Bearer + credentials). Logika „jak zalogować” w api/auth + LoginPage.
- **LoginPage:** wywołuje `authApi.login(email, password)`; po sukcesie `setAccessToken(data.access_token)` i navigate. Formularz = tylko UI.
- **Dashboard:** np. `usersApi.getMe()` (przez apiFetch) lub React Query; wyświetla dane. Logout: api.auth.logout() + kontekst czyści token.
- **Hooki (opcjonalnie):** useLogin() – wywołuje authApi.login, setAccessToken, navigate; zwraca { login, loading, error }. LoginPage tylko używa useLogin() i renderuje formularz.

---

### 2.3 Wprowadzenie warstwy API

1. **api/client.ts** – funkcja `createApiClient(getToken, onTokenUpdate)` zwracająca metody get/post/patch/delete (fetch + base URL + credentials + Authorization). Przy 401: wywołanie refresh, onTokenUpdate(newToken), ponowienie requestu raz. Kontekst trzyma getToken, setAccessToken i przekazuje je do createApiClient.
2. **api/auth.ts** – login(), refresh(), logout() używające klienta.
3. **api/users.ts** – getMe(), updateMe() przez apiClient.
4. **AuthContext:** wywołania fetch zastąpić przez api.auth (refresh, logout). Kontekst: accessToken, setAccessToken, isInitializing, apiClient (lub getApiClient()).
5. **LoginPage:** zamienić bezpośredni fetch na api.auth.login().

---

### 2.4 React Query

- **Warto** przy listach (docks, blocks, planning). Auth zostaje w AuthContext; React Query dla getMe (opcjonalnie), getDocks, getBlocks.
- **Sposób:** QueryClientProvider w main. W queryFn używać apiClient z kontekstu. Np. w DockPage: `useQuery({ queryKey: ['docks', destinationId], queryFn: () => dockApi.getDocks(destinationId) })`.
- **Kolejność:** najpierw warstwa api/ i routing; pierwszy ekran z listą (docks) = dobry moment na React Query dla tego modułu.

---

### 2.5 Realtime

- Jeden hook, np. `useRealtimeSubscription(channel, event, handler)`. Połączenie WebSocket/SSE, autentykacja (token). Zdarzenia nie aktualizują setState wszędzie – najlepiej: realtime wywołuje `queryClient.invalidateQueries(['docks'])`, React Query refetchuje.
- Kolejność: po działającym REST dock dodać endpoint/WebSocket w backendzie, potem na frontzie hook + invalidateQueries.

---

### 2.6 Routing pod role

- Backend zwraca w /auth/me (lub w tokenie) role/permissions. Kontekst trzyma `profile` (z permissions).
- Komponent **ProtectedRoute**: prop `requiredPermission`. Jeśli !accessToken → redirect /login; jeśli brak uprawnienia → strona „Brak uprawnień” lub redirect.
- W routerze: `<Route path="/users" element={<ProtectedRoute requiredPermission="manage_team"><UserManagement /></ProtectedRoute>} />`.
- Kolejność: gdy backend zwraca permissions → dodać profile do kontekstu → ProtectedRoute → owinąć wybrane trasy.

---

### 2.7 Kolejność refaktoru frontendu

| Krok | Działanie |
|------|-----------|
| 1 | api/client.ts + api/auth.ts + api/users.ts. Kontekst nadal może wewnętrznie używać fetch – na razie tylko wydzielenie warstwy. |
| 2 | AuthContext „cienki”: wywołania fetch zastąpić przez api/auth (refresh, logout). Kontekst: stan + apiClient (createApiClient z getToken, setAccessToken). |
| 3 | LoginPage: zamienić fetch na api.auth.login(). |
| 4 | Utworzyć features/auth (LoginPage), features/dashboard (Dashboard). Przenieść pliki. components/ui (BackgroundSlider). |
| 5 | Routing: ewentualnie jeden plik routes z lazy load. App.tsx = bramka auth. |
| 6 | React Query: QueryClientProvider; pierwszy useQuery np. w Dashboard (getMe) lub przy pierwszym ekranie dock. |
| 7 | ProtectedRoute i profile/permissions gdy backend gotowy. |
| 8 | Realtime po działującym REST dock. |

---

## 3. Globalnie

### 3.1 Monorepo

- **Rekomendacja: tak** dla jednego produktu i małego zespołu.
- Struktura: np. `docktogo/` z `apps/api`, `apps/app`, ewentualnie `packages/shared` (typy).
- Kolejność: po ustabilizowaniu refaktoru – nowe repo lub folder, przeniesienie api i app jako apps, npm workspaces lub Turborepo, skrypty w root (np. `dev:all`).

### 3.2 Środowiska

| Środowisko | API | Frontend | CORS / cookie |
|------------|-----|----------|----------------|
| **Dev** | localhost:3000 | localhost:5174 | NODE_ENV=development, origin localhost:5174 |
| **Staging** | staging API URL | staging front URL | NODE_ENV=production (lub staging), CORS + cookie domain spójne |
| **Prod** | api.docktogo.com | app.docktogo.com | CORS tylko prod origin, cookie .docktogo.com |

Konwencja: .env.example z komentarzami; nie committować .env. Opcjonalnie .env.development / .env.production w app (Vite).

### 3.3 Unikanie technical debt

- Jedna konwencja endpointu: route → controller (walidacja) → service → repository/pool.
- Jedna konwencja frontu: wywołania API tylko z api/*; nowe ekrany w features/<moduł>.
- Od pierwszego nowego schematu (dock): każda zmiana DB tylko przez migrację.
- Checklist przed mergem: czy nowy kod w odpowiednim module, czy nie ma fetch poza api/, czy jest walidacja.

### 3.4 Dock Management 2.0 jako pierwszy moduł domenowy

- **Backend:** moduł dock + pierwszy endpoint (np. GET /dock/docks) po Fazie A i B. Schemat w migracjach.
- **Frontend:** api/dock.ts + features/dock/DockPage.tsx z React Query. Routing: /dock → ProtectedRoute → DockPage.
- **Kolejność:** backend (endpoint + migracja) → front (api + ekran) → kolejne endpointy dock → realtime. Planning = drugi moduł, ten sam wzorzec.

---

*Plan: realistyczny, etapowy, do wdrożenia przez 1 osobę, bez przepisywania wszystkiego.*
