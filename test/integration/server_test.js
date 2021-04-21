let axios = require("axios");

describe("integration tests", function () {
  const TIMEOUT = 20 * 1000;
  this.timeout(TIMEOUT);
  this.slow(TIMEOUT / 2);

  const HORIZON = "https://horizon-testnet.stellar.org";
  StellarSdk.Network.useTestNetwork();
  let server = new StellarSdk.Server(HORIZON);
  let master = StellarSdk.Keypair.random();

  before(function (done) {
    axios
      .get(`${HORIZON}/friendbot?addr=${master.publicKey()}`)
      .then(() => done());
  });

  after(function (done) {
    // Merge account
    server
      .operations()
      .forAccount(master.publicKey())
      .limit(1)
      .order("asc")
      .call()
      .then((response) => {
        let operation = response.records[0];

        return server.loadAccount(master.publicKey()).then((source) => {
          let tx = new StellarSdk.TransactionBuilder(source)
            .addOperation(
              StellarSdk.Operation.accountMerge({
                destination: operation.funder,
              })
            )
            .build();

          tx.sign(master);

          server.submitTransaction(tx).then(() => done());
        });
      });
  });

  function createNewAccount(accountId) {
    return server.loadAccount(master.publicKey()).then((source) => {
      let tx = new StellarSdk.TransactionBuilder(source)
        .addOperation(
          StellarSdk.Operation.createAccount({
            destination: accountId,
            startingBalance: "1",
          })
        )
        .build();

      tx.sign(master);

      return server.submitTransaction(tx);
    });
  }
});
