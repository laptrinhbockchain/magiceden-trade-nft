# Trade NFT on MagicEden

A simple bot that arbitrages NFTs on the Monad Testnet using MagicEden API. You can extend it to support multiple blockchains.

## 1. Requirement
- NodeJs version 18 or newer
- Must have more MON than current price of NFT

## 2. Preparing
Use below commands to get code and install libraries:
```bash
  git clone https://github.com/laptrinhbockchain/magiceden-trade-nft.git
  cd magiceden-trade-nft
  npm i
```
And then create .env file with following content:
```bash
BOT_PK = xxxxxx
```
Where xxxxxx is the private key in hexadecimal form without the 0x at the beginning.

Final, you can edit some variables in the file index.js:
```bash
const diffPriceMin = 0.0001;
const collectionId = "0xe25c57ff3eea05d0f8be9aaae3f522ddc803ca4e";  // Monadverse: Chapter 1
```

## 3. Run bot
Use below the command to run the bot:
```bash
node index.js
```

If you want to know more details, please refer to the article:
[Hướng dẫn lập trình bot tìm kiếm cơ hội giao dịch chênh lệch giá NFT trên blockchain Monad Testnet sử dụng nền tảng MagicEden](https://laptrinhblockchain.net/huong-dan-lap-trinh-su-dung-nodejs-de-mua-ban-nft-tren-nen-tang-magiceden-su-dung-blockchain-monad-testnet/)
