# Anima — Cura che connette

**Anima** è una Progressive Web App (PWA) progettata per la gestione integrata e cooperativa della cura di pazienti affetti da Alzheimer e patologie correlate. Il progetto nasce dalla fusione sinergica di due piattaforme distinte:

*   **Memora** — Soluzione incentrata sull'accessibilità per il paziente: mood tracking, bacheca dei ricordi condivisi (Memoriae), messaggistica vocale semplificata e pulsante di emergenza SOS.
*   **CareLink** — Gestionale clinico ad alta densità informativa per strutture sanitarie (RSA, ASL): somministrazioni terapeutiche, monitoraggio parametri vitali con alert automatici, diario clinico, agenda e audit log di sicurezza.

Anima unisce la sensibilità e la rassicurazione di *Memora* con la rigorosa precisione medica di *CareLink*.

---

## 🚀 Architettura e Stack Tecnologico

Il progetto è sviluppato seguendo i massimi standard qualitativi, usando **TypeScript** e un approccio Mobile-First per garantire l'accessibilità da qualsiasi dispositivo.

*   **Framework:** Next.js 16 (App Router, TypeScript)
*   **Design System:** tailwindcss v4 + shadcn/ui + Framer Motion (per le transizioni del paziente)
*   **Database & Auth:** Supabase (PostgreSQL con Row Level Security attiva)
*   **Realtime:** Supabase Realtime (chat, presenza online e instant updates)
*   **State Management:** Zustand
*   **Grafici:** Recharts (storico parametri vitali ed umore)
*   **Esportazione:** `@react-pdf/renderer` (generazione al volo del fascicolo clinico)
*   **PWA:** `@ducanh2912/next-pwa` + Notifiche Push (VAPID)

---

## 👥 Ruoli Utente Supportati

L'applicazione si adatta dinamicamente all'utente loggato applicando stili ed elementi di accessibilità specifici:

1.  **Paziente (`patient`):** UX ultra-accessibile, font grandi, pulsanti minimi (min. 56px), schema colori caldo (`amber/warm`), pulsante SOS fluttuante sempre in primo piano.
2.  **Caregiver (`caregiver`):** Monitoraggio da remoto del proprio caro (umore, parametri, farmaci del giorno) e messaggistica diretta con la struttura.
3.  **Infermiere (`nurse`):** Interfaccia per il controllo delle somministrazioni terapeutiche del turno, registrazione parametri e diario clinico.
4.  **Medico (`doctor`):** Prescrizioni, analisi dei parametri fuori soglia, note cliniche private e grafici clinici.
5.  **Admin (`admin`) & Super Admin (`super_admin`):** Gestione dello staff, impostazione delle soglie di alert e monitoraggio degli accessi tramite l'Audit Log.

---

## 📂 Struttura Directory Principale

```
anima/
├── src/
│   ├── app/
│   │   ├── (auth)/login/        # Pagina di accesso email/password e magic link
│   │   ├── (dashboard)/         # Gruppo protetto da middleware di autenticazione
│   │   │   ├── dashboard/       # Dashboard dinamica smistata per ruolo
│   │   │   └── ...              # Altre rotte applicative (pazienti, messaggi, impostazioni)
│   │   ├── layout.tsx           # Configurazione root HTML e font Plus Jakarta Sans
│   │   ├── middleware.ts        # Controllo accessi e sessione utente
│   │   └── manifest.ts          # Configurazione Manifest PWA
│   ├── components/
│   │   ├── dashboard/           # Componenti specifici delle dashboard per ruolo
│   │   ├── layout/              # Sidebar desktop, BottomNav, Topbar e MainLayout
│   │   ├── ui/                  # Componenti atomici (StatusBadge, RoleBadge, StatusDot, KpiCard, ecc.)
│   │   └── debug/               # DebugConsole (visibile solo in ambiente dev)
│   ├── lib/
│   │   ├── hooks/useUser.ts     # Hook di gestione utente, ruoli ed auto-healing profili
│   │   ├── stores/              # Store Zustand (appStore, debugStore)
│   │   └── supabase/            # Client Supabase (client, server, admin)
│   └── types/index.ts           # Definizioni dei tipi TypeScript dell'intero dominio
├── supabase/
│   └── migrations/              # Migrazioni SQL per lo schema database, RLS e trigger
├── package.json                 # Dipendenze e script npm
└── .env.local.example           # Variabili d'ambiente richieste
```

---

## 🛠️ Configurazione Ambiente & Setup

### 1. Variabili d'Ambiente
Crea un file `.env.local` partendo dall'esempio in `.env.local.example` e inserisci le tue chiavi Supabase e VAPID:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[tuo-progetto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Web Push (Genera con: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BF...
VAPID_PRIVATE_KEY=...
```

### 2. Installazione delle Dipendenze
Installa tutti i pacchetti necessari tramite npm:

```bash
npm install
```

### 3. Migrazioni Database
Applica i file SQL presenti in `supabase/migrations/` all'interno dell'SQL Editor del tuo progetto Supabase nel seguente ordine:
1.  `001_initial_schema.sql` (Tabelle principali)
2.  `002_rls_policies.sql` (Regole di sicurezza e permessi Row Level Security)
3.  `003_functions_triggers.sql` (Automazione alert dei parametri fuori soglia)
4.  `004_realtime.sql` (Abilitazione del realtime per messaggi e presenza)
5.  `005_storage_buckets.sql` (Configurazione Bucket: crea `memories`, `avatars`, `attachments`, `audio-messages` su Supabase)

### 4. Avvio in Locale
Avvia l'ambiente di sviluppo:

```bash
npm run dev
```

---

## 🐛 Debug & Testing
In ambiente di sviluppo (`development`), è disponibile un comodo pulsante fluttuante `🐛` (in basso a sinistra). Cliccandoci potrai forzare l'override del tuo ruolo utente attuale (`Paziente`, `Caregiver`, `Infermiere`, ecc.) per testare istantaneamente le diverse interfacce utente e simulare i vari comportamenti dell'applicazione senza dover cambiare account.
