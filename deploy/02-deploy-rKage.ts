import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains, networkConfig } from "../helper-hardhat-config"
import { verify } from "../utils/verify"
import { rKAGE_SUPPLY } from "../constants"

/**
 * @notice deployes rewards token rKage
 * @param hre hardhat environment
 */
const deployrKage = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, ethers, getNamedAccounts, network } = hre

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = (network.config.chainId || "31337").toString()
    const args = [ethers.utils.parseEther(rKAGE_SUPPLY)]

    log("Deploying rKAGE ERC20 token......")

    const deployTx = await deploy("r0Kage", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: networkConfig[chainId].blockConfirmations,
    })
    log("r0Kage deployed successfully")
    log("---------------------------")

    if (!developmentChains.includes(network.name)) {
        log("Verifying contract....")

        await verify(deployTx.address, args)
    }
}

export default deployrKage

deployrKage.tags = ["all", "rKage"]
