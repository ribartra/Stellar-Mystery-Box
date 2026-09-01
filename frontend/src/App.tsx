import { useEffect } from "react";
import { useWallet } from "./hooks/useWallet";
import { useToken } from "./hooks/useToken";
import { useRegistry } from "./hooks/useRegistry";
import { BoxReveal } from "./components/BoxReveal";
import { MintPanel } from "./components/MintPanel";
import { ExchangePanel } from "./components/ExchangePanel";
import { SharedBoard } from "./components/SharedBoard";

// Cada cuanto refrescamos el sorteo compartido, para ver en vivo quien se
// va anotando (y que sus direcciones esten disponibles para el airdrop).
const REGISTRY_POLL_MS = 8000;

export default function App() {
  const wallet = useWallet();
  const token = useToken(wallet.address);
  // Un solo `useRegistry` para toda la app: lo comparten el tablero de la sala
  // y el panel de airdrop (que usa las direcciones de los registrados).
  const registry = useRegistry(wallet.address);

  useEffect(() => {
    if (wallet.address) token.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address]);

  useEffect(() => {
    if (!wallet.address) return;
    registry.refresh();
    const interval = setInterval(registry.refresh, REGISTRY_POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address]);

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__kicker">Expediente: amigo invisible</span>
        <h1>Stellar Mystery Box</h1>
        <p>
          Aca vas a crear tu propia moneda de juego y el sorteo va a decidir
          a quien se la mandas, sin que nadie se autoasigne.
        </p>
      </header>

      {wallet.error && <p className="mint-panel__warning app__error">⚠️ {wallet.error}</p>}

      <main className="app__grid">
        <BoxReveal />
        <MintPanel wallet={wallet} token={token} registry={registry} />
        <ExchangePanel wallet={wallet} token={token} />
        <SharedBoard wallet={wallet} registry={registry} />
      </main>

      <footer className="app__footer">
        <p>
          Estas perdido/a? Mira el archivo <code>RETOS.md</code> en la raiz
          del repositorio: ahi esta la guia completa, paso a paso.
        </p>
      </footer>
    </div>
  );
}
