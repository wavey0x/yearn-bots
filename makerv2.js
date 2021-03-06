const Web3 = require('web3');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const web3 = require('./web3.js')();
const get_abi = require('./utilities/get_abi.js');
const email_alert = require('./utilities/email_alert');
let vaultBalance = 0;

module.exports = (strategy) => new Promise ((resolve,reject) => {
    let vaultAbi = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/contract_abis/v2vault.json')));
    let makerAbi = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/contract_abis/makerv2.json')));
    let env = process.env.ENVIRONMENT;
    if(env != "PROD"){
        let vals = JSON.parse(fs.readFileSync(path.normalize(path.dirname(require.main.filename)+'/makerTest.json')));
        vals.strategy = strategy;
        resolve(vals);
    }
    else{
        let values = {};
        values.strategy = strategy;
        let maker = new web3.eth.Contract(makerAbi, values.strategy.address);
        maker.methods.tendTrigger(1).call().then(trigger=>{
            values.trigger = trigger;
            maker.methods.collateralizationRatio().call().then(targetRatio=>{
                values.targetRatio = targetRatio;
                maker.methods.getCurrentMakerVaultRatio().call().then(currentRatio=>{
                    values.currentRatio = currentRatio;
                    values.isBad = values.currentRatio < values.targetRatio;
                    resolve(values);
                }).catch(err => reject(err));
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    }
})