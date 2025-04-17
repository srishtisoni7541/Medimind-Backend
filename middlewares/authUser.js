import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
    console.log("running");
    
    try {
        const token = req.headers.utoken;
        console.log(token);
        if (!token) {
            return res.status(403).json({ success: false, message: "Not Authorized. Login Again" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.body.userId = decoded.id
        req.user = decoded.id;
        next();
    } catch (error) {
        console.error(error);
        return res.status(403).json({ success: false, message: error.message });
    }
}

export default authUser;