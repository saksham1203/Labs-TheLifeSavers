import axios from "axios";
import { Preferences } from "@capacitor/preferences";

// Define a dynamic API_URL for the reviews API
const API_URL = import.meta.env.VITE_API_URL;

// Interfaces
export interface Review {
  userId: any;
  _id: string;
  username: string;
  rating: number;
  comment: string;
  image?: string;
  createdAt: string;
}

export interface CreateReviewData {
  userId: string;
  rating: number;
  comment: string;
  image?: string;
}

export interface UpdateReviewData {
  name: string;
  rating: number;
  comment: string;
  fileUpload?: FileList;
  image?: string;
}

// Axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Async interceptor to fetch token from Capacitor Preferences
axiosInstance.interceptors.request.use(
  async (config) => {
    const { value: token } = await Preferences.get({ key: "token" });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fetch all reviews
export const fetchReviews = async () => {
  const { data } = await axiosInstance.get("/reviews");
  return data;
};

// Create a new review
export const createReview = async (newReviewData: CreateReviewData) => {
  const { data } = await axiosInstance.post("/reviews", newReviewData);
  return data;
};

// Update review
export const updateReview = async ({
  id,
  updatedData,
}: {
  id: string;
  updatedData: Partial<UpdateReviewData>;
}) => {
  const { data } = await axiosInstance.put(`/reviews/${id}`, updatedData);
  return data;
};

// Delete review
export const deleteReview = async (id: string) => {
  const { data } = await axiosInstance.delete(`/reviews/${id}`);
  return data;
};
