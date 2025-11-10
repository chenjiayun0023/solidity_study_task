// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
✅ 作业 1：ERC20 代币
任务：参考 openzeppelin-contracts/contracts/token/ERC20/IERC20.sol实现一个简单的 ERC20 代币合约。要求：
合约包含以下标准 ERC20 功能：
balanceOf：查询账户余额。
transfer：转账。
approve 和 transferFrom：授权和代扣转账。
使用 event 记录转账和授权操作。
提供 mint 函数，允许合约所有者增发代币。
提示：
使用 mapping 存储账户余额和授权信息。
使用 event 定义 Transfer 和 Approval 事件。
部署到sepolia 测试网，导入到自己的钱包
*/

interface IERC20 {
    //查询余额
    function balanceOf(address account) external view returns (uint256);
    //转账
    function transfer(address from, address to, uint256 value) external returns (bool);
    //授权 
    function approve(address owner, address spender, uint256 value) external returns (bool);
    //代扣转账
    function transferFrom(address from, address spender, address to, uint256 value) external returns (bool);
    //合约所有者增发代币
    function mint(uint256 value) external returns (bool);


    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


contract ERC20Contract is IERC20 {  

    mapping(address account => uint256) private _balances;
    mapping(address account => mapping(address spender => uint256)) private _allowances;

    address public ownerBy;

    constructor() {
        ownerBy = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == ownerBy, unicode"仅合约所有者可调用");
        _;
    }

    
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address from, address to, uint256 value) public override returns (bool) {
        require(from != address(0), unicode"无效的from地址");
        require(to != address(0), unicode"无效的to地址");
        require(_balances[from] >= value, unicode"余额不足");

        unchecked {
            _balances[from] = _balances[from] - value;
            _balances[to] += value;
        }
        emit Transfer(from, to, value);
        return true;
    }

    function approve(address owner, address spender, uint256 value) public override returns (bool) {
        require(owner != address(0), unicode"无效的owner地址");
        require(spender != address(0), unicode"无效的spender地址");

        _allowances[owner][spender] = value;

        emit Approval(owner, spender, value);
        return true;
    }
    
    function transferFrom(address from, address spender, address to, uint256 value) public override returns (bool) {
        require(from != address(0), unicode"无效的from地址");
        require(spender != address(0), unicode"无效的spender地址");
        require(to != address(0), unicode"无效的to地址");

        uint256 currentAllowance = _allowances[from][spender];
        require(currentAllowance >= value, unicode"可代扣的余额不足");

        approve(from, spender, currentAllowance - value);

        transfer(from, to, value);

        return true;
    }

    function mint(uint256 value) public onlyOwner override returns (bool) {
        require(value > 0, unicode"无效的value值");
        
        unchecked {
            _balances[msg.sender] += value;
        }
        return true;
    }

}

