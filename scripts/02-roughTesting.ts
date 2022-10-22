/**
 * @notice Run all kinds of tests here
 */

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { ethers, network } from "hardhat"
import { R0Kage, StakingRewards, ZeroKageMock } from "../typechain-types"
import { TOTAL_REWARDS } from "../constants"

const myAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

const main = async () => {
    const rewardsInWei = ethers.utils.parseEther(TOTAL_REWARDS)
    const accounts: SignerWithAddress[] = await ethers.getSigners()
    const zKageContract: ZeroKageMock = await ethers.getContract(
        "ZeroKageMock",
        accounts[0].address
    )
    const rKageContract: R0Kage = await ethers.getContract("r0Kage", accounts[0].address)
    const stakingContract: StakingRewards = await ethers.getContract(
        "StakingRewards",
        accounts[0].address
    )

    const account0Balance = await zKageContract.balanceOf(accounts[0].address)

    console.log("account 0 balance = ", ethers.utils.formatEther(account0Balance))

    const stakingContractBalance = await zKageContract.balanceOf(stakingContract.address)
    console.log("staking contract balance", ethers.utils.formatEther(stakingContractBalance))

    const rewardsInStakingContractBalance = await rKageContract.balanceOf(stakingContract.address)
    console.log(
        "rewards balance in staking contract",
        ethers.utils.formatEther(rewardsInStakingContractBalance)
    )

    const myAccountRewards = await rKageContract.balanceOf(myAddress)
    console.log("rewards in my account", ethers.utils.formatEther(myAccountRewards))
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.log(e)
        process.exit(1)
    })
