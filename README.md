# STAKING CONTRACT

## Summary

Replicated staking contract as per logic of [smartcontract engineer](https://www.youtube.com/watch?v=32n3Vu0BK4g). Purpose of this contract is to build a rewards program for users who stake the protocol native token (0KAGE). This contract calculates proportionate rewards for every user & allows users to freely stake and unstake full/partial balance of 0Kage tokens. Contract is inspired from Synthetix staking rewards contract

1. Users stake 0KAGE tokens and get rKAGE tokens (both ERC20)
2. Total of 250,000 rKAGE tokens would be issued as rewards over 12 months
3. On unstaking, users get back their 0KAGE tokens and proportionate rKAGE tokens, as per their ownership in pool
4. Rewards are calculated every second

----

## Contracts

Created 2 contracts in this project

 - [r0Kage.sol](./contracts//r0Kage.sol) is a ERC20 implementation of rewards token granted to 0Kage stakers

 - [StakingRewards.sol](./contracts/StakingRewards.sol) is a generic staking contract implementation. Key functions in this contract are
    - Stake
    - Unstake
    - DistributeRewards

---

## Deploy
IF you are deploying in local environment, an additional [ZeroKageMock.sol](./contracts/test/ZeroKageMock.sol) will be deployed. This is a mock implementation of native 0Kage contract. For deployment in goerli, contract address defined in [constants.ts](./constants.ts) is used.

To deploy all contracts, use following command

```
    $ yarn hardhat deploy --network <networkname> 
```
You can use tags, to deploy only specific contract. For example, if you only want to deploy staking contract, use

```
    $ yarn hardhat deploy --network <networkname> --tags "staking"
```

---

## Testing

Unit tests are available [here](./test/unit/staking-unit-tests.ts). You can check if all tests are running by command

```
$ yarn hardhart test
```

To run a specific test with name `xyz`, use command

```
$ yarn hardhat test --grep "xyz"
```

Integration tests are not complete. Feel free to complete and raise a PR

---

## Scripts

I've added some custom scripts that will help in deployment and testing purposes

- [01-publishToFrontEnd](./scripts/01-publisToFrontEnd.ts) exports all contract abis and addresses to a designated folder -> will be useful if you are building a front end application

- [02-roughTesting](./scripts/02-roughTesting.ts) general calls on StakingContract for basic sanity checks (note that this is not intended to replace unit/integration testing)

- [03-moveTimeAndBlocks.ts](./scripts/03-moveTimeAndBlocks.ts) is a utility script to shift blocks or move time to verify staking calculations. Needless to say, this works only on local chain

- [04-transferAndApproveRewards.ts](./scripts/04-transferAndApproveRewards.ts) is a script that can transfer rewards to staking contract and approve their usage by staking contract

---

## Other pointers

- Contract addresses on Goerli
    - 0Kage (0Kage token) - 0x7b6AB22C716cBb0Ad71Bb5202055402B627c486a
    - r0Kage (rewards Kage token) - 0x88DD0e5ce0996F07BE0C9001FA37d5321bAf52d0
    - Staking Rewards - 0x1D72cecf5e9F9940D3a5C0C61BaA2d79B7E74d23

- Have your own .env file & make sure its not exposed. Sample .env.example file attached for your reference

- Front end only works on Goerli or Localhost network - Make sure you are one of them. You can access my front end at


- Last but not least, any bugs/issues/suggestions -> please leave comments or drop a mail at 0kage.eth@gmail.com



