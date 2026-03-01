# Analiza projektów DockToGo

Dokument powstał na podstawie przeglądu trzech elementów ekosystemu: **docktogo-api**, **docktogo-app** oraz **prod.docktogo.com**. Plik **PROD.zip** nie został znaleziony w workspace; analiza „produkcji” dotyczy folderu **prod.docktogo.com**.

---

## 1. Przegląd trzech projektów

| Projekt | Ścieżka | Technologie | Cel |
|--------|---------|-------------|-----|
| **docktogo-api** | `Desktop/DOCKTOGO/docktogo-api` | Node.js, Express 5, PostgreSQL, JWT (access + refresh), bcrypt | Backend API – tylko auth + użytkownicy (register, login, refresh, /users/me). |
| **docktogo-app** | `Desktop/DOCKTOGO/docktogo-app` | React 19, Vite 7, TypeScript | Nowy frontend – jedna strona logowania do API (email/hasło → `access_token` w localStorage). |
| **prod.docktogo.com** | `Dev/prod.docktogo.com` | React 18, Vite 5, Supabase (auth + DB + Realtime), Tailwind, react-router | Obecna aplikacja produkcyjna – pełna logika: dock management, planning, raporty, zwroty, chat, użytkownicy, destynacje. |

**Różnica kluczowa:**  
- **docktogo-app** + **docktogo-api** = nowy stos: własne API + PostgreSQL, tylko logowanie/rejestracja i profil.  
- **prod.docktogo.com** = aplikacja na Supabase (BaaS): auth, baza, Realtime i logika biznesowa w jednym projekcie.

---

## 2. docktogo-api – backend (szczegóły)

### 2.1 Struktura kodu

```
src/
  server.js          # wejście, nasłuch portu, shutdown (SIGINT/SIGTERM)
  app.js             # Express: express.json(), /health, /auth, /users, errorHandler
  config/env.js      # wymagane: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET; port, jwt.expiresIn/refreshExpiresIn
  core/
    db.js            # pg.Pool(connectionString)
    errors.js        # AppError(message, code, statusCode), errorHandler
    transaction.js   # withTransaction(client => callback)
  auth/
    auth.routes.js   # POST register, login, refresh; GET me; POST logout (requireAuth na me, logout)
    auth.controller.js
    auth.service.js  # rejestracja (users_auth + user_profiles + user_sessions), login, refresh, logout, getProfileById, revokeSession
    auth.middleware.js # requireAuth: Bearer token → verifyAccess → profile → req.user, req.profile, req.permissions
    jwt.js           # signAccess, verifyAccess (refresh nieużywany w kodzie – tylko access)
    roles.js         # ROLE_NAMES (1,3,5,7,8,9,12), PERMISSION_THRESHOLDS, hasPermission, canManageRole, getPermissions
  users/
    users.routes.js  # GET /me, PATCH /me (requireAuth)
    users.controller.js
    users.service.js # getMe, updateMe(displayName) → user_profiles
sql/
  001_auth_tables.sql # users_auth, user_profiles, user_sessions
```

### 2.2 Schemat bazy (PostgreSQL)

- **users_auth:** `id` (uuid PK), `email` (unique), `password_hash`, `created_at`
- **user_profiles:** `id` (PK, FK→users_auth), `display_name`, `role_type` (int, default 1), `destination_id`, `is_active`, `created_at`, `last_login`
- **user_sessions:** `id`, `user_id` (FK→users_auth), `refresh_token_hash`, `user_agent`, `ip_address`, `created_at`, `expires_at`, `is_revoked`

### 2.3 Endpointy API

| Metoda | Ścieżka | Auth | Opis |
|--------|---------|------|------|
| GET | /health | — | `SELECT 1` → `{ status: 'ok', data: { db: 'ok' } }` |
| POST | /auth/register | — | body: email, password, displayName → 201 + access_token, refresh_token, profile, permissions |
| POST | /auth/login | — | body: email, password → 200 + access_token, refresh_token, profile, permissions |
| POST | /auth/refresh | — | body: refresh_token → nowa para tokenów + profile, permissions |
| GET | /auth/me | Bearer | profile + permissions |
| POST | /auth/logout | Bearer | body: refresh_token → revoke session |
| GET | /users/me | Bearer | profil użytkownika (to samo co auth/me z innego modułu) |
| PATCH | /users/me | Bearer | body: displayName → aktualizacja profilu |

Format odpowiedzi: sukces `{ status: 'ok', data: ... }`, błąd `{ status: 'error', message, code }`.  
Kody błędów m.in.: VALIDATION, EMAIL_TAKEN (23505), INVALID_CREDENTIALS, ACCOUNT_INACTIVE, UNAUTHORIZED, INVALID_REFRESH, NOT_FOUND.

### 2.4 Role (role_type)

