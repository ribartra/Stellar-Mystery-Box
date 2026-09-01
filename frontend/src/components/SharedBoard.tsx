import type { useWallet } from "../hooks/useWallet";
import type { useRegistry } from "../hooks/useRegistry";

interface SharedBoardProps {
  wallet: ReturnType<typeof useWallet>;
  registry: ReturnType<typeof useRegistry>;
}

export function SharedBoard({ wallet, registry }: SharedBoardProps) {
  return (
    <section className="card shared-board">
      <h2>🌌 La sala</h2>
      <p className="mint-panel__intro">
        Aca van apareciendo, en vivo, las cajas de todas las personas
        anotadas en el sorteo.
        {wallet.address && registry.registryId && (
          <> Estado: {registry.shuffled ? "ya se sorteo" : "anotandose"}.</>
        )}
      </p>

      {!registry.registryId && (
        <p className="mint-panel__warning">
          ⚠️ El sorteo compartido todavia no esta conectado. Pregunta a
          quien organiza el taller.
        </p>
      )}

      {!wallet.address && registry.registryId && (
        <p className="shared-board__hint">
          Conecta tu billetera para ver las cajas que ya se anotaron en el
          sorteo.
        </p>
      )}

      {registry.tokens.length > 0 && (
        <ul className="shared-board__grid">
          {registry.tokens.map((t, i) => (
            <li key={t.token_contract} className="shared-board__item">
              <span className="shared-board__case">
                Caso {String(i + 1).padStart(3, "0")}
              </span>
              <span className="shared-board__emoji">{t.emoji}</span>
              <strong>{t.name}</strong>
              <span className="shared-board__symbol">{t.symbol}</span>
              <p className="shared-board__tagline">"{t.tagline}"</p>
            </li>
          ))}
        </ul>
      )}

      {wallet.address && registry.tokens.length === 0 && !registry.loading && (
        <p className="shared-board__hint">
          Todavia no hay cajas anotadas en el sorteo. Se el primero o la
          primera en sumar la tuya con el Reto 4!
        </p>
      )}
    </section>
  );
}
