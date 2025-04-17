// Import necessary models
import Hospital from "../models/hospital.js";
import User from "../models/userModel.js";
import HospitalReview from "../models/hospitalReview.js";

// Add a hospital review
export const addHospitalReview = async (req, res) => {
  try {
    const { ratings, comment } = req.body;
    console.log(req.body);
    
    // Check if the hospital exists
    const hospitalExists = await Hospital.findById(req.params.hospitalId);
    if (!hospitalExists) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }
    
    const loggedInuser = await User.findById(req.user._id);
    if (!loggedInuser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Create a new review
    const newReview = new HospitalReview({
      user: loggedInuser._id,
      hospital: hospitalExists._id,
      rating: ratings.overall,
      comment,
      staffFriendliness: ratings.staffFriendliness,
      facilityClean: ratings.facilityClean,
      waitingTime: ratings.waitingTime,
      accessibility: ratings.accessibility,
      appointmentEase: ratings.appointmentEase || 0,
      emergencyResponse: ratings.emergencyResponse || 0,
    });

    await newReview.save();
    hospitalExists.reviews.push(newReview._id);
    hospitalExists.rating = Math.ceil((hospitalExists.rating + newReview.rating)/2);
    await hospitalExists.save();
    loggedInuser.hosreviews.push(newReview._id);
    await loggedInuser.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: newReview
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a hospital review
export const updateHospitalReview = async (req, res) => {
  try {
    const { ratings, comment } = req.body;
    const { reviewId } = req.params;
    
    const review = await HospitalReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    
    // Check if the hospital exists
    const hospitalExists = await Hospital.findById(review.hospital);
    if (!hospitalExists) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }
    
    const loggedInuser = await User.findById(review.user);
    if (!loggedInuser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    if (review.user.toString() !== (req.user._id).toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not authorized to update this review" 
      });
    }
    
    hospitalExists.rating = Math.ceil((hospitalExists.rating + ratings.overall)/2);
    await hospitalExists.save();
    
    review.rating = ratings.overall;
    review.comment = comment;
    review.staffFriendliness = ratings.staffFriendliness;
    review.facilityClean = ratings.facilityClean;
    review.waitingTime = ratings.waitingTime;
    review.accessibility = ratings.accessibility;
    review.appointmentEase = ratings.appointmentEase || 0;
    review.emergencyResponse = ratings.emergencyResponse || 0;

    await review.save();
    
    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all reviews for a hospital
export const getHospitalReviews = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const reviews = await HospitalReview.find({ hospital: hospitalId })
      .populate("user")
      .populate("hospital");
    
    res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data: reviews
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a hospital review
export const deleteHospitalReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await HospitalReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Check if the user is the author of the review
    if (review.user.toString() !== (req.user._id).toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this review"
      });
    }

    // Remove the review from the hospital's reviews array
    await Hospital.findByIdAndUpdate(review.hospital, {
      $pull: { reviews: reviewId },
    });

    // Delete the review
    await HospitalReview.deleteOne({ _id: reviewId });
    
    res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};