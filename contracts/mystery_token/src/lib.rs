#![no_std]

// ══════════════════════════════════════════════════════════════════════
//  🎁 MYSTERY TOKEN — tu propio token de Stellar (Soroban)
//  Workshop: Live-coding en Stellar
//
//  Considerar lo siguiente: la API de soroban-sdk (aca fijada
//  en la v26, ver /Cargo.toml) y el target wasm32v1-none cambian seguido.
//  Si algo difiere de la documentacion oficial de forma posterior al taller,
//  revisar en:
//  https://developers.stellar.org/docs/build/smart-contracts/getting-started
// ══════════════════════════════════════════════════════════════════════

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

// ╔═══════════════════════════════════════════════════════════╗
// ║  🎁 RETO 1 — PERSONALIZA TU TOKEN MISTERIOSO               ║
// ║  Cambia estos valores por los de tu caja. Despues:         ║
// ║  git add . && git commit -m "Reto 1: mi token" && git push ║
// ╚═══════════════════════════════════════════════════════════╝
const TOKEN_NAME: &str = "FUEGO_R"; // Nombre de tu token
const TOKEN_SYMBOL: &str = "FUR"; // Simbolo (3-5 letras)
const TOKEN_DECIMALS: u32 = 7; // Dejalo en 7 (estandar de Stellar)
const INITIAL_SUPPLY: i128 = 1_000_000; // Cuantos tokens acuñar

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Balance(Address),
    TotalSupply,
    Initialized,
}

fn read_balance(env: &Env, id: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Balance(id.clone()))
        .unwrap_or(0)
}

fn write_balance(env: &Env, id: &Address, amount: i128) {
    env.storage()
        .persistent()
        .set(&DataKey::Balance(id.clone()), &amount);
}

fn read_supply(env: &Env) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::TotalSupply)
        .unwrap_or(0)
}

fn write_supply(env: &Env, amount: i128) {
    env.storage()
        .persistent()
        .set(&DataKey::TotalSupply, &amount);
}

#[contract]
pub struct MysteryToken;

#[contractimpl]
impl MysteryToken {
    /// Acuña el INITIAL_SUPPLY completo a `owner`. Se llama una sola vez,
    /// justo despues de desplegar el contrato (lo hace deploy-testnet.sh).
    pub fn initialize(env: Env, owner: Address) {
        owner.require_auth();

        if env.storage().instance().has(&DataKey::Initialized) {
            panic!("este token ya fue inicializado");
        }
        env.storage().instance().set(&DataKey::Initialized, &true);

        write_supply(&env, INITIAL_SUPPLY);
        write_balance(&env, &owner, INITIAL_SUPPLY);
    }

    pub fn name(env: Env) -> String {
        String::from_str(&env, TOKEN_NAME)
    }

    pub fn symbol(env: Env) -> String {
        String::from_str(&env, TOKEN_SYMBOL)
    }

    pub fn decimals(_env: Env) -> u32 {
        TOKEN_DECIMALS
    }

    pub fn total_supply(env: Env) -> i128 {
        read_supply(&env)
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        read_balance(&env, &id)
    }

    /// Transferencia normal, ya resuelta — usala de referencia para el Reto 2.
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        if amount <= 0 {
            panic!("el monto tiene que ser mayor a cero");
        }

        let from_balance = read_balance(&env, &from);
        if from_balance < amount {
            panic!("saldo insuficiente");
        }
        let to_balance = read_balance(&env, &to);

        write_balance(&env, &from, from_balance - amount);
        write_balance(&env, &to, to_balance + amount);
    }

    // ╔═══════════════════════════════════════════════════════════╗
    // ║  ⚡ RETO 2 — ACTIVA EL PODER DE TU TOKEN                    ║
    // ║  Completa la funcion siguiendo las 🔍 PISTAS.              ║
    // ║  Corre los tests: si pasan en verde, el poder esta activo. ║
    // ╚═══════════════════════════════════════════════════════════╝
    pub fn transfer_with_fee(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        if amount <= 0 {
            panic!("el monto tiene que ser mayor a cero");
        }

        let from_balance = read_balance(&env, &from);
        if from_balance < amount {
            panic!("saldo insuficiente");
        }

        let fee = amount / 100;
        let net = amount - fee;
        let to_balance = read_balance(&env, &to);
        let supply = read_supply(&env);

        write_balance(&env, &from, from_balance - amount);
        write_balance(&env, &to, to_balance + net);
        write_supply(&env, supply - fee);
    }

    /// Envia la misma cantidad de tokens a varios destinatarios en una sola llamada.
    pub fn airdrop(env: Env, from: Address, recipients: Vec<Address>, amount: i128) {
        from.require_auth();

        if amount <= 0 {
            panic!("el monto tiene que ser mayor a cero");
        }
        if recipients.is_empty() {
            panic!("necesitas al menos un destinatario");
        }

        let total = amount * recipients.len() as i128;
        let from_balance = read_balance(&env, &from);
        if from_balance < total {
            panic!("saldo insuficiente");
        }

        write_balance(&env, &from, from_balance - total);

        for recipient in recipients.iter() {
            let recipient_balance = read_balance(&env, &recipient);
            write_balance(&env, &recipient, recipient_balance + amount);
        }
    }
}

mod test;
