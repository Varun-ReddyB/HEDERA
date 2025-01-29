const {
    Client,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TransferTransaction,
    AccountId,
    PrivateKey,
    TokenAssociateTransaction,
    AccountBalanceQuery,
    TokenMintTransaction 
} = require("@hashgraph/sdk");

const operatorId = AccountId.fromString("0.0.5405444"); 
const operatorKey = PrivateKey.fromString("3030020100300706052b8104000a04220420ef7e14df9fef4587677e0a874358af4968124ea57d8fffb75136d298572b4251"); 
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

const recipientId = AccountId.fromString("0.0.5409034"); 
const recipientKey = PrivateKey.fromString("3030020100300706052b8104000a042204208da71a0f52a5a2579e646914cda840678c3d4e950e49e1ab40146fb9b10cfa44"); 

const additionalRecipients = [
    { accountId: AccountId.fromString("0.0.5409035"), privateKey: PrivateKey.fromString("3030020100300706052b8104000a04220420abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890") },
    { accountId: AccountId.fromString("0.0.5409036"), privateKey: PrivateKey.fromString("3030020100300706052b8104000a042204201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef") }
];
const supplyKey = PrivateKey.generate();

async function createAndTransferToken() {
    const tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName("MyToken")
        .setTokenSymbol("MTK")
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(2)
        .setInitialSupply(1000) 
        .setTreasuryAccountId(operatorId) 
        .setSupplyType(TokenSupplyType.Infinite)
        .setSupplyKey(supplyKey) // Set the supply key here
        .execute(client);

    const tokenCreateRx = await tokenCreateTx.getReceipt(client);
    const tokenId = tokenCreateRx.tokenId;
    console.log(`Token Created: MyToken (${tokenId})`);

    await associateTokenWithAccounts([recipientId, ...additionalRecipients.map(r => r.accountId)], tokenId);

    const transferTx = await new TransferTransaction()
        .addTokenTransfer(tokenId, operatorId, -50) 
        .addTokenTransfer(tokenId, recipientId, 50) 
        .execute(client);

    await transferTx.getReceipt(client);
    console.log("Initial tokens transferred successfully.");

    const mintAmount = 500; 
    await mintTokens(tokenId, mintAmount);
    console.log(`Minted ${mintAmount} additional tokens.`);

    const distributionAmount = 100; // Amount to distribute to each account
    await distributeTokens(tokenId, [recipientId, ...additionalRecipients.map(r => r.accountId)], distributionAmount);
    console.log(`Distributed ${distributionAmount} tokens to each recipient.`);
    const treasuryBalance = await getTokenBalance(operatorId, tokenId);
    const recipientBalance = await getTokenBalance(recipientId, tokenId);
    const additionalBalances = await Promise.all(additionalRecipients.map(r => getTokenBalance(r.accountId, tokenId)));

    console.log(`Treasury Balance: ${treasuryBalance}`);
    console.log(`Recipient Balance: ${recipientBalance}`);
    additionalBalances.forEach((balance, index) => {
        console.log(`Additional Recipient ${index + 1} Balance: ${balance}`);
    });
}

async function associateTokenWithAccounts(accountIds, tokenId) {
    for (const accountId of accountIds) {
        const associateTx = await new TokenAssociateTransaction()
            .setAccountId(accountId)
            .setTokenIds([tokenId])
            .freezeWith(client)
            .sign(additionalRecipients.find(r => r.accountId.toString() === accountId.toString())?.privateKey || recipientKey); 
        await associateTx.execute(client);
        console.log(`Token associated with account ${accountId.toString()}.`);
    }
}

async function mintTokens(tokenId, amount) {
    const mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(amount)
        .freezeWith(client)
        .sign(supplyKey); // Sign the transaction with the supply key
    const mintTxResponse = await mintTx.execute(client);
    await mintTxResponse.getReceipt(client);
}

async function distributeTokens(tokenId, accountIds, amount) {
    const transferTx = new TransferTransaction();
    for (const accountId of accountIds) {
        transferTx
            .addTokenTransfer(tokenId, operatorId, -amount) 
            .addTokenTransfer(tokenId, accountId, amount); 
    }

    await transferTx.execute(client);
    await transferTx.getReceipt(client);
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