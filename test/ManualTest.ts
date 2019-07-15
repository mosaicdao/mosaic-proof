import { ProofGenerator } from "../src/ProofGenerator";
const Web3  = require('web3');

describe('Manual testing of proof generator', () => {
    it('Should generate account proof', async() => {
        console.log('hello');

        const sourceWeb3 = new Web3('http://localhost:8546');
        const targetWeb3 = new Web3('http://localhost:8547');


        const proofGenerator = new ProofGenerator(sourceWeb3, targetWeb3);
        const outboxProof = await proofGenerator.getOutboxProof('0xbf4263c8842b48c2f7cb1ceb237ae0207952edab',['0xfae36c71e25c3026c43f5316caaa308463f1245861775a7ce298ddc00327b78a'], 'latest');
        console.log('outboxProof: ', outboxProof);

        const inboxProof = await proofGenerator.getInboxProof('0x6674323517415d158d023c14319854b7d5546905',['0xfae36c71e25c3026c43f5316caaa308463f1245861775a7ce298ddc00327b78a'], 'latest');
        console.log('inboxProof: ', inboxProof);
    });
});
