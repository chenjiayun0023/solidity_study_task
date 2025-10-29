// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
✅ 创建一个名为Voting的合约，包含以下功能：
一个mapping来存储候选人的得票数
一个vote函数，允许用户投票给某个候选人
一个getVotes函数，返回某个候选人的得票数
一个resetVotes函数，重置所有候选人的得票数
*/

contract Voting {

    // 存储候选人得票数
    mapping(string name => uint count) public voteMapping; 
    // 维护键列表
    string[] public candidates;

    
    function vote(string memory name) public {
    
        voteMapping[name] += 1;
        
        // 记录新键
        if(!nameExists(name)){
            candidates.push(name);
        }
        
    }

    function getVotes(string memory name) public view returns (uint) {
        return voteMapping[name];
    }

    function resetVotes() public {
        
        for (uint i = 0; i < candidates.length; i++) {
            delete voteMapping[candidates[i]];
        }
    }

    
    function nameExists(string memory name) public view returns (bool) {
        for (uint i = 0; i < candidates.length; i++) {
            if (keccak256(abi.encodePacked(candidates[i])) == keccak256(abi.encodePacked(name))) {
                return true;
            }
        }
        return false;
    }




    
}