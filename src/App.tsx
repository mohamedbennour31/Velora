import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
ShieldCheck, LockKeyhole, Eye, EyeOff, ArrowRight,
Fingerprint, WifiOff, Plus, LogOut, Trash2, KeyRound, Copy, Check
} from "lucide-react";
import "./App.css";

type Entry = {
id: string;
title: string;
username: string;
password: string;
url: string;
notes: string;
};

type Mode = "setup" | "unlock" | "vault" | "recover" | "recovery-key";

export default function App() {
const [name, setName] = useState("");
const [password, setPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [recoveryKey, setRecoveryKey] = useState("");
const [issuedKey, setIssuedKey] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [mode, setMode] = useState<Mode>("setup");
const [entries, setEntries] = useState<Entry[]>([]);
const [error, setError] = useState("");
const [busy, setBusy] = useState(false);
const [keyCopied, setKeyCopied] = useState(false);
const [title, setTitle] = useState("");
const [username, setUsername] = useState("");
const [entryPassword, setEntryPassword] = useState("");
const [showEntryPassword, setShowEntryPassword] = useState(false);
const [url, setUrl] = useState("");
const [notes, setNotes] = useState("");
const [search, setSearch] = useState("");
const [editingId, setEditingId] = useState<string | null>(null);
const [revealed, setRevealed] = useState<string | null>(null);
const [generatedLength, setGeneratedLength] = useState(20);
const [useSymbols, setUseSymbols] = useState(true);
const [copyStatus, setCopyStatus] = useState("");
const [showOfflineProof, setShowOfflineProof] = useState(false);

async function createVault(event: React.FormEvent) {
event.preventDefault();
setError("");
setBusy(true);
try {
const key = await invoke<string>("create_vault", { password });
setIssuedKey(key);
setPassword("");
setMode("recovery-key");
} catch (e) {
setError(String(e));
} finally {
setBusy(false);
}
}


function generatePassword() {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{};:,.?";

  let chars = lower + upper + numbers;
  if (useSymbols) chars += symbols;

  // Reject values that would introduce modulo bias.
  const limit = Math.floor(4294967296 / chars.length) * chars.length;
  let result = "";

  while (result.length < generatedLength) {
    const bytes = new Uint32Array(
      Math.max(16, (generatedLength - result.length) * 2)
    );

    crypto.getRandomValues(bytes);

    for (const value of bytes) {
      if (value >= limit) continue;

      result += chars[value % chars.length];

      if (result.length === generatedLength) break;
    }
  }

  setEntryPassword(result);
setShowEntryPassword(true);
setCopyStatus("");
}






async function copyEntryPassword() {
  if (!entryPassword) return;

  try {
    await navigator.clipboard.writeText(entryPassword);
    setCopyStatus("Password copied to clipboard.");

    window.setTimeout(() => {
      setCopyStatus("");
    }, 2500);
  } catch {
    setCopyStatus(
      "Copy failed. Check clipboard permissions and try again."
    );
  }
}





function getPasswordStrength(value: string) {
  let score = 0;

  if (value.length >= 12) score++;
  if (value.length >= 16) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^a-zA-Z0-9]/.test(value)) score++;

  if (!value) return { label: "", score: 0 };
  if (score <= 2) return { label: "Weak", score };
  if (score <= 3) return { label: "Good", score };
  return { label: "Strong", score };
}




async function unlockVault(event: React.FormEvent) {
event.preventDefault();
setError("");
setBusy(true);
try {
const saved = await invoke<Entry[]>("unlock_vault", { password });
setEntries(saved);
setPassword("");
setMode("vault");
} catch (e) {
setError(String(e));
} finally {
setBusy(false);
}
}

async function recoverVault(event: React.FormEvent) {
event.preventDefault();
setError("");
setBusy(true);
try {
const saved = await invoke<Entry[]>("recover_vault", {
recoveryKey: recoveryKey.trim(),
newPassword,
});
setEntries(saved);
setPassword("");
setNewPassword("");
setRecoveryKey("");
setMode("vault");
} catch (e) {
setError(String(e));
} finally {
setBusy(false);
}
}

async function finishRecoverySetup() {
setEntries([]);
setMode("vault");
setIssuedKey("");
setKeyCopied(false);
}

async function logout() {
try {
await invoke("lock_vault");
setEntries([]);
setPassword("");
setNewPassword("");
setEntryPassword("");
setShowEntryPassword(false);
setShowPassword(false);
setCopyStatus("");
setEditingId(null);
setRevealed(null);
setError("");
setMode("unlock");
} catch (e) {
setError(String(e));
}
}



