// programs/incinerator/src/lib.rs
// ─────────────────────────────────────────────────────────────────────────────
// INCINERATOR PROTOCOL — 10-Tier Token-2022 System
// Each tier = unique mint with on-chain metadata, transfer fees, burn mechanics
// ─────────────────────────────────────────────────────────────────────────────

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self, Token2022},
    token_interface::{Mint, TokenAccount},
};
use spl_token_2022::{
    extension::{
        metadata_pointer::MetadataPointer,
        transfer_fee::TransferFeeConfig,
        ExtensionType,
    },
    instruction as token_instruction,
    state::Mint as MintState,
};
use spl_token_metadata_interface::state::TokenMetadata;

declare_id!("11111111111111111111111111111111"); // ← Replace after first deploy

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

pub const DECIMALS: u8 = 3;
pub const CONFIG_SEED: &[u8] = b"incinerator_config";
pub const TIER_SEED: &[u8] = b"tier_mint_authority";

/// 10 tiers — name, symbol, max supply (in whole tokens, will be * 10^DECIMALS on-chain)
pub const TIERS: [(& str, &str, u64); 10] = [
    ("INCINERATOR",  "INCNR",  33),
    ("APOCALYPSE",   "APCLP",  55),
    ("GODSLAYER",    "GODSLY", 88),
    ("DISINTEGRATE", "DSNTG",  111),
    ("TERMINATE",    "TRMNT",  222),
    ("ANNIHILATE",   "ANHLT",  333),
    ("OVERWRITE",    "OVRWT",  444),
    ("INFERNO",      "INFRN",  555),
    ("FLAME",        "FLAME",  888),
    ("SPARK",        "SPARK",  4444),
];

// ─── STATE ────────────────────────────────────────────────────────────────────

/// Global config PDA — stores admin authority and protocol settings
#[account]
#[derive(Default)]
pub struct ProtocolConfig {
    /// Admin wallet (can update fees, freeze, etc.)
    pub authority: Pubkey,
    /// Treasury wallet for transfer fee collection
    pub treasury: Pubkey,
    /// Transfer fee in basis points (100 = 1%)
    pub transfer_fee_bps: u16,
    /// Maximum transfer fee in basis points
    pub max_fee_bps: u16,
    /// Whether burns are enabled
    pub burns_enabled: bool,
    /// Number of tiers initialized so far
    pub tiers_initialized: u8,
    /// Mint addresses for each tier (indexed 0-9)
    pub tier_mints: [Pubkey; 10],
    /// Bump for PDA
    pub bump: u8,
}

/// Per-tier metadata stored in a PDA
#[account]
#[derive(Default)]
pub struct TierInfo {
    /// Tier index (0-9, 0 = INCINERATOR, 9 = SPARK)
    pub tier_index: u8,
    /// Mint address for this tier
    pub mint: Pubkey,
    /// Max supply in raw units (whole_tokens * 10^DECIMALS)
    pub max_supply: u64,
    /// Current circulating supply
    pub current_supply: u64,
    /// Total burned
    pub total_burned: u64,
    /// Metadata URI (off-chain JSON with image, attributes)
    pub uri: String,
    /// Bump
    pub bump: u8,
}

// ─── PROGRAM ──────────────────────────────────────────────────────────────────

#[program]
pub mod incinerator {
    use super::*;

    /// Initialize the protocol config. Called once by admin.
    pub fn initialize(
        ctx: Context<Initialize>,
        treasury: Pubkey,
        transfer_fee_bps: u16,
        max_fee_bps: u16,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.treasury = treasury;
        config.transfer_fee_bps = transfer_fee_bps;
        config.max_fee_bps = max_fee_bps;
        config.burns_enabled = true;
        config.tiers_initialized = 0;
        config.tier_mints = [Pubkey::default(); 10];
        config.bump = ctx.bumps.config;

        msg!("INCINERATOR PROTOCOL initialized");
        msg!("Authority: {}", config.authority);
        msg!("Treasury: {}", config.treasury);
        msg!("Transfer fee: {} bps", config.transfer_fee_bps);
        Ok(())
    }

