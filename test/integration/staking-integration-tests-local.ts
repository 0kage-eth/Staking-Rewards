// import { ethers, network, getNamedAccounts, deployments } from "hardhat"
// import { developmentChains, networkConfig } from "../../helper-hardhat-config"
// import { expect, assert } from "chai"
// import { R0Kage, StakingRewards, ZeroKageMock } from "../../typechain-types"
// import { TOTAL_REWARDS } from "../../constants"
// import { Signer } from "ethers"

// !developmentChains.includes(network.name)
//     ? describe.skip
//     : describe("Staking Contract Unit Tests", () => {
//           let stakingContract: StakingRewards
//           let zKageContract: ZeroKageMock
//           let rKageContract: R0Kage
//           let creationBlock
//           let creationTime: number

//           let staker1: Signer
//           let staker2: Signer

//           beforeEach(async () => {
//               const { deployer } = await getNamedAccounts()
//               const accounts = await ethers.getSigners()
//               staker1 = accounts[1] // non-deployer account we use for testing staking logic
//               staker2 = accounts[2] // non-deployer account we use for testing staking logic
//               const allContracts = await deployments.fixture(["all"])
//               creationBlock = allContracts["StakingRewards"].receipt?.blockHash || ""
//               creationTime = (await ethers.provider.getBlock(creationBlock)).timestamp

//               stakingContract = await ethers.getContract("StakingRewards", deployer)
//               zKageContract = await ethers.getContract("ZeroKageMock", deployer)
//               rKageContract = await ethers.getContract("r0Kage", deployer)
//           })

//           describe("Constructor tests", () => {
//               it("check initial values", async () => {
//                   const rkageAddress = await stakingContract.getrKageAddress()
//                   const zKageAddress = await stakingContract.getZeroKageAddress()
//                   const lastUpdate = await stakingContract.getLastUpdate()
//                   const duration = await stakingContract.getDuration()
//                   const reward = await stakingContract.getRewardAmount()

//                   expect(rkageAddress).equals(
//                       rKageContract.address,
//                       "rKage address in contract should match"
//                   )

//                   expect(zKageAddress).equals(
//                       zKageContract.address,
//                       "zKage address in contract should match"
//                   )
//                   expect(lastUpdate.toString()).equals(
//                       creationTime.toString(),
//                       "block creation time should match"
//                   )

//                   expect(ethers.utils.formatEther(reward)).equals(TOTAL_REWARDS.toString())
//               })
//           })

//           describe("Stake tests - single staker", async () => {
//               beforeEach(async () => {
//                   // start with a staker 1 account
//                   // transfer 10k 0Kage tokens to staker 1 (from deployer to staker 1)
//                   // approve usage of 1000 0Kage tokens for staking rewards contract
//                   // shift 100 seconds of blockchain
//                   // Staker 1 stakes 100 0Kage
//               })

//               it("check total staked", async () => {})

//               it("check staked amount of staker 1", async () => {})

//               it("check last update time ", async () => {})

//               it("check reward for staker 1", async () => {})
//           })

//           describe("Stake tests - 2 stakers", () => {
//               beforeEach(async () => {
//                   // transfer 10k 0Kage tokens to staker 1 and staker2 (from deployer to staker 1/2)
//                   // approve usage of 1000 0Kage tokens for staking rewards contract for staker1/ staker2
//                   // shift 100 seconds of blockchain
//                   // Staker 1 stakes 100 0Kage
//                   // shift 100 seconds of blockchain
//                   // Staker 2 stakes 200 0Kage
//               })

//               it("check total supply", async () => {})

//               it("check inidividual supply", async () => {})

//               it("check update time", async () => {})

//               it("check reward for each user", async () => {})
//           })

//           describe("Unstake tests for 2 users", async () => {
//               beforeEach(async () => {
//                   // transfer 10k 0Kage tokens to staker 1 and staker2 (from deployer to staker 1/2)
//                   // approve usage of 1000 0Kage tokens for staking rewards contract for staker1/ staker2
//                   // shift 100 seconds of blockchain
//                   // Staker 1 stakes 100 0Kage
//                   // shift 100 seconds of blockchain
//                   // Staker 2 stakes 200 0Kage
//                   // Shift 200 seconds of blockchain
//                   // Staker 1 unstakes 100 0Kage
//                   // Shift 200 seconds
//                   // Staker 2 unstakes 100 0Kage
//                   // Shift 100 seconds
//                   //Staker 2 unstakes 100 0Kage
//               })

//               it("check total supply", async () => {})

//               it("check balance of both stakers", async () => {})

//               it("check rewards of both users", async () => {})

//               it("check last update time", async () => {})
//           })

//           describe("Distrubute Reward tests", async () => {
//               beforeEach(async () => {
//                   // staker 1 stakes at 100 seconds for 500 0Kage
//                   // 300 seconds pass
//                   // staker 1 unstakes 200 0Kage
//                   // staker 1 withdraws reward
//                   // 300 seconds pass
//                   // staker 1 unstakes 300 0KAGE
//                   // staker 1 withdraws reward
//               })

//               it("Check 0Kage/rKage in staker 1 account after first withdrawal", async () => {})

//               it("Check 0Kage balance in rewards contract after first withdrawal", async () => {})
//           })

//           describe("Event emissions", async () => {
//               beforeEach(async () => {
//                   // staker 1 stakes at 100 seconds for 500 0Kage
//                   // 300 seconds pass
//                   // staker 1 unstakes 500 0Kage
//                   // 300 seconds pass
//                   // staker 1 withdraws 500 0KAGE and reward
//               })

//               it("stake event emitted", async () => {})

//               it("unstake event emitted", async () => {})

//               it("")
//           })
//       })
