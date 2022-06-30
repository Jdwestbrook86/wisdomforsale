import {loadStdlib} from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
import { ask } from '@reach-sh/stdlib';

if (process.argv.length < 3 || ['seller', 'buyer'].includes(process.argv[2]) == false) {
    console.log('Usage: reach run index [seller|buyer]');
    process.exit(0);
}
const role = process.argv[2];

console.log(`Your role is ${role}`);

const stdlib = loadStdlib(process.env);
console.log(`The consensus network is ${stdlib.connector}.`);

const suStr = stdlib.standardUnit;
const auStr = stdlib.atomicUnit;
const toAU = (su) => stdlib.parseCurrency(su);
const toSU = (au) => stdlib.formatCurrency(au, 4);

const iBalance = toAU(1000)
const showBalance = async (acc) => console.log(`Your balance is ${toSU(await stdlib.balanceOf(acc))} ${suStr}.`)
const suBal = 1000;
const auBal = toAU(suBal);

const commonInteract = {
    reportCancellation: () => { console.log(`The buyer canceled the order.`);},
    reportTransfer: (payment) => { console.log(`The contract paid ${toSU(payment)} ${suStr} to ${role == 'seller' ? 'you' : 'the seller'}.`)},
    reportPayment: (payment) => {console.log(`${role == 'buyer' ? 'You' : 'The buyer'} paid ${toSU(payment)} ${suStr} to the contract.`)}
};

if (role === 'seller') {
  const sellerInteract = {
    ...commonInteract,
    price: toAU(5),
    wisdom: await ask.ask('Enter a wise phrase, or press Enter for default:', (s) => {
        let w = !s ? 'Build healthy communities.' : s;
        if (!s) {console.log(w);}
        return w;
    }),
    reportReady: async (price) => {
        console.log(`Your wisdom is for sale at ${toSU(price)} ${suStr}.`);
        console.log(`Contract info: ${JSON.stringify(await sctc.getInfo())}`);
    }
  };

  const sacc = await stdlib.newTestAccount(iBalance)
  await showBalance(sacc);
  const sctc = sacc.contract(backend);
  await sctc.participants.Seller(sellerInteract);
  await showBalance(sacc);
} else {
  const buyerInteract = {
    ...commonInteract,
    confirmPurchase: async (price) => await ask.ask(`Do you want to purchase wisdom for ${toSU(price)} ${suStr}?`, ask.yesno),
    reportWisdom: (wisdom) => console.log(`Your new wisdom is "${wisdom}"`)
  };
  const bacc = await stdlib.newTestAccount(iBalance);
  const info = await ask.ask('Paste contract info:', (s) => JSON.parse(s))
  const bctc = bacc.contract(backend, info);
  await showBalance(bacc);
  await bctc.p.Buyer(buyerInteract);
  await showBalance(bacc)
}

ask.done();
