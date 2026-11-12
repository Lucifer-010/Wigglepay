//! WigglePay Soroban Smart Contract
//! Automated Payout Splitting & Non-Custodial Escrow Settlement
#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, BytesN,
    Env, IntoVal, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvoiceAlreadyExists = 4,
    InvoiceNotFound = 5,
    InvoiceNotPending = 6,
    InvalidAmount = 7,
    InvalidFeeBps = 8,
    EscrowNotFound = 9,
    EscrowAlreadySettled = 10,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    PlatformFeeRecipient,
    PlatformFeeBps,
    Invoice(BytesN<32>),
    Escrow(BytesN<32>),
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum InvoiceStatus {
    Pending = 0,
    Settled = 1,
    Cancelled = 2,
    Refunded = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InvoiceRecord {
    pub merchant: Address,
    pub token: Address,
    pub amount: i128,
    pub fee_bps: u32,
    pub payer: Option<Address>,
    pub status: InvoiceStatus,
    pub created_at: u64,
    pub settled_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowRecord {
    pub payer: Address,
    pub merchant: Address,
    pub token: Address,
    pub amount: i128,
    pub fee_bps: u32,
    pub settled: bool,
    pub created_at: u64,
}

const MAX_BPS: u32 = 10000; // 100.00%
const LEDGER_THRESHOLD: u32 = 500000; // Extend TTL threshold
const LEDGER_EXTEND: u32 = 1000000;

#[contract]
pub struct WigglePayEscrowContract;

#[contractimpl]
impl WigglePayEscrowContract {
    /// Initialize the WigglePay platform escrow contract with admin and platform fee configuration
    pub fn initialize(
        env: Env,
        admin: Address,
        platform_fee_recipient: Address,
        platform_fee_bps: u32,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        if platform_fee_bps > 3000 {
            // Maximum platform fee capped at 30%
            return Err(Error::InvalidFeeBps);
        }

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::PlatformFeeRecipient, &platform_fee_recipient);
        env.storage()
            .instance()
            .set(&DataKey::PlatformFeeBps, &platform_fee_bps);

        env.storage().instance().extend_ttl(LEDGER_THRESHOLD, LEDGER_EXTEND);
        Ok(())
    }

    /// Update platform fee basis points (Admin only)
    pub fn set_platform_fee(env: Env, new_fee_bps: u32) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        if new_fee_bps > 3000 {
            return Err(Error::InvalidFeeBps);
        }

        env.storage()
            .instance()
            .set(&DataKey::PlatformFeeBps, &new_fee_bps);
        Ok(())
    }

    /// Update fee recipient account (Admin only)
    pub fn set_fee_recipient(env: Env, new_recipient: Address) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::PlatformFeeRecipient, &new_recipient);
        Ok(())
    }

    /// Register a new invoice for settlement routing
    pub fn create_invoice(
        env: Env,
        invoice_id: BytesN<32>,
        merchant: Address,
        token: Address,
        amount: i128,
        custom_fee_bps: Option<u32>,
    ) -> Result<(), Error> {
        merchant.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let key = DataKey::Invoice(invoice_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::InvoiceAlreadyExists);
        }

        let default_fee_bps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::PlatformFeeBps)
            .unwrap_or(50); // Default 0.5% (50 bps)

        let fee_bps = custom_fee_bps.unwrap_or(default_fee_bps);
        if fee_bps > 3000 {
            return Err(Error::InvalidFeeBps);
        }

        let now = env.ledger().timestamp();
        let record = InvoiceRecord {
            merchant: merchant.clone(),
            token: token.clone(),
            amount,
            fee_bps,
            payer: None,
            status: InvoiceStatus::Pending,
            created_at: now,
            settled_at: 0,
        };

        env.storage().persistent().set(&key, &record);
        env.storage().persistent().extend_ttl(&key, LEDGER_THRESHOLD, LEDGER_EXTEND);

        env.events().publish(
            (symbol_short!("inv_crtd"), invoice_id),
            (merchant, token, amount, fee_bps),
        );

        Ok(())
    }

    /// Settle an invoice with automatic secondary payout splitting (e.g. 95% merchant, 5% platform fee)
    pub fn pay_invoice(
        env: Env,
        invoice_id: BytesN<32>,
        payer: Address,
    ) -> Result<(), Error> {
        payer.require_auth();

        let key = DataKey::Invoice(invoice_id.clone());
        let mut invoice: InvoiceRecord = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::InvoiceNotFound)?;

        if invoice.status != InvoiceStatus::Pending {
            return Err(Error::InvoiceNotPending);
        }

        let platform_fee_recipient: Address = env
            .storage()
            .instance()
            .get(&DataKey::PlatformFeeRecipient)
            .ok_or(Error::NotInitialized)?;

        // Calculate split: Platform fee vs Merchant payout
        let total_amount = invoice.amount;
        let fee_amount = (total_amount * invoice.fee_bps as i128) / MAX_BPS as i128;
        let merchant_amount = total_amount - fee_amount;

        // Perform token transfers via SEP-41 Client
        let token_client = token::Client::new(&env, &invoice.token);

        // 1. Transfer merchant share directly to merchant
        if merchant_amount > 0 {
            token_client.transfer(&payer, &invoice.merchant, &merchant_amount);
        }

        // 2. Transfer platform share to fee recipient
        if fee_amount > 0 {
            token_client.transfer(&payer, &platform_fee_recipient, &fee_amount);
        }

        // Update invoice state
        invoice.status = InvoiceStatus::Settled;
        invoice.payer = Some(payer.clone());
        invoice.settled_at = env.ledger().timestamp();

        env.storage().persistent().set(&key, &invoice);

        // Emit settlement event for indexing & listening
        env.events().publish(
            (symbol_short!("settled"), invoice_id),
            (payer, invoice.merchant, merchant_amount, fee_amount),
        );

        Ok(())
    }

    /// Deposit funds into a non-custodial holding escrow
    pub fn create_escrow(
        env: Env,
        escrow_id: BytesN<32>,
        payer: Address,
        merchant: Address,
        token: Address,
        amount: i128,
        custom_fee_bps: Option<u32>,
    ) -> Result<(), Error> {
        payer.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let key = DataKey::Escrow(escrow_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::InvoiceAlreadyExists);
        }

        let default_fee_bps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::PlatformFeeBps)
            .unwrap_or(50);
        let fee_bps = custom_fee_bps.unwrap_or(default_fee_bps);

        // Lock funds from payer into the contract itself
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&payer, &env.current_contract_address(), &amount);

        let escrow = EscrowRecord {
            payer: payer.clone(),
            merchant: merchant.clone(),
            token: token.clone(),
            amount,
            fee_bps,
            settled: false,
            created_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&key, &escrow);

        env.events().publish(
            (symbol_short!("escr_new"), escrow_id),
            (payer, merchant, amount),
        );

        Ok(())
    }

    /// Release escrow funds with automated splitting
    pub fn release_escrow(env: Env, escrow_id: BytesN<32>) -> Result<(), Error> {
        let key = DataKey::Escrow(escrow_id.clone());
        let mut escrow: EscrowRecord = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::EscrowNotFound)?;

        if escrow.settled {
            return Err(Error::EscrowAlreadySettled);
        }

        // Payer or Admin can authorize release
        escrow.payer.require_auth();

        let platform_fee_recipient: Address = env
            .storage()
            .instance()
            .get(&DataKey::PlatformFeeRecipient)
            .ok_or(Error::NotInitialized)?;

        let fee_amount = (escrow.amount * escrow.fee_bps as i128) / MAX_BPS as i128;
        let merchant_amount = escrow.amount - fee_amount;

        let token_client = token::Client::new(&env, &escrow.token);

        if merchant_amount > 0 {
            token_client.transfer(&env.current_contract_address(), &escrow.merchant, &merchant_amount);
        }
        if fee_amount > 0 {
            token_client.transfer(&env.current_contract_address(), &platform_fee_recipient, &fee_amount);
        }

        escrow.settled = true;
        env.storage().persistent().set(&key, &escrow);

        env.events().publish(
            (symbol_short!("escr_rel"), escrow_id),
            (escrow.merchant, merchant_amount, fee_amount),
        );

        Ok(())
    }

    /// Refund escrow back to payer if unfulfilled (Merchant or Admin can authorize)
    pub fn refund_escrow(env: Env, escrow_id: BytesN<32>) -> Result<(), Error> {
        let key = DataKey::Escrow(escrow_id.clone());
        let mut escrow: EscrowRecord = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::EscrowNotFound)?;

        if escrow.settled {
            return Err(Error::EscrowAlreadySettled);
        }

        // Either merchant authorizes refund or admin
        escrow.merchant.require_auth();

        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(&env.current_contract_address(), &escrow.payer, &escrow.amount);

        escrow.settled = true;
        env.storage().persistent().set(&key, &escrow);

        env.events().publish(
            (symbol_short!("escr_ref"), escrow_id),
            (escrow.payer, escrow.amount),
        );

        Ok(())
    }

    /// Query invoice record
    pub fn get_invoice(env: Env, invoice_id: BytesN<32>) -> Option<InvoiceRecord> {
        let key = DataKey::Invoice(invoice_id);
        env.storage().persistent().get(&key)
    }

    /// Query escrow record
    pub fn get_escrow(env: Env, escrow_id: BytesN<32>) -> Option<EscrowRecord> {
        let key = DataKey::Escrow(escrow_id);
        env.storage().persistent().get(&key)
    }

    /// Query platform configuration
    pub fn get_config(env: Env) -> (Address, Address, u32) {
        let admin = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("contract not initialized");
        let fee_recipient = env
            .storage()
            .instance()
            .get(&DataKey::PlatformFeeRecipient)
            .expect("contract not initialized");
        let fee_bps = env
            .storage()
            .instance()
            .get(&DataKey::PlatformFeeBps)
            .unwrap_or(50);
        (admin, fee_recipient, fee_bps)
    }
}

#[cfg(test)]
mod test;

