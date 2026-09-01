#![cfg(test)]

use super::{MysteryToken, MysteryTokenClient};
use soroban_sdk::{testutils::Address as _, vec, Address, Env};

fn setup() -> (Env, MysteryTokenClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MysteryToken, ());
    let client = MysteryTokenClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    client.initialize(&owner);

    (env, client, owner)
}

#[test]
fn test_initialize_acuna_supply_inicial() {
    let (_env, client, owner) = setup();

    assert_eq!(client.balance(&owner), 1_000_000);
    assert_eq!(client.total_supply(), 1_000_000);
}

#[test]
fn test_transfer_normal_mueve_balances() {
    let (env, client, owner) = setup();
    let bob = Address::generate(&env);

    client.transfer(&owner, &bob, &200);

    assert_eq!(client.balance(&owner), 1_000_000 - 200);
    assert_eq!(client.balance(&bob), 200);
}

// ─────────────────────────────────────────────────────────────
//  Tests del Reto 2 — la "luz verde" de transfer_with_fee.
//  Fallan mientras la funcion tenga el panic! de plantilla.
// ─────────────────────────────────────────────────────────────

#[test]
fn test_transfer_with_fee_cobra_uno_por_ciento() {
    let (env, client, owner) = setup();
    let bob = Address::generate(&env);

    client.transfer_with_fee(&owner, &bob, &1_000);

    // 1% de 1000 = 10 de comision -> a bob le llegan 990
    assert_eq!(client.balance(&bob), 990);
}

#[test]
fn test_transfer_with_fee_descuenta_el_monto_completo_al_emisor() {
    let (env, client, owner) = setup();
    let bob = Address::generate(&env);

    client.transfer_with_fee(&owner, &bob, &1_000);

    assert_eq!(client.balance(&owner), 1_000_000 - 1_000);
}

#[test]
fn test_transfer_with_fee_quema_la_comision_del_supply() {
    let (env, client, owner) = setup();
    let bob = Address::generate(&env);

    client.transfer_with_fee(&owner, &bob, &1_000);

    // el supply total baja en la comision quemada (10)
    assert_eq!(client.total_supply(), 1_000_000 - 10);
}

#[test]
#[should_panic(expected = "saldo insuficiente")]
fn test_transfer_with_fee_falla_sin_saldo() {
    let (env, client, owner) = setup();
    let bob = Address::generate(&env);

    client.transfer_with_fee(&owner, &bob, &10_000_000);
}

#[test]
fn test_airdrop_reparte_a_varios_destinatarios() {
    let (env, client, owner) = setup();
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);
    let dave = Address::generate(&env);

    client.airdrop(
        &owner,
        &vec![&env, bob.clone(), carol.clone(), dave.clone()],
        &250,
    );

    assert_eq!(client.balance(&bob), 250);
    assert_eq!(client.balance(&carol), 250);
    assert_eq!(client.balance(&dave), 250);
}

#[test]
fn test_airdrop_descuenta_total_al_emisor() {
    let (env, client, owner) = setup();
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);
    let dave = Address::generate(&env);

    client.airdrop(&owner, &vec![&env, bob, carol, dave], &250);

    assert_eq!(client.balance(&owner), 1_000_000 - 750);
}

#[test]
fn test_airdrop_no_cambia_supply_total() {
    let (env, client, owner) = setup();
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);

    client.airdrop(&owner, &vec![&env, bob, carol], &100);

    assert_eq!(client.total_supply(), 1_000_000);
}

#[test]
#[should_panic(expected = "el monto tiene que ser mayor a cero")]
fn test_airdrop_falla_con_monto_cero() {
    let (env, client, owner) = setup();
    let bob = Address::generate(&env);

    client.airdrop(&owner, &vec![&env, bob], &0);
}

#[test]
#[should_panic(expected = "necesitas al menos un destinatario")]
fn test_airdrop_falla_sin_destinatarios() {
    let (env, client, owner) = setup();

    client.airdrop(&owner, &vec![&env], &100);
}

#[test]
#[should_panic(expected = "saldo insuficiente")]
fn test_airdrop_falla_sin_saldo_suficiente() {
    let (env, client, owner) = setup();
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);

    client.airdrop(&owner, &vec![&env, bob, carol], &600_000);
}
