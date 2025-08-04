import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import { MdEdit, MdDelete } from "react-icons/md";
import { useAuth } from "../../Context/AuthContext";
import { useReviews } from "../../hooks/useReviews";
import { UpdateReviewData, Review } from "../../services/reviewService";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaFilter,
  FaTimes,
  FaUpload,
} from "react-icons/fa";

const UserReviews: React.FC = () => {
  const { user } = useAuth(); // Auth context to check user status
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "photos">("reviews");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const {
    reviewsResponse,
    isLoading,
    error,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useReviews();

  // Retrieve user data from localStorage
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "latest" ? "oldest" : "latest"));
  };

  const sortedReviews = React.useMemo(() => {
    return reviewsResponse
      ?.slice()
      .sort(
        (
          a: { createdAt: string | number | Date },
          b: { createdAt: string | number | Date }
        ) => {
          return sortOrder === "latest"
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
      );
  }, [reviewsResponse, sortOrder]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UpdateReviewData>({
    defaultValues: {
      name: `${userData.firstName} ${userData.lastName}`,
      rating: 1,
      comment: "",
    },
  });

  // Handlers
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsSubmitted(false);
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      setIsModalOpen(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  // Submit handler for updating or submitting the review
  const onSubmit: SubmitHandler<UpdateReviewData> = (data) => {
    if (editingReview) {
      const updatedData: UpdateReviewData = {
        name: `${userData.firstName} ${userData.lastName}`,
        rating: data.rating,
        comment: data.comment,
        ...(imagePreview && { image: imagePreview }),
      };
      updateMutation.mutate({ id: editingReview._id, updatedData });
    } else {
      const reviewData = {
        userId: userData._id,
        rating: data.rating,
        comment: data.comment,
        ...(imagePreview && { image: imagePreview }),
      };
      createMutation.mutate(reviewData);
    }
  };

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
    }
  };

  // Render rating stars
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        className={`w-5 h-5 ${
          index < rating ? "text-yellow-400" : "text-gray-300"
        } transition-transform duration-300 transform hover:scale-110`}
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 24 24"
        stroke="currentColor"
        onClick={() => setValue("rating", index + 1)}
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.18 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </svg>
    ));
  };

  // Process reviews or display the "No reviews found" message
  let processedReviews: Review[] = [];
  let noReviewsFound = false;

  if (Array.isArray(reviewsResponse)) {
    processedReviews = reviewsResponse;
  } else if (reviewsResponse?.msg === "No reviews found") {
    noReviewsFound = true;
  }

  // Edit review functionality
  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setValue("name", review.username);
    setValue("rating", review.rating);
    setValue("comment", review.comment);
    setIsModalOpen(true);
  };

  // Delete review functionality
  const handleDeleteReview = (review: Review) => {
    setReviewToDelete(review);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (reviewToDelete) {
      deleteMutation.mutate(reviewToDelete._id);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setReviewToDelete(null);
  };

  // Close modal on successful add/edit/delete operation
  useEffect(() => {
    if (createMutation.isSuccess || updateMutation.isSuccess) {
      handleCloseModal();
    }
  }, [createMutation.isSuccess, updateMutation.isSuccess]);

  // Close delete modal on successful delete operation
  useEffect(() => {
    if (deleteMutation.isSuccess) {
      handleCancelDelete();
    }
  }, [deleteMutation.isSuccess]);

  // Additional JSX for rendering reviews
  return (
    <>
      <div
        className="min-h-screen bg-white flex items-center justify-center p-4"
        style={{ paddingTop: "4rem", paddingBottom: "4rem" }}
      >
        <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden relative animate-fade-in">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-400 text-white text-center py-8 px-6 relative">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="absolute left-6 top-1/2 transform -translate-y-1/2 p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition"
            >
              <FaArrowLeft size={20} /> {/* Back icon */}
            </button>
            <button
              onClick={toggleSortOrder}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 p-2 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 transition"
              title={`Sort by ${
                sortOrder === "latest" ? "Oldest" : "Latest"
              } Date`}
            >
              <FaFilter size={18} />
            </button>

            {/* Centered Heading */}
            <h1 className="text-4xl font-extrabold mb-2">
              {activeTab === "reviews" ? "Reviews" : "Photos "}
            </h1>
          </div>
          {/* Content Section */}
          <div className="p-4 ">
            <div className="mb-6 flex justify-center gap-4">
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === "reviews"
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-800"
                } transition-colors duration-300`}
              >
                Reviews
              </button>
              <button
                onClick={() => setActiveTab("photos")}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === "photos"
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-800"
                } transition-colors duration-300`}
              >
                Photos
              </button>
            </div>

            {/* Loading and Error States */}
            {isLoading && (
              <div className="flex justify-center h-34">
                <div className="inline-block text-center">
                  <div
                    className="inline-block h-16 w-16 animate-spin rounded-full border-8 border-solid border-red-500 border-r-transparent align-[-0.125em] text-danger motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                  >
                    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                      Loading...
                    </span>
                  </div>
                  <p className="text-lg text-gray-600 mt-4">Loading...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-gray-100 rounded-xl shadow-md p-6 flex flex-col items-center text-center">
                <FaExclamationTriangle
                  size={48}
                  className="text-red-500 mb-4"
                />
                <h2 className="text-xl font-semibold text-red-600 mb-2">
                  Error Fetching Reviews
                </h2>
                <p className="text-gray-700 mb-4">
                  There was an issue connecting to the review service. Please
                  check your internet connection or try again later.
                </p>
              </div>
            )}

            {/* No reviews found */}
            {noReviewsFound && (
              <div className="text-center text-gray-600">No reviews found.</div>
            )}

            {/* Display reviews in the "User Reviews" tab */}
            {activeTab === "reviews" &&
              !isLoading &&
              !error &&
              !noReviewsFound && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                  {[
                    // Reorder: Place the logged-in user's review at the 0th index
                    ...sortedReviews?.filter(
                      (review: Review) => review._id === user?.reviewId
                    ),
                    ...sortedReviews?.filter(
                      (review: Review) => review._id !== user?.reviewId
                    ),
                  ].map((review: Review, index) => (
                    <div
                      key={index}
                      className="border border-gray-300 bg-white rounded-lg shadow-md p-4 flex flex-col gap-2 transition-transform transform hover:scale-105 animate-fade-in relative"
                      style={{ paddingBottom: "2rem" }} // Reduced padding for the card
                    >
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="w-full md:w-2/5 bg-gray-200 p-3 flex flex-col items-center justify-between rounded-lg">
                          <div className="bg-red-500 rounded-full w-16 h-16 flex items-center justify-center mb-2 text-white text-xl font-semibold">
                            {review.username[0]}
                          </div>
                          <h3 className="text-base font-semibold text-gray-800">
                            <strong>{review.username}</strong>
                          </h3>
                          {/* Display the formatted creation date */}
                          <p className="text-sm text-gray-500 whitespace-nowrap">
                            {new Intl.DateTimeFormat("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }).format(new Date(review.createdAt))}
                          </p>
                        </div>
                        <div className="w-full md:w-3/5 flex flex-col">
                          <div className="flex flex-col items-start mb-3 flex-grow">
                            <div className="flex items-center space-x-1 mb-1">
                              {renderStars(review.rating)}
                              <span className="text-base font-semibold text-gray-800 ml-2">
                                {review.rating} / 5
                              </span>
                            </div>
                          </div>
                          {review.image && (
                            <div className="relative group overflow-hidden rounded-lg shadow-lg transform transition-transform duration-300 hover:scale-105">
                              <img
                                src={review.image}
                                alt="Review"
                                className="hidden sm:block w-full h-20 object-cover mb-2 rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span
                                  className="text-white text-base font-semibold cursor-pointer"
                                  onClick={() =>
                                    setSelectedImage(review.image!)
                                  }
                                >
                                  Zoom
                                </span>
                              </div>
                            </div>
                          )}
                          <p className="text-sm text-gray-700 border border-gray-300 p-3 rounded-lg h-20 overflow-auto">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                      {/* Show edit and delete buttons for logged-in user's review */}
                      {user?.reviewId === review._id && (
                        <div className="absolute bottom-2 right-2 flex gap-1">
                          <button
                            onClick={() => handleEditReview(review)}
                            className="text-gray-500 hover:text-gray-700"
                            title="Edit Review"
                          >
                            <MdEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete Review"
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            {/* Display reviews with images in the "Photos" tab */}
            {activeTab === "photos" &&
              !isLoading &&
              !error &&
              !noReviewsFound && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
                  {processedReviews
                    .filter((review) => review.image)
                    .map((review, index) => (
                      <div
                        key={index}
                        className="relative group overflow-hidden rounded-lg shadow-lg transform transition-transform duration-300 hover:scale-105"
                      >
                        {review.image && (
                          <img
                            src={review.image}
                            alt={`Gallery item ${index + 1}`}
                            className="w-full h-40 object-cover"
                          />
                        )}
                        <h3 className="text-center text-sm font-bold mt-2">
                          {review.username}
                        </h3>
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span
                            className="text-white text-lg md:text-xl font-semibold cursor-pointer"
                            onClick={() => setSelectedImage(review.image!)}
                          >
                            Zoom
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
          </div>

          {/* Add Review Button */}
          {/* <button
            onClick={handleOpenModal}
            disabled={!user || loggedInUserReview !== false} // Disable if not authenticated or if the user already has a review
            className={`fixed bottom-14 left-1/2 transform -translate-x-1/2 p-3 rounded-full shadow-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-transform duration-300 hover:scale-105 ${
              !user || loggedInUserReview !== false
                ? "bg-red-600 opacity-50 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            + Add Review
          </button> */}

          {/* <button
            onClick={handleOpenModal}
            disabled={!user || !!user?.reviewId} // Disable if not authenticated or if the user already has a review
            className={`fixed bottom-14 left-1/2 transform -translate-x-1/2 p-3 rounded-full shadow-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-transform duration-300 hover:scale-105 ${
              !user || !!user?.reviewId
                ? "bg-red-600 opacity-50 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            + Add Review
          </button> */}

          {/* <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition"
          >
            Back
          </button> */}
        </div>

        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
            <img
              src={selectedImage}
              alt="Selected"
              className="max-w-full max-h-80 object-contain rounded-lg shadow-lg"
            />
            <span
              className="text-white text-2xl font-bold cursor-pointer mt-4 bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors duration-300"
              onClick={() => setSelectedImage(null)}
            >
              Close
            </span>
          </div>
        )}

        <button
          onClick={handleOpenModal}
          disabled={!user || !!user?.reviewId} // Disable if not authenticated or if the user already has a review
          className={`fixed bottom-14 left-1/2 transform -translate-x-1/2 p-3 rounded-full shadow-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-transform duration-300 hover:scale-105 ${
            !user || !!user?.reviewId
              ? "bg-red-600 opacity-50 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          + Add Review
        </button>

        {isModalOpen && (
          <div
            className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 backdrop-blur-sm transition-opacity duration-300 ${
              isClosing ? "opacity-0" : "opacity-100"
            } p-4`}
          >
            <div
              ref={modalRef}
              className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 transition-transform duration-300 ${
                isClosing ? "transform scale-75" : "transform scale-100"
              } relative`}
            >
              {isSubmitted ? (
                <div className="flex flex-col items-center">
                  <div className="relative flex items-center justify-center mb-4">
                    <FaCheckCircle className="text-green-500 w-12 h-12 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-800 mb-2 animate-fade-in text-center">
                    Thank you for your feedback!
                  </h3>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold mb-4 animate-fade-in text-center text-gray-700">
                    Submit Your Review
                  </h3>
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-4 animate-fade-in"
                  >
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        {...register("name", {
                          required: "Name is required",
                        })}
                        value={`${userData.firstName} ${userData.lastName}`}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-gray-100"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        User ID: {userData._id}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Review ID: {userData.reviewId}
                      </p>
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Rating
                      </label>
                      <div className="flex items-center gap-2">
                        {renderStars(watch("rating"))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Comment
                      </label>
                      <textarea
                        {...register("comment", {
                          required: "Comment is required",
                          maxLength: {
                            value: 200,
                            message: "Comment cannot exceed 200 characters",
                          },
                        })}
                        placeholder="Enter your comment (max 200 characters)"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      {errors.comment && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.comment.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Image
                      </label>
                      <div className="mt-1 flex justify-center px-4 pt-3 pb-4 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <FaUpload className="text-gray-400 mx-auto h-8 w-8" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none"
                            >
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                type="file"
                                accept="image/*"
                                {...register("fileUpload", {
                                  onChange: (e) => handleImageChange(e),
                                })}
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                      </div>

                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-24 object-cover mt-2 rounded-lg"
                        />
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="bg-gray-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-gray-600 transition-transform transform hover:scale-105"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-red-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-red-600 transition-transform transform hover:scale-105"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </>
              )}
              <button
                onClick={handleCloseModal}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors duration-300"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div
            className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 backdrop-blur-sm transition-opacity duration-300 ${
              isClosing ? "opacity-0" : "opacity-100"
            } p-4`}
          >
            <div
              className={`bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full relative transition-transform duration-300 ${
                isClosing
                  ? "transform scale-75 opacity-0"
                  : "transform scale-100 opacity-100"
              }`}
            >
              <div className="flex flex-col items-center">
                {/* Warning Icon */}
                <div className="bg-red-100 p-4 rounded-full mb-4 animate-pulse">
                  <FaExclamationCircle className="w-10 h-10 text-red-600" />
                </div>

                {/* Modal Title */}
                <h2 className="text-xl font-extrabold text-gray-800 text-center mb-2 animate-fade-in">
                  Confirm Deletion
                </h2>
                <p className="text-sm text-gray-600 text-center mb-6">
                  Are you sure you want to permanently delete this review? This
                  action cannot be undone.
                </p>

                {/* Action Buttons */}
                <div className="flex w-full justify-center gap-4">
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-transform duration-200 ease-in-out transform hover:scale-105"
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 rounded-lg transition-transform duration-200 ease-in-out transform hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleCancelDelete}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors duration-300"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserReviews;
