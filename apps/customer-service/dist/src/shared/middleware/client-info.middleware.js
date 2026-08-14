export const requestDataInfo = (req, res, next) => {
    const ip_address = req.ip || req.socket.remoteAddress || 'unknown';
    const user_agent = req.headers['user-agent'] || 'unknown';
    req.requestDataInfo = {
        ip_address,
        user_agent
    };
    next();
};
//# sourceMappingURL=client-info.middleware.js.map