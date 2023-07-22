"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const server = (0, fastify_1.default)();
function toHex(str) {
    var result = '';
    for (var i = 0; i < str.length; i++) {
        result += str.charCodeAt(i).toString(16);
    }
    return result;
}
async function hashData(data) {
    let hash = '';
    for (let i = 0; i < data.length; i++) {
        hash = hash + data[i].toString();
    }
    console.log(toHex(hash));
}
server.post('/prover', async (request, reply) => {
    const body = request.body;
    hashData(body);
    return reply.code(200).send({ success: true });
});
server.listen({ port: 3030 }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
