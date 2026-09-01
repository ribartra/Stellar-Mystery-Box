// ══════════════════════════════════════════════════════════════════════
//  Helper para hablar con contratos Soroban desde el navegador, usando el
//  `contract.Client` de alto nivel de @stellar/stellar-sdk (v17): arma,
//  simula y (si hace falta) firma y envia la transaccion automaticamente,
//  leyendo el spec del contrato directamente desde su .wasm ya publicado.
//
//  Verificado contra el paquete publicado en npm el 25/08/2026. Si una
//  version mayor de @stellar/stellar-sdk cambia esta API, revisa la doc:
//  https://developers.stellar.org/docs/build/guides/transactions/invoke-contract-tx-sdk
// ══════════════════════════════════════════════════════════════════════
import { contract, Networks } from "@stellar/stellar-sdk";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";

const RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;

// Red en la que vive el contrato ("testnet" | "public"). La usa Stellar Expert
// para armar los links publicos del explorador.
const NETWORK = (import.meta.env.VITE_NETWORK as string | undefined) ?? "testnet";

/**
 * Lo que devuelve `signAndSend`: el `result` ya decodificado y, cuando la
 * transaccion se envio, la respuesta del RPC con el `hash` de la transaccion
 * (asi podemos linkear a Stellar Expert).
 */
export interface SentResult<T> {
  result: T;
  sendTransactionResponse?: { hash: string };
}

/** Forma minima de lo que devuelve cada metodo del Client (result + signAndSend). */
export interface AssembledCall<T> {
  result: T;
  signAndSend: () => Promise<SentResult<T>>;
}

/** Link publico a una transaccion en Stellar Expert. */
export function explorerTxUrl(hash: string) {
  return `https://stellar.expert/explorer/${NETWORK}/tx/${hash}`;
}

/** Link publico a un contrato (y su lista de transacciones) en Stellar Expert. */
export function explorerContractUrl(contractId: string) {
  return `https://stellar.expert/explorer/${NETWORK}/contract/${contractId}`;
}

export async function getContractClient<T = unknown>(
  contractId: string,
  publicKey: string | null
) {
  return contract.Client.from<T>({
    contractId,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    publicKey: publicKey ?? undefined,
    signTransaction: (xdr, opts) => StellarWalletsKit.signTransaction(xdr, opts),
  });
}

/** Carga saldo de prueba (XLM de Testnet) en una cuenta, usando Friendbot. */
export async function fundWithFriendbot(publicKey: string) {
  const response = await fetch(
    `https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`
  );
  if (!response.ok) {
    throw new Error(
      "No pudimos cargar saldo de prueba en esta cuenta (puede que ya tenga saldo)."
    );
  }
}
