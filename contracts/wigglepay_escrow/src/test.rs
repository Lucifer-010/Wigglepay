#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, token, vec, Address, BytesN, Env, IntoVal};

#[test]
fn test_initialization_and_settlement_split() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(WigglePayEscrowContract, ());
    let client = WigglePayEscrowContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let merchant = Address::generate(&env);
    let payer = Address::generate(&env);

    // Initialize platform with 500 bps (5.00% platform fee)
    client.initialize(&admin, &fee_recipient, &500);

    let (cfg_admin, cfg_fee_recipient, cfg_fee_bps) = client.get_config();
    assert_eq!(cfg_admin, admin);
    assert_eq!(cfg_fee_recipient, fee_recipient);
    assert_eq!(cfg_fee_bps, 500);

    // Create a mock token
    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin);
    let token_client = token::Client::new(&env, &token_contract.address());
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract.address());

    // Mint 10,000 units to payer
    token_admin_client.mint(&payer, &10000);
    assert_eq!(token_client.balance(&payer), 10000);

    // Create invoice for 1,000 units with default 5% fee (50 units to fee recipient, 950 to merchant)
    let invoice_id: BytesN<32> = BytesN::from_array(&env, &[1u8; 32]);
    client.create_invoice(&invoice_id, &merchant, &token_contract.address(), &1000, &None);

    let invoice = client.get_invoice(&invoice_id).unwrap();
    assert_eq!(invoice.amount, 1000);
    assert_eq!(invoice.fee_bps, 500);
    assert_eq!(invoice.status, InvoiceStatus::Pending);

    // Payer settles invoice
    client.pay_invoice(&invoice_id, &payer);

    // Verify balances
    // Merchant should receive 950 (95%)
    assert_eq!(token_client.balance(&merchant), 950);
    // Fee recipient should receive 50 (5%)
    assert_eq!(token_client.balance(&fee_recipient), 50);
    // Payer has 10000 - 1000 = 9000
    assert_eq!(token_client.balance(&payer), 9000);

    // Check updated invoice record
    let settled_invoice = client.get_invoice(&invoice_id).unwrap();
    assert_eq!(settled_invoice.status, InvoiceStatus::Settled);
    assert_eq!(settled_invoice.payer, Some(payer));
}

#[test]
fn test_escrow_deposit_release() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(WigglePayEscrowContract, ());
    let client = WigglePayEscrowContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    let merchant = Address::generate(&env);
    let payer = Address::generate(&env);

    client.initialize(&admin, &fee_recipient, &1000); // 10% fee

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin);
    let token_client = token::Client::new(&env, &token_contract.address());
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract.address());

    token_admin_client.mint(&payer, &5000);

    let escrow_id: BytesN<32> = BytesN::from_array(&env, &[2u8; 32]);
    // Escrow 2000 units
    client.create_escrow(&escrow_id, &payer, &merchant, &token_contract.address(), &2000, &None);

    // Escrow funds locked in contract
    assert_eq!(token_client.balance(&contract_id), 2000);
    assert_eq!(token_client.balance(&payer), 3000);

    // Release escrow
    client.release_escrow(&escrow_id);

    // 10% of 2000 is 200 fee; 1800 to merchant
    assert_eq!(token_client.balance(&merchant), 1800);
    assert_eq!(token_client.balance(&fee_recipient), 200);
    assert_eq!(token_client.balance(&contract_id), 0);
}

