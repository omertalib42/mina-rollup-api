import fastify from 'fastify'
import fetch from 'node-fetch'
import Queue from 'queue'

const server = fastify()

const { spawn } = require('child_process');

// Start the server script in a separate process
const serverProcess = spawn('node', ['./build/prover.js']);

// Optional: Log output from the server script
serverProcess.stdout.on('data', (data: any) => {
    console.log(`Server: ${data}`);
});

serverProcess.stderr.on('data', (data: any) => {
    console.error(`Server Error: ${data}`);
});

serverProcess.on('close', (code: any) => {
    console.log(`Server process exited with code ${code}`);
});


server.get('/ping', async (request, reply) => {
    return 'pong\n'
})

// let utxo_tree = {};
// let nullifier_tree = {};

let global_mempool = new Queue({ results: [] })
let processingQueue = false;

// interface Query {
//     input_utxos: [string],
//     output_utxos: [string],
//     signatures: [string],
// }

interface IReply {
    200: { success: boolean };
    302: { url: string };
    '4xx': { error: string };
}


server.post<{ Reply: IReply }>('/accept_tx', async (request: any, reply) => {
    global_mempool.push(request.body);
    console.log(global_mempool.length, request.body);
    if (global_mempool.length >= 3 && !processingQueue) {
        processingQueue = true;
        let dataToSend = [];
        for (let i = 0; i < 3; i++) {
            dataToSend.push(global_mempool.pop());
        }
        dataToSend.reverse();
        try {
            const response = await fetch('http://127.0.0.1:3030/prover', {
                method: 'POST',
                body: JSON.stringify(dataToSend),
                headers: { 'Content-Type': 'application/json' },
            });
            const json = await response.json();
            console.log(json);
            global_mempool = new Queue({ results: [] }); // Clear the queue
        } catch (error) {
            console.log(error);
        } finally {
            processingQueue = false;
        }

        return reply.status(302).send({ url: "/prover" });
    }

    reply.status(200).send({ success: true })
})

server.listen({ port: 8080 }, (err, address) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }
    console.log(`Server listening at ${address}`)
})

export { global_mempool };