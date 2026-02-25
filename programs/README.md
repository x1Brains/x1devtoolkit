# Programs

Anchor/Rust on-chain programs go here. Each program gets its own directory:

```
programs/
├── my_first_program/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
├── token_vault/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
```

## Creating a new program

```bash
anchor init my_program --no-git
# or manually create the directory structure
```

## Program template

```rust
use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111"); // replace after deploy

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Program initialized!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```
