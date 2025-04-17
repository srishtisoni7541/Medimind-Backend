import Doctor from "../models/doctorModel.js";
import User from "../models/userModel.js";
import Hospital from "../models/hospital.js";
import DoctorReview from "../models/doctorReview.js";
import HospitalReview from "../models/hospitalReview.js"; // in case you use it later

// Add Doctor Review
export const addDoctorReview = async (req, res) => {
  try {
    const { ratings, comments, tags } = req.body;
    const doctorExists = await Doctor.findById(req.params.doctorId);
    if (!doctorExists) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const userId = req.user._id;
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const newReview = new DoctorReview({
      user: userId,
      doctor: doctorExists._id,
      rating: ratings.overall,
      comment: comments.en,
      hashtags: tags,
      medicalAccuracy: ratings.medicalAccuracy,
      clarityInExplanation: ratings.clarityInExplanation,
      communicationSkills: ratings.communicationSkills,
      punctuality: ratings.punctuality,
      experienceAndExpertise: ratings.experienceAndExpertise,
    });

    doctorExists.reviews.push(newReview._id);
    userExists.docreviews.push(newReview._id);
    doctorExists.rating = (doctorExists.rating + ratings.overall) / 2;

    await doctorExists.save();
    await newReview.save();
    await userExists.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: newReview,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Doctor Reviews
export const getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const reviews = await DoctorReview.find({ doctor: doctorId }).populate("user");
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Doctor Review
export const updateDoctorReview = async (req, res) => {
  try {
    const { ratings, comment, tags } = req.body;
    const { reviewId } = req.params;

    const review = await DoctorReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const doctorExists = await Doctor.findById(review.doctor);
    if (!doctorExists) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const loggedInUser = await User.findById(review.user);
    if (!loggedInUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this review" });
    }

    doctorExists.rating = Math.ceil((doctorExists.rating + ratings.overall) / 2);
    await doctorExists.save();

    review.rating = ratings.overall;
    review.comment = comment;
    review.hashtags = tags;
    review.medicalAccuracy = ratings.medicalAccuracy;
    review.clarityInExplanation = ratings.clarityInExplanation;
    review.communicationSkills = ratings.communicationSkills;
    review.punctuality = ratings.punctuality;
    review.experienceAndExpertise = ratings.experienceAndExpertise;

    await review.save();

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Doctor Review
export const deleteDoctorReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await DoctorReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this review" });
    }

    await Doctor.findByIdAndUpdate(review.doctor, {
      $pull: { reviews: reviewId },
    });

    await DoctorReview.deleteOne({ _id: reviewId });

    res.status(200).json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
