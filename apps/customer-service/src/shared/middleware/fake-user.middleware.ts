import { NextFunction, Request, Response } from "express";

export const fakeAuth = (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    req.user = {
        id: 19,
        email: "admin@test.com",
        roles: []
    };

    next();

}