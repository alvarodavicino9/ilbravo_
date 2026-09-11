# IL BRAVO — Sistema de turnos, agenda y asistente de WhatsApp

Sistema completo para **IL BRAVO | Peluquería & Barbería** (Miguel C. del Corro 173,
Zona Centro, Córdoba): web de reservas, API con agenda en base de datos +
espejo en Google Sheets/Excel, y un asistente de WhatsApp que responde
preguntas y toma turnos solo.

Armado como prototipo funcional real, no un mockup: todo lo de abajo corre y
se probó de punta a punta (reserva desde la web, reserva simulada por chat,
listado/cancelación desde el panel, exportación a Excel).

---

## 1. Qué incluye

```
apps/
  api/            Backend (Express + TypeScript + SQLite). Es el corazón: agenda,
                  disponibilidad, servicios, sincronización con Google Sheets,
                  exportación a Excel.
  web/            Sitio de reservas (React + Vite + TypeScript + Tailwind).
                  Landing + reserva online + panel /admin para el local.
  whatsapp-bot/   Asistente de WhatsApp (Node + TypeScript + Baileys). Responde
                  horarios/precios/ubicación y reserva/cancela turnos por chat.
```

Los tres se conectan a la misma API, así que la agenda es **una sola**: un
turno reservado por WhatsApp aparece al instante en la web, en el panel
admin y en el Excel/Sheets.

## 2. Datos reales ya cargados

Se tomaron de Instagram (@ilbravo.peluqueria) y del perfil de WhatsApp
Business del negocio:

- Dirección: Miguel Calixto del Corro 173, X5000KTC Córdoba
- WhatsApp / turnos: +54 9 3516 60-9971
- Horarios: Lunes 11:00–20:00 · Martes a Sábado 10:30–20:00 · Domingo cerrado
  *(el viernes no se veía en la captura que pasaste — quedó igual que
  martes/miércoles/jueves/sábado; confirmalo con el cliente)*

Todo esto vive en un solo archivo, fácil de tocar si algo cambia:
`apps/api/src/data/business.ts`

**Los servicios y precios son de ejemplo** (no los tenía — no estaban en el
perfil público). Están en `apps/api/src/data/services.json`, es una lista
simple para editar antes de mostrárselo al cliente:

```json
{ "id": "corte-clasico", "name": "Corte clásico", "priceArs": 8000, "durationMinutes": 30, "active": true }
```

## 3. Cómo correrlo en local

Requisitos: **Node.js 22.5 o superior** (usa el módulo SQLite incorporado de
Node, así que no hace falta compilar nada ni instalar Visual Studio/Build
Tools — solo necesitás una versión de Node no muy vieja). Si `node -v` te
muestra menos de 22.5, actualizá Node antes de instalar.

```bash
# 1. Instalar todo (una sola vez, desde la raíz)
npm install

# 2. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/whatsapp-bot/.env.example apps/whatsapp-bot/.env
# Editá apps/api/.env y poné un ADMIN_TOKEN propio (cualquier texto largo)

# 3. Levantar cada parte (en terminales separadas)
npm run dev:api    # http://localhost:4000
npm run dev:web    # http://localhost:5173
npm run dev:bot    # imprime un QR en la terminal (ver sección 5)
```

Con eso ya podés entrar a `http://localhost:5173`, reservar un turno de
prueba, y verlo en `http://localhost:5173/admin` (con el ADMIN_TOKEN que
pusiste en el `.env`).

> Nota: la API va a mostrar un `ExperimentalWarning: SQLite is an
> experimental feature` al arrancar. Es solo un aviso de Node, no un error —
> todo funciona normal, tranquilo.

## 4. La "agenda en Excel siempre actualizada"

Se resolvió en dos capas, para que funcione sí o sí y además quede como vos
lo pediste:

1. **Base de datos SQLite** (`apps/api/data/il-bravo.sqlite3`) — es la
   fuente de verdad real. Cada reserva (web o WhatsApp) escribe ahí primero,
   así que nunca depende de que Google esté configurado.
2. **Espejo en Google Sheets** — cada vez que se crea o cancela un turno, el
   sistema reescribe automáticamente una planilla de Google Sheets con toda
   la agenda (y además hay un re-sincronizado cada 5 min por las dudas). El
   cliente la abre desde el celu o la PC y la ve siempre al día, y la puede
   descargar como `.xlsx` de Excel real cuando quiera desde el mismo Google
   Sheets (Archivo → Descargar → Microsoft Excel).
3. Además, desde el panel `/admin` hay un botón **"Exportar Excel"** que baja
   un `.xlsx` real al toque, generado en el momento — funciona aunque Google
   Sheets todavía no esté conectado.

### Cómo conectar el Google Sheets real (10 minutos)

