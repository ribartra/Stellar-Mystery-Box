# ⚡ Segundo token (Builder) — Token del Rayo

Reto Builder "Segundo token": la caja misteriosa me asignó el tema del **Rayo**
y publiqué una segunda caja con ese tema, además de la original (FUEGO_R / FUR).

Se desplegó con el mismo owner `ribartra`
(`pnpm run deploy:testnet ribartra`), así que la misma billetera puede usarlo
desde el frontend. Es el token al que apunta hoy `frontend/.env`
(`VITE_MYSTERY_TOKEN_CONTRACT_ID`).

## Datos de la caja

- **Nombre del token:** Token del Rayo
- **Símbolo:** RAY
- **Tema de la caja:** Rayo ⚡
- **Color:** #FFD700
- **Lema:** "Impredecible y directo al punto"
- **Owner:** `ribartra` — GBDGBEHR2XCETX4MKP3AA7PX6EPWN4A4TJ3KY6GVZN54ZT6VAGXH2SBX
- **Supply inicial:** 1.000.000 (acuñado al owner al inicializar)

## Contrato en Testnet

- **CONTRACT_ID:** `CBHAUDGUDHHCHHFZX6A2JGGF74HGIOUBVB3XFJRVH5PYPYPN4Z4A2W7E`
- **Stellar Expert:**
  `https://stellar.expert/explorer/testnet/contract/CBHAUDGUDHHCHHFZX6A2JGGF74HGIOUBVB3XFJRVH5PYPYPN4Z4A2W7E`

## Poderes incluidos (Retos opcionales previos)

- `transfer_with_fee`: transfiere quemando la comisión del 1%.
- `airdrop`: envía la misma cantidad a varias direcciones en una sola
  transacción (se puede alimentar con las direcciones de los registrados en el
  sorteo).

## Cómo se creó

1. Se cambió el tema en el código:
   - `contracts/mystery_token/src/lib.rs`: `TOKEN_NAME = "Token del Rayo"`,
     `TOKEN_SYMBOL = "RAY"`.
   - `frontend/src/config/tokenConfig.ts`: emoji ⚡, lema y color #FFD700.
2. `pnpm run test:contracts` → 21 tests en verde.
3. `pnpm run deploy:testnet ribartra` → despliega e inicializa el token.
4. Se pegó el nuevo `CONTRACT_ID` en `frontend/.env`.

## Pendiente (a cargo mío)

- Registrar esta caja en el sorteo (`mystery_exchange`) desde el frontend.
- Probar el envío de la caja y el airdrop end-to-end.
