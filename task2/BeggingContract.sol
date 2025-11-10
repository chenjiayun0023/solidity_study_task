// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
✅ 作业3：编写一个讨饭合约
任务目标
使用 Solidity 编写一个合约，允许用户向合约地址发送以太币。
记录每个捐赠者的地址和捐赠金额。
允许合约所有者提取所有捐赠的资金。

任务步骤
编写合约
创建一个名为 BeggingContract 的合约。
合约应包含以下功能：
一个 mapping 来记录每个捐赠者的捐赠金额。
一个 donate 函数，允许用户向合约发送以太币，并记录捐赠信息。
一个 withdraw 函数，允许合约所有者提取所有资金。
一个 getDonation 函数，允许查询某个地址的捐赠金额。
使用 payable 修饰符和 address.transfer 实现支付和提款。
部署合约
在 Remix IDE 中编译合约。
部署合约到 Goerli 或 Sepolia 测试网。
测试合约
使用 MetaMask 向合约发送以太币，测试 donate 功能。
调用 withdraw 函数，测试合约所有者是否可以提取资金。
调用 getDonation 函数，查询某个地址的捐赠金额。

任务要求
合约代码：
使用 mapping 记录捐赠者的地址和金额。
使用 payable 修饰符实现 donate 和 withdraw 函数。
使用 onlyOwner 修饰符限制 withdraw 函数只能由合约所有者调用。
测试网部署：
合约必须部署到 Goerli 或 Sepolia 测试网。
功能测试：
确保 donate、withdraw 和 getDonation 函数正常工作。

提交内容
合约代码：提交 Solidity 合约文件（如 BeggingContract.sol）。
合约地址：提交部署到测试网的合约地址。
测试截图：提交在 Remix 或 Etherscan 上测试合约的截图。

额外挑战（可选）
捐赠事件：添加 Donation 事件，记录每次捐赠的地址和金额。
捐赠排行榜：实现一个功能，显示捐赠金额最多的前 3 个地址。
时间限制：添加一个时间限制，只有在特定时间段内才能捐赠。
*/

import "@openzeppelin/contracts/access/Ownable.sol";

contract BeggingContract is Ownable {
    struct Donor {
        string name;
        uint256 age;
        bool exists;
        uint256 amount;
    }

    //记录每个捐赠者的捐赠金额
    mapping(address account => Donor donorInfo) private _donates;
    //所有捐赠者地址
    address[] private _allDonors;

    //捐赠时间设置
    uint256 public donationStartTime;
    uint256 public donationEndTime;

    event Donation(address indexed donor, uint256 amount); 

    constructor(uint256 _startTime, uint256 _endTime) Ownable(msg.sender) {
        require(_startTime < _endTime, "Start time must be before end time");
        require(_startTime > block.timestamp, "Start time must be in the future");

        donationStartTime = _startTime;
        donationEndTime = _endTime;
    }

    // 检查当前是否在捐赠时间内
    function _isWithinDonationPeriod() private view returns (bool) {
        return block.timestamp >= donationStartTime && block.timestamp <= donationEndTime;
    }
    
    // 修饰符：只在捐赠时间内有效
    modifier onlyDuringDonationPeriod() {
        require(_isWithinDonationPeriod(), "Donations are only accepted during the specified period");
        _;
    }


    //允许用户向合约发送以太币，并记录捐赠信息
    function donate(string memory name, uint256 age) public payable onlyDuringDonationPeriod returns (bool) {
        if (msg.value <= 0) {
            revert ("The donation amount is incorrect");
        }
        if (_donates[msg.sender].exists) {
            revert ("You have already donated!");
        }
        
        _donates[msg.sender] = Donor(name, age, true, msg.value);
        _allDonors.push(msg.sender);
  
        emit Donation(msg.sender, msg.value);
        return true;
    }

    //允许合约所有者提取所有资金
    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    //允许查询某个地址的捐赠金额
    function getDonation(address addr) public view returns (uint256) {
        if (!_donates[addr].exists) {
            revert ("You haven't donated yet");
        }
        return _donates[addr].amount;
    }

    // 获取前3名捐赠者地址
    function getTop3Addresses() public view returns (address[3] memory) {
        address[3] memory top3;
        
        if (_allDonors.length == 0) {
            return top3; // 返回空数组
        }
        
        // 简单的冒泡排序获取前3名
        address[] memory donorsCopy = _allDonors;
        
        // 只排序前3名（部分排序）
        for (uint256 i = 0; i < donorsCopy.length && i < 3; i++) {
            uint256 maxIndex = i;
            for (uint256 j = i + 1; j < donorsCopy.length; j++) {
                if (_donates[donorsCopy[j]].amount > _donates[donorsCopy[maxIndex]].amount) {
                    maxIndex = j;
                }
            }
            // 交换位置
            if (maxIndex != i) {
                address temp = donorsCopy[i];
                donorsCopy[i] = donorsCopy[maxIndex];
                donorsCopy[maxIndex] = temp;
            }
            top3[i] = donorsCopy[i];
        }
        
        return top3;
    }


    
}


//sepolia测试网
// 0xf67d0571b648ed24ED6d7CCba3Dd96e0e99ce02B 合约地址  
// 0x7E40eeE7722065E4F90AA75090771c05EF60705e 合约部署者  








