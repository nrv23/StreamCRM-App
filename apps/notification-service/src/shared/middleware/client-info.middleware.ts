import { NextFunction, Request, Response } from "express";

export const requestDataInfo = (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    const ip_address = req.ip || req.socket.remoteAddress || 'unknown';
    const user_agent = req.headers['user-agent'] || 'unknown';

    req.requestDataInfo = {
        ip_address,
        user_agent
    };

    next();
};