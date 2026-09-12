# Bhasha Setu — Phase 9 Pilot Deployment Procedure
## Reproducible Start-to-Pilot Workflow

**Version:** Phase 9
**Target:** Supervised field pilot on physical Android devices
**UI:** FROZEN — no changes permitted

---

## Prerequisites

On the operator's laptop / PC:

`
Node.js    v18+ installed
Python     3.9+  installed (for Santali IndicConformer backend)
Git        available
Network    Wi-Fi hotspot or shared LAN with Android devices
`

---

## Step 1 — Build Production Bundle

`ash
# In project root:
node node_modules/typescript/bin/tsc --noEmit
# Expected: 0 errors

node node_modules/vite/bin/vite.js build
# Expected: dist/ folder, approximately 8.18 MB total
# The chunk-size warning is normal — it is NOT a build failure.
`

---

## Step 2 — Start the Santali ASR Backend

`ash
# In project root:
# (activate Python venv first if using .venv)
# .venv\Scripts\activate    (Windows)

pip install -r requirements.txt
python server/main.py
# Expected output: Uvicorn running on http://0.0.0.0:5000
# Keep this terminal open throughout the pilot.
`

---

## Step 3 — Serve the Production Frontend

Option A — Vite preview (recommended for LAN):

`ash
node node_modules/vite/bin/vite.js preview --host 0.0.0.0 --port 4173
# Expected output:
#   Local:   http://localhost:4173/
#   Network: http://192.168.x.x:4173/   <-- use this on Android devices
`

Option B — Static file server (if Vite preview unavailable):

`ash
node -e "
const http = require('http');
const fs   = require('fs');
const path = require('path');
const port = 4173;
http.createServer((req, res) => {
  let fp = path.join('dist', req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(fp)) fp = path.join('dist', 'index.html');
  const ext = path.extname(fp);
  const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.wasm':'application/wasm','.db':'application/octet-stream'};
  res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
  fs.createReadStream(fp).pipe(res);
}).listen(port, '0.0.0.0', () => console.log('Serving on port', port));
"
`

---

## Step 4 — Install PWA on Android Device

On each Android device (Chrome browser):

`
1. Open Chrome
2. Navigate to: http://<operator-laptop-IP>:4173
3. Tap the three-dot menu (top right)
4. Select: "Add to Home Screen" or "Install app"
5. Confirm installation
6. Open the app from the home screen (standalone PWA mode)
7. Confirm the app opens without browser chrome
`

---

## Step 5 — Download and Cache Required Assets

With network ON and PWA open:

`
1. Open the app
2. Navigate to: Features -> Classroom & Field Dialogue (Speech-to-Speech)
3. Navigate to: Features -> Speech to Text
4. Navigate to: Features -> Dictionary
5. Wait approximately 30 seconds for the Service Worker to pre-cache assets
6. Confirm translations load (try typing "hello" in the dictionary)
7. Check: the app should show translation results from the local DB
`

---

## Step 6 — Verify Offline Capability

`
1. Toggle Android device to Airplane Mode (all network OFF)
2. Reload the PWA (close and reopen from home screen icon)
3. Navigate to Speech-to-Speech
4. Confirm the conversation history and phrase cards load
5. Navigate to Dictionary — confirm search works
6. If these work: OFFLINE VERIFIED
7. If any page fails to load: do NOT proceed — the cache did not complete in Step 5
`

---

## Step 7 — Run Microphone Test

With device online (ASR backend reachable):

`
1. Open Speech-to-Speech page
2. Select Speaker 1: Hindi
3. Select Speaker 2: Santali
4. Press the blue mic button (Speaker 1)
5. Speak: "Namaste" clearly into the microphone
6. Verify:
   - Button turns red while speaking
   - Button turns blue after speech ends (within ~7 seconds)
   - Translation appears in the conversation thread
7. If mic button stays red: check browser microphone permissions
8. If no translation appears: check ASR backend is running (Step 2)
`

---

## Step 8 — Run S2S Test

`
1. With Speaker 1 = Hindi, Speaker 2 = Santali
2. Speaker 1 speaks: "Aapka naam kya hai?" (What is your name?)
3. Verify Santali translation appears: "ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱮᱫ?"
4. Press Speaker 2 mic (green button)
5. Speaker 2 speaks a Santali phrase
6. Verify Hindi translation appears
7. If both directions work: S2S TEST PASS
`

---

## Step 9 — Begin Pilot

`
1. Register device in: docs/PILOT_DEVICE_CHECK.md
2. Assign Session ID (e.g. SESSION-001)
3. Assign Speaker IDs (e.g. SPK-001, SPK-002)
4. Fill Environment section of: docs/S2S_FIELD_SESSION_FORM.md
5. Begin supervised conversation sessions
6. Fill one TURN RECORD per spoken turn during the session
7. Measure auto-stop delays with a stopwatch (do NOT estimate from memory)
8. Fill End of Session Summary immediately after each session ends
`

---

## Emergency Stop

If at any point:

- The device overheats significantly
- A healthcare translation is flagged as potentially unsafe
- The microphone stops responding
- The browser crashes repeatedly

`
STOP the session.
Record the failure in: docs/S2S_FIELD_SESSION_FORM.md (Section: Android Interruption Record)
Do NOT restart until the issue is understood.
Report to supervisor before continuing.
`

---

## Regression Verification (Run Before Each Pilot Day)

`ash
node scripts/test_s2s_pipeline.cjs
# Expected: 12 / 12 PASS

node scripts/test_translation_pipeline.cjs
# Expected: 83 PASS, 0 FAIL

node scripts/test_s2s_phase8_deployment.cjs
# Expected: 55 PASS, 0 FAIL
`

If any test fails: **do not proceed with pilot** — investigate and fix first.

---

## After Pilot — Record Results

Fill in all sections of:

`
docs/S2S_STAGE1_PILOT_RESULTS.md
`

Then re-evaluate the deployment gate:

`
GREEN  = Physical evidence sufficient for supervised use
YELLOW = Works but more evidence needed
RED    = Unsafe or unusable
`

**Do not begin Phase 10 until GREEN gate is reached.**
