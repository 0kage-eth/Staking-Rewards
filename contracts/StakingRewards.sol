//SPDX-License-Identifier:MIT

pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingRewards is Ownable{

    //************ Variables **************/
    IERC20 private immutable i_0Kage;
    IERC20 private immutable i_rKage;

    uint256 private s_start; // starting timestamp 
    uint256 private s_rewardAmount; // total reward allocated for distribution
    uint256 private s_duration; // duration is calculated in seconds
    uint256 private s_lastUpdate; // last timestamp when staking rewards were calculated


    mapping(address => uint256) private s_rewards; // rewards for a given user
    mapping(address => uint256) private s_balance; // staked balances per user
    mapping(address => uint256) private s_rewardsPaidPerUser; // rewards paid per user

    uint256 private s_totalSupply; // total supply of staked tokens
    uint256 private s_rewardsPerToken; // total rewards per token

    /**
     * ************ FORMULAS **********
     * rewardsPerToken += reward * (current time - prev time) / totalSupply 
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

    constructor(address ZeroKage, address rKage, uint256 duration){
        
        // initializing 0Kage and rKage Interfaces
        i_0Kage = IERC20(ZeroKage);
        i_rKage = IERC20(rKage);
        s_duration= duration;   
    }


    //*************** Mutative functions **********/

    function stake(uint256 stakeAmount) public payable{
        require(stakeAmount>0, "Stake Amount must be >0");
        require(stakeAmount<=userStakedTokenBalance(), "Cannot stake more than your balance");

        // first calculate rewards from prev time to current time
        calculateStakes();


        // next, update total supply and balance for user
        s_totalSupply += stakeAmount;
        s_balance[msg.sender] += stakeAmount;

        // at the end update time
        updateTime();

        emit Stake(msg.sender, stakeAmount);

    }

    function unstake(uint256 unStakeAmount) public{
        require(unStakeAmount>0, "Stake Amount withdrawal must be >0");
        require(unStakeAmount< s_balance[msg.sender], "Amount to be unstaked exceeds your staked balance");

        // first calculate rewards from prev time to current time
        calculateStakes();

        // next, update total supply and balance for user
        s_totalSupply -= unStakeAmount;
        s_balance[msg.sender] -= unStakeAmount;

        // at the end update time
        updateTime();

        emit Unstake(msg.sender, unStakeAmount);
    }

    function calculateStakes() private {
        // first update rewards per token
        updateRewardsPerToken();

        // then we update rewards from last time stamp to current
        // for the given user who staked 
        updateReward();

        // update rewards paid per user with rewards per token
        s_rewardsPaidPerUser[msg.sender]= s_rewardsPerToken;
    }

    function updateReward() private {
        s_rewards[msg.sender] += s_balance[msg.sender]*(s_rewardsPerToken - s_rewardsPaidPerUser[msg.sender]);
    }

    function updateRewardsPerToken() private{
        s_rewardsPerToken += s_rewardAmount * (block.timestamp - s_lastUpdate) / s_totalSupply;
    }

    function updateTime() private {
        s_lastUpdate = block.timestamp;
    }

    function distributeReward() private{
        uint256 userReward = s_rewards[msg.sender];
        s_rewards[msg.sender] = 0;

        bool success = i_rKage.transferFrom(adddress(this), msg.sender, userReward);
        require(success, "Reward token transfer failed");
    }

    function setDuration(uint256 duration) onlyOwner{
        s_duration = duration;
    }

    //*************** View functions **********/

    function userStakedTokenBalance() private view returns(uint256){
        return i_0Kage.balanceOf(msg.sender);
    }

    function userRewardTokenBalance() private view returns(uint256){
        return i_rKage.balanceOf(msg.sender);
    }

    function getLastUpdate() public view returns(uint256){
        return s_lastUpdate;
    }

    function getDuration() public view returns(uint256){
        return s_duration;
    }

    function getRewardAmount() public view returns(uint256){
        return s_rewardAmount;
    }
    function getStakerReward() public view returns(uint256){
        return s_rewards[msg.sender];
    }

    function getStakingBalance() public view returns(uint256){
        return s_balance[msg.sender];
    }

    function getTotalStakingSupply() public view returns(uint256){
        return s_totalSupply;
    }

}