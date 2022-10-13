import { HardhatRuntimeEnvironment } from "hardhat/types"
import { networkConfig } from "../helper-hardhat-config"
import { zKAGE_MOCK_SUPPLY } from "../constants"

const deploy0Kage = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, ethers, getNamedAccounts, network } = hre
    const chainId = network.config.chainId || 31337

    if (chainId == 31337) {
        const { deploy, log } = deployments
        const { deployer } = await getNamedAccounts()

        log("Local chain detected....")
        log("Deploying ZeroKage Mock token......")

        const args = [ethers.utils.parseEther(zKAGE_MOCK_SUPPLY)]
        const deployTx = await deploy("ZeroKageMock", {
            from: deployer,
            log: true,
            args: args,
            waitConfirmations: networkConfig[chainId].blockConfirmations,
        })

        log("---------------------------")
    }
}

export default deploy0Kage

deploy0Kage.tags = ["all", "0Kage"]