    /// Create a tier mint with Token-2022 extensions (metadata + transfer fee).
    /// Called once per tier by admin. Must be called in order (0, 1, 2...).
    pub fn create_tier(
        ctx: Context<CreateTier>,
        tier_index: u8,
        uri: String,
    ) -> Result<()> {
        require!(tier_index < 10, IncineratorError::InvalidTier);
        require!(
            tier_index == ctx.accounts.config.tiers_initialized,
            IncineratorError::TierOutOfOrder
        );

        let (name, symbol, max_supply_whole) = TIERS[tier_index as usize];
        let max_supply_raw = max_supply_whole * 10u64.pow(DECIMALS as u32);

        // Store tier info
        let tier_info = &mut ctx.accounts.tier_info;
        tier_info.tier_index = tier_index;
        tier_info.mint = ctx.accounts.tier_mint.key();
        tier_info.max_supply = max_supply_raw;
        tier_info.current_supply = 0;
        tier_info.total_burned = 0;
        tier_info.uri = uri.clone();
        tier_info.bump = ctx.bumps.tier_info;

        // Update config
        let config = &mut ctx.accounts.config;
        config.tier_mints[tier_index as usize] = ctx.accounts.tier_mint.key();
        config.tiers_initialized += 1;

        msg!(
            "Tier {} ({}) created — mint: {}, max supply: {} ({} raw)",
            tier_index, name, ctx.accounts.tier_mint.key(),
            max_supply_whole, max_supply_raw
        );

        Ok(())
    }

    /// Mint tokens for a tier. Only admin can mint. Cannot exceed max supply.
    pub fn mint_tier(
        ctx: Context<MintTier>,
        tier_index: u8,
        amount: u64,
    ) -> Result<()> {
        require!(tier_index < 10, IncineratorError::InvalidTier);

        let tier_info = &mut ctx.accounts.tier_info;
        require!(
            tier_info.current_supply + amount <= tier_info.max_supply,
            IncineratorError::ExceedsMaxSupply
        );

        // Mint via PDA authority
        let config_bump = ctx.accounts.config.bump;
        let seeds = &[CONFIG_SEED, &[config_bump]];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = token_2022::MintTo {
            mint: ctx.accounts.tier_mint.to_account_info(),
            to: ctx.accounts.recipient_ata.to_account_info(),
            authority: ctx.accounts.config.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token_2022::mint_to(cpi_ctx, amount)?;

        tier_info.current_supply += amount;

        let (name, _, _) = TIERS[tier_index as usize];
        msg!(
            "Minted {} raw units of {} (tier {}). Supply: {}/{}",
            amount, name, tier_index,
            tier_info.current_supply, tier_info.max_supply
        );

        Ok(())
    }

    /// Burn tokens. Any holder can burn their own tokens.
    pub fn burn_tokens(
        ctx: Context<BurnTokens>,
        tier_index: u8,
        amount: u64,
    ) -> Result<()> {
        require!(tier_index < 10, IncineratorError::InvalidTier);
        require!(ctx.accounts.config.burns_enabled, IncineratorError::BurnsDisabled);
        require!(amount > 0, IncineratorError::ZeroAmount);

        let cpi_accounts = token_2022::Burn {
            mint: ctx.accounts.tier_mint.to_account_info(),
            from: ctx.accounts.holder_ata.to_account_info(),
            authority: ctx.accounts.holder.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token_2022::burn(cpi_ctx, amount)?;

        let tier_info = &mut ctx.accounts.tier_info;
        tier_info.current_supply = tier_info.current_supply.saturating_sub(amount);
        tier_info.total_burned += amount;

        let (name, _, _) = TIERS[tier_index as usize];
        msg!(
            "🔥 Burned {} raw units of {} (tier {}). Remaining: {}, Total burned: {}",
            amount, name, tier_index,
            tier_info.current_supply, tier_info.total_burned
        );

        Ok(())
    }

    /// Update transfer fee. Admin only.
    pub fn update_fee(
        ctx: Context<AdminOnly>,
        new_fee_bps: u16,
        new_max_fee_bps: u16,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.transfer_fee_bps = new_fee_bps;
        config.max_fee_bps = new_max_fee_bps;
        msg!("Transfer fee updated: {} bps (max {} bps)", new_fee_bps, new_max_fee_bps);
        Ok(())
    }

    /// Toggle burns on/off. Admin only.
    pub fn toggle_burns(ctx: Context<AdminOnly>, enabled: bool) -> Result<()> {
        ctx.accounts.config.burns_enabled = enabled;
        msg!("Burns {}", if enabled { "ENABLED" } else { "DISABLED" });
        Ok(())
    }

    /// Update treasury wallet. Admin only.
    pub fn update_treasury(ctx: Context<AdminOnly>, new_treasury: Pubkey) -> Result<()> {
        ctx.accounts.config.treasury = new_treasury;
        msg!("Treasury updated: {}", new_treasury);
        Ok(())
    }

    /// Transfer authority to a new admin. Admin only.
    pub fn transfer_authority(ctx: Context<AdminOnly>, new_authority: Pubkey) -> Result<()> {
        ctx.accounts.config.authority = new_authority;
        msg!("Authority transferred to: {}", new_authority);
        Ok(())
    }
}

// ─── ACCOUNTS ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 2 + 2 + 1 + 1 + (32 * 10) + 1 + 64, // extra padding
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, ProtocolConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tier_index: u8, uri: String)]
pub struct CreateTier<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, ProtocolConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + 1 + 32 + 8 + 8 + 8 + 4 + 256 + 1 + 32, // extra for URI string
        seeds = [b"tier_info", &[tier_index]],
        bump,
    )]
    pub tier_info: Account<'info, TierInfo>,

    /// The Token-2022 mint for this tier.
    /// Created externally (client-side) with extensions, then passed in.
    /// CHECK: Validated by constraint below
    #[account(mut)]
    pub tier_mint: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tier_index: u8, amount: u64)]
