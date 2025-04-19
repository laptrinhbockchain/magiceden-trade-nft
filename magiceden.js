const axios = require('axios');
const qs = require('qs');

const baseApi = "https://api-mainnet.magiceden.dev";

async function _requestData(type, endPoint, params={}) {
    try {
        let link = `${baseApi}${endPoint}`;
        if (type=="GET") {
            let queryString = qs.stringify(params);
            if (queryString && queryString.length>0) {
                link += '?' + queryString;   
            }
        }
        let requestConfig = {
            method: type,
            url: link,
            timeout: 60000,
        };
        if (type=="POST") requestConfig.data = params;
        const response = await axios(requestConfig);
        if (response == null) {
            console.error("_requestData(): No response for link:", link);
            return null;
        }
        if (response.data==null) {
            console.error("_requestData(): No data return");
            return null;
        }
        // this.logger.debug("_requestPublic response", response.data);
        return response.data;
    } catch(ex) {
        console.error("_requestData(): Exception", type, endPoint, params, ex);
    }
    return null;
}

async function getCollectionInfo(collectionId) {
    let data = await _requestData("GET", `/v3/rtp/monad-testnet/collections/v7`, { id: collectionId });
    if (!data || !data.collections) return null;
    if (data.collections.length>0) return data.collections[0];
    return null;
}
exports.getCollectionInfo = getCollectionInfo;

async function getCollectionBids(collectionId) {
    let url = `/v3/rtp/monad-testnet/orders/bids/v6`;
    let param = {
        collection: collectionId,
        status: "active"
    };
    let data = await _requestData("GET", url, param);
    if (!data || !data.orders) return null;
    return data.orders;
}
exports.getCollectionBids = getCollectionBids;

async function getCollectionAsks(collectionId) {
    let url = `/v3/rtp/monad-testnet/orders/asks/v5`;
    let param = {
        tokenSetId: "contract:" + collectionId,
        status: "active"
    };
    let data = await _requestData("GET", url, param);
    if (!data || !data.orders) return null;
    return data.orders;
}
exports.getCollectionAsks = getCollectionAsks;

async function generateBuyNftOrder(askId, recipent, skipBalanceCheck=false) {
    let params = {
        items: [{
            quantity: 1,
            orderId: askId,
            fillType: "trade",
        }],
        taker: recipent,
        relayer: recipent,
        skipBalanceCheck: skipBalanceCheck
    };
    let endPoint = `/v3/rtp/monad-testnet/execute/buy/v7`;
    let orderInfo = await _requestData("POST", endPoint, params);
    return orderInfo;
}
exports.generateBuyNftOrder = generateBuyNftOrder;

async function generateSellNftOrder(bidId, recipent, token, skipBalanceCheck=false) {
    let params = {
        items: [{
            token: token,
            quantity: 1,
            orderId: bidId,
            fillType: "trade",
        }],
        taker: recipent,
        relayer: recipent,
        skipBalanceCheck: skipBalanceCheck
    };
    let endPoint = `/v3/rtp/monad-testnet/execute/sell/v7`;
    let orderInfo = await _requestData("POST", endPoint, params);
    return orderInfo;
}
exports.generateSellNftOrder = generateSellNftOrder;