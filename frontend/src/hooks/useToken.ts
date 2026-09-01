import { useCallback, useState } from "react";
import { getContractClient, type AssembledCall } from "../lib/soroban";

const TOKEN_CONTRACT_ID = import.meta.env.VITE_MYSTERY_TOKEN_CONTRACT_ID as
  | string
  | undefined;

// Firma del contrato mystery_token, tal como quedo definida en
// contracts/mystery_token/src/lib.rs (sin el parametro `env`, que el SDK
// maneja solo). i128 en Soroban viaja como `bigint` en JS/TS.
interface MysteryTokenContract {
  initialize: (args: { owner: string }) => Promise<AssembledCall<null>>;
  name: () => Promise<AssembledCall<string>>;
  symbol: () => Promise<AssembledCall<string>>;
  balance: (args: { id: string }) => Promise<AssembledCall<bigint>>;
  total_supply: () => Promise<AssembledCall<bigint>>;
  transfer_with_fee: (args: {
    from: string;
    to: string;
    amount: bigint;
  }) => Promise<AssembledCall<null>>;
  airdrop: (args: {
    from: string;
    recipients: string[];
    amount: bigint;
  }) => Promise<AssembledCall<null>>;
}

function parseRecipients(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

export function useToken(publicKey: string | null) {
  const [balance, setBalance] = useState<number | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<string | null>(null);
  // Si el supply total ya es mayor a cero, alguien (el script deploy-testnet.sh,
  // normalmente) ya llamo a `initialize`. Lo usamos para no ofrecer el boton
  // de crear la moneda dos veces, cosa que el contrato rechaza.
  const [alreadyMinted, setAlreadyMinted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!publicKey || !TOKEN_CONTRACT_ID) return;
    setLoading(true);
    setError(null);
    try {
      const client = await getContractClient<MysteryTokenContract>(
        TOKEN_CONTRACT_ID,
        publicKey
      );
      const [balanceTx, nameTx, symbolTx, supplyTx] = await Promise.all([
        client.balance({ id: publicKey }),
        client.name(),
        client.symbol(),
        client.total_supply(),
      ]);
      setBalance(Number(balanceTx.result));
      setName(nameTx.result);
      setSymbol(symbolTx.result);
      setAlreadyMinted(supplyTx.result > 0n);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos leer tu moneda todavia. Sigue el Reto 3 de la guia para publicarla."
      );
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  /** Acuña el supply inicial (por si todavia no corriste deploy-testnet.sh). */
  const mint = useCallback(async () => {
    if (!publicKey) throw new Error("Conecta tu billetera primero");
    if (!TOKEN_CONTRACT_ID) {
      throw new Error("Todavia no configuraste tu moneda. Sigue el Reto 3 de la guia.");
    }
    const client = await getContractClient<MysteryTokenContract>(
      TOKEN_CONTRACT_ID,
      publicKey
    );
    const tx = await client.initialize({ owner: publicKey });
    await tx.signAndSend();
    await refresh();
  }, [publicKey, refresh]);

  /**
   * Envia tu regalo (con la comision/quema del Reto 2) a quien te toco en el
   * sorteo. Devuelve el hash de la transaccion para poder linkearla.
   */
  const sendGift = useCallback(
    async (to: string, amount: number): Promise<string | null> => {
      if (!publicKey) throw new Error("Conecta tu billetera primero");
      if (!TOKEN_CONTRACT_ID) {
        throw new Error("Todavia no configuraste tu moneda. Sigue el Reto 3 de la guia.");
      }
      const client = await getContractClient<MysteryTokenContract>(
        TOKEN_CONTRACT_ID,
        publicKey
      );
      const tx = await client.transfer_with_fee({
        from: publicKey,
        to,
        amount: BigInt(Math.trunc(amount)),
      });
      const sent = await tx.signAndSend();
      await refresh();
      return sent.sendTransactionResponse?.hash ?? null;
    },
    [publicKey, refresh]
  );

  /** Envia la misma cantidad de tokens a varias billeteras en una sola transaccion. */
  const airdrop = useCallback(
    async (recipientsText: string, amount: number) => {
      if (!publicKey) throw new Error("Conecta tu billetera primero");
      if (!TOKEN_CONTRACT_ID) {
        throw new Error("Todavia no configuraste tu moneda. Sigue el Reto 3 de la guia.");
      }

      const recipients = parseRecipients(recipientsText);
      if (recipients.length === 0) {
        throw new Error("Pega al menos una direccion Stellar para enviar el airdrop.");
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("El monto del airdrop tiene que ser mayor a cero.");
      }

      const client = await getContractClient<MysteryTokenContract>(
        TOKEN_CONTRACT_ID,
        publicKey
      );
      const tx = await client.airdrop({
        from: publicKey,
        recipients,
        amount: BigInt(Math.trunc(amount)),
      });
      await tx.signAndSend();
      await refresh();
    },
    [publicKey, refresh]
  );

  return {
    contractId: TOKEN_CONTRACT_ID ?? null,
    balance,
    name,
    symbol,
    alreadyMinted,
    loading,
    error,
    refresh,
    mint,
    sendGift,
    airdrop,
  };
}
