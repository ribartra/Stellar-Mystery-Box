# Pendientes de logica

Este documento resume el estado funcional actual del proyecto `Stellar Mystery
Box` y los pendientes opcionales para seguir construyendo despues del taller.

## Estado general

El repositorio esta armado como un taller con dos contratos Soroban y un
frontend React:

- `contracts/mystery_token`: contrato del token personal.
- `registry/mystery_exchange`: contrato del sorteo compartido.
- `frontend`: aplicacion web para conectar billetera, registrar la caja y
  enviar el regalo.

Los cuatro retos principales ya fueron completados:

- El token fue personalizado.
- `transfer_with_fee` fue implementada.
- Los contratos pasan tests.
- El token fue desplegado en Stellar Testnet.
- El frontend tiene IDs reales en `frontend/.env`.
- La caja fue registrada en el sorteo y enviada al match asignado.
- `MI-TOKEN.md` fue completado con el comprobante del taller.

## Logica obligatoria completada

### 1. `transfer_with_fee`

Archivo: `contracts/mystery_token/src/lib.rs`

La funcion ya implementa el poder del token:

- valida que `amount` sea mayor que cero.
- valida que el emisor tenga saldo suficiente.
- calcula la comision como `amount / 100`.
- calcula el monto neto como `amount - fee`.
- resta `amount` completo del balance del emisor.
- suma `net` al balance del receptor.
- reduce el `total_supply` en `fee`, quemando la comision.

Implementacion actual:

```rust
let fee = amount / 100;
let net = amount - fee;
let to_balance = read_balance(&env, &to);
let supply = read_supply(&env);

write_balance(&env, &from, from_balance - amount);
write_balance(&env, &to, to_balance + net);
write_supply(&env, supply - fee);
```

### 2. Token personalizado

Archivo: `contracts/mystery_token/src/lib.rs`

Valores actuales:

```rust
const TOKEN_NAME: &str = "FUEGO_R";
const TOKEN_SYMBOL: &str = "FUR";
const TOKEN_DECIMALS: u32 = 7;
const INITIAL_SUPPLY: i128 = 1_000_000;
```

### 3. IDs reales en el frontend

Archivo local: `frontend/.env`

Valores actuales:

```env
VITE_MYSTERY_EXCHANGE_CONTRACT_ID=CD3FN3KP4VLL5O7MDLYBUATU7K4ARPPGMQAOMOI2ZPJISUXDONWA7JNL
VITE_MYSTERY_TOKEN_CONTRACT_ID=CAIOJR2N3AKO2LH2RQCVPH62SI3B73D6YLUNQGD25YRY5YHF5BTHJ2GI
VITE_NETWORK=testnet
```

`frontend/.env` no debe commitearse; esta correctamente ignorado por Git.

### 4. Registro y envio del sorteo

Contrato de sorteo:

```text
CD3FN3KP4VLL5O7MDLYBUATU7K4ARPPGMQAOMOI2ZPJISUXDONWA7JNL
```

Token propio:

```text
CAIOJR2N3AKO2LH2RQCVPH62SI3B73D6YLUNQGD25YRY5YHF5BTHJ2GI
```

Participante registrado:

```text
FUEGO_R (FUR)
Owner: GBDGBEHR2XCETX4MKP3AA7PX6EPWN4A4TJ3KY6GVZN54ZT6VAGXH2SBX
```

Envio realizado:

```text
Destinatario: COStoken (COS)
Owner: GBD3CYHYW3KRZJLFLX2L4M2BVB3ATVGM6BI2J64HJORINBLZK75TGZNO
Monto enviado: 100 FUR
Monto recibido: 99 FUR
Comision quemada: 1 FUR
```

## Verificacion realizada

Se corrio:

```bash
pnpm run test:contracts
```

Resultado:

- `mystery_exchange`: 9 tests pasan.
- `mystery_token`: 6 tests pasan.
- Total: 15 tests pasan.

Tambien se verifico en Testnet que el envio aplico la comision del 1%:

- balance del destinatario en el token propio: `99`.
- balance del owner despues del envio: `999900`.

## Pendientes opcionales Builder

### 1. Segundo poder: `airdrop`

Agregar una funcion nueva al contrato del token para enviar una cantidad fija a
varios destinatarios en una sola llamada.

Firma sugerida:

```rust
pub fn airdrop(env: Env, from: Address, recipients: Vec<Address>, amount: i128)
```

Comportamiento esperado:

- `from.require_auth()`.
- validar que `amount > 0`.
- validar que `recipients` no este vacio.
- calcular el total como `amount * recipients.len()`.
- validar que `from` tenga saldo suficiente.
- restar el total del balance de `from`.
- sumar `amount` al balance de cada destinatario.
- no modificar `total_supply`, porque no quema ni crea tokens.

Tests sugeridos:

- reparte el monto a todos los destinatarios.
- descuenta el total correcto al emisor.
- falla si el monto es cero o negativo.
- falla si no hay destinatarios.
- falla si el emisor no tiene saldo suficiente.

Nota: agregar `airdrop` cambia el contrato fuente, pero no actualiza el
contrato que ya fue desplegado. Para usarlo en Testnet habria que desplegar un
nuevo contrato.

### 2. Estetica propia

Personalizar la interfaz en:

```text
frontend/src/styles.css
```

Este cambio no toca blockchain ni requiere redesplegar contratos.

### 3. Segundo token

Publicar una segunda caja con otro tema:

1. Cambiar `TOKEN_NAME`, `TOKEN_SYMBOL`, `tokenConfig`, etc.
2. Ejecutar:

   ```bash
   pnpm run deploy:testnet otro-alias
   ```

3. Guardar el nuevo `CONTRACT_ID`.

## Criterio de completitud actual

La logica principal del taller esta completa. A partir de este punto, cualquier
cambio nuevo debe considerarse trabajo Builder opcional y conviene registrarlo
en un commit separado.
