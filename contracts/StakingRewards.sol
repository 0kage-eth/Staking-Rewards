//SPDX-License-Identifier:MIT

pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract StakingRewards is Ownable {
    //************ Variables **************/
    IERC20 private immutable i_0Kage;
    IERC20 private immutable i_rKage;

    uint256 private s_totalRewards; // total reward allocated for distribution
    uint256 private s_duration; // duration is calculated in seconds
    uint256 private s_lastUpdate; // last timestamp when staking rewards were calculated

    mapping(address => uint256) private s_rewards; // rewards for a given user
    mapping(address => uint256) private s_balance; // staked balances per user
    mapping(address => uint256) private s_rewardsPaidPerUser; // rewards paid per user

    uint256 private s_totalSupply; // total supply of staked tokens
    uint256 private s_rewardsPerToken; // total rewards per token

    /**
     * ************ FORMULAS **********
     * rewardsPerToken (r) += rewardPerSecond * (current time - prev time) / totalSupply
     * rewards[user] += balance[user]*(r-rewardsPaidPerUser[user])
     * rewardsPaidPerUser[user]= rewardsPerToken
     * totalSupply += stakedAmount (-= unStakedAmount)
     * balance[user] += stakedAmount (-= unStakedAmount)
     * prevTime = currentTime
     */

    //*************** Modifiers ************/

    //*************** Events ***************/
    event Stake(address staker, uint256 amount);
    event Unstake(address staker, uint256 amount);
    event RewardDistributed(address staker, uint256 reward);

    //*************** Constructor **********/

    /**
     * @param zeroKage zero Kage token address
     * @param rKage reward Kage token address
     * @param duration total duration in seconds for which rewards will be paid
     * @param totalReward total reward amount to be paid over duration
     */
    constructor(
        address zeroKage,
        address rKage,
        uint256 duration,
        uint256 totalReward
    ) {
        // initializing 0Kage and rKage Interfaces
        i_0Kage = IERC20(zeroKage);
        i_rKage = IERC20(rKage);
        s_duration = duration;
        s_totalRewards = totalReward;
        s_lastUpdate = block.timestamp;
    }

    //*************** Mutative functions **********/

    /**
     * @notice function that manages staked 0Kage & keeps track of rKage rewards
     * @param stakeAmount amount of 0Kage tokens that will be staked into the contract
     * @dev every time there is a stake, user balances and rewards are recalculated
     */
    function stake(uint256 stakeAmount) public payable {
        require(stakeAmount > 0, "Stake Amount must be >0");
        require(stakeAmount <= userStakedTokenBalance(), "Cannot stake more than your balance");

        // first calculate rewards from prev time to current time
        calculateStakes();

        // withdraw balance from staker
        bool success = i_0Kage.transferFrom(msg.sender, address(this), stakeAmount);
        require(success, "Failed to transfer tokens to staking contract");

        // next, update total supply and balance for user
        s_totalSupply += stakeAmount;
        s_balance[msg.sender] += stakeAmount;

        // at the end update time
        updateTime();

        emit Stake(msg.sender, stakeAmount);
    }

    /**
     * @notice function manages unstaking of balance -> freezes rewards on amount unstake
     * @param unStakeAmount amount of 0Kage that will be unstaked from contract
     */
    function unstake(uint256 unStakeAmount) public {
        require(unStakeAmount > 0, "Stake Amount withdrawal must be >0");
        require(
            unStakeAmount <= s_balance[msg.sender],
            "Amount to be unstaked exceeds your staked balance"
        );

        console.log("calculating stakes at unstaking point");
        // first calculate rewards from prev time to current time
        calculateStakes();

        // transfer balance back to staker
        bool success = i_0Kage.transfer(msg.sender, unStakeAmount);
        require(success, "Failed to seend tokens back to staker");

        // next, update total supply and balance for user
        s_totalSupply -= unStakeAmount;
        s_balance[msg.sender] -= unStakeAmount;

        // at the end update time
        updateTime();

        emit Unstake(msg.sender, unStakeAmount);
    }

    /**
     * @notice main function that calculates rewards for a given user
     * @notice gets executed every time user stakes or unstakes
     */
    function calculateStakes() private {
        // first update rewards per token
        updateRewardsPerToken();

        // then we update rewards from last time stamp to current
        // for the given user who staked
        updateReward();

        // update rewards paid per user with rewards per token
        s_rewardsPaidPerUser[msg.sender] = s_rewardsPerToken;
    }

    function updateReward() private {
        s_rewards[msg.sender] +=
            (s_balance[msg.sender] * (s_rewardsPerToken - s_rewardsPaidPerUser[msg.sender])) /
            s_duration;
    }

    function updateRewardsPerToken() private {
        s_rewardsPerToken += s_totalSupply == 0
            ? 0
            : (s_totalRewards * (block.timestamp - s_lastUpdate)) / s_totalSupply;
    }

    function updateTime() private {
        s_lastUpdate = block.timestamp;
    }

    function distributeReward() public {
        uint256 userReward = s_rewards[msg.sender];
        s_rewards[msg.sender] = 0;

        console.log("user reward", userReward);
        console.log("pool balance before transfer", i_rKage.balanceOf(address(this)));
        bool success = i_rKage.transfer(msg.sender, userReward);
        require(success, "Reward token transfer failed");
        console.log("pool balance after transfer", i_rKage.balanceOf(address(this)));

        emit RewardDistributed(msg.sender, userReward);
    }

    function setDuration(uint256 duration) public onlyOwner {
        s_duration = duration;
    }

    //*************** View functions **********/

    function userStakedTokenBalance() private view returns (uint256) {
        return i_0Kage.balanceOf(msg.sender);
    }

    function userRewardTokenBalance() private view returns (uint256) {
        return i_rKage.balanceOf(msg.sender);
    }

    function getLastUpdate() public view returns (uint256) {
        return s_lastUpdate;
    }

    function getDuration() public view returns (uint256) {
        return s_duration;
    }

    function getRewardAmount() public view returns (uint256) {
        return s_totalRewards;
    }

    function getStakerReward(address staker) public view returns (uint256) {
        return s_rewards[staker];
    }

    /**
     * @notice this function returns accrued rewards assuming user unstakes right now
     * @notice until a staker unstakes, user will not be able to redeem rewards
     * @notice this function calculates only accrued rewards that will become redeemable
     * @notice once user unstakes
     */
    function getStakerAccruedRewards() public view returns (uint256 accruedRewards) {
        uint256 rewardsPerToken = s_rewardsPerToken +
            (
                s_totalSupply == 0
                    ? 0
                    : (s_totalRewards * (block.timestamp - s_lastUpdate)) / s_totalSupply
            );

        accruedRewards =
            s_rewards[msg.sender] +
            (s_balance[msg.sender] * (rewardsPerToken - s_rewardsPaidPerUser[msg.sender])) /
            s_duration;
    }

    function getStakingBalance(address staker) public view returns (uint256) {
        return s_balance[staker];
    }

    function getTotalStakingSupply() public view returns (uint256) {
        return s_totalSupply;
    }

    function getZeroKageAddress() public view returns (address) {
        return address(i_0Kage);
    }

    function getrKageAddress() public view returns (address) {
        return address(i_rKage);
    }
}