1. Andá a [Google Cloud Console](https://console.cloud.google.com/) → creá un
   proyecto (o usá uno existente) → habilitá la **Google Sheets API**.
2. Creá una **cuenta de servicio** (IAM y administración → Cuentas de
   servicio → Crear) → generá una clave JSON.
3. Del JSON, copiá `client_email` y `private_key` a `apps/api/.env`:
   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxx@xxxx.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_SHEET_ID=el-id-que-aparece-en-la-url-de-la-planilla
   ```
4. Creá una planilla de Google Sheets nueva (puede estar vacía, se llena
   sola) y **compartila** con el email de la cuenta de servicio (el
   `client_email`) con permiso de Editor.
5. Reiniciá la API. Vas a ver en la consola `Google Sheets sync: ACTIVADO`, y
   desde ese momento cada turno se refleja ahí solo.

Sin este paso, el sistema funciona igual (SQLite + botón de exportar Excel);
simplemente no hay espejo en vivo en Sheets todavía.

## 5. El asistente de WhatsApp

### La decisión pendiente: qué API de WhatsApp usar

Me preguntaste por esto — quedó para resolver antes de llevarlo a producción,
así que te dejo el análisis:

| | **Librería no oficial (Baileys)** — la que está armada | **API oficial de Meta (WhatsApp Business Cloud API)** |
|---|---|---|
| Cómo arranca | Escaneás un QR con el WhatsApp real del local (como WhatsApp Web) | Hay que verificar el negocio en Meta Business Manager |
| Tiempo para tenerlo funcionando | Minutos | Días (verificación de Meta) |
| Costo | Gratis | Gratis las primeras conversaciones/mes, después cobra por conversación |
| Estabilidad / riesgo | No es oficial de Meta: en teoría podría banear el número si detecta uso "de bot" agresivo. En la práctica, para el volumen de una peluquería (consultas y turnos, no spam masivo) el riesgo es bajo, pero existe | 100% soportado por Meta, cero riesgo de baneo por este motivo |
| Multi-dispositivo / equipo | Un poco más delicado (depende de una sesión activa) | Pensado para negocios, se banca mejor el uso serio a largo plazo |

**Recomendación:** arrancar con Baileys para la demo y las primeras semanas
reales (es lo que ya está armado y anda), y si el cliente lo adopta en
serio, migrar a la API oficial de Meta más adelante — la lógica de
conversación (`apps/whatsapp-bot/src/conversation.ts`) no cambia, solo se
reemplaza la capa de conexión (`apps/whatsapp-bot/src/index.ts`).

### Cómo conectarlo

```bash
npm run dev:bot
```

Va a imprimir un código QR en la terminal. Se escanea desde el WhatsApp del
local: **WhatsApp → Configuración → Dispositivos vinculados → Vincular un
dispositivo**. Una sola vez — la sesión queda guardada en
`apps/whatsapp-bot/auth/` (no se sube a git, ver `.gitignore`).

⚠️ Usá un número de prueba para probarlo las primeras veces, no el número
real del local, hasta estar seguros de que el flujo de conversación es el
que quieren.

### Qué sabe responder

- Horarios, precios, ubicación (menú con opciones 1-5, o lenguaje natural:
  "hola", "cuánto sale un corte", "a qué hora abren", etc.)
- Reserva de turno paso a paso (servicio → día → horario disponible → nombre)
  usando la misma disponibilidad real que la web — si alguien lo toma desde
  la web, no aparece más como libre en WhatsApp, y viceversa.
- Cancelación de turnos propios (identifica por el número de WhatsApp de
  quien escribe).
- **Preguntas libres con IA (opcional):** si cargás un `ANTHROPIC_API_KEY`
  en `apps/whatsapp-bot/.env`, el bot usa Claude para responder preguntas
  que no matchean el menú, pero *solo* con los datos reales del negocio
  (no inventa precios ni horarios). Sin esa clave, esas preguntas reciben el
  menú de nuevo — el bot sigue funcionando perfecto igual.

Herramienta para probar el flujo sin gastar un WhatsApp real:

```bash
npm run simulate --workspace=apps/whatsapp-bot
```

(requiere que `apps/api` esté corriendo)

## 6. Panel para el local (`/admin`)

En `http://localhost:5173/admin` (o el dominio real una vez desplegado):
login con el `ADMIN_TOKEN` del `.env` de la API, y desde ahí ve los
próximos turnos, cancela, exporta a Excel, y fuerza una sincronización
manual con Google Sheets.

## 7. Deploy (para mostrárselo al cliente en un link real)

Recomendación simple y barata para esta etapa:

- **API (`apps/api`)**: [Railway](https://railway.app) o
  [Render](https://render.com) — ambos soportan Node + un volumen persistente
  para el archivo SQLite. Variables de entorno: las del `.env` de la API.
- **Web (`apps/web`)**: [Vercel](https://vercel.com) o
  [Netlify](https://netlify.com) — build command `npm run build`, carpeta
  `dist`. Variable de entorno: `VITE_API_URL` apuntando a la URL pública de
  la API.
- **Bot de WhatsApp (`apps/whatsapp-bot`)**: necesita un proceso corriendo
  todo el tiempo (no serverless) porque mantiene la conexión de WhatsApp
  abierta — Railway o una VPS chica (ej. un droplet de $5-6/mes) andan bien.
  Importante: la carpeta `auth/` con la sesión tiene que persistir entre
  reinicios (volumen persistente), si no hay que re-escanear el QR cada vez.

Con esto el cliente ya puede entrar desde su celu a un link real y probar
todo — web, WhatsApp y la agenda actualizándose sola.

## 8. Qué quedaría para una siguiente vuelta

Esto ya es un sistema funcional real para mostrar y empezar a usar. Ideas
para después, una vez que el cliente lo valide:

- Cargar los servicios y precios reales (hoy son de ejemplo).
- Confirmar el horario del viernes (asumido igual al resto de la semana).
- Reemplazar el logo/marca placeholder por el diseño real de IL BRAVO.
- Recordatorios automáticos por WhatsApp 1-2 horas antes del turno.
- Elegir barbero/estilista específico si en algún momento son más de uno
  atendiendo a la vez.
- Migrar el bot a la API oficial de Meta si el volumen lo justifica.
