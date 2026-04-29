import type { Request, Response } from 'express';
import type { HealthResponse } from '#self/types';

export function createHealthHandler() {
    return function handleHealth(_req: Request, res: Response<HealthResponse>): void {
        res.json({
            status: 'ok',
            service: 'FlowForge Backend',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    };
}
