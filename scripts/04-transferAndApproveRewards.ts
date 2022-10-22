import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { ethers, network } from "hardhat"
import { R0Kage, StakingRewards, ZeroKageMock } from "../typechain-types"
import { TOTAL_REWARDS } from "../constants"

// once a Staking Contract is created, this script funds the contract with r0Kage
// and approves spending that token

const transferAndApprove = async () => {
    const rewardsInWei = ethers.utils.parseEther(TOTAL_REWARDS)

    const accounts: SignerWithAddress[] = await ethers.getSigners()
    const rKageContract: R0Kage = await ethers.getContract("r0Kage", accounts[0].address)
    const stakingContract: StakingRewards = await ethers.getContract(
        "StakingRewards",
        accounts[0].address
    )
    // assign all tokens to Staking rewardds
    console.log("Transferring rewards to Staking contract")
    const transferTx = await rKageContract.transfer(stakingContract.address, rewardsInWei)
    await transferTx.wait(1)

    // give approval to StakingRewards contract to use r0Kage
    console.log("Giving permissions to Staking Rewards contract to use r0Kage reward tokens")
    const approveTx = await rKageContract.approve(stakingContract.address, rewardsInWei)
    await approveTx.wait(1)
}

transferAndApprove()
    .then(() => process.exit(0))
    .catch((e) => {
        console.log(e)
        process.exit(1)
    })
