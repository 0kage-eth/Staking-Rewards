import { ethers, network, getNamedAccounts, deployments } from "hardhat"
import { developmentChains, networkConfig } from "../../helper-hardhat-config"
import { expect, assert } from "chai"
import { R0Kage, StakingRewards, ZeroKageMock } from "../../typechain-types"
import { TOTAL_REWARDS } from "../../constants"
import { BigNumber, Signer } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { shiftTimeWithoutMiningBlock } from "../../utils/shiftTime"
import { moveBlocks } from "../../utils/moveBlocks"

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Staking Contract Unit Tests", () => {
          let stakingContract: StakingRewards
          let zKageContract: ZeroKageMock
          let rKageContract: R0Kage
          let creationBlock
          let creationTime: number

          let staker1: SignerWithAddress
          let staker2: SignerWithAddress

          let stakeAmount: BigNumber
          let transferAmount: BigNumber

          beforeEach(async () => {
              const { deployer } = await getNamedAccounts()
              const accounts = await ethers.getSigners()
              staker1 = accounts[1] // non-deployer account we use for testing staking logic
              staker2 = accounts[2] // non-deployer account we use for testing staking logic
              const allContracts = await deployments.fixture(["all"])
              creationBlock = allContracts["StakingRewards"].receipt?.blockHash || ""
              creationTime = (await ethers.provider.getBlock(creationBlock)).timestamp

              stakingContract = await ethers.getContract("StakingRewards", deployer)
              zKageContract = await ethers.getContract("ZeroKageMock", deployer)
              rKageContract = await ethers.getContract("r0Kage", deployer)

              transferAmount = ethers.utils.parseEther("1000")
              stakeAmount = ethers.utils.parseEther("100")
          })

          describe("Constructor tests", () => {
              it("check initial values", async () => {
                  const rkageAddress = await stakingContract.getrKageAddress()
                  const zKageAddress = await stakingContract.getZeroKageAddress()
                  const lastUpdate = await stakingContract.getLastUpdate()
                  const duration = await stakingContract.getDuration()
                  const reward = await stakingContract.getRewardAmount()

                  expect(rkageAddress).equals(
                      rKageContract.address,
                      "rKage address in contract should match"
                  )

                  expect(zKageAddress).equals(
                      zKageContract.address,
                      "zKage address in contract should match"
                  )
                  expect(lastUpdate.toString()).equals(
                      creationTime.toString(),
                      "block creation time should match"
                  )

                  expect(ethers.utils.formatEther(reward)).equals(TOTAL_REWARDS.toString())
              })
          })

          describe("Stake tests", async () => {
              let stakingTime: number
              beforeEach(async () => {
                  // start with a staker 1 account
                  // transfer 10k 0Kage tokens to staker 1 (from deployer to staker 1)
                  const transferTx = await zKageContract.transfer(staker1.address, transferAmount)
                  await transferTx.wait(1)

                  // approve usage of 1000 0Kage tokens for staking rewards contract
                  const approveTx = await zKageContract
                      .connect(staker1)
                      .approve(stakingContract.address, transferAmount)

                  // shift 100 seconds of blockchain & moves chain by 1 block
                  shiftTimeWithoutMiningBlock(100)

                  // Connect Staker1 & stake 100 0Kage
                  const stakeTx = await stakingContract.connect(staker1).stake(stakeAmount)
                  const stakeReceipt = await stakeTx.wait(1)
                  stakingTime = (await ethers.provider.getBlock(stakeReceipt.blockHash)).timestamp
                  // Move another 100 seconds
                  shiftTimeWithoutMiningBlock(100)

                  // So currently our unit tests are being run 100 seconds after staker 1 has
                  // deposited 100 0Kage tokens
              })

              it("check total staked", async () => {
                  const totalStaked = await stakingContract.getTotalStakingSupply()
                  expect(totalStaked.toString()).equals(
                      stakeAmount.toString(),
                      "Total stake amount == staker1 stake"
                  )
              })

              it("check staked amount of staker 1", async () => {
                  const staker1StakeBalance = await stakingContract.getStakingBalance(
                      staker1.address
                  )

                  expect(staker1StakeBalance.toString()).equals(
                      stakeAmount.toString(),
                      "staker 1 balance == amount staked by user"
                  )
              })

              it("check last update time after staking ", async () => {
                  const lastUpdateTime = await stakingContract.getLastUpdate()
                  expect(lastUpdateTime.toString()).equals(
                      stakingTime.toString(),
                      "Last update = staker 1 staking time"
                  )
              })

              it("check reward for staker 1", async () => {
                  // reward for staker 1 is calculated as of last update time
                  // since this time matches with staker 1 staking => reward = 0

                  const staker1Reward = await stakingContract.getStakerReward(staker1.address)

                  expect(staker1Reward).equals(0, "staker 1 reward as on last update time == 0")
              })
          })

          describe("Unstake tests", async () => {
              let stakingTime: number
              let unStakingTime: number

              beforeEach(async () => {
                  // transfer 10k 0Kage tokens to staker 1
                  const transferTx = await zKageContract.transfer(staker1.address, transferAmount)
                  await transferTx.wait(1)

                  // approve usage of 1000 0Kage tokens for staking
                  const approveTx = await zKageContract
                      .connect(staker1)
                      .approve(stakingContract.address, stakeAmount)
                  await approveTx.wait(1)

                  // shift 100 seconds of blockchain
                  await shiftTimeWithoutMiningBlock(100)

                  // Staker 1 stakes 100 0Kage
                  const stakeTx = await stakingContract.connect(staker1).stake(stakeAmount)
                  const stakeReceipt = await stakeTx.wait(1)

                  stakingTime = (await ethers.provider.getBlock(stakeReceipt.blockHash)).timestamp

                  // shift 99 seconds of blockchain - why 99, explained below...
                  await shiftTimeWithoutMiningBlock(99)

                  // Staker 1 unstakes 100 0Kage
                  // note that while waiting 1 second is added to chain (default)
                  // in order to get exact 100, I shifted by 99 seconds above
                  const unstakeTx = await stakingContract.connect(staker1).unstake(stakeAmount)
                  const unstakeReceipt = await unstakeTx.wait(1)

                  unStakingTime = (await ethers.provider.getBlock(unstakeReceipt.blockHash))
                      .timestamp

                  // Shift another 100 seconds
                  await shiftTimeWithoutMiningBlock(100)

                  // So we are entering tests with following setting
                  // - staked 100 0Kage
                  // - after 100 seconds unstaked 100 0Kage
                  // - wait for 100 more seconds
              })

              it("check total supply after unstaking", async () => {
                  // at this point, balance in stake contract should be 0
                  const totalSupply = await stakingContract.getTotalStakingSupply()
                  expect(totalSupply).equals(0, "No balance in staking contract")
              })
              it("check last update time after unstaking", async () => {
                  const lastUpdateTime = await stakingContract.getLastUpdate()
                  expect(lastUpdateTime).equals(
                      unStakingTime,
                      "Unstaking time should be last update"
                  )
              })

              it("check balance of staker after unstaking", async () => {
                  const stakerBalance = await stakingContract.getStakingBalance(staker1.address)
                  expect(stakerBalance).equals(0, "No balance against staker 1 after unstaking")
              })

              it("check rewards of staker after unstaking", async () => {
                  const rewards = await stakingContract.getStakerReward(staker1.address)
                  console.log("timeGap", unStakingTime - stakingTime)
                  const expectedReward = ethers.utils.parseEther("0.792744799594115")

                  // Reward calculation is shared here
                  // https://docs.google.com/spreadsheets/d/16ZJXNlzb1l0tKiUDbVhNFI3tTf3rnWJPq0iUU2K1L98/edit?usp=sharing
                  // took only 14 decimals as spreadsheets have rounding error
                  expect(rewards.toString().substring(0, 14)).equals(
                      expectedReward.toString().substring(0, 14),
                      "Reward should be as per calculation"
                  )
              })
          })

          describe("Distrubute Reward tests", async () => {
              let rewardBeforeWithdraw = BigNumber.from("0")
              let rewardAfterWithdraw = BigNumber.from("0")

              let poolRewardsBeforeWithdraw = BigNumber.from("0")
              let poolRewardsAfterWithdraw = BigNumber.from("0")
              transferAmount = ethers.utils.parseEther("500")
              stakeAmount = ethers.utils.parseEther("100")
              beforeEach(async () => {
                  // staker1 is transfered 1000 0Kage
                  const transferTx = await zKageContract.transfer(staker1.address, transferAmount)
                  await transferTx.wait(1)

                  // approve staking contract to use staker1 tokens
                  const approveTx = await zKageContract
                      .connect(staker1)
                      .approve(stakingContract.address, stakeAmount)
                  await transferTx.wait(1)

                  // staker 1 stakes at 100 seconds for 100 0Kage
                  const stakeTx = await stakingContract.connect(staker1).stake(stakeAmount)
                  await stakeTx.wait(1)

                  // 99 seconds pass
                  shiftTimeWithoutMiningBlock(99)

                  // staker 1 unstakes 100 0Kage
                  const unstakeTx = await stakingContract.connect(staker1).unstake(stakeAmount)
                  // 1 more second is added on wait
                  await unstakeTx.wait(1)
                  poolRewardsBeforeWithdraw = await rKageContract.balanceOf(stakingContract.address)
                  // staker 1 withdraws reward
                  const withdrawRewardTx = await stakingContract.connect(staker1).distributeReward()
                  await withdrawRewardTx.wait(1)
                  poolRewardsAfterWithdraw = await rKageContract.balanceOf(stakingContract.address)
              })

              it("Check 0Kage/rKage in staker 1 account after first withdrawal", async () => {
                  const rkageBalance = await rKageContract.balanceOf(staker1.address)
                  // calculated Balance -> again refer to calculations in
                  // https://docs.google.com/spreadsheets/d/16ZJXNlzb1l0tKiUDbVhNFI3tTf3rnWJPq0iUU2K1L98/edit?usp=sharing
                  const calculatedBalance = ethers.utils.parseEther("0.7927447995941146")

                  expect(rkageBalance.toString().substring(0, 15)).equals(
                      calculatedBalance.toString().substring(0, 15),
                      "r0Kage balance should match with calculated balance"
                  )

                  const zKageBalance = await zKageContract.balanceOf(staker1.address)
                  expect(zKageBalance).equals(
                      transferAmount,
                      "staker wallet should get back original balance it started before staking"
                  )
              })

              it("Check 0Kage balance in staking contract after first withdrawal", async () => {
                  const calculatedBalance = ethers.utils.parseEther("0.7927447995941146")
                  expect(
                      poolRewardsBeforeWithdraw
                          .sub(poolRewardsAfterWithdraw)
                          .toString()
                          .substring(0, 15)
                  ).equals(
                      calculatedBalance.toString().substring(0, 15),
                      "Diff in pool balance should be equal to rewards transffered to staker1"
                  )
              })
          })

          describe("Event emissions", async () => {
              beforeEach(async () => {
                  // fund staker 1 with 1000 0KAGE
                  const transferTx = await zKageContract.transfer(
                      staker1.address,
                      ethers.utils.parseEther("1000")
                  )
                  transferTx.wait(1)
                  // give approval to stake with staking rewards contract
                  const arpproveTx = await zKageContract
                      .connect(staker1)
                      .approve(stakingContract.address, ethers.utils.parseEther("1000"))
                  arpproveTx.wait(1)

                  // transfer 250k rKage tokens to stakingContract
                  //   const rewards = ethers.utils.parseEther("250000")
                  //   const transferRewardsTx = await rKageContract.transfer(
                  //       stakingContract.address,
                  //       rewards
                  //   )
                  //   await transferRewardsTx.wait(1)

                  // give approval to spend
                  //   const approveRewardsTx = await rKageContract.approve(
                  //       stakingContract.address,
                  //       rewards
                  //   )
              })

              it("stake event emitted", async () => {
                  const stakeAmount = ethers.utils.parseEther("500")
                  // staker 1 stakes 500 0Kage
                  await expect(stakingContract.connect(staker1).stake(stakeAmount))
                      .to.emit(stakingContract, "Stake")
                      .withArgs(staker1.address, stakeAmount)
              })

              it("unstake event emitted", async () => {
                  const stakeAmount = ethers.utils.parseEther("500")
                  // staker 1 stakes 500 0Kage
                  const stakeTx = await stakingContract.connect(staker1).stake(stakeAmount)
                  await stakeTx.wait(1)

                  await shiftTimeWithoutMiningBlock(300)

                  await expect(stakingContract.connect(staker1).unstake(stakeAmount))
                      .to.emit(stakingContract, "Unstake")
                      .withArgs(staker1.address, stakeAmount)
              })

              it("rewards paid event emitted staking", async () => {
                  const stakeAmount = ethers.utils.parseEther("100")
                  // staker 1 stakes 500 0Kage
                  const stakeTx = await stakingContract.connect(staker1).stake(stakeAmount)
                  await stakeTx.wait(1)

                  await shiftTimeWithoutMiningBlock(99)

                  const unstakeTx = await stakingContract.connect(staker1).unstake(stakeAmount)
                  await unstakeTx.wait(1)

                  await shiftTimeWithoutMiningBlock(300)
                  const calculatedBalance = ethers.utils.parseEther("0.792744799594114662")

                  await expect(stakingContract.connect(staker1).distributeReward())
                      .to.emit(stakingContract, "RewardDistributed")
                      .withArgs(staker1.address, calculatedBalance)
              })
          })

          describe("Error handling", async () => {
              beforeEach(async () => {
                  // fund staker 1 with 1000 0KAGE
                  const transferTx = await zKageContract.transfer(
                      staker1.address,
                      ethers.utils.parseEther("1000")
                  )
                  transferTx.wait(1)
                  // give approval to stake with staking rewards contract
                  const arpproveTx = await zKageContract
                      .connect(staker1)
                      .approve(stakingContract.address, ethers.utils.parseEther("1000"))
                  arpproveTx.wait(1)

                  //   // transfer 250k rKage tokens to stakingContract
                  //   const rewards = ethers.utils.parseEther("250000")
                  //   const transferRewardsTx = await rKageContract.transfer(
                  //       stakingContract.address,
                  //       rewards
                  //   )
                  //   await transferRewardsTx.wait(1)

                  //   // give approval to spend
                  //   const approveRewardsTx = await rKageContract.approve(
                  //       stakingContract.address,
                  //       rewards
                  //   )
              })

              it("Add stake amount > 0Kage balance", async () => {
                  const stakeAmount = ethers.utils.parseEther("1200")
                  // staker 1 stakes 1200 0Kage -> but only has 1000
                  await expect(
                      stakingContract.connect(staker1).stake(stakeAmount)
                  ).to.be.revertedWith("Cannot stake more than your balance")
              })

              it("Unstake amount > existing stake balance", async () => {
                  const stakeAmount = ethers.utils.parseEther("500")
                  const unstakeAmount = ethers.utils.parseEther("800")
                  // staker 1 stakes 500 0Kage
                  const stakeTx = await stakingContract.connect(staker1).stake(stakeAmount)
                  await stakeTx.wait(1)

                  await shiftTimeWithoutMiningBlock(300)

                  await expect(
                      stakingContract.connect(staker1).unstake(unstakeAmount)
                  ).to.be.revertedWith("Amount to unstake exceeds your staked balance")
              })
          })
      })
