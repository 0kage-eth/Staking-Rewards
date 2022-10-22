//SPDX-License-Identifier:MIT

pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// import "hardhat/console.sol";

// Contract developed by 0Kage (https://github.com/0kage-eth/Staking-Rewards)

/**
 * @notice Staking Rewards contract - for logic and details, refer to https://www.youtube.com/watch?v=32n3Vu0BK4g
 * @notice this contract allows users to stake 0Kage and win r0Kage - rewards 0Kage whose emission rate is pre-decided
 * @dev multiple people can stake into this contract, contract will issue r0Kage proportional to each individual's contribution
 */

contract StakingRewards is Ownable, ReentrancyGuard {
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

    //*************** MUTATIVE FUNCTIONS **********/

    /**
     * @notice function that helps users stake 0Kage & keeps track of rKage rewards
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

        // emit Stake event
        emit Stake(msg.sender, stakeAmount);
    }

    /**
     * @notice function manages unstaking of balance -> freezes rewards on amount unstaked
     * @param unStakeAmount amount of 0Kage that will be unstaked from contract
     */
    function unstake(uint256 unStakeAmount) public {
        require(unStakeAmount > 0, "Stake Amount withdrawal must be >0");
        require(
            unStakeAmount <= s_balance[msg.sender],
            "Amount to unstake exceeds your staked balance"
        );

        // first calculate rewards from prev time snapshot to current time snapshot
        // snapshot is taken at every significant event - either staking or unstaking is considered significant
        calculateStakes();

        // transfer balance back to staker
        bool success = i_0Kage.transfer(msg.sender, unStakeAmount);
        require(success, "Failed to seend tokens back to staker");

        // next, update total supply and balance for user
        // total supply reduces by total amount -> same applies for balance of current user
        s_totalSupply -= unStakeAmount;
        s_balance[msg.sender] -= unStakeAmount;

        // at the end update last timestamp (snapshot at previous significant event)
        updateTime();

        // emit Unstake event
        emit Unstake(msg.sender, unStakeAmount);
    }

    /**
     * @notice main function that calculates rewards for a given user
     * @notice gets executed every time user stakes or unstakes
     */
    function calculateStakes() private {
        // first update rewards per token
        // rewardsPerToken (r) += rewardPerSecond * (current time - prev time) / totalSupply
        updateRewardsPerToken();

        // then we update rewards from last time stamp to current
        // for the given user who staked
        // rewards[user] += balance[user]*(r-rewardsPaidPerUser[user])
        updateReward();

        // update rewards paid per user with rewards per token
        s_rewardsPaidPerUser[msg.sender] = s_rewardsPerToken;
    }

    // Helper function that internally updates reward for a staker
    function updateReward() private {
        s_rewards[msg.sender] +=
            (s_balance[msg.sender] * (s_rewardsPerToken - s_rewardsPaidPerUser[msg.sender])) /
            s_duration;
    }

    // Helper function that updates rewards per token -> kind of reward emission rate
    function updateRewardsPerToken() private {
        s_rewardsPerToken += s_totalSupply == 0
            ? 0
            : (s_totalRewards * (block.timestamp - s_lastUpdate)) / s_totalSupply;
    }

    // helper function that recents update time of last significant event
    function updateTime() private {
        s_lastUpdate = block.timestamp;
    }

    /**
     * @notice function distributes accrued rewards back to staker wallets
     * @notice protecting againt re-entrancy attacks
     */
    function distributeReward() public nonReentrant {
        uint256 userReward = s_rewards[msg.sender];
        s_rewards[msg.sender] = 0;
        // console.log("staker reward sol", userReward);
        // console.log("rewards before transfer sol", i_rKage.balanceOf(address(this)));
        bool success = i_rKage.transfer(msg.sender, userReward);
        // console.log("rewards after transfer sol", i_rKage.balanceOf(address(this)));
        require(success, "Reward token transfer failed");

        // emit reward distributed event
        emit RewardDistributed(msg.sender, userReward);
    }

    // changes duration of staking
    function setDuration(uint256 duration) public onlyOwner {
        s_duration = duration;
    }

    //*************** GET (View) functions **********/

    /**
     * @notice get 0Kage balance in staker wallet
     */
    function userStakedTokenBalance() private view returns (uint256) {
        return i_0Kage.balanceOf(msg.sender);
    }

    /**
     * @notice get r0Kage balance in staker wallet (reward tokens already distributed)
     */
    function userRewardTokenBalance() private view returns (uint256) {
        return i_rKage.balanceOf(msg.sender);
    }

    /**
     * @notice get time of last significant update
     */
    function getLastUpdate() public view returns (uint256) {
        return s_lastUpdate;
    }

    /**
     * @notice get staking duration
     */
    function getDuration() public view returns (uint256) {
        return s_duration;
    }

    function getRewardAmount() public view returns (uint256) {
        return s_totalRewards;
    }

    /**
     * @notice get total reward accrued to user
     */
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

    // get total amount staked by staker
    function getStakingBalance(address staker) public view returns (uint256) {
        return s_balance[staker];
    }

    // get total supply of staked tokens across all stakers
    function getTotalStakingSupply() public view returns (uint256) {
        return s_totalSupply;
    }

    // get zKage address used by current contract
    function getZeroKageAddress() public view returns (address) {
        return address(i_0Kage);
    }

    // get r0Kage address used by current contract
    function getrKageAddress() public view returns (address) {
        return address(i_rKage);
    }

    // ******************* FALLBACK FUNCTIONS *********************//

    receive() external payable {}

    fallback() external payable {}
}
