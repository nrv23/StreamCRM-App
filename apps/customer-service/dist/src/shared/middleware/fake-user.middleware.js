export const fakeAuth = (req, res, next) => {
    req.user = {
        id: 18,
        email: "admin@test.com",
        roles: []
    };
    next();
};
//# sourceMappingURL=fake-user.middleware.js.map