- 1 Viewer, 3 Warehouse Worker, 5 Office Worker, 7 Team Leader, 8 Global Admin, 9 Global Viewer, 12 DEV  
- Uprawnienia (progi): read(1), warehouse_operations(3), office_operations(5), manage_team(7), manage_all(8), all(12).  
- `canManageRole`: 12→wszystko; 8→wszystko oprócz 12; 7→tylko 1,3,5.

### 2.5 Konfiguracja

- **Wymagane zmienne:** `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- Opcjonalne: `PORT` (domyślnie 3000), `JWT_EXPIRES_IN` (15m), `JWT_REFRESH_EXPIRES_IN` (30d)

---

## 3. docktogo-app – nowy frontend (szczegóły)

### 3.1 Co jest zaimplementowane

- **Jedna strona:** formularz logowania (email, hasło).
- **Zmienna:** `VITE_API_URL` (w .env: `https://api.docktogo.com`) – wywołanie `POST ${API_URL}/auth/login`.
- **Sukces:** zapis `data.data.access_token` w `localStorage`, `alert("Zalogowano pomyślnie 🚀")`.
- **Brak:** refresh tokena, przekierowania po logowaniu, routingu, nawigacji, wywołań do /auth/me, /users/me, obsługi 401/403.

### 3.2 Stack

- React 19, Vite 7, TypeScript, ESLint. Brak routera, stanu globalnego, Supabase.

---

## 4. prod.docktogo.com – aplikacja produkcyjna (szczegóły)

### 4.1 Stack i konfiguracja

