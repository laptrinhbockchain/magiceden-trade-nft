require('dotenv').config();
const MagicEden = require('./magiceden');
const Web3Utils = require('./web3-utils');

const chainId = 10143;
const skipBalanceCheck = false;
const WMON = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
const diffPriceMin = 0.0001;
const collectionId = "0x7bbd69551c73d149846df55cd5ff5f0a691bd0f7";	// Bitcoin to the moon
const botPk = process.env.BOT_PK;

async function convertWmon2Mon(web3, botPk) {
    try {
        // Bot address
        let botAddr = Web3Utils.privateKeyToAddress(web3, botPk);

        // Get balance of WMON
        let contract = Web3Utils.getErc20Contract(web3, WMON);
        let balance = await contract.methods.balanceOf(botAddr).call();
        console.log("WMON Balance:", balance);
        if (Number(balance)<=0) return false;

        // Gas estimate
        let data = web3.eth.abi.encodeFunctionCall(
            {
                name: "withdraw",
                type: "function",
                inputs: [{
                    type: "uint256",
                    name: "amount"
                }]
            }, [ balance ]
        );
        let opts = {
            from: botAddr,
            chainId: chainId,
            to: WMON,
            data: data
        };
        let gasEstimate = await Web3Utils.gasEstimate(web3, opts);
        console.log("GasEstimate:", opts, gasEstimate);

        // Convert WMON to MON
        opts.gasLimit = Web3Utils.toHex(Web3Utils.addNumber(gasEstimate, 5000));
        let result = await Web3Utils.sendTransaction(web3, botPk, opts);
        if (!result || result.status!=true || !result.transactionHash) return false;
        let txId = result.transactionHash;
        console.log(`Convert ${balance} WMON to MON: ${txId}`);

        // Check transaction
        let receipt = await Web3Utils.waitForTransaction(web3, txId, 5000);
        let ret = (receipt && receipt.status);
        // console.log("Receipt:", receipt);
        console.log(`    Convert ${balance} WMON to MON`, botAddr, (ret?"SUCCESS":"FAIL"));

        return true;
    } catch(ex) {
        console.error(`    Convert WMON to MON`, ex);
    }
    return false;
}

async function buyNft(web3, botPk, askId) {
    try {
        // Bot address
        let botAddr = Web3Utils.privateKeyToAddress(web3, botPk);

        // Buy Order
        let buyOrder = await MagicEden.generateBuyNftOrder(askId, botAddr, skipBalanceCheck);
        // console.log("BuyOrder:", JSON.stringify(buyOrder, null, 4));
        if (!buyOrder) return false;
        if (buyOrder.statusCode) {
            console.error("Error to generate buy order", buyOrder);
            return false;
        }

        // Send transactions to blockchain
        let steps = buyOrder.steps;
        for (let idx=0; idx<steps.length; idx++) {
            let step = steps[idx];
            // console.log("Step", idx, step);
            let items = (step.items??[]);
            for (let idx1=0; idx1<items.length; idx1++) {
                let item = items[idx1];
                // console.log("Item", item);

                // Gas estimate
                let opts = {
                    from: botAddr,
                    chainId: chainId,
                    to: item.data.to,
                    data: item.data.data
                };
                if (item.data.value) {
                    opts.value = Web3Utils.hexaToDecimal(item.data.value);
                }
                let gasEstimate = await Web3Utils.gasEstimate(web3, opts);
                console.log("GasEstimate:", opts, gasEstimate);

                // Send transaction to blockchain
                opts.gasLimit = Web3Utils.toHex(Web3Utils.addNumber(gasEstimate, 10000));
                let result = await Web3Utils.sendTransaction(web3, botPk, opts);
                if (!result || result.status!=true || !result.transactionHash) return false;
                let txId = result.transactionHash;
                console.log(`[BUY] Steps[${idx}] - Items[${idx1}]: TxId: ${txId}`);

                // Check transaction
                let receipt = await Web3Utils.waitForTransaction(web3, txId, 5000);
                // console.log("Receipt:", receipt);
                let ret = (receipt && receipt.status);
                let msg = `Buy NFT at step ${idx} and item ${idx1}: ${ret?"SUCCESS":"FAIL"} (${txId})`;
                console.log(new Date(), msg);

                if (!ret) return false;
            }
        }
        return true;
    } catch(ex) {
        console.log("buyNft() EXCEPTION", ex);
    }
    return false;
}