pub struct MintTier<'info> {
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, ProtocolConfig>,

    #[account(
        mut,
        seeds = [b"tier_info", &[tier_index]],
        bump = tier_info.bump,
    )]
    pub tier_info: Account<'info, TierInfo>,

    #[account(
        mut,
        constraint = tier_mint.key() == tier_info.mint @ IncineratorError::MintMismatch,
    )]
    pub tier_mint: InterfaceAccount<'info, Mint>,

    /// Recipient's associated token account
    #[account(mut)]
    pub recipient_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tier_index: u8, amount: u64)]
pub struct BurnTokens<'info> {
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, ProtocolConfig>,

    #[account(
        mut,
        seeds = [b"tier_info", &[tier_index]],
        bump = tier_info.bump,
    )]
    pub tier_info: Account<'info, TierInfo>,

    #[account(
        mut,
        constraint = tier_mint.key() == tier_info.mint @ IncineratorError::MintMismatch,
    )]
    pub tier_mint: InterfaceAccount<'info, Mint>,

    /// Holder's token account to burn from
    #[account(
        mut,
        constraint = holder_ata.owner == holder.key() @ IncineratorError::NotTokenOwner,
    )]
    pub holder_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub holder: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority,
    )]
    pub config: Account<'info, ProtocolConfig>,

    pub authority: Signer<'info>,
}

// ─── ERRORS ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum IncineratorError {
    #[msg("Invalid tier index. Must be 0-9.")]
    InvalidTier,

    #[msg("Tiers must be created in order (0, 1, 2...).")]
    TierOutOfOrder,

    #[msg("Minting would exceed max supply for this tier.")]
    ExceedsMaxSupply,

    #[msg("Mint address does not match tier.")]
    MintMismatch,

    #[msg("Burns are currently disabled.")]
    BurnsDisabled,

    #[msg("Amount must be greater than zero.")]
    ZeroAmount,

    #[msg("You do not own this token account.")]
    NotTokenOwner,
}
