import { useEffect, useState } from "react";
import type { useWallet } from "../hooks/useWallet";
import type { useToken } from "../hooks/useToken";
import { useRegistry, type BoxEntry } from "../hooks/useRegistry";
import { getContractClient, explorerTxUrl, type AssembledCall } from "../lib/soroban";

interface AdmirerTokenContract {
  balance: (args: { id: string }) => Promise<AssembledCall<bigint>>;
}

interface ExchangePanelProps {
  wallet: ReturnType<typeof useWallet>;
  token: ReturnType<typeof useToken>;
}

const DEFAULT_AMOUNT = "100";

export function ExchangePanel({ wallet, token }: ExchangePanelProps) {
  const exchange = useRegistry(wallet.address);
  const [busy, setBusy] = useState<string | null>(null);
  const [myMatch, setMyMatch] = useState<BoxEntry | null>(null);
  const [myAdmirer, setMyAdmirer] = useState<BoxEntry | null>(null);
  const [receivedBalance, setReceivedBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [sent, setSent] = useState(false);
  const [sentHash, setSentHash] = useState<string | null>(null);

  useEffect(() => {
    if (wallet.address) exchange.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address]);

  const alreadyRegistered = exchange.tokens.some(
    (t) => t.token_contract === token.contractId
  );

  const nowSeconds = Math.floor(Date.now() / 1000);
  const unlocked = exchange.unlockTimestamp !== null && nowSeconds >= exchange.unlockTimestamp;

  useEffect(() => {
    if (!exchange.shuffled) return;
    exchange.getMyMatch().then(setMyMatch);
    if (unlocked) {
      exchange.getMyAdmirer().then(setMyAdmirer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchange.shuffled, unlocked, wallet.address]);

  useEffect(() => {
    if (!myAdmirer || !wallet.address) return;
    getContractClient<AdmirerTokenContract>(myAdmirer.token_contract, wallet.address)
      .then((client) => client.balance({ id: wallet.address! }))
      .then((tx) => setReceivedBalance(Number(tx.result)))
      .catch(() => setReceivedBalance(null));
  }, [myAdmirer, wallet.address]);

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

  if (!wallet.address) {
    return (
      <section className="card">
        <h2>🎲 El sorteo</h2>
        <p className="mint-panel__intro">
          Conecta tu billetera para sumarte al sorteo de la sala.
        </p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>🎲 El sorteo</h2>

      {!exchange.registryId && (
        <p className="mint-panel__warning">
          ⚠️ El sorteo compartido todavia no esta conectado. Pregunta a
          quien organiza el taller.
        </p>
      )}

      {exchange.registryId && !token.contractId && (
        <p className="mint-panel__warning">
          ⚠️ Primero desplega tu moneda (Reto 3) para poder sumarte al
          sorteo.
        </p>
      )}

      {exchange.registryId && token.contractId && !exchange.shuffled && (
        <>
          {alreadyRegistered ? (
            <p className="mint-panel__success">
              ✅ Ya estas en el sorteo. Esperando a que se sortee.
            </p>
          ) : (
            <>
              <p className="mint-panel__intro">
                Sumate con tu propia moneda: el contrato va a sortear quien
                le manda su caja a quien, sin que nadie se autoasigne.
              </p>
              <button
                className="btn btn--primary"
                onClick={() =>
                  withBusy("register", () =>
                    exchange.register(
                      token.contractId ?? "",
                      token.name ?? "Mi Token",
                      token.symbol ?? "XXX"
                    )
                  )
                }
                disabled={busy !== null}
              >
                {busy === "register" ? "Sumando..." : "🎲 Sumarme al sorteo"}
              </button>
            </>
          )}
        </>
      )}

      {exchange.shuffled && (
        <>
          {myMatch ? (
            <dl className="mint-panel__stats">
              <dt>Le mandas tu caja a</dt>
              <dd>
                {myMatch.emoji} {myMatch.name} ({myMatch.symbol})
              </dd>
              <dt>Su lema</dt>
              <dd>"{myMatch.tagline}"</dd>
            </dl>
          ) : (
            <p className="mint-panel__intro">Buscando a quien le mandas tu caja...</p>
          )}

          {myMatch && !sent && (
            <div className="mint-panel__actions">
              <label className="mint-panel__intro" htmlFor="gift-amount">
                Cuanto le mandas de tu moneda
              </label>
              <input
                id="gift-amount"
                className="mint-panel__input"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button
                className="btn btn--primary"
                onClick={() =>
                  withBusy("send", async () => {
                    const hash = await token.sendGift(myMatch.owner, Number(amount) || 0);
                    setSentHash(hash);
                    setSent(true);
                  })
                }
                disabled={busy !== null || !Number(amount)}
              >
                {busy === "send" ? "Enviando..." : "🎁 Enviar mi caja"}
              </button>
            </div>
          )}

          {sent && (
            <p className="mint-panel__success">
              ✅ Le mandaste tu caja a {myMatch?.name}.
              {sentHash && (
                <>
                  {" "}
                  <a
                    className="tx-link"
                    href={explorerTxUrl(sentHash)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver la transaccion ↗
                  </a>
                </>
              )}
            </p>
          )}

          {!unlocked && (
            <p className="box-reveal__hint">
              Todavia no llega el momento de ver quien te manda tu caja,
              eso se revela mas adelante.
            </p>
          )}

          {unlocked && myAdmirer && (
            <p className="mint-panel__success">
              🎉 {myAdmirer.emoji} {myAdmirer.name} te manda una caja
              ({myAdmirer.symbol}).{" "}
              {receivedBalance !== null
                ? `Ya tienes ${receivedBalance} en tu cuenta de esa moneda.`
                : "Todavia no te la mando, revisa mas tarde."}
            </p>
          )}
        </>
      )}
    </section>
  );
}
