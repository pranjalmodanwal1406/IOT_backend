const jwt = require('jsonwebtoken');
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')

const verifyToken = (req, res, next) => {
    const token = req.cookies.access_token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return next(createError(401, "You are not authenticated"));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(createError(403, "Token is not valid"));
        }

        req.user = decoded; // Save decoded token to request
        next();
    });
};

const verifyUser = (req, res, next) => {
    verifyToken(req, res, () => {
        // if (req.user.id === req.params.id || req.user.isAdmin) {
        //     next();
        // }
        // else {
        //     return next(createError(403, "You are not authorized!"));
        // }
        next();
    })
}

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        // if (req.user.isAdmin) {
        //     next();
        // }
        // else {
        //     return next(createError(403, "You are not authorized!"));
        // }
        next()
    })
}

module.exports = { verifyToken, verifyUser, verifyAdmin }