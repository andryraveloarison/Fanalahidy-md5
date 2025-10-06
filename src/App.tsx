import React, { useEffect, useMemo, useState } from "react";
import CryptoJS from "crypto-js";

/** CODE GPLAY-TEST-ACCESS */

/**
 * --- LOGIQUE CONSERVÉE / NETTOYÉE ---
 * - computeSecretN1(): reconstitue la clé secrète n1() trouvée dans le code décompilé
 * - reorderDisplayedIdToOriginal(): reconstruit l'ID original depuis l'ID affiché (A-B-C-D -> D+B+C+A)
 * - hmacMd5Hex(): HMAC-MD5 (crypto-js)
 * - generateKeyFromDisplayedId(): renvoie la clé formatée XXXX-XXXX-XXXX-XXXX + infos debug
 */

/* --- Reconstruction de la secret key n1() basée sur le code décompilé --- */
function computeSecretN1(): string {
  // t() = "WP8$A6n5"
  const t = "WP8$A6n5";

  // i() = "s" + a() + p1()
  // a() = x1() + "3" ; x1() = j1() + "7" ; j1() = "Y" => a() = "Y7" + "3" = "Y73"
  // p1() = "G0Xw"
  const i = "s" + "Y73" + "G0Xw"; // "sY73G0Xw"

  // q1() = z() + c()
  // z() = "d" + v1() + g() ; v1() = "_" + "{" ; g() = "H" => z = "d_{H"
  // c() = "k" + "S" => "kS"
  const q1 = "d_{H" + "kS"; // "d_{HkS"

  const r1 = i + q1; // "sY73G0Xwd_{HkS"

  // m() = "-" + "j" + "]" => "-j]"
  // p() = ">9="
  const m = "-j]";
  const p = ">9=";

  const u1 = r1 + m + p; // "sY73G0Xwd_{HkS-j]>9="

  // t1() = b() + v() ; b() = "e*" ; v() = "m4" => "e*m4"
  const t1 = "e*m4";

  // n1 = t + u1 + t1
  return t + u1 + t1;
}

/* --- Recomposer l'ID original à partir de l'ID affiché ---
   Format affiché: A-B-C-D (A = sub5, B = sub3, C = sub4, D = sub2)
   Original = D + B + C + A
*/
function reorderDisplayedIdToOriginal(displayedId: string): string | null {
  const cleaned = displayedId.replace(/[^0-9a-fA-F]/g, ""); // supprime non-hex (y compris tirets)
  if (cleaned.length !== 16) {
    if (cleaned.length < 16) return null; // trop court
  }
  const parts = displayedId.split("-").map((p) => p.trim());
  if (parts.length === 4 && parts.every((p) => p.length === 4)) {
    const A = parts[0]; // substring5
    const B = parts[1]; // substring3
    const C = parts[2]; // substring4
    const D = parts[3]; // substring2
    return (D + B + C + A).slice(0, 16).toLowerCase();
  }
  if (cleaned.length >= 16) {
    return cleaned.slice(0, 16).toLowerCase();
  }
  return null;
}

/* --- HMAC-MD5 via crypto-js (retourne hex) --- */
function hmacMd5Hex(message: string, key: string): string {
  const mac = CryptoJS.HmacMD5(message, key);
  return mac.toString(CryptoJS.enc.Hex);
}

/* --- Génère la clé formatée comme l'APK --- */
function generateKeyFromDisplayedId(displayedId: string): {
  formattedKey?: string;
  debug?: { originalSubstring?: string; fullHex?: string; secret?: string };
} {
  const original = reorderDisplayedIdToOriginal(displayedId);
  if (!original) return { formattedKey: undefined };

  const secret = computeSecretN1();
  const fullHex = hmacMd5Hex(original, secret);
  const first16 = fullHex.slice(0, 16);
  const formatted = first16.match(/.{1,4}/g)?.join("-") ?? first16;
  return { formattedKey: formatted, debug: { originalSubstring: original, fullHex, secret } };
}

/* ---------------- UI MODERNE + DARK MODE NOIR/VERT ---------------- */