async function sellNft(web3, botPk, bidId, token) {
    try {
        // Bot address
        let botAddr = Web3Utils.privateKeyToAddress(web3, botPk);

        // Sell order
        let sellOrder = await MagicEden.generateSellNftOrder(bidId, botAddr, token, skipBalanceCheck);
        // console.log("SellOrder:", JSON.stringify(sellOrder, null, 4));
        if (!sellOrder) return false;
        if (sellOrder.statusCode) {
            console.error("Error to generate sell order", sellOrder);
            return false;
        }

        // Send transactions to blockchain
        let steps = sellOrder.steps;
        for (let idx=0; idx<steps.length; idx++) {
            let step = steps[idx];
            // console.log("Step", idx, step);
            let items = (step.items??[]);
            for (let idx1=0; idx1<items.length; idx1++) {
                let item = items[idx1];
                // console.log("Item", item);

                // Gas estimate
                let opts = {
                    from: botAddr,
                    chainId: chainId,
                    to: item.data.to,
                    data: item.data.data
                };
                if (item.data.value) {
                    opts.value = Web3Utils.hexaToDecimal(item.data.value);
                }
                let gasEstimate = await Web3Utils.gasEstimate(web3, opts);
                console.log("GasEstimate:", opts, gasEstimate, token);

                // Generate transaction
                opts.gasLimit = Web3Utils.toHex(Web3Utils.addNumber(gasEstimate, 10000));
                let result = await Web3Utils.sendTransaction(web3, botPk, opts);
                if (!result || result.status!=true || !result.transactionHash) return false;
                let txId = result.transactionHash;
                console.log(`[SELL] Steps[${idx}] - Items[${idx1}]: TxId: ${txId}`);

                // Check transaction
                let receipt = await Web3Utils.waitForTransaction(web3, txId, 5000);
                // console.log("Receipt:", receipt);
                let ret = (receipt && receipt.status);
                let msg = `Sell NFT at step ${idx} and item ${idx1}: ${ret?"SUCCESS":"FAIL"} (${txId})`;
                console.log(new Date(), msg);

                if (!ret) return false;
            }
        }
        return true;
    } catch(ex) {
        console.log("sellNft() EXCEPTION", ex);
    }
    return false;
}

async function arbitrageNft(web3) {
    // Get Bid/Ask
    let promises = [
        MagicEden.getCollectionAsks(collectionId),
        MagicEden.getCollectionBids(collectionId)
    ];
    let results = await Promise.all(promises);
    let asks = results[0];
    let bids = results[1];
    if (!asks | !bids) return false;
    if (asks.length==0 || bids.length==0) {
        console.log(new Date(), "No bids or no asks data!");
        return false;
    }

    // Get best ask
    asks = asks.map(item => {
        return { id: item.id, symbol: item.price.currency.symbol, price: item.price.amount.decimal, tokenId: item.criteria.data.token.tokenId }
    });
    asks.sort(function(a, b) { return a.price - b.price; });
    let bestAsk = asks[0];
    console.log(new Date(), "Best Ask:", JSON.stringify(bestAsk));

    // Get best bids
    bids = bids.map(item => {
        return { id: item.id, symbol: item.price.currency.symbol, price: item.price.netAmount.decimal }
    });
    bids.sort(function(a, b) { return b.price - a.price; });
    let bestBid = bids[0];
    console.log(new Date(), "Best Bid:", JSON.stringify(bestBid));

    // Check arbitrage
    let diffPrice = bestBid.price - bestAsk.price;
    console.log(new Date(), "DiffPrice", diffPrice);
    if (diffPrice >= diffPriceMin) {
        console.log(new Date(), "There is an opportunity for arbitrage!");

        // Buy NFT
        if (!await buyNft(web3, botPk, bestAsk.id)) return false;

        // Sell NFT
        let token = `${collectionId}:${bestAsk.tokenId}`
        if (!await sellNft(web3, botPk, bestBid.id, token)) return false;

        // Convert WMON to MON
        if (await convertWmon2Mon(web3, botPk)) {
            let msg = `Arbitrage DONE: buyPrice=${bestAsk.price} - sellPrice=${bestBid.price} => Profit=${diffPrice} MON`;
            console.log(new Date(), msg);
        }

        return true;
    } else {
        console.log(new Date(), "There is no opportunity for arbitrage!");
    }
    return false;
}

async function autoArbitrageNft(web3) {
    try {
        await arbitrageNft(web3);
    } catch(ex) {
        console.error(new Date(), "Error to arbitrage NFT", ex);
    }

    setTimeout(async function() {
        await autoArbitrageNft(web3);
    }, 15000);
}

async function main() {
    let web3 = Web3Utils.getWeb3();
    await autoArbitrageNft(web3);
}
main();
