# runay-farma-app

RUNAY FARMA — Aplicación móvil para gestionar ventas, inventario, compras, productos, lotes, vencimientos y operaciones de boticas. Desarrollada con Expo, React Native y Supabase.

## Arranque (Fase 1)

1. Copia `.env.example` a `.env` y completa `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. En el proyecto de Supabase ejecuta `supabase/migrations/20260916120000_phase1_sales.sql` y luego `supabase/seed.sql`.
3. `npm install` y `npm start`.

El primer usuario registrado queda como dueño; los siguientes, como cajeros del mismo local.

