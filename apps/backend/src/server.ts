import { loadAppConfig } from '@/config';
import { Server } from '@/server';

const server = new Server(loadAppConfig());

await server.start();
