const jwt = require('jsonwebtoken');
const User = require('../models/userModel');


const authMiddleware = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({
            message: "No token, authorization denied.",
            status: 401,
            sucess: "false"
        });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        if (!req.user) {
            return res.status(401).json({
                message: "User not found.",
                status: 401,
                sucess: "false"
            });
        }
        next();
    } catch (err) {
        return res.status(401).json({
            message: "Token is not valid.",
            status: 401,
            sucess: "false"
        });
    }
};

module.exports = authMiddleware;