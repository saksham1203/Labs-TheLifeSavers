import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fetchReviews, createReview, updateReview, deleteReview } from "../services/reviewService";

export const useReviews = () => {
  const queryClient = useQueryClient();

  // Fetch reviews
  const { data: reviewsResponse, isLoading, error } = useQuery({
    queryKey: ["reviews"],
    queryFn: fetchReviews,
  });

  // Create review mutation
  const createMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review added successfully!");
    },
    onError: () => {
      toast.error("Failed to add the review.");
    },
  });

  // Update review mutation
  const updateMutation = useMutation({
    mutationFn: updateReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update the review.");
    },
  });

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete the review.");
    },
  });

  return {
    reviewsResponse,
    isLoading,
    error,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};
