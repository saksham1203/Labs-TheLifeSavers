// hooks/useUserProfileForm.ts
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { updateUserDataService } from "../services/userService";
import { toast } from "react-hot-toast";

interface IFormInput {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  dob: string;
  country: string;
  state: string;
  district: string;
  city: string;
  bloodGroup: string;
  gender: string;
  availability: string;
  reportUpload?: FileList;
}

export const useUserProfileForm = (user: any) => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<IFormInput>({
    mode: "onChange",
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      mobileNumber: user?.mobileNumber.replace("+91", "") || "",
      dob: user?.dob || "",
      country: user?.country || "",
      state: user?.state || "",
      district: user?.district || "",
      city: user?.city || "",
      bloodGroup: user?.bloodGroup || "",
      gender: user?.gender || "",
      availability: user?.availability || "available",
    },
  });

  const { mutate: updateUserData } = useMutation({
    mutationFn: async (formData: IFormInput) => {
      return await updateUserDataService(user?._id, formData);
    },
    onSuccess: (data) => {
      toast.success("User data updated successfully");
      console.log("User data updated successfully:", data);
    },
    onError: (error) => {
      toast.error("An error occurred while updating user data");
      console.error("An error occurred while updating user data:", error);
    },
  });

  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    const updatedData = {
      ...data,
      mobileNumber: `+91${data.mobileNumber}`,
    };
    updateUserData(updatedData);
  };

  useEffect(() => {
    reset({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      mobileNumber: user?.mobileNumber.replace("+91", "") || "",
      dob: user?.dob || "",
      country: user?.country || "",
      state: user?.state || "",
      district: user?.district || "",
      city: user?.city || "",
      bloodGroup: user?.bloodGroup || "",
      gender: user?.gender || "",
      availability: user?.availability || "available",
    });
  }, [user, reset]);

  return { register, handleSubmit, errors, onSubmit, watch };
};
