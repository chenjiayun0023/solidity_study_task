const { ethers, deployments } = require("hardhat")
const { expect } = require("chai")

describe("Test auction", async function () {
    let count = 0;
    async function deploy() {
        count++;
        [signer, buyer] = await ethers.getSigners();
        console.log("signer::", count, signer.address, "buyer::", count, buyer.address);

        //部署拍卖合约  
        const NftAuction = await ethers.getContractFactory("NftAuction");
        const nftAuction = await NftAuction.deploy();
        await nftAuction.waitForDeployment();
        const nftAuctionAddress = await nftAuction.getAddress();
        console.log("nftAuctionAddress::", count, nftAuctionAddress);

        //初始化
        await nftAuction.initialize();

        //部署erc20代币
        const TestERC20 = await ethers.getContractFactory("TestERC20");
        const testERC20 = await TestERC20.deploy();
        await testERC20.waitForDeployment();
        const UsdcAddress = await testERC20.getAddress();
        console.log("UsdcAddress::", count, UsdcAddress);

        //部署erc721代币
        const TestERC721 = await ethers.getContractFactory("NFT");
        const testERC721 = await TestERC721.deploy();
        await testERC721.waitForDeployment();
        const testERC721Address = await testERC721.getAddress();
        console.log("testERC721Address::", count, testERC721Address);
        // mint 10个 NFT
        for (let i = 0; i < 10; i++) {
            await testERC721.mint(signer.address, i + 1, "https://baseURI/" + (i + 1));
        }

        //部署预言机
        const aggreagatorV3 = await ethers.getContractFactory("AggreagatorV3")
        // 预言机返回值：10000 × 10¹⁸  小数位：18  实际价格：(10000 × 10¹⁸) / 10¹⁸ = 10000  所以：1 ETH = 10000 USD 
        // ETH/USD 价格预言机：1 ETH = 10000 USD
        const priceFeedEthDeploy = await aggreagatorV3.deploy(ethers.parseEther("10000"))
        const priceFeedEth = await priceFeedEthDeploy.waitForDeployment()
        const priceFeedEthAddress = await priceFeedEth.getAddress()
        console.log("ethFeed: ", count, priceFeedEthAddress)
        await nftAuction.setPriceFeed(ethers.ZeroAddress, priceFeedEthAddress);

        // USDC/USD 价格预言机：1 USDC = 1 USD  
        const priceFeedUSDCDeploy = await aggreagatorV3.deploy(ethers.parseEther("1"))
        const priceFeedUSDC = await priceFeedUSDCDeploy.waitForDeployment()
        const priceFeedUSDCAddress = await priceFeedUSDC.getAddress()
        console.log("usdcFeed: ", count, priceFeedUSDCAddress)
        await nftAuction.setPriceFeed(UsdcAddress, priceFeedUSDCAddress);

        return { signer, buyer, nftAuction, testERC20, testERC721, nftAuctionAddress, UsdcAddress, testERC721Address };
    }

     it("【重复初始化】", async function () {
        const { nftAuction } = await deploy();
        await expect(nftAuction.initialize()).to.be.revertedWithCustomError(nftAuction, "InvalidInitialization");
    });
    

    it("【创建拍卖成功】", async function () {
        const { signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address } = await deploy();
        await createAuction(signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address);
    });

    async function createAuction(signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address) {
        const tokenId = 1;
        // 给代理合约授权    是代理合约调用testERC721合约的safeTransferFrom方法，所以发送者是代理合约地址
        await testERC721.connect(signer).setApprovalForAll(nftAuctionAddress, true);
        // 调用 createAuction 方法创建拍卖
        await nftAuction.createAuction(
            10,
            ethers.parseEther("0.01"),
            testERC721Address,
            tokenId
        );
        const auction = await nftAuction.auctions(0);
        // console.log("创建拍卖成功：：", auction);
    }

    it("【创建拍卖-非管理员创建失败】", async function () {
        const { buyer, nftAuction, testERC721Address } = await deploy();
        const tokenId = 1;
        // 调用 createAuction 方法创建拍卖
        await expect(nftAuction.connect(buyer).createAuction(
            10,
            ethers.parseEther("0.01"),
            testERC721Address,
            tokenId
        )).to.be.revertedWith("Only admin can create auctions");
    });

    it("【创建拍卖-拍卖持续时间应大于10秒", async function () {
        const { signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address } = await deploy();
        const tokenId = 1;
        // 给代理合约授权    是代理合约调用testERC721合约的safeTransferFrom方法，所以发送者是代理合约地址
        await testERC721.connect(signer).setApprovalForAll(nftAuctionAddress, true);
        // 调用 createAuction 方法创建拍卖
        await expect(nftAuction.connect(signer).createAuction(
            5,
            ethers.parseEther("0.01"),
            testERC721Address,
            tokenId
        )).to.be.revertedWith("Duration must be greater than 10s");
    });

    it("【创建拍卖-起始价应大于0】", async function () {
        const { signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address } = await deploy();
        const tokenId = 1;
        // 给代理合约授权    是代理合约调用testERC721合约的safeTransferFrom方法，所以发送者是代理合约地址
        await testERC721.connect(signer).setApprovalForAll(nftAuctionAddress, true);
        // 调用 createAuction 方法创建拍卖
        await expect(nftAuction.connect(signer).createAuction(
            10,
            0,
            testERC721Address,
            tokenId
        )).to.be.revertedWith("Start price must be greater than 0");
    });


    it("【ETH、USDC参与竞价】", async () => {
        const { signer, buyer, nftAuction, testERC20, testERC721, nftAuctionAddress, UsdcAddress, testERC721Address } = await deploy();
        await createAuction(signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address);

        let tx = await nftAuction.connect(buyer).placeBid(0, 0, ethers.ZeroAddress, { value: ethers.parseEther("0.01") });
        await tx.wait()

        tx = await testERC20.connect(signer).transfer(buyer, ethers.parseEther("1000"))
        await tx.wait()

        // transferFrom方法是spender可以操作，所以是代理合约可以操作，所以from要给代理合约spender授权
        tx = await testERC20.connect(buyer).approve(nftAuctionAddress, ethers.MaxUint256)
        await tx.wait()
        tx = await nftAuction.connect(buyer).placeBid(0, ethers.parseEther("101"), UsdcAddress);
        await tx.wait()
    })


    it("【USDC、ETH参与竞价】", async () => {
        const { signer, buyer, nftAuction, testERC20, testERC721, nftAuctionAddress, UsdcAddress, testERC721Address } = await deploy();
        await createAuction(signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address);

        let tx = await testERC20.connect(signer).transfer(buyer, ethers.parseEther("1000"))
        await tx.wait()

        // transferFrom方法是spender可以操作，所以是代理合约可以操作，所以from要给代理合约spender授权
        tx = await testERC20.connect(buyer).approve(nftAuctionAddress, ethers.MaxUint256)
        await tx.wait()
        tx = await nftAuction.connect(buyer).placeBid(0, ethers.parseEther("101"), UsdcAddress);
        await tx.wait()

        tx = await nftAuction.connect(buyer).placeBid(0, 0, ethers.ZeroAddress, { value: ethers.parseEther("102") });
        await tx.wait()
    })


    it("【参与竞价-拍卖已经结束】", async () => {
        const { signer, buyer, nftAuction, testERC20, testERC721, nftAuctionAddress, UsdcAddress, testERC721Address } = await deploy();
        await createAuction(signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address);

        // 等待 10 s
        await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

        await expect(nftAuction.connect(buyer).placeBid(0, 0, ethers.ZeroAddress, { value: ethers.parseEther("0.01") })).to.be.revertedWith("Auction has ended");
    })

    it("【USDC参与竞价-误发eth金额】", async () => {
        const { signer, buyer, nftAuction, testERC20, testERC721, nftAuctionAddress, UsdcAddress, testERC721Address } = await deploy();
        await createAuction(signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address);

        let tx = await testERC20.connect(signer).transfer(buyer, ethers.parseEther("1000"))
        await tx.wait()

        // transferFrom方法是spender可以操作，所以是代理合约可以操作，所以from要给代理合约spender授权
        tx = await testERC20.connect(buyer).approve(nftAuctionAddress, ethers.MaxUint256)
        await tx.wait()
        await expect(nftAuction.connect(buyer).placeBid(0, ethers.parseEther("101"), UsdcAddress, { value: ethers.parseEther("0.01") })).to.be.revertedWith("ETH not accepted for ERC20 bids");
    })

    it("【ETH、USDC参与竞价-出价应要高于最高出价者】", async () => {
        const { signer, buyer, nftAuction, testERC20, testERC721, nftAuctionAddress, UsdcAddress, testERC721Address } = await deploy();
        await createAuction(signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address);

        let tx = await nftAuction.connect(buyer).placeBid(0, 0, ethers.ZeroAddress, { value: ethers.parseEther("0.03") });
        await tx.wait()

        tx = await testERC20.connect(signer).transfer(buyer, ethers.parseEther("1000"))
        await tx.wait()

        // transferFrom方法是spender可以操作，所以是代理合约可以操作，所以from要给代理合约spender授权
        tx = await testERC20.connect(buyer).approve(nftAuctionAddress, ethers.MaxUint256)
        await tx.wait()
        await expect(nftAuction.connect(buyer).placeBid(0, ethers.parseEther("0.01"), UsdcAddress)).to.be.revertedWith("Bid must be higher than the current highest bid");
    })

    it("【ETH竞价-结束拍卖】", async () => {
        const { signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address } = await deploy();
        await createAuction(signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address);

        const nftAuctionAddressBalance1 = await ethers.provider.getBalance(nftAuctionAddress);
        console.log("nftAuctionAddressBalance1::", nftAuctionAddressBalance1);

        // ETH参与竞价
        tx = await nftAuction.connect(buyer).placeBid(0, 0, ethers.ZeroAddress, { value: ethers.parseEther("1") });
        await tx.wait()

        //验证代理合约有没有收到款
        const nftAuctionAddressBalance2 = await ethers.provider.getBalance(nftAuctionAddress);
        console.log("nftAuctionAddressBalance2::", nftAuctionAddressBalance2);

        const balance1 = await ethers.provider.getBalance(signer.address);
        console.log("balance1::", balance1);

        // 等待 10 s
        await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
        await nftAuction.connect(signer).endAuction(0);

        // 验证结果
        const auctionResult = await nftAuction.auctions(0);
        // console.log("结束拍卖后读取拍卖成功：：", auctionResult);
        expect(auctionResult.highestBidder).to.equal(buyer.address);
        expect(auctionResult.highestBid).to.equal(ethers.parseEther("1"));
        expect(auctionResult.ended).to.equal(true);
        // 验证 NFT 所有权
        const owner = await testERC721.ownerOf(auctionResult.tokenId);
        // console.log("owner::", owner);
        expect(owner).to.equal(buyer.address);

        //验证卖家的余额有没有增加，验证有无收到款
        const balance2 = await ethers.provider.getBalance(signer.address);
        console.log("balance2::", balance2);
    })

    it("【USDC竞价-结束拍卖】", async () => {
        const { signer, nftAuction, testERC20, testERC721, nftAuctionAddress, UsdcAddress, testERC721Address } = await deploy();
        await createAuction(signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address);

        const nftAuctionAddressBalance1 = await testERC20.balanceOf(nftAuctionAddress);
        console.log("nftAuctionAddressBalance1------::", nftAuctionAddressBalance1);

        let tx = await testERC20.connect(signer).transfer(buyer, ethers.parseEther("1000"))
        await tx.wait()

        //transferFrom方法是spender可以操作，所以是代理合约可以操作，所以from要给代理合约spender授权
        tx = await testERC20.connect(buyer).approve(nftAuctionAddress, ethers.MaxUint256)
        await tx.wait()
        // USDC参与竞价
        tx = await nftAuction.connect(buyer).placeBid(0, ethers.parseEther("101"), UsdcAddress);
        await tx.wait()

        //验证代理合约有没有收到款
        const nftAuctionAddressBalance2 = await testERC20.balanceOf(nftAuctionAddress);
        console.log("nftAuctionAddressBalance2------::", nftAuctionAddressBalance2);

        const balance1 = await testERC20.balanceOf(signer.address);
        console.log("balance1------::", balance1);

        // 等待 10 s
        await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
        await nftAuction.connect(signer).endAuction(0);

        // 验证结果
        const auctionResult = await nftAuction.auctions(0);
        // console.log("结束拍卖后读取拍卖成功：：", auctionResult);
        expect(auctionResult.highestBidder).to.equal(buyer.address);
        expect(auctionResult.highestBid).to.equal(ethers.parseEther("101"));
        expect(auctionResult.ended).to.equal(true);
        // 验证 NFT 所有权
        const owner = await testERC721.ownerOf(auctionResult.tokenId);
        // console.log("owner::", owner);
        expect(owner).to.equal(buyer.address);

        //验证卖家的余额有没有增加，验证有无收到款
        const balance2 = await testERC20.balanceOf(signer.address);
        console.log("balance2------::", balance2);
    })


    it("【结束拍卖-已经结束】", async () => {
        const { signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address } = await deploy();
        await createAuction(signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address);

        // ETH参与竞价
        tx = await nftAuction.connect(buyer).placeBid(0, 0, ethers.ZeroAddress, { value: ethers.parseEther("0.01") });
        await tx.wait()

        // 等待 10 s
        await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
        await nftAuction.connect(signer).endAuction(0);

        await expect(nftAuction.connect(signer).endAuction(0)).to.be.revertedWith("Auction has ended");
    })

    it("【结束拍卖-还没结束】", async () => {
        const { signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address } = await deploy();
        await createAuction(signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address);

        // ETH参与竞价
        tx = await nftAuction.connect(buyer).placeBid(0, 0, ethers.ZeroAddress, { value: ethers.parseEther("0.01") });
        await tx.wait()

        // 等待 5 s
        await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
        await expect(nftAuction.connect(signer).endAuction(0)).to.be.revertedWith("Auction has not ended");
    })

    it("【结束拍卖-无人竞价】", async () => {
        const { signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address } = await deploy();
        await createAuction(signer, nftAuction, testERC721, nftAuctionAddress, testERC721Address);

        // 等待 10 s
        await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
        await nftAuction.connect(signer).endAuction(0)

        const auctionResult = await nftAuction.auctions(0);
        expect(auctionResult.highestBidder).to.equal(ethers.ZeroAddress);
    })


})





