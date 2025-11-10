// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
✅ 作业2：在测试网上发行一个图文并茂的 NFT
任务目标
使用 Solidity 编写一个符合 ERC721 标准的 NFT 合约。
将图文数据上传到 IPFS，生成元数据链接。
将合约部署到以太坊测试网（如 Goerli 或 Sepolia）。
铸造 NFT 并在测试网环境中查看。
任务步骤
编写 NFT 合约
使用 OpenZeppelin 的 ERC721 库编写一个 NFT 合约。
合约应包含以下功能：
构造函数：设置 NFT 的名称和符号。
mintNFT 函数：允许用户铸造 NFT，并关联元数据链接（tokenURI）。
在 Remix IDE 中编译合约。
准备图文数据
准备一张图片，并将其上传到 IPFS（可以使用 Pinata 或其他工具）。
创建一个 JSON 文件，描述 NFT 的属性（如名称、描述、图片链接等）。
将 JSON 文件上传到 IPFS，获取元数据链接。
JSON文件参考 https://docs.opensea.io/docs/metadata-standards
部署合约到测试网
在 Remix IDE 中连接 MetaMask，并确保 MetaMask 连接到 Goerli 或 Sepolia 测试网。
部署 NFT 合约到测试网，并记录合约地址。
铸造 NFT
使用 mintNFT 函数铸造 NFT：
在 recipient 字段中输入你的钱包地址。
在 tokenURI 字段中输入元数据的 IPFS 链接。
在 MetaMask 中确认交易。
查看 NFT
打开 OpenSea 测试网 或 Etherscan 测试网。
连接你的钱包，查看你铸造的 NFT。
*/

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTContract is ERC721, ERC721URIStorage, Ownable { 
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);


    constructor() ERC721("MyArtNFT", "MANFT") Ownable(msg.sender) {
        
    }

    function mintNFT(address recipient, string memory uri) public returns (uint256) {
        // 确保 uri 不为空
        require(bytes(uri).length > 0, "Token URI cannot be empty");

        // 获取当前 tokenId 并递增
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        // 铸造 NFT
        _safeMint(recipient, newTokenId);
        
        // 设置 uri
        _setTokenURI(newTokenId, uri);
        
        // 触发事件
        emit NFTMinted(recipient, newTokenId, uri);
        
        return newTokenId;
    }

    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    //必须重写的函数（由于多重继承）
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    //必须重写的函数（由于多重继承）
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

// 0x7E40eeE7722065E4F90AA75090771c05EF60705e  部署者
// 0x3357ADff753C5ef8eC3c54Ace7A62D5e5a7060d2  合约地址 

// mintNFT方法的入参：
//uri: ipfs://bafkreifcvpavo2xjkv2x3p3waz3cnc6ehdu2duysbo3uxhmz3orpx54jii
//recipient: 0x7E40eeE7722065E4F90AA75090771c05EF60705e  /  0x8c1bebb0a8100f097627eb781277a164fc58b4ce



}