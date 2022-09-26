import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains, networkConfig } from "../helper-hardhat-config"
import { verify } from "../utils/verify"

/**
 * @notice deployes rewards token rKage
 * @param hre hardhat environment
 */
const deploy0Kage = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, ethers, getNamedAccounts, network } = hre

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = (network.config.chainId || "31337").toString()
    const args = ["Reward 0Kage", "rKAGE", ethers.utils.parseEther("1000000")]

    log("Deploying rKAGE ERC20 token......")
    log("---------------------------")

    const deployTx = await deploy("ZeroKageERC20", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: networkConfig[chainId].blockConfirmations,
    })

    if (!developmentChains.includes(network.name)) {
        log("Verifying contract....")

        await verify(deployTx.address, args)
    }
}

export default deploy0Kage

deploy0Kage.tags = ["all", "0Kage"]
