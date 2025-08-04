import React, { useState } from "react";
import useRegisterForm from "../../hooks/useRegisterForm";
import { Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FiCheck } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";

const Register: React.FC = () => {
  const {
    register,
    errors,
    isValid,
    isLoading,
    states,
    cities,
    districts,
    handleCountryChange,
    handleStateChange,
    handleDistrictChange,
    watch,
    onSubmit,
  } = useRegisterForm();

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const countries = ["Select Country", "India"];

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false); // Add this state to manage password visibility

  const steps = [
    { id: 1, label: "Personal Details" },
    { id: 2, label: "Additional details" },
    { id: 3, label: "Preview" },
  ];

  // Get all form values using watch to display in the confirmation modal
  const formValues = watch();

  // Handle opening confirmation modal on form submission
  const handleOpenConfirmModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
    }
  };

  // Final submission after confirmation
  const handleConfirmSubmit = () => {
    onSubmit();
  };

  return (
    <>
      <div
        className="min-h-screen bg-white flex items-center justify-center p-4"
        style={{ paddingTop: "4rem", paddingBottom: "4rem" }}
      >
        <Toaster />
        <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden relative animate-fade-in">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-400 text-white text-center py-8 px-6">
            <h1 className="text-4xl font-extrabold mb-2">Register</h1>
          </div>

          {/* Content Section */}
          <div className="flex flex-col sm:flex-row">
            <div className="hidden sm:flex sm:w-1/2 h-[350px] justify-center items-center relative mt-24">
              <video
                src="https://res.cloudinary.com/dqm7wf4zi/video/upload/v1734541688/theLifeSaversVideo_mrchef.mp4"
                poster="https://res.cloudinary.com/dqm7wf4zi/image/upload/v1734541684/thelifesaverslogo_odohxz.png"
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-contain"
                aria-label="Background video"
                preload="auto"
              />
            </div>
            <div className="w-full sm:w-1/2 p-8 flex flex-col justify-center items-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                Be a{" "}
                <span className="text-3xl text-red-600 font-bold">
                  Life Saver:
                </span>{" "}
                Donate Blood, Save Lives!
              </h2>
              <div className="flex items-center mb-2 w-full">
                <hr className="flex-1 border-gray-300" />
                <span className="mx-4 text-sm text-gray-600">
                  Register here
                </span>
                <hr className="flex-1 border-gray-300" />
              </div>

              <form
                onSubmit={handleOpenConfirmModal}
                className="space-y-4 w-full"
              >
                <div className="w-full max-w-3xl mx-auto">
                  <div className="flex items-center justify-between relative mb-8">
                    {/* Progress bar container */}
                    <div className="absolute top-5 left-0 w-full">
                      <div className="absolute h-[2px] bg-gray-200 w-full max-w-[calc(100%-8rem)] left-1/2 -translate-x-1/2" />
                      <div
                        className="absolute h-[3px] bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
                        style={{
                          width: `${Math.max(
                            0,
                            ((step - 1) / (steps.length - 1)) *
                              (100 - 100 / steps.length)
                          )}%`,
                          left: "3.7rem",
                        }}
                      />
                    </div>

                    {/* Steps */}
                    <div className="relative z-10 w-full flex justify-between items-center gap-4">
                      {steps.map((s) => (
                        <div
                          key={s.id}
                          className="flex-1 flex flex-col items-center min-w-[80px]"
                        >
                          <div className="relative">
                            {step >= s.id && (
                              <div className="absolute inset-0 bg-red-400/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300 animate-pulse" />
                            )}
                            <div
                              className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full transition-all duration-300
                  ${
                    step >= s.id
                      ? "bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
                      : "border-2 border-gray-200 bg-white"
                  } hover:-translate-y-0.5 group cursor-pointer`}
                            >
                              {step > s.id ? (
                                <FiCheck className="h-4 w-4 md:h-5 md:w-5 text-white transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200 stroke-[3]" />
                              ) : (
                                <span
                                  className={`text-xs md:text-sm font-bold ${
                                    step >= s.id
                                      ? "text-white"
                                      : "text-gray-400 group-hover:text-gray-600"
                                  } transition-colors duration-200`}
                                >
                                  {String(s.id).padStart(2, "0")}
                                </span>
                              )}
                              {step === s.id && (
                                <div className="absolute inset-0 border-2 border-red-500/50 rounded-full animate-ping" />
                              )}
                            </div>
                          </div>
                          <span
                            className={`mt-2 text-xs md:text-sm font-bold text-center ${
                              step >= s.id
                                ? "text-gray-900 group-hover:text-red-600"
                                : "text-gray-400 group-hover:text-gray-600"
                            } transition-colors duration-200 whitespace-nowrap px-1`}
                          >
                            {s.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* First Name */}
                  {step === 1 && (
                    <>
                      <div>
                        <label
                          htmlFor="firstName"
                          className="block text-sm font-medium text-gray-700"
                        >
                          First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          placeholder="Enter your first name"
                          {...register("firstName", {
                            required: "First name is required",
                            maxLength: {
                              value: 50,
                              message: "First name cannot exceed 50 characters",
                            },
                          })}
                          className={`mt-1 block w-full px-3 py-2 border ${
                            errors.firstName
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                          aria-invalid={!!errors.firstName}
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.firstName.message}
                          </p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div>
                        <label
                          htmlFor="lastName"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          placeholder="Enter your last name"
                          {...register("lastName", {
                            required: "Last name is required",
                            maxLength: {
                              value: 50,
                              message: "Last name cannot exceed 50 characters",
                            },
                          })}
                          className={`mt-1 block w-full px-3 py-2 border ${
                            errors.lastName
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                          aria-invalid={!!errors.lastName}
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.lastName.message}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          placeholder="Enter your email"
                          {...register("email", {
                            required: "Email is required",
                            pattern: {
                              value: /^\S+@\S+$/i,
                              message: "Invalid email address",
                            },
                          })}
                          className={`mt-1 block w-full px-3 py-2 border ${
                            errors.email ? "border-red-500" : "border-gray-300"
                          } rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                          aria-invalid={!!errors.email}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.email.message}
                          </p>
                        )}
                      </div>

                      {/* Password */}
                      <div className="relative">
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            placeholder="Enter your password"
                            {...register("password", {
                              required: "Password is required",
                              minLength: {
                                value: 8,
                                message:
                                  "Password must be at least 8 characters long",
                              },
                            })}
                            className={`mt-1 block w-full px-3 py-2 pr-10 border ${
                              errors.password
                                ? "border-red-500"
                                : "border-gray-300"
                            } rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                            aria-invalid={!!errors.password}
                            style={{ paddingRight: "2.5rem" }} // Ensures space for the icon
                          />
                          <div
                            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                            onClick={() => setShowPassword((prev) => !prev)} // Toggle password visibility
                          >
                            {showPassword ? (
                              <AiFillEyeInvisible className="text-gray-500" />
                            ) : (
                              <AiFillEye className="text-gray-500" />
                            )}
                          </div>
                        </div>
                        {errors.password && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.password.message}
                          </p>
                        )}
                      </div>

                      {/* Mobile Number */}
                      <div>
                        <label
                          htmlFor="mobileNumber"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Mobile Number
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            +91
                          </span>
                          <input
                            id="mobileNumber"
                            placeholder="Please Enter Your Mobile Number"
                            {...register("mobileNumber", {
                              required: "Mobile number is required",
                              pattern: {
                                value: /^[0-9]{10}$/, // regex to enforce 10 digits
                                message: "Mobile number must be 10 digits",
                              },
                            })}
                            inputMode="numeric" // Enforces numeric keypad on mobile devices
                            pattern="[0-9]*" // Enforces only numeric characters
                            onInput={(e) => {
                              const target = e.target as HTMLInputElement; // Type assertion
                              target.value = target.value.replace(
                                /[^0-9]/g,
                                ""
                              ); // Remove non-numeric characters
                            }}
                            className={`flex-1 block w-full px-3 py-2 border ${
                              errors.mobileNumber
                                ? "border-red-500"
                                : "border-gray-300"
                            } rounded-r-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                            aria-invalid={!!errors.mobileNumber}
                          />
                        </div>
                        {errors.mobileNumber && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.mobileNumber.message}
                          </p>
                        )}
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label
                          htmlFor="dob"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Date of Birth
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            📅
                          </span>
                          <input
                            type="date" // Use type="date" for a date picker
                            id="dob"
                            {...register("dob", {
                              required: "Date of Birth is required",
                              validate: (value) => {
                                const today = new Date();
                                const dob = new Date(value);
                                const age =
                                  today.getFullYear() - dob.getFullYear();
                                const isOldEnough =
                                  age > 18 ||
                                  (age === 18 &&
                                    today >=
                                      new Date(
                                        dob.setFullYear(today.getFullYear())
                                      ));
                                return (
                                  isOldEnough ||
                                  "You must be at least 18 years old to register"
                                );
                              },
                            })}
                            className={`flex-1 block w-full px-3 py-2 border ${
                              errors.dob ? "border-red-500" : "border-gray-300"
                            } rounded-r-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                            aria-invalid={!!errors.dob}
                          />
                        </div>
                        {errors.dob && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.dob.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="gender"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Gender
                        </label>
                        <select
                          id="gender"
                          {...register("gender", {
                            required: "Gender is required",
                          })}
                          className={`mt-1 block w-full px-3 py-2 border ${
                            errors.gender ? "border-red-500" : "border-gray-300"
                          } rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                          aria-invalid={!!errors.gender}
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        {errors.gender && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.gender.message}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      {/* Blood Group */}
                      <div>
                        <label
                          htmlFor="bloodGroup"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Blood Group
                        </label>
                        <select
                          id="bloodGroup"
                          {...register("bloodGroup", {
                            required: "Blood group is required",
                          })}
                          className={`mt-1 block w-full px-3 py-2 border ${
                            errors.bloodGroup
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                          aria-invalid={!!errors.bloodGroup}
                        >
                          <option value="">Select Blood Group</option>
                          {bloodGroups.map((group, index) => (
                            <option key={index} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                        {errors.bloodGroup && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.bloodGroup.message}
                          </p>
                        )}
                      </div>
                      {/* Availability */}
                      <div>
                        <label
                          htmlFor="availability"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Availability
                        </label>
                        <select
                          id="availability"
                          {...register("availability", {
                            required: "Availability is required",
                          })}
                          className={`mt-1 block w-full px-3 py-2 border ${
                            errors.availability
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                          defaultValue="available"
                          aria-invalid={!!errors.availability}
                        >
                          <option value="available">Available</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                        {errors.availability && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.availability.message}
                          </p>
                        )}
                      </div>

                      {/* Country */}
                      <div>
                        <label
                          htmlFor="country"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Country
                        </label>
                        <select
                          id="country"
                          {...register("country", {
                            required: "Country is required",
                          })}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border ${
                            errors.country
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                          aria-invalid={!!errors.country}
                        >
                          {countries.map((country, index) => (
                            <option key={index} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                        {errors.country && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.country.message}
                          </p>
                        )}
                      </div>

                      {/* State */}
                      <div>
                        <label
                          htmlFor="state"
                          className="block text-sm font-medium text-gray-700"
                        >
                          State
                        </label>
                        <select
                          id="state"
                          {...register("state", {
                            required: "State is required",
                          })}
                          onChange={(e) => handleStateChange(e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border ${
                            errors.state ? "border-red-500" : "border-gray-300"
                          } rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                          aria-invalid={!!errors.state}
                        >
                          <option value="">Select State</option>
                          {states.map((state, index) => (
                            <option key={index} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                        {errors.state && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.state.message}
                          </p>
                        )}
                      </div>

                      {/* District */}
                      <div>
                        <label
                          htmlFor="district"
                          className="block text-sm font-medium text-gray-700"
                        >
                          District
                        </label>
                        <select
                          id="district"
                          {...register("district", {
                            required: "District is required",
                          })}
                          onChange={(e) => handleDistrictChange(e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border ${
                            errors.district
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                          aria-invalid={!!errors.district}
                        >
                          <option value="">Select District</option>
                          {districts.map((district, index) => (
                            <option key={index} value={district}>
                              {district}
                            </option>
                          ))}
                        </select>
                        {errors.district && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.district.message}
                          </p>
                        )}
                      </div>

                      {/* City */}
                      <div>
                        <label
                          htmlFor="city"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Sub Districts/City
                        </label>
                        <select
                          id="city"
                          {...register("city", {
                            required: "City is required",
                          })}
                          className={`mt-1 block w-full px-3 py-2 border ${
                            errors.city ? "border-red-500" : "border-gray-300"
                          } rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                          aria-invalid={!!errors.city}
                        >
                          <option value="">Select City</option>
                          {cities.map((city, index) => (
                            <option key={index} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        {errors.city && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.city.message}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {step === 3 && (
                  <div className="w-full">
                    {/* Confirm Your Details */}
                    <div className="w-full bg-gray-50 border rounded-lg p-6 shadow-sm text-center">
                      <h3 className="text-2xl font-semibold text-gray-700 mb-6">
                        Confirm Your Details
                      </h3>

                      {/* Details Section */}
                      <div className="max-w-2xl mx-auto space-y-4">
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium text-gray-600">
                            First Name:
                          </span>
                          <span className="text-gray-800">
                            {formValues.firstName}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium text-gray-600">
                            Last Name:
                          </span>
                          <span className="text-gray-800">
                            {formValues.lastName}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium text-gray-600">
                            Email:
                          </span>
                          <span className="text-gray-800">
                            {formValues.email}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium text-gray-600">
                            Mobile Number:
                          </span>
                          <span className="text-gray-800">
                            {formValues.mobileNumber}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium text-gray-600">
                            DOB:
                          </span>
                          <span className="text-gray-800">
                            {formValues.dob}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium text-gray-600">
                            Blood Group:
                          </span>
                          <span className="text-gray-800">
                            {formValues.bloodGroup}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium text-gray-600">
                            Gender:
                          </span>
                          <span className="text-gray-800">
                            {formValues.gender}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium text-gray-600">
                            Country:
                          </span>
                          <span className="text-gray-800">
                            {formValues.country}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium text-gray-600">
                            State:
                          </span>
                          <span className="text-gray-800">
                            {formValues.state}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium text-gray-600">
                            District:
                          </span>
                          <span className="text-gray-800">
                            {formValues.district}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-medium text-gray-600">
                            City:
                          </span>
                          <span className="text-gray-800">
                            {formValues.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="mt-6 flex flex-col items-center">
                      <div className="flex items-center space-x-2">
                        <input
                          id="termsAccepted"
                          type="checkbox"
                          {...register("termsAccepted", { required: true })}
                          className="h-4 w-4 accent-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="termsAccepted"
                          className="text-sm text-gray-900"
                        >
                          I agree to the{" "}
                          <Link
                            to="/terms-and-conditions"
                            className="text-red-600 hover:text-red-500 font-medium"
                          >
                            Terms and Conditions
                          </Link>
                        </label>
                      </div>
                      {errors.termsAccepted && (
                        <p className="text-red-500 text-sm mt-2">
                          You must accept the terms to continue.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  {step > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setStep(step - 1)}
                        className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-600 hover:text-white"
                      >
                        Previous
                      </button>
                      {step < steps.length && (
                        <button
                          type="button"
                          onClick={() => setStep(step + 1)}
                          disabled={!isValid}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-end w-full">
                      {step < steps.length && (
                        <button
                          type="button"
                          onClick={() => setStep(step + 1)}
                          disabled={!isValid}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      )}
                    </div>
                  )}

                  {step === steps.length && (
                    <button
                      type="button"
                      disabled={!isValid || isLoading} // Disable if form is not valid or loading
                      onClick={handleConfirmSubmit}
                      className={`px-4 py-2 text-white rounded-lg bg-red-500 hover:bg-red-600 transition-transform transform duration-300 ${
                        (!isValid || isLoading) &&
                        "opacity-50 cursor-not-allowed hover:bg-red-500"
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <FaSpinner className="animate-spin h-5 w-5 text-white mr-2" />
                          Registering...
                        </div>
                      ) : (
                        "Confirm & Register"
                      )}
                    </button>
                  )}
                </div>

                {/* Login Link */}
                <div className="flex items-center mt-4">
                  <hr className="flex-1 border-gray-300" />
                  <span className="mx-4 text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-red-600 hover:text-red-500 font-medium"
                    >
                      Login here
                    </Link>
                  </span>
                  <hr className="flex-1 border-gray-300" />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
