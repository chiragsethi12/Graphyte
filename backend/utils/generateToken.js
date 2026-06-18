import jwt from "jsonwebtoken";

const generateToken = (userId, tokenVersion) => {
    return jwt.sign({ id: userId, tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

export default generateToken;