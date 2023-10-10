# light-client-relayer

This is a basic relayer for applying updates to the [axelar-light-client](https://github.com/commonprefix/axelar-light-client).

## Setup

Copy `.env.template` to `.env` and populate it with your mnemonic, beacon api url and contract address.

## Run

```
➜  relayer git:(main) ✗ ts-node src/index.ts
Current contract period 865
Fetching update for period 866
Applying update for period 866
Update applied for period 866 with gas: 11614002 uwasm
Current contract period after update 866
```
