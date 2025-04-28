import hospitalModel from '../models/hospital.js';

export const isHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalModel.findOne({ _id: req.query.hospitalId });
    
    if (!hospital) {
      return res.status(403).json({ message: 'Access denied. Not a hospital account.' });
    }
    
    req.hospital = hospital;
    next();
  } catch (error) { 
    return res.status(500).json({ message: error.message });
  }
};
