import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains, networkConfig } from "../helper-hardhat-config"
import { verify } from "../utils/verify"
import { GOERLI_ZEROKAGE_ADDRESS, TOTAL_REWARDS, REWARDS_PERIOD } from "../constants"

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
    const rKageContract = await ethers.getContract("r0Kage")
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
}

export default deployStaking

deployStaking.tags = ["all", "Staking"]
