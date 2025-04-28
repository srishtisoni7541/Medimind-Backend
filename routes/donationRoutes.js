// routes/donationRoutes.js
import express from 'express';
import authAdmin from '../middlewares/authAdmin.js'
import { 
  registerDonor,
  updateDonorProfile,
  getDonorProfile,
  searchDonors,
  setDonorAvailability
} from '../controllers/donorController.js';
import {
  createDonationRequest,
  updateDonationRequest,
  getAllDonationRequests,
  getHospitalDonationRequests,
  matchDonorsWithRequest,
  getDonationRequestById
} from '../controllers/donationRequestController.js';
import {
  scheduleDonation,
  completeDonation,
  cancelDonation,
  getDonorDonations,
  getHospitalDonations
} from '../controllers/donationController.js';
import {  isHospital} from '../middlewares/Hospitalcheck.js';
import isAuthenticated from '../middlewares/authUser.js'

const router = express.Router();

// Donor routes
router.post('/donors/register', isAuthenticated, registerDonor);
router.put('/donors/update', isAuthenticated, updateDonorProfile);
router.get('/donors/profile', isAuthenticated, getDonorProfile);
router.put('/donors/availability', isAuthenticated, setDonorAvailability);

// Hospital can search for donors
router.get('/donors/search', isAuthenticated, isHospital, searchDonors);

// Donation request routes
router.post('/requests', isAuthenticated, isHospital, createDonationRequest);
router.put('/requests/:requestId', isAuthenticated, isHospital, updateDonationRequest);
router.get('/requests/:requestId', getDonationRequestById);
router.get('/requests', getAllDonationRequests);
router.get('/hospitals/requests', isAuthenticated, isHospital, getHospitalDonationRequests);
router.get('/requests/:requestId/match', isAuthenticated, isHospital, matchDonorsWithRequest);

// Donation tracking routes
router.post('/donations/schedule', isAuthenticated, isHospital, scheduleDonation);
router.put('/donations/:donationId/complete', isAuthenticated, isHospital, completeDonation);
router.put('/donations/:donationId/cancel', isAuthenticated, cancelDonation);
router.get('/donors/donations', isAuthenticated, getDonorDonations);
router.get('/hospitals/donations', isAuthenticated, isHospital, getHospitalDonations);



router.post('/admin/donors/register', authAdmin, registerDonor);
router.put('/admin/donors/update', authAdmin, updateDonorProfile);
router.get('/admin/donors/profile', authAdmin, getDonorProfile);
router.put('/admin/donors/availability', authAdmin, setDonorAvailability);

// Hospital can search for donors
router.get('/admin/donors/search', authAdmin, isHospital, searchDonors);

// Donation request routes
router.post('/admin/requests', authAdmin, isHospital, createDonationRequest);
router.put('/admin/requests/:requestId', authAdmin, isHospital, updateDonationRequest);
router.get('/admin/requests/:requestId', getDonationRequestById);
router.get('/admin/requests', getAllDonationRequests);
router.get('/admin/hospitals/requests', authAdmin, isHospital, getHospitalDonationRequests);
router.get('/admin/requests/:requestId/match', authAdmin, isHospital, matchDonorsWithRequest);

// Donation tracking routes
router.post('/admin/donations/schedule', authAdmin, isHospital, scheduleDonation);
router.put('/admin/donations/:donationId/complete', authAdmin, isHospital, completeDonation);
router.put('/admin/donations/:donationId/cancel', authAdmin, cancelDonation);
router.get('/admin/donors/donations', authAdmin, getDonorDonations);
router.get('/admin/hospitals/donations', authAdmin, isHospital, getHospitalDonations);
export default router;