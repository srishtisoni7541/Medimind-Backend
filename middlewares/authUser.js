import jwt from 'jsonwebtoken';
import User from '../models/userModel.js'
const authUser = async (req, res, next) => {
    console.log("running");
    try {
        const token = req.headers.utoken;
    
        console.log(token,"token");
        if (!token) {
            return res.status(403).json({ success: false, message: "Not Authorized. Login Again" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded,"decoded");
        
        req.body.userId = decoded.id
        const userData = await User.findById(decoded.id);
        
        req.user = userData;
        
        next();
    } catch (error) {
        console.error(error);
        return res.status(403).json({ success: false, message: error.message });
    }
}

export default authUser;