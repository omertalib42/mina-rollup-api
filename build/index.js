"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.global_mempool = void 0;
const fastify_1 = __importDefault(require("fastify"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const queue_1 = __importDefault(require("queue"));
const server = (0, fastify_1.default)();
const { spawn } = require('child_process');
// Start the server script in a separate process
const serverProcess = spawn('node', ['./build/prover.js']);
// Optional: Log output from the server script
serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
});
serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
});
serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
});
server.get('/ping', async (request, reply) => {
    return 'pong\n';
});
// let utxo_tree = {};
// let nullifier_tree = {};
let global_mempool = new queue_1.default({ results: [] });
exports.global_mempool = global_mempool;
let processingQueue = false;
server.post('/accept_tx', async (request, reply) => {
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
            const response = await (0, node_fetch_1.default)('http://127.0.0.1:3030/prover', {
                method: 'POST',
                body: JSON.stringify(dataToSend),
                headers: { 'Content-Type': 'application/json' },
            });
            const json = await response.json();
            console.log(json);
            exports.global_mempool = global_mempool = new queue_1.default({ results: [] }); // Clear the queue
        }
        catch (error) {
            console.log(error);
        }
        finally {
            processingQueue = false;
        }
        return reply.status(302).send({ url: "/prover" });
    }
    reply.status(200).send({ success: true });
});
server.listen({ port: 8080 }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
