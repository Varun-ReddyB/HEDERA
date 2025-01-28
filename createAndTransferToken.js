const {
    Client,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TransferTransaction,
    AccountId,
    PrivateKey,
    TokenAssociateTransaction,
    AccountBalanceQuery // Add this import
} = require("@hashgraph/sdk");

const operatorId = AccountId.fromString("0.0.5405444"); 
const operatorKey = PrivateKey.fromString("3030020100300706052b8104000a04220420ef7e14df9fef4587677e0a874358af4968124ea57d8fffb75136d298572b4251"); 
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

const recipientId = AccountId.fromString("0.0.5409034"); 
const recipientKey = PrivateKey.fromString("3030020100300706052b8104000a042204208da71a0f52a5a2579e646914cda840678c3d4e950e49e1ab40146fb9b10cfa44"); 

async function createAndTransferToken() {
    const tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName("MyToken")
        .setTokenSymbol("MTK")
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(2)
        .setInitialSupply(1000) 
        .setTreasuryAccountId(operatorId) 
        .setSupplyType(TokenSupplyType.Infinite)
        .execute(client);

    const tokenCreateRx = await tokenCreateTx.getReceipt(client);
    const tokenId = tokenCreateRx.tokenId;
    console.log(`Token Created: MyToken (${tokenId})`);

    const associateTx = await new TokenAssociateTransaction()
        .setAccountId(recipientId)
        .setTokenIds([tokenId])
        .freezeWith(client)
        .sign(recipientKey); 
    await associateTx.execute(client);
    console.log("Token associated with recipient account.");

    const transferTx = await new TransferTransaction()
        .addTokenTransfer(tokenId, operatorId, -50) 
        .addTokenTransfer(tokenId, recipientId, 50) 
        .execute(client);

    await transferTx.getReceipt(client);
    console.log("Tokens transferred successfully.");

    const treasuryBalance = await getTokenBalance(operatorId, tokenId);
    const recipientBalance = await getTokenBalance(recipientId, tokenId);

    console.log(`Treasury Balance: ${treasuryBalance}`);
    console.log(`Recipient Balance: ${recipientBalance}`);
}

async function getTokenBalance(accountId, tokenId) {
    const accountInfo = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client);

    return accountInfo.tokens.get(tokenId.toString()) || 0;
}

createAndTransferToken().catch((err) => {
    console.error(err);
    process.exit(1);
});