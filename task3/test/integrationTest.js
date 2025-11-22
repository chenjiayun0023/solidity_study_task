const { ethers, deployments } = require("hardhat")
const { expect } = require("chai")

describe("Test auction", async function () {
    it("Should be ok", async function () {
        await main();
    });
})

async function main() {
    // 检查当前网络
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name, network.chainId);

    let signer, buyer;

    if (network.chainId === 31337n) { // 本地网络
        [signer, buyer] = await ethers.getSigners();
    } else { // 测试网或主网
        // 使用配置的第一个账户作为 signer
        signer = await ethers.provider.getSigner();
        // 为了测试，我们使用另一个地址作为 buyer
        // 在实际测试中，您可能需要预先准备测试账户
        buyer = signer; // 如果没有第二个账户，使用同一个
    }
    
    console.log("signer::", signer.address, "buyer::", buyer.address);

    await deployments.fixture(["deployNftAuction"]);
    const nftAuctionProxy = await deployments.get("NftAuctionProxy");
    const nftAuction = await ethers.getContractAt("NftAuction", nftAuctionProxy.address);

    const TestERC20 = await ethers.getContractFactory("TestERC20");
    const testERC20 = await TestERC20.deploy();
    await testERC20.waitForDeployment();
    const UsdcAddress = await testERC20.getAddress();
    
    let tx = await testERC20.connect(signer).transfer(buyer, ethers.parseEther("1000"))
    await tx.wait()
    
    //sepolia网
    // const priceFeedEthAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306"; //ETH / USD
    // const priceFeedUSDCAddress = "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E"; //USDC / USD

    const aggreagatorV3 = await ethers.getContractFactory("AggreagatorV3")
    // 预言机返回值：10000 × 10¹⁸  小数位：18  实际价格：(10000 × 10¹⁸) / 10¹⁸ = 10000  所以：1 ETH = 10000 USD 
    // ETH/USD 价格预言机：1 ETH = 10000 USD
    const priceFeedEthDeploy = await aggreagatorV3.deploy(ethers.parseEther("10000"))
    const priceFeedEth = await priceFeedEthDeploy.waitForDeployment()
    const priceFeedEthAddress = await priceFeedEth.getAddress()
    console.log("ethFeed: ", priceFeedEthAddress)
    // USDC/USD 价格预言机：1 USDC = 1 USD  
    const priceFeedUSDCDeploy = await aggreagatorV3.deploy(ethers.parseEther("1"))
    const priceFeedUSDC = await priceFeedUSDCDeploy.waitForDeployment()
    const priceFeedUSDCAddress = await priceFeedUSDC.getAddress()
    console.log("usdcFeed: ", priceFeedUSDCAddress)

    const token2Usd = [{
        token: ethers.ZeroAddress,
        priceFeed: priceFeedEthAddress
    }, {
        token: UsdcAddress,
        priceFeed: priceFeedUSDCAddress
    }]

    for (let i = 0; i < token2Usd.length; i++) {
        const { token, priceFeed } = token2Usd[i];
        await nftAuction.setPriceFeed(token, priceFeed);
    }


    // 1. 部署 ERC721 合约
    const TestERC721 = await ethers.getContractFactory("NFT");
    const testERC721 = await TestERC721.deploy();
    await testERC721.waitForDeployment();
    const testERC721Address = await testERC721.getAddress();
    console.log("testERC721Address::", testERC721Address);

    // mint 10个 NFT
    for (let i = 0; i < 10; i++) {
        await testERC721.mint(signer.address, i + 1,  "https://baseURI/"+ (i + 1));
    }
    
    const tokenId = 1;   
    // 给代理合约授权    是代理合约调用testERC721合约的safeTransferFrom方法，所以发送者是代理合约地址
    await testERC721.connect(signer).setApprovalForAll(nftAuctionProxy.address, true);
    //2. 调用 createAuction 方法创建拍卖
    await nftAuction.createAuction(
        10,
        ethers.parseEther("0.01"),
        testERC721Address,
        tokenId
    );
    const auction = await nftAuction.auctions(0);
    console.log("创建拍卖成功：：", auction);

    // 3. 购买者参与拍卖
    // ETH参与竞价
    await nftAuction.connect(buyer).placeBid(0, 0, ethers.ZeroAddress, { value: ethers.parseEther("0.01") });
    await tx.wait()

    // USDC参与竞价
    // transferFrom方法是spender可以操作，所以是代理合约可以操作，所以from要给代理合约spender授权
    tx = await testERC20.connect(buyer).approve(nftAuctionProxy.address, ethers.MaxUint256)
    await tx.wait()
    tx = await nftAuction.connect(buyer).placeBid(0, ethers.parseEther("101"), UsdcAddress);
    await tx.wait()

    // 4. 结束拍卖
    // 等待 10 s
    await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
    await nftAuction.connect(signer).endAuction(0);

    // 验证结果
    const auctionResult = await nftAuction.auctions(0);
    console.log("结束拍卖后读取拍卖成功：：", auctionResult);
    expect(auctionResult.highestBidder).to.equal(buyer.address);
    expect(auctionResult.highestBid).to.equal(ethers.parseEther("101"));

    // 验证 NFT 所有权
    const owner = await testERC721.ownerOf(tokenId);
    console.log("owner::", owner);
    expect(owner).to.equal(buyer.address);

}

// npx hardhat node --no-deploy
//执行测试： npx hardhat test test/auction.js --network localhost
// npx hardhat test test/auction.js --network sepolia

