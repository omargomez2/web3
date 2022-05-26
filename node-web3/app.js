// Web3 example that implements a basic ETH wallet,
// and calls a smartcontract
// Author: Omar G2
// Date: May 2022


var express = require('express');
const bodyParser = require("body-parser");
const cors = require("cors");

var app = express();

const Web3 = require("web3");
var web3 = new Web3("http://127.0.0.1:7545");

// Set EJS as templating engine
app.set('view engine', 'ejs');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



// Resources definition
app.get("/", async (req, res) => {
  accounts = await web3.eth.getAccounts();
  acc = {acc:JSON.parse(JSON.stringify(accounts))}
  console.log(acc);
  res.render('transactionform', {data:acc});
});


app.get("/api/sc", async (req, res) => {
  accounts = await web3.eth.getAccounts();

  acc = {acc:JSON.parse(JSON.stringify(accounts))}
  
  res.render('contractform', {data:acc});
});



app.post("/api/transaction", async (req, res) => {
	
  const trans = JSON.parse(JSON.stringify(req.body));
  console.log(trans.from);

  console.log(`Attempting to make transaction from ${trans.from} to ${trans.to}`);
          
  privKey = trans.pk;

  const createTransaction = await web3.eth.accounts.signTransaction(
      {
         from:trans.from,
         to:trans.to,
         value:web3.utils.toWei(trans.value, 'ether'),
         gas:trans.gas,
      },
      privKey
  );

  // Deploy transaction
  const createReceipt = await web3.eth.sendSignedTransaction(
      createTransaction.rawTransaction
  );
  console.log(`Transaction successful with hash: ${createReceipt.transactionHash}`);

	var info = {hash:createReceipt.transactionHash};
	res.render('returntransaction', {data:info});
});



//Call smart contract, save value on the blockchain
app.post('/api/contract', async (req, res)=>{
  const trans = JSON.parse(JSON.stringify(req.body));
 
  contract = new web3.eth.Contract([
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "num",
				"type": "uint256"
			}
		],
		"name": "store",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "retrieve",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
], '0x8bF3E41b96F2e4E3b9687f4ECFA034a8E28c4279');


  contract.methods.store(trans.value).send({ from: trans.from }).then(console.log);
  
  var value = {value:trans.value};
  res.render('returncontractset', {data:value});
});



//Call smart contract method, get saved value
app.get("/api/getvalue", async (req, res) => {

  contract = new web3.eth.Contract([
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "num",
				"type": "uint256"
			}
		],
		"name": "store",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "retrieve",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
], '0x8bF3E41b96F2e4E3b9687f4ECFA034a8E28c4279');
  

  var v = await contract.methods.retrieve().call()
  var datos = {value:v};
  res.render('returncontractcall', {data:datos});
});




var server = app.listen(4000, function(){
    console.log('listening to port 4000')
});