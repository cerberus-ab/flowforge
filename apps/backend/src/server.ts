import { loadAppConfig } from '#self/config';
import { Server } from '#self/server';

const server = new Server(loadAppConfig());

await server.start();