- **package.json:** nazwa `dock-management-app`, React 18, Vite 5, react-router-dom, Supabase (@supabase/supabase-js), Tailwind, lucide-react, react-dnd, browser-image-compression, heic2any, pg (dev), sharp, vite-imagetools.
- **.env:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_SERVICE_ROLE_KEY` (Supabase project `ylaziamvurrormebzxjb`).
- **Service Worker:** rejestracja `/sw.js`, nasłuch `updatefound`.

### 4.2 Architektura aplikacji

- **main.tsx:** AppErrorBoundary → BrowserRouter → AppBootstrap (inicjalizacja sesji + Realtime) → RealtimeManager → AuthProvider → DestinationProvider → DockRealtimeProvider → ChatProvider → App.
- **App.tsx:**  
  - Tryb maintenance (`isMaintenanceMode`).  
  - Niezalogowani: Routes tylko /login, /auth/invite, /register, /auth/confirm, / → AuthPage.  
  - Zalogowani: Routes z Layout i AppContent; widoki: dock-management, planning (internal, schedule, ab-transport), dashboard, reports, returns, settings, users, profile.  
  - Bramki: `hasPermission('read')`, `hasPermission('manage_team')` (users), brak destynacji → ekran „Wybierz destynację”, `auth-unhealthy-hard` → signOut + reload.

### 4.3 Moduły funkcjonalne (features)

- **auth:** AuthPage, RegisterPage, AuthInvitePage, ProtectedRoute, logowanie/rejestracja/invite przez Supabase Auth + AuthService (auth.ts).
- **planning:** Planning, Schedule, PlanningInternal, ABTransportCRM, TruckForm, TruckCard – trucks/orders/truck_blocks, synchronizacja (truckBlockSync), konflikty czasowe, sugerowany dok.
- **dock-management:** DockManagement, DockColumn, TruckBlockCard, QuickBlockForm, BlockEditModal, CompletedTrucks, AvailableTrucksPanel, ExportModal, RealtimeDebug – bloki, doki (w tym AU/AL), statusy, complete/restore.
- **dashboard:** Dashboard, StatsGrid, TruckChart, RecentTrucks, QuickActions, PerformanceMetrics, ActivityFeed.
- **reports:** Reports, ReportCard, ReportDetailsModal, NewReportModal, ReportsStats, ReturnReportDetailModal – raporty = returns z filtrami.
- **returns:** Returns, ReturnFormModal, ReturnDetailDrawer, useReturnPhotoUpload – zwroty, linie, załączniki, komentarze.
- **user-management:** UserManagement, UserProfile, UserEditModal, UserInviteModal, ReturnsSettings, DockManagementSettings, PasswordChangePanel, UserProfilePanel, AuditLogModal, DestinationSwitcher, UserRoleBadge.
- **chat:** Chat, ChatProvider, ChatSidebar, ChatWindow, MessageBubble, konwersacje, wiadomości, useMessages/useConversations/useChat/useNotifications.
- **settings:** Settings, DestinationSwitcher, TimeChecker.
- **shared:** supabase client (singleton), supabase-admin, database.types (pełne typy tabel), auth.ts (AuthService, USER_ROLES, ROLE_PERMISSIONS, hasPermission, canManageRole), useAuth, DestinationContext, RealtimeManager, DockRealtimeProvider, useRealtimeSubscription, useGlobalDockRealtime, useUserSettings, useSmoothingSettings, useExcelExport, useTheme, useLanguage, truckBlockSync, withTimeout, devlog, auth-refresh.

### 4.4 Baza danych (Supabase / database.types)

Tabele używane w typach/funkcjonalnościach: audit_log, block_orders, completed_trucks, destinations, docks, orders, truck_blocks, trucks, returns, return_lines, return_attachments, return_comments, return_email_config, user_profiles, user_invitations, user_return_email_settings, user_sessions (w docach), chat_profiles, conversations, conversation_members, messages, message_reactions, message_read_receipts, typing_indicators. Storage: return-photos, user-avatars.

### 4.5 Role i uprawnienia (prod)

- **USER_ROLES:** 1 Viewer … 12 DEV (w tym 10 Driver, 11 Transport Company).  
- **ROLE_PERMISSIONS:** mapowanie rola → lista permission (read, warehouse_operations, office_operations, manage_team, invite_users, manage_all, global_access, driver_operations, transport_operations, all).  
- **hasPermission / canManageRole:** zgodne z dokumentacją (Team Leader 7 → 1,3,5; Global Admin 8 → bez 12; DEV 12 → wszystko).  
- Data „aplikacji”: Europe/Amsterdam (getAppCurrentDate).  
- Wirtualne docki AU/AL – tylko do „Available Unloading/Loading”, nie do ręcznego przypisania.

### 4.6 Dokumentacja w repo (docs/)

- **BACKEND-API-SPECIFICATION.md** – wymagania na backend (moduły M1–M8, operacje CRUD, reguły biznesowe, state machine, endpointy REST, autoryzacja, realtime).
- **BACKEND-ARCHITECTURE-SPEC.md** – architektura docelowego backendu (Node.js + Postgres + JWT + Socket.io), mapa domeny, struktura katalogów, realtime, storage.
- **BUSINESS-LOGIC-IN-FRONTEND-ANALYSIS.md** – przykłady logiki biznesowej w frontendzie i rekomendacje przeniesienia do backendu.
- **MIGRATION-VPS-ANALYSIS.md**, **AB_Transport_Specyfikacja_Techniczna.md**, **BRANCH-RECOVERY-PLAN.md**.

---

## 5. Zależności między projektami

- **docktogo-app** jest klientem **docktogo-api**: jedyne wywołanie to `POST /auth/login`; nie używa refresh, /auth/me ani /users/me.
- **prod.docktogo.com** nie korzysta z docktogo-api; używa w całości Supabase (auth + DB + Realtime).
- **docktogo-api** implementuje tylko podzbiór „users + auth” z docelowej specyfikacji (BACKEND-API-SPECIFICATION, BACKEND-ARCHITECTURE-SPEC); brak modułów: destinations, planning, dock, returns, reports, chat, storage.

### 5.1 Różnice schematu użytkowników

- **docktogo-api:** `users_auth.id` = uuid; `user_profiles.id` = FK do users_auth; brak `auth_user_id` (to jest ten sam id).
- **prod (Supabase):** `user_profiles.auth_user_id` = Supabase Auth UUID; `user_profiles.id` może być innym identyfikatorem. Role (1,3,5,7,8,9,10,11,12) i nazwy ról są bardzo zbliżone; w API brak ról 10 (Driver), 11 (Transport Company).

---

## 6. Wnioski i rekomendacje

1. **PROD.zip** – w workspace nie ma pliku `PROD.zip`; analiza „produkcji” oparta jest wyłącznie na folderze **prod.docktogo.com**.
2. **docktogo-api** – spójny, minimalny backend auth: JWT access+refresh, sesje w DB, role i uprawnienia. Gotowy do rozwoju w kierunku pełnego API opisanego w docs (destinations, planning, dock, returns, reports, chat, storage).
3. **docktogo-app** – szkielet frontendu pod nowe API: tylko logowanie i zapis access_token; brak refresh, routingu i integracji z resztą ekranów. Naturalny kolejny krok: dodać obsługę refresh, /auth/me, routing i stopniowo przenosić widoki z prod.docktogo.com bądź budować je od zera pod docktogo-api.
4. **prod.docktogo.com** – pełna aplikacja z logiką w frontendzie i Supabase; dokumenty w docs/ opisują przeniesienie tej logiki do backendu (docktogo-api lub nowy serwis) oraz spójną architekturę (JWT, Socket.io/Realtime, storage, audit).
5. **Migracja prod → nowy stos:** Wymaga decyzji: albo docktogo-app staje się nowym frontem do docktogo-api (rozszerzonego o wszystkie moduły z docs), albo prod.docktogo.com jest stopniowo przełączany na nowe API z zachowaniem Supabase tylko tam, gdzie to potrzebne. W obu przypadkach docs (BACKEND-API-SPECIFICATION, BACKEND-ARCHITECTURE-SPEC, BUSINESS-LOGIC-IN-FRONTEND-ANALYSIS) są bezpośrednim odniesieniem do implementacji backendu i przenoszenia logiki z frontu.

---

*Analiza wykonana na podstawie kodu w: docktogo-api, docktogo-app, prod.docktogo.com (w tym docs i src).*
