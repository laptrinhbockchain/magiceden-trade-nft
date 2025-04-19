const Web3 = require('web3');
const delay = require('delay');

const monadRpc = "https://testnet-rpc.monad.xyz";
const erc20Abi = [
	{
        name: "balanceOf",
		stateMutability: "view",
		type: "function",
        inputs: [
            { type: "address", name: "account" }
        ],
		outputs: [
			{ name: "balance", type: "uint256" }
		]
	}
];

function getWeb3() {
    return new Web3(monadRpc)
}
exports.getWeb3 = getWeb3;

function getErc20Contract(web3, tokenAddr) {
    return new web3.eth.Contract(erc20Abi, tokenAddr);
}
exports.getErc20Contract = getErc20Contract;

function privateKeyToAddress(web3, pk) {
    return web3.eth.accounts.privateKeyToAccount(pk).address;
}
exports.privateKeyToAddress = privateKeyToAddress;

function toHex(mixed) {
    return Web3.utils.toHex(mixed);
}
exports.toHex = toHex;

function hexaToDecimal(hex) {
    let n = Web3.utils.BN(hex);
    return n.toString();
}
exports.hexaToDecimal = hexaToDecimal;

function addNumber(num, delta) {
    let n = Web3.utils.BN(num);
    let d = Web3.utils.BN(delta);
    n.add(d);
    return n.toString();
}
exports.addNumber = addNumber;

function addPercent(num, percent) {
    let n = Web3.utils.BN(num);
    let p = Web3.utils.BN(percent);
    let k100 = Web3.utils.BN(100);
    let delta = n.mul(p).div(k100)
    n.add(delta);
    return n.toString();
}
exports.addPercent = addPercent;

function gasEstimate(web3, opts) {
    return new Promise(function(resolve, reject) {
        opts = JSON.parse(JSON.stringify(opts));
        web3.eth.estimateGas(opts, function(err, estimatedGas) {
            if (err) {
                console.log(err);
                resolve(null);
                return;
            }
            resolve(estimatedGas);
          });
    });
}
exports.gasEstimate = gasEstimate;

async function sendTransaction(web3, botPk, opts) {
    try {
        // Get nonce
        let botAddr = web3.eth.accounts.privateKeyToAccount(botPk).address;
        let nonce = await web3.eth.getTransactionCount(botAddr);

        // Get gasprice and increase it 1%
        let gasPrice = await web3.eth.getGasPrice();
        gasPrice = addPercent(gasPrice, 1);

        // Gas limit
        let gasLimit = (opts.gasLimit??500000);

        // Create transaction
        let transInfo = {
            chainId:  opts.chainId,
            nonce   : nonce,
            gasPrice: gasPrice,
            gasLimit: gasLimit.toString(),
        };
        if (opts.data) {
            transInfo.data = opts.data;
        }
        if (opts.to) {
            transInfo.to = opts.to;
        }
        if (opts.value) {
            transInfo.value = opts.value;
        }
        //console.log(`Transaction Info:`, transInfo);

        // Sign transaction
        let signedTrans = await web3.eth.accounts.signTransaction(transInfo, botPk);
        let signedTx = signedTrans.rawTransaction;
        console.log(`SignedTx:`, signedTx);

        // Sign using EvmAccSigner
        let result = await web3.eth.sendSignedTransaction(signedTx);
        return result;
    } catch(ex) {
        console.error("sendTransaction() return exception", ex);
    }
    return null;
}
exports.sendTransaction = sendTransaction;

async function waitForTransaction(web3, txId, delayInMs, timeoutInSec=300) {
    let startTime = Date.now();
    while (true) {
        let diffTime = (Date.now() - startTime)/1000;
        if (diffTime>timeoutInSec) return null;

        let result = null;
        try {
            result = await web3.eth.getTransactionReceipt(txId);
        } catch(ex) {
            console.error("Error to get receipt", ex);
        }
        if (result) return result;
        await delay(delayInMs);
    }
}
exports.waitForTransaction = waitForTransaction;
