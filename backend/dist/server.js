"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./utils/env");
const client_1 = require("./prisma/client");
async function main() {
    try {
        await client_1.prisma.$connect();
        console.log('[db] Connected to PostgreSQL');
    }
    catch (err) {
        console.error('[db] Connection failed', err);
        process.exit(1);
    }
    app_1.app.listen(env_1.env.PORT, () => {
        console.log(`[server] Listening on http://localhost:${env_1.env.PORT}`);
    });
}
void main();
