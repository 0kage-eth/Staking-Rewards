import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains, networkConfig } from "../helper-hardhat-config"
import { verify } from "../utils/verify"
import { GOERLI_ZEROKAGE_ADDRESS, TOTAL_REWARDS, REWARDS_PERIOD } from "../constants"
import { R0Kage } from "../typechain-types"

const deployStaking = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, ethers, getNamedAccounts, network } = hre

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = (network.config.chainId || "31337").toString()
    let zKageAddress
    let rKageAddress

    if (developmentChains.includes(network.name)) {
        log("Development chain detected.. ")
        log("getting ZeroKage mock address")
        const zKageContract = await ethers.getContract("ZeroKageMock")
        zKageAddress = zKageContract.address
    } else {
        zKageAddress = GOERLI_ZEROKAGE_ADDRESS
    }

    // get rKage address -> need to deploy rKage contract before deploying staking contract
    const rKageContract: R0Kage = await ethers.getContract("r0Kage")
    rKageAddress = rKageContract.address

    log("Deploying Staking Contract...")
    const rewardsInWei = ethers.utils.parseEther(TOTAL_REWARDS)
    const args = [zKageAddress, rKageAddress, REWARDS_PERIOD, rewardsInWei]

    const deployTx = await deploy("StakingRewards", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: networkConfig[chainId].blockConfirmations,
    })

    log("---------------------------")

    if (!developmentChains.includes(network.name)) {
        log("Verifying Stakinng contract....")
        await verify(deployTx.address, args)
    }

    // assign all tokens to Staking rewardds
    log("Transferring rewards to Staking contract")
    const transferTx = await rKageContract.transfer(deployTx.address, rewardsInWei)
    await transferTx.wait(1)

    // give approval to StakingRewards contract to use r0Kage
    log("Giving permissions to Staking Rewards contract to use r0Kage reward tokens")
    const approveTx = await rKageContract.approve(deployTx.address, rewardsInWei)
    await approveTx.wait(1)
}

export default deployStaking

deployStaking.tags = ["all", "Staking"]