async function manageVault(action: "new" | "delete") {
  const message =
    action === "new"
      ? "Create a new vault? Your current vault and all its saved passwords will be permanently deleted."
      : "Permanently delete your vault and all saved passwords? This cannot be undone.";

  if (!window.confirm(message)) return;

  setError("");
  setBusy(true);

  try {
    await invoke("delete_vault");

    // Reset the application state.
    setName("");
    setPassword("");
    setNewPassword("");
    setRecoveryKey("");
    setIssuedKey("");
    setEntries([]);
    setTitle("");
    setUsername("");
    setEntryPassword("");
    setUrl("");
    setNotes("");
    setSearch("");
    setEditingId(null);
    setRevealed(null);
    setShowPassword(false);
    setShowEntryPassword(false);
    setCopyStatus("");
    setKeyCopied(false);

    // Return to the create-vault screen.
    setMode("setup");
  } catch (e) {
    setError(String(e));
  } finally {
    setBusy(false);
  }
}


async function copyRecoveryKey() {
try {
await navigator.clipboard.writeText(issuedKey);
setKeyCopied(true);
} catch {
setError("Copy failed. Select and copy the recovery key manually.");
}
}

return (
<main className="velora">
<div className="ambient ambient-one" />
<div className="ambient ambient-two" />

  <header className="topbar">
    <div className="brand">
      <div className="brand-icon"><ShieldCheck size={23} /></div>
      <span>VELORA<span className="brand-dot">.</span></span>
    </div>
    <button
  className="offline"
  type="button"
  onClick={() => setShowOfflineProof(v => !v)}
  aria-expanded={showOfflineProof}
>
  <span className="status-dot" />
  <WifiOff size={14} /> LOCAL-ONLY STATUS
</button>
  </header>

{showOfflineProof && (
  <section className="setup-card" aria-live="polite">
    <h2><ShieldCheck size={19} /> Your privacy status</h2>
    <p>🔒 Vault data is encrypted and stored locally.</p>
    
    
  </section>
)}

  {mode === "recovery-key" ? (
    <section className="welcome">
      <div className="security-icon"><KeyRound size={31} /></div>
      <div className="eyebrow"><span /> IMPORTANT SECURITY STEP</div>
      <h1>Your recovery.<br /><span>Your responsibility.</span></h1>
      <p className="subtitle">
        Save this recovery key somewhere safe, separate from this computer.
        It is shown only now. Anyone who obtains it can recover your vault.
      </p>
      <div className="setup-card">
        <div className="card-heading">
          <div><h2>Your recovery key</h2><p>Store it in a safe place.</p></div>
          <KeyRound size={23} />
        </div>
        <textarea
          readOnly
          rows={3}
          value={issuedKey}
          aria-label="Recovery key"
          onFocus={e => e.currentTarget.select()}
        />
        <button className="primary-button" type="button" onClick={copyRecoveryKey}>
          {keyCopied ? <Check size={18} /> : <Copy size={18} />}
          {keyCopied ? "Copied — store it safely" : "Copy recovery key"}
        </button>
        <p className="disclaimer">
          Losing both your master password and recovery key means your vault cannot be recovered.
        </p>
        <button className="secondary-button" type="button" onClick={finishRecoverySetup}>
          I've saved my recovery key <ArrowRight size={16} />
        </button>
      </div>
    </section>
  ) : mode === "vault" ? (
    <section className="vault-page">
      <div className="vault-heading">
        <div>
          <div className="eyebrow"><span /> YOUR PRIVATE SPACE</div>
          <h1>Hello, <span>{name.trim() || "there"}.</span></h1>
          <p className="subtitle">Your vault is unlocked on this device.</p>
        </div>
        <div className="vault-actions">
  <button
    className="secondary-button"
    type="button"
    onClick={logout}
    disabled={busy}
  >
    <LogOut size={16} />
    Lock vault
  </button>

  <button
    className="secondary-button"
    type="button"
    onClick={() => manageVault("new")}
    disabled={busy}
  >
    <Plus size={16} />
    Create new vault
  </button>

  <button
    className="danger-button"
    type="button"
    onClick={() => manageVault("delete")}
    disabled={busy}
  >
    <Trash2 size={16} />
    Delete vault
  </button>
</div>
      </div>

      <div className="setup-card entry-card">
        <h2>
  <Plus size={19} />
  {editingId ? "Edit password" : "Add a password"}
</h2>
        <form onSubmit={async (e) => {
  e.preventDefault();
  setError("");
  setBusy(true);

  try {
    const entry: Entry = {
      id: editingId ?? crypto.randomUUID(),
      title,
      username,
      password: entryPassword,
      url,
      notes,
    };

    const saved = await invoke<Entry[]>(
      editingId ? "update_entry" : "add_entry",
      { entry }
    );

    setEntries(saved);
setEditingId(null);
setTitle("");
setUsername("");
setEntryPassword("");
setShowEntryPassword(false);
setCopyStatus("");
setUrl("");
setNotes("");
  } catch (err) {
    setError(String(err));
  } finally {
    setBusy(false);
  }
}}>


{editingId && (
  <button
    className="secondary-button"
    type="button"
    onClick={() => {
      setEditingId(null);
      setTitle("");
      setUsername("");
      setEntryPassword("");
setShowEntryPassword(false);
setCopyStatus("");
      setUrl("");
      setNotes("");
      setError("");
    }}
  >
    Cancel editing
  </button>
)}

          <label htmlFor="entry-title">SERVICE NAME</label>
          <input id="entry-title" value={title} onChange={e => setTitle(e.target.value)} required />
          <label htmlFor="entry-username">USERNAME OR EMAIL</label>
          <input id="entry-username" value={username} onChange={e => setUsername(e.target.value)} />
         <label htmlFor="entry-password">PASSWORD</label>

<div className="password-field">
  <input
    id="entry-password"
    type={showEntryPassword ? "text" : "password"}
    value={entryPassword}
    onChange={e => setEntryPassword(e.target.value)}
    placeholder="Account password"
    autoComplete="new-password"
    required
  />

  <button
    className="visibility-button"
    type="button"
    onClick={() => setShowEntryPassword(value => !value)}
    aria-label={showEntryPassword ? "Hide account password" : "Show account password"}
    title={showEntryPassword ? "Hide password" : "Show password"}
  >
    {showEntryPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>
          

<div className="generator-controls">
  <label htmlFor="generated-length">
    PASSWORD LENGTH: {generatedLength}
  </label>

  <input
    id="generated-length"
    type="range"
    min="12"
    max="64"
    value={generatedLength}
    onChange={e => setGeneratedLength(Number(e.target.value))}
  />

  <label>
    <input
      type="checkbox"
      checked={useSymbols}
      onChange={e => setUseSymbols(e.target.checked)}
    />
    Include symbols
  </label>

  <button
    className="secondary-button"
    type="button"
    onClick={generatePassword}
  >
    Generate password
  </button>

  <button
  className="secondary-button"
  type="button"
  onClick={copyEntryPassword}
  disabled={!entryPassword}
>
  <Copy size={16} />
  Copy password
</button>

{copyStatus && (
  <p className="copy-status" role="status">
    {copyStatus}
  </p>
)}
</div>



{entryPassword && (
  <div className="strength">
    <div className="strength-header">
      <span>Password strength</span>
      <strong>{getPasswordStrength(entryPassword).label}</strong>
    </div>

    <div className="strength-track">
      <div
        className={`strength-fill strength-${getPasswordStrength(entryPassword).label.toLowerCase()}`}
        style={{
          width: `${(getPasswordStrength(entryPassword).score / 5) * 100}%`,
        }}
      />
    </div>
  </div>
)}



<label htmlFor="entry-url">WEBSITE (OPTIONAL)</label>
          <input id="entry-url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" />
          <label htmlFor="entry-notes">NOTES (OPTIONAL)</label>
          <textarea id="entry-notes" value={notes} onChange={e => setNotes(e.target.value)} />
          {error && <p role="alert" className="error-message">{error}</p>}
          <button className="primary-button" type="submit" disabled={busy}>
  {busy ? "Saving..." : editingId ? "Save changes" : "Add password"}
  <Plus size={18} />
</button>
        </form>
      </div>

      <div className="setup-card entry-card">
        <h2><LockKeyhole size={19} /> Your passwords</h2>
<p className="subtitle">
  {entries.length} {entries.length === 1 ? "account" : "accounts"} saved in your encrypted vault.
</p>
        <input
  type="search"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search passwords..."
  aria-label="Search saved passwords"
/>

{entries.length === 0 ? (
  <p className="subtitle">Your encrypted vault is empty.</p>
) : entries.filter(entry =>
    `${entry.title} ${entry.username} ${entry.url}`
      .toLowerCase()
      .includes(search.toLowerCase())
  ).map(entry => (
            <div className="entry-row" key={entry.id}>
              <div><strong>{entry.title}</strong><p>{entry.username}</p></div>
              <button className="secondary-button" onClick={() => setRevealed(revealed === entry.id ? null : entry.id)}>
                {revealed === entry.id ? "Hide" : "Reveal"}
              </button>
              <button className="secondary-button" aria-label={`Delete ${entry.title}`} onClick={async () => {
                if (!window.confirm(`Delete "${entry.title}" permanently?`)) return;
                try {
                  const saved = await invoke<Entry[]>("delete_entry", { id: entry.id });
                  setEntries(saved);
                  setRevealed(null);
                  setError("");
                } catch (e) {
                  setError(String(e));
                }
              }}><Trash2 size={16} /></button>
<button
  className="secondary-button"
  onClick={() => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setUsername(entry.username);
    setEntryPassword(entry.password);
setShowEntryPassword(false);
setCopyStatus("");
    setUrl(entry.url);
    setNotes(entry.notes);
  }}
>
  Edit
</button>
              {revealed === entry.id && <p>{entry.password}</p>}
            </div>
          ))
        }
      </div>
    </section>
  ) : (
    <section className="welcome">
      <div className="security-icon">
        {mode === "recover" ? <KeyRound size={31} /> :
          mode === "setup" ? <LockKeyhole size={31} /> : <Fingerprint size={31} />}
      </div>
      <div className="eyebrow"><span /> YOUR PERSONAL DIGITAL VAULT</div>
      <h1>{mode === "setup" ? <>Your secrets.<br /><span>Your sanctuary.</span></> :
        mode === "recover" ? <>Find your way<br /><span>back in.</span></> :
          <>Welcome<br /><span>back.</span></>}</h1>
      <p className="subtitle">
        {mode === "setup" ? "A private, encrypted home for your passwords." :
          mode === "recover" ? "Use your saved recovery key to set a new master password." :
            "Your encrypted vault is waiting for you."}
      </p>

      <form className="setup-card" onSubmit={mode === "setup" ? createVault : mode === "recover" ? recoverVault : unlockVault}>
        <div className="card-heading">
          <div>
            <h2>{mode === "setup" ? "Create your vault" : mode === "recover" ? "Recover your vault" : "Unlock your vault"}</h2>
            <p>{mode === "setup" ? "Choose a strong master password." :
              mode === "recover" ? "Your recovery key never leaves this device." :
                "Enter your master password to continue."}</p>
          </div>
         
        </div>

        {mode === "setup" && <>
          <label htmlFor="name">YOUR NAME</label>
          <input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="What should we call you?" autoComplete="nickname" required />
        </>}

        {mode === "recover" && <>
          <label htmlFor="recovery-key">RECOVERY KEY</label>
          <textarea id="recovery-key" rows={3} value={recoveryKey} onChange={e => setRecoveryKey(e.target.value)} placeholder="Paste your saved recovery key" required />
          <label htmlFor="new-password">NEW MASTER PASSWORD</label>

<div className="password-field">
  <input
    id="new-password"
    type={showPassword ? "text" : "password"}
    value={newPassword}
    onChange={e => setNewPassword(e.target.value)}
    minLength={12}
    autoComplete="new-password"
    required
  />

  <button
    className="visibility-button"
    type="button"
    onClick={() => setShowPassword(value => !value)}
    aria-label={showPassword ? "Hide new master password" : "Show new master password"}
    title={showPassword ? "Hide password" : "Show password"}
  >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>
        </>}

        {mode !== "recover" && <>
          <label htmlFor="master-password">MASTER PASSWORD</label>
          <div className="password-field">
            <input id="master-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "setup" ? "At least 12 characters" : "Enter your master password"} autoComplete={mode === "setup" ? "new-password" : "current-password"} minLength={mode === "setup" ? 12 : undefined} required />
            <button className="visibility-button" type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </>}

        {error && <p role="alert" className="error-message">{error}</p>}
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? "Please wait..." : mode === "setup" ? "Create encrypted vault" : mode === "recover" ? "Reset master password" : "Unlock vault"}
          {!busy && <ArrowRight size={18} />}
        </button>
        <p className="disclaimer">Your master password is never emailed.</p>
      </form>

      <button className="text-button" type="button" onClick={() => {
        setError("");
        setPassword("");
        setNewPassword("");
        setRecoveryKey("");
        setMode(mode === "setup" ? "unlock" : "setup");
      }}>
        {mode === "setup" ? "Already have a vault? Unlock it" : "First time here? Create a vault"}
      </button>
      {mode === "unlock" && <button className="text-button" type="button" onClick={() => {
        setError("");
        setMode("recover");
      }}>Forgot master password? Recover with key</button>}
      {mode === "recover" && <button className="text-button" type="button" onClick={() => {
        setError("");
        setMode("unlock");
      }}>Back to unlock</button>}
    </section>
  )}

  <footer>
    <span>VELORA © 2026</span>
    <span>YOUR DIGITAL LIFE, UNDER YOUR CONTROL.</span>
  </footer>
</main>

);
}