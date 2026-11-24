// Web3 example that implements a basic ETH wallet,
// and calls a smartcontract
// Author: Omar G2
// First Date: May 2022
// Updated: Nov 2026


var express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

var app = express();

const { Web3 } = require('web3');
var web3 = new Web3('http://127.0.0.1:7545');

// Set EJS as templating engine
app.set('view engine', 'ejs');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// --- CONFIGURACIÓN DEL CONTRATO ---
const contractAddress = '0xe96E15b0A2114E859eEB602Efb54e3318eaD3a1D';
const contractABI = [
	{
		"inputs": [ { "internalType": "uint256", "name": "num", "type": "uint256" } ],
		"name": "store",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "retrieve",
		"outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
		"stateMutability": "view",
		"type": "function"
	}
];
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Resources definition
app.get('/', async (req, res) => {
  const accounts = await web3.eth.getAccounts();
  res.render('transactionform', {data: {acc: accounts}});
});

app.get("/api/sc", async (req, res) => {
  const accounts = await web3.eth.getAccounts();
  res.render('contractform', {data: {acc: accounts}});
});

// Transferencia de ETH
app.post('/api/transaction', async (req, res) => {
  try {
    const trans = req.body;
    console.log(`Intentando transferir de ${trans.from} a ${trans.to}`);
          
    const privKey = trans.pk;

    const createTransaction = await web3.eth.accounts.signTransaction(
        {
           from: trans.from,
           to: trans.to,
           value: web3.utils.toWei(trans.value, 'ether'),
           gas: trans.gas,
           gasPrice: await web3.eth.getGasPrice(),    
        },
        privKey
    );

    const createReceipt = await web3.eth.sendSignedTransaction(
        createTransaction.rawTransaction
    );
    console.log(`Transacción exitosa con hash: ${createReceipt.transactionHash}`);

    res.render('returntransaction', {data: {hash: createReceipt.transactionHash}});
  } catch (error) {
    console.error("Error en transferencia:", error.message);
    res.status(500).send(`Error: ${error.message} <br><a href="/">Volver</a>`);
  }
});

// Guardar valor en el contrato (CORREGIDO PARA WEB3 V4)
app.post('/api/contract', async (req, res)=>{
  try {
    const trans = req.body;
    
    // En Web3 v4, usamos sendTransaction para que Ganache firme con las cuentas desbloqueadas
    const data = contract.methods.store(trans.value).encodeABI();
    
    const receipt = await web3.eth.sendTransaction({
      from: trans.from,
      to: contractAddress,
      data: data,
      gas: '0x100000' // 1,000,000 de gas, suficiente para escribir
    });

    console.log("Valor guardado con éxito. Hash:", receipt.transactionHash);
    
    res.render('returncontractset', {data: {value: trans.value}});
  } catch (error) {
    console.error("Error al guardar en contrato:", error.message);
    res.status(500).send(`Error al guardar: ${error.message} <br><a href="/api/sc">Volver</a>`);
  }
});

// Leer valor del contrato (CORREGIDO PARA WEB3 V4)
app.get('/api/getvalue', async (req, res) => {
  try {
    // En Web3 v4, el resultado de uint256 es un BigInt. Lo convertimos a String para EJS.
    const v = await contract.methods.retrieve().call();
    
    console.log("Valor leído de la blockchain:", v.toString());
    
    res.render('returncontractcall', {data: {value: v.toString()}});
  } catch (error) {
    console.error("Error al leer contrato:", error.message);
    res.status(500).send(`Error al leer: ${error.message} <br><a href="/api/sc">Volver</a>`);
  }
});

var server = app.listen(4000, function(){
    console.log('listening to port 4000');
});
