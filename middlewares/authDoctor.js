import jwt from 'jsonwebtoken';

const authDoctor = async (req, res, next) => {
    try {
        const { token } = req.headers
        if (!token) {
            return res.status(403).json({ success: false, message: "Not Authorized. Login Again" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.body.docId = decoded.id

        next();
    } catch (error) {
        console.error(error);
        return res.status(403).json({ success: false, message: error.message });
    }
}

export default authDoctor;