const App: React.FC = () => {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const [id, setId] = useState<string>("");
  const [key, setKey] = useState<string>("");
  const [debug, setDebug] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleGenerate = () => {
    setKey("");
    setDebug(null);
    const result = generateKeyFromDisplayedId(id.trim());
    if (!result.formattedKey) {
      alert("ID invalide — entre un ID affiché (format xxxx-xxxx-xxxx-xxxx) ou 16 hex.");
      return;
    }
    setKey(result.formattedKey);
    setDebug(result.debug);
  };

  const copyKey = async () => {
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const fillExample = () => {
    setId("4f14-3c8a-6f16-ee35");
    setKey("");
    setDebug(null);
  };

  return (
    <>
      {/* DESIGN SYSTEM: variables + styles globaux */}
      <style>{cssVars}</style>

      <div className="page">
        <header className="header">
          <div className="brand">
            <span className="dot" />
            <h1>Fanalahidy</h1>
          </div>

          <div className="tools">
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </header>

        <main className="main">
          <section className="card">
            <h2 className="card__title">ID</h2>


            <div className="form">
              <div className="inputRow">
                <input
                  id="id"
                  className="input"
                  placeholder="ex: 4f14-3c8a-6f16-ee35"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                <button className="btn btn--ghost" onClick={fillExample} type="button" aria-label="Remplir exemple">
                  Exemple
                </button>
              </div>

              <div className="actions">
                <button className="btn btn--primary" onClick={handleGenerate} type="button">
                  Générer la clé
                </button>
              </div>
            </div>
          </section>

          <section className="card">
            <h3 className="card__title">Clé</h3>
            {key ? (
              <div className="result">
                <div className="result__value" aria-live="polite">
                  {key}
                </div>
                <button className="btn btn--outline" onClick={copyKey} type="button">
                  {copied ? "Copié ✓" : "Copier"}
                </button>
              </div>
            ) : (
              <p className="muted">La clé s’affichera ici après génération.</p>
            )}

          </section>
        </main>

        <footer className="footer">
          <span className="muted">Keygen HMAC-MD5 by Nananjy</span>
        </footer>
      </div>
    </>
  );
};

/* --------------------- Composants UI --------------------- */

function ThemeToggle({
  theme,
  setTheme,
}: {
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
}) {
  return (
    <div className="toggle">
      <button
        className="btn btn--toggle"
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Basculer le thème"
        title="Basculer le thème"
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </button>
    </div>
  );
}

/* --------------------- Styles (CSS-in-TS) --------------------- */

const cssVars = `
:root {
  --bg: #0d1117;         /* noir GitHub dark */
  --panel: #0f141b;      /* panneau */
  --card: #0b0f14;       /* carte profond */
  --border: #1f2937;     /* gris foncé */
  --text: #e6edf3;       /* texte principal */
  --muted: #9aa7b2;      /* texte secondaire */
  --accent: #2ea043;     /* vert GitHub (succès) */
  --accent-600: #2ea043;
  --accent-700: #238636;
  --accent-800: #196c2e;
  --focus: #2ea04355;    /* halo focus */
  --ring: 0 0 0 3px var(--focus);

  --shadow-sm: 0 1px 2px rgba(0,0,0,.25);
  --shadow-md: 0 6px 20px rgba(0,0,0,.35);
  --radius: 14px;

  --font: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Apple Color Emoji","Segoe UI Emoji";
}

[data-theme="light"] {
  --bg: #f6f8fa;
  --panel: #ffffff;
  --card: #ffffff;
  --border: #e5e7eb;
  --text: #0f172a;
  --muted: #475569;
  --focus: #9ae6b455;
  --ring: 0 0 0 3px var(--focus);
  --shadow-sm: 0 1px 2px rgba(0,0,0,.08);
  --shadow-md: 0 8px 30px rgba(0,0,0,.08);
}

* { box-sizing: border-box; }

html, body, #root { height: 100%; }

body {
  margin: 0;
  background: radial-gradient(1200px 800px at 20% -10%, rgba(46,160,67,0.08), transparent 60%),
              radial-gradient(1000px 500px at 110% 0%, rgba(46,160,67,0.06), transparent 55%),
              var(--bg);
  color: var(--text);
  font-family: var(--font);
  justify-content: center;
}

/* Layout */
.page {
  min-height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  position: sticky;
  top: 0;
  background: color-mix(in oklab, var(--bg) 84%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand h1 {
  margin: 0;
  font-size: clamp(18px, 2vw, 20px);
  letter-spacing: .2px;
}
.dot {
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px rgba(46,160,67,.25), 0 0 20px rgba(46,160,67,.25);
}

.main {
  display: grid;
  gap: 16px;
  width: min(980px, 92vw);
  margin: 20px auto;
  grid-template-columns: 1fr;
}
@media (min-width: 960px) {
  .main { grid-template-columns: 1fr 1fr; }
}

.card {
  background: linear-gradient(180deg, color-mix(in oklab, var(--card) 96%, transparent), var(--card));
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: clamp(16px, 2.5vw, 22px);
  box-shadow: var(--shadow-sm);
}

.card__title {
  margin: 0 0 6px;
  font-size: clamp(16px, 2vw, 18px);
}
.card__subtitle {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 14px;
}

/* Form */
.form { display: grid; gap: 10px; }
.label { font-size: 13px; color: var(--muted); }
.inputRow {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}
.input {
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: color-mix(in oklab, var(--panel) 96%, transparent);
  color: var(--text);
  padding: 12px 14px;
  font-size: 15px;
  outline: none;
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}
.input:focus {
  border-color: var(--accent-700);
  box-shadow: var(--ring);
  background: color-mix(in oklab, var(--panel) 100%, transparent);
}
.actions { display: flex; gap: 8px; margin-top: 6px; }

/* Buttons */
.btn {
  appearance: none; border: 1px solid transparent; border-radius: 12px;
  font-size: 14px; padding: 10px 14px; cursor: pointer; transition: transform .04s ease, border-color .15s ease, background .15s ease, color .15s ease, box-shadow .15s ease;
  display: inline-flex; align-items: center; gap: 8px;
  user-select: none;
}
.btn:active { transform: translateY(1px); }
.btn:focus-visible { outline: none; box-shadow: var(--ring); }

.btn--primary {
  background: linear-gradient(180deg, var(--accent-600), var(--accent-700));
  color: white;
  border-color: color-mix(in oklab, var(--accent-700) 60%, transparent);
}
.btn--primary:hover { background: linear-gradient(180deg, var(--accent-700), var(--accent-800)); }

.btn--outline {
  background: transparent;
  color: var(--text);
  border-color: var(--border);
}
.btn--outline:hover { border-color: var(--accent-700); color: var(--accent-700); }

.btn--ghost {
  background: transparent;
  color: var(--muted);
  border-color: var(--border);
}
.btn--ghost:hover { color: var(--accent-700); border-color: var(--accent-700); }

.btn--toggle {
  background: transparent;
  color: var(--text);
  border-color: var(--border);
  width: 42px; height: 38px; display: inline-flex; align-items: center; justify-content: center;
}
.btn--toggle:hover { border-color: var(--accent-700); }

.toggle { display: flex; align-items: center; }

/* Result */
.result {
  margin-top: 8px;
  display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap;
  background: color-mix(in oklab, var(--panel) 92%, transparent);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
}
.result__value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: clamp(16px, 2.2vw, 20px);
  letter-spacing: .6px;
}

/* Details / code */
.details {
  margin-top: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  background: color-mix(in oklab, var(--panel) 92%, transparent);
}
.details summary { cursor: pointer; color: var(--muted); }
.code {
  margin: 10px 0 2px;
  padding: 12px;
  border-radius: 8px;
  background: #0a0f14;
  color: #c9d1d9;
  overflow: auto;
  font-size: 12px;
}

/* Footer */
.footer {
  border-top: 1px solid var(--border);
  padding: 16px 20px;
  text-align: center;
}
.muted { color: var(--muted); font-size: 13px; }
`;

export default App;
