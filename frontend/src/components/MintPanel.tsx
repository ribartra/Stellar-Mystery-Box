import { useState } from "react";
import type { useWallet } from "../hooks/useWallet";
import type { useToken } from "../hooks/useToken";
import type { useRegistry } from "../hooks/useRegistry";
import { explorerContractUrl } from "../lib/soroban";

interface MintPanelProps {
  wallet: ReturnType<typeof useWallet>;
  token: ReturnType<typeof useToken>;
  registry: ReturnType<typeof useRegistry>;
}

// Un color estable (parece aleatorio) para cada direccion: derivamos un tono
// del hash del texto, asi la misma direccion siempre se ve del mismo color.
function colorForAddress(address: string) {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return {
    background: `hsl(${hue} 65% 18%)`,
    borderColor: `hsl(${hue} 80% 58%)`,
    color: `hsl(${hue} 90% 84%)`,
  };
}

function splitAddresses(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function MintPanel({ wallet, token, registry }: MintPanelProps) {
  const [busy, setBusy] = useState<string | null>(null);
  // Cada direccion confirmada es un "chip". `draft` es lo que se esta
  // escribiendo y todavia no se confirmo (con coma+espacio o Enter).
  const [recipients, setRecipients] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [airdropAmount, setAirdropAmount] = useState("25");
  const [airdropMessage, setAirdropMessage] = useState<string | null>(null);

  async function withBusy(label: string, action: () => Promise<void>) {
    setBusy(label);
    try {
      await action();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Algo salio mal");
    } finally {
      setBusy(null);
    }
  }

  // Direcciones de quienes ya se anotaron en el sorteo, sacadas del campo
  // `owner` de cada caja registrada. Sacamos la billetera propia (no tiene
  // sentido hacerse airdrop a uno mismo) y quitamos repetidas.
  const registeredAddresses = Array.from(
    new Set(
      registry.tokens
        .map((entry) => entry.owner)
        .filter((owner) => owner && owner !== wallet.address)
    )
  );

  // Confirma una o varias direcciones como chips, sin duplicar.
  function addRecipients(values: string[]) {
    if (values.length === 0) return;
    setRecipients((prev) => Array.from(new Set([...prev, ...values])));
    setAirdropMessage(null);
  }

  function removeRecipient(address: string) {
    setRecipients((prev) => prev.filter((item) => item !== address));
    setAirdropMessage(null);
  }

  // Al escribir: si aparece un separador (coma, espacio, salto de linea, o al
  // pegar una lista), confirmamos todo lo completo y dejamos el ultimo trozo
  // en `draft` por si se sigue escribiendo.
  function handleDraftChange(value: string) {
    setAirdropMessage(null);
    if (/[\s,;]/.test(value)) {
      const parts = value.split(/[\s,;]+/);
      const last = parts.pop() ?? "";
      addRecipients(parts.filter(Boolean));
      setDraft(last.trim());
    } else {
      setDraft(value);
    }
  }

  function handleDraftKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addRecipients(splitAddresses(draft));
      setDraft("");
    } else if (event.key === "Backspace" && draft === "" && recipients.length > 0) {
      // Borrar hacia atras con el campo vacio quita el ultimo chip.
      setRecipients((prev) => prev.slice(0, -1));
      setAirdropMessage(null);
    }
  }

  function fillFromRegistered() {
    if (registeredAddresses.length === 0) return;
    setRecipients(registeredAddresses);
    setDraft("");
    setAirdropMessage(null);
  }

  // Todo lo que se enviaria: chips confirmados + lo que quede en el borrador.
  const allRecipients = draft.trim()
    ? Array.from(new Set([...recipients, draft.trim()]))
    : recipients;
  const recipientCount = allRecipients.length;

  return (
    <section className="card mint-panel">
      <h2>🔮 Tu moneda</h2>

      {!wallet.address ? (
        <>
          <p className="mint-panel__intro">
            Conecta tu billetera digital para ver tu moneda y usarla.
          </p>
          <button className="btn btn--primary" onClick={wallet.connect} disabled={wallet.connecting}>
            {wallet.connecting ? "Conectando..." : "🔗 Conectar mi billetera"}
          </button>
        </>
      ) : (
        <>
          <p className="mint-panel__address">
            Tu billetera: <code>{wallet.address.slice(0, 6)}...{wallet.address.slice(-6)}</code>
          </p>

          <div className="mint-panel__actions">
            <button
              className="btn"
              onClick={() => withBusy("fund", wallet.fund)}
              disabled={busy !== null}
            >
              {busy === "fund" ? "Cargando saldo..." : "🚰 Cargar saldo de prueba"}
            </button>

            {!token.alreadyMinted && (
              <button
                className="btn"
                onClick={() => withBusy("mint", token.mint)}
                disabled={busy !== null || !token.contractId}
              >
                {busy === "mint" ? "Creando..." : "✨ Crear mi moneda"}
              </button>
            )}
          </div>

          {wallet.fundedMessage && (
            <p className="mint-panel__success">✅ {wallet.fundedMessage}</p>
          )}

          {token.alreadyMinted && (
            <p className="mint-panel__success">
              ✨ Tu moneda ya fue creada (se acuño automaticamente al
              desplegarla con <code>deploy-testnet.sh</code>).
            </p>
          )}

          {!token.contractId && (
            <p className="mint-panel__warning">
              ⚠️ Todavia no configuraste tu moneda. Sigue el Reto 3 de la
              guia (<code>RETOS.md</code>) para publicarla en Stellar
              Testnet.
            </p>
          )}

          {token.name && (
            <dl className="mint-panel__stats">
              <dt>Nombre</dt>
              <dd>{token.name}</dd>
              <dt>Simbolo</dt>
              <dd>{token.symbol}</dd>
              <dt>Cuanto tienes</dt>
              <dd>{token.balance ?? "..."}</dd>
            </dl>
          )}

          {token.alreadyMinted && token.contractId && (
            <div className="airdrop-panel">
              <h3>🔥 Airdrop builder</h3>
              <p className="mint-panel__intro">
                Envia la misma cantidad de {token.symbol ?? "tu token"} a varias
                billeteras en una sola transaccion.
              </p>

              <div className="airdrop-panel__label-row">
                <label className="airdrop-panel__label" htmlFor="airdrop-recipients">
                  Destinatarios
                </label>
                <button
                  type="button"
                  className="btn btn--ghost airdrop-panel__fill"
                  onClick={fillFromRegistered}
                  disabled={busy !== null || registeredAddresses.length === 0}
                  title={
                    registeredAddresses.length === 0
                      ? "Todavia no hay otras cajas anotadas en el sorteo"
                      : undefined
                  }
                >
                  📋 Usar direcciones de los registrados
                  {registeredAddresses.length > 0 && ` (${registeredAddresses.length})`}
                </button>
              </div>
              <div
                className="mint-panel__input airdrop-panel__chips"
                onClick={(event) => {
                  const input = event.currentTarget.querySelector("input");
                  input?.focus();
                }}
              >
                {recipients.map((address) => (
                  <span
                    key={address}
                    className="airdrop-panel__chip"
                    style={colorForAddress(address)}
                    title={address}
                  >
                    <span className="airdrop-panel__chip-text">
                      {address.slice(0, 6)}…{address.slice(-6)}
                    </span>
                    <button
                      type="button"
                      className="airdrop-panel__chip-remove"
                      aria-label={`Quitar ${address}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        removeRecipient(address);
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  id="airdrop-recipients"
                  className="airdrop-panel__chip-input"
                  placeholder={
                    recipients.length === 0
                      ? "Pega direcciones G... (coma + espacio para separar)"
                      : "Agregar otra…"
                  }
                  value={draft}
                  onChange={(event) => handleDraftChange(event.target.value)}
                  onKeyDown={handleDraftKeyDown}
                  onBlur={() => {
                    if (draft.trim()) {
                      addRecipients(splitAddresses(draft));
                      setDraft("");
                    }
                  }}
                />
              </div>

              <div className="airdrop-panel__row">
                <div>
                  <label className="airdrop-panel__label" htmlFor="airdrop-amount">
                    Monto por wallet
                  </label>
                  <input
                    id="airdrop-amount"
                    className="mint-panel__input"
                    type="number"
                    min="1"
                    value={airdropAmount}
                    onChange={(event) => {
                      setAirdropAmount(event.target.value);
                      setAirdropMessage(null);
                    }}
                  />
                </div>
                <p className="airdrop-panel__total">
                  {recipientCount} destinatario{recipientCount === 1 ? "" : "s"}
                </p>
              </div>

              <button
                className="btn btn--primary"
                onClick={() =>
                  withBusy("airdrop", async () => {
                    const sentCount = recipientCount;
                    await token.airdrop(allRecipients.join("\n"), Number(airdropAmount) || 0);
                    setRecipients([]);
                    setDraft("");
                    setAirdropMessage(
                      `Airdrop enviado a ${sentCount} destinatario${
                        sentCount === 1 ? "" : "s"
                      }.`
                    );
                  })
                }
                disabled={busy !== null || recipientCount === 0 || !Number(airdropAmount)}
              >
                {busy === "airdrop" ? "Enviando airdrop..." : "🔥 Enviar airdrop"}
              </button>

              {airdropMessage && (
                <p className="mint-panel__success">
                  ✅ {airdropMessage}
                  {token.contractId && (
                    <>
                      {" "}
                      <a
                        className="tx-link"
                        href={explorerContractUrl(token.contractId)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver el contrato y sus transacciones ↗
                      </a>
                    </>
                  )}
                </p>
              )}
            </div>
          )}

          {token.error && <p className="mint-panel__warning">⚠️ {token.error}</p>}
        </>
      )}
    </section>
  );
}
