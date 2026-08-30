# Pendientes de logica

Este documento resume lo que falta para completar la logica funcional del
proyecto `Stellar Mystery Box`.

## Estado general

El repositorio esta armado como un taller con dos contratos Soroban y un
frontend React:

- `contracts/mystery_token`: contrato del token personal.
- `registry/mystery_exchange`: contrato del sorteo compartido.
- `frontend`: aplicacion web para conectar billetera, registrar la caja y
  enviar el regalo.

El contrato del sorteo ya tiene la logica principal implementada y cubierta por
tests. El contrato del token todavia conserva una funcion incompleta que bloquea
el flujo final de envio.

## Pendientes obligatorios

### 1. Completar `transfer_with_fee`

Archivo: `contracts/mystery_token/src/lib.rs`

La funcion `transfer_with_fee` aun termina con:

```rust
panic!("TODO Reto 2: completa esta funcion siguiendo las pistas");
```

Para completar la logica debe:

- validar que `amount` sea mayor que cero.
- validar que el emisor tenga saldo suficiente.
- calcular la comision como `amount / 100`.
- calcular el monto neto como `amount - fee`.
- restar `amount` completo del balance del emisor.
- sumar `net` al balance del receptor.
- reducir el `total_supply` en `fee`, quemando la comision.

Referencia esperada:

```rust
let fee = amount / 100;
let net = amount - fee;

let to_balance = read_balance(&env, &to);
write_balance(&env, &from, from_balance - amount);
write_balance(&env, &to, to_balance + net);

let supply = read_supply(&env);
write_supply(&env, supply - fee);
```

Mientras esto no se implemente, el boton del frontend para enviar la caja falla,
porque llama directamente a esta funcion.

### 2. Personalizar datos del token

Archivo: `contracts/mystery_token/src/lib.rs`

Siguen los valores de plantilla:

```rust
const TOKEN_NAME: &str = "CAMBIAME";
const TOKEN_SYMBOL: &str = "XXX";
```

Antes de desplegar el contrato final, deben reemplazarse por el nombre y simbolo
del token del participante.

Opcionalmente tambien puede actualizarse:

```text
frontend/src/config/tokenConfig.ts
```

Ese archivo solo cambia como se muestra la moneda en el frontend; la verdad del
token vive en el contrato.

### 3. Configurar IDs reales en el frontend

Archivo base: `frontend/.env.example`

Para que el frontend pueda operar contra Testnet debe existir `frontend/.env`
con:

```env
VITE_MYSTERY_EXCHANGE_CONTRACT_ID=<EXCHANGE_ID_DEL_SORTEO>
VITE_MYSTERY_TOKEN_CONTRACT_ID=<CONTRACT_ID_DEL_TOKEN>
VITE_NETWORK=testnet
```

Sin esos valores, los hooks del frontend no pueden construir clientes contra los
contratos:

- `frontend/src/hooks/useToken.ts`
- `frontend/src/hooks/useRegistry.ts`

## Verificacion realizada

Se intento correr:

```bash
pnpm run test:contracts
```

pero `pnpm` no estaba instalado en el entorno local.

Luego se corrio directamente:

```bash
cargo test --workspace
```

Resultado:

- `mystery_exchange`: 9 tests pasan.
- `mystery_token`: 3 tests fallan, todos relacionados con
  `transfer_with_fee`.

Los tests fallidos son:

- `test_transfer_with_fee_cobra_uno_por_ciento`
- `test_transfer_with_fee_descuenta_el_monto_completo_al_emisor`
- `test_transfer_with_fee_quema_la_comision_del_supply`

El error se origina en el `panic!("TODO Reto 2...")` de la funcion pendiente.

## Criterio de completitud

La logica puede considerarse completa cuando:

- `transfer_with_fee` esta implementada.
- `cargo test --workspace` pasa completo.
- el token fue personalizado.
- el contrato del token fue desplegado en Testnet.
- `frontend/.env` tiene los IDs reales.
- desde el frontend se puede registrar la caja y ejecutar el envio al match del
  sorteo.
