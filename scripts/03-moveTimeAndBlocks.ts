import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { ethers, network } from "hardhat"
import { R0Kage, StakingRewards, ZeroKageMock } from "../typechain-types"
import { moveBlocks } from "../utils/moveBlocks"
import { shiftTimeWithoutMiningBlock } from "../utils/shiftTime"

const main = async (numBlocks: number, numSecs: number) => {
    await moveBlocks(numBlocks)

    await shiftTimeWithoutMiningBlock(numSecs)
}

main(50, 100)
    .then(() => process.exit(0))
    .catch((e) => {
        console.log(e)
        process.exit(1)
    })
