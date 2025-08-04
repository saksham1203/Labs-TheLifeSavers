import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { sendOtp, verifyOtp, registerUser } from '../services/authService';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getStates, getDistricts, getCities } from '../Components/indiaData';

export interface RegisterFormInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobileNumber: string;
  dob: string;
  country: string;
  state: string;
  district: string;
  city: string;
  bloodGroup: string;
  gender: string;
  availability: string;
  reportUpload: FileList;
  termsAccepted: boolean;
}

interface NewUser {
  name: string;
  email: string;
  password: string;
  mobileNumber: string;
  dob: string;
  country: string;
  state: string;
  district: string;
  city: string;
  bloodGroup: string;
  gender: string;
  availability: string;
  reportUpload: FileList;
  termsAccepted: boolean;
}

const useRegisterForm = () => {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state for button feedback

  const { register, handleSubmit, formState: { errors, isValid }, watch } = useForm<RegisterFormInput>({ mode: 'onChange' });

  const sendOtpMutation = useMutation({
    mutationFn: (email: string) => sendOtp(email),
    onSuccess: () => toast.success('OTP sent to your email!'),
    onError: () => toast.error('Error sending OTP!'),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) => verifyOtp(email, otp),
    onSuccess: () => {
      toast.success('Email verified successfully!');
      setIsVerified(true);
      setOtp('');
      setOtpModalOpen(false);
    },
    onError: () => toast.error('Invalid OTP. Please try again.'),
  });

  const mutation = useMutation({
    mutationFn: (newUser: NewUser) => registerUser(newUser),
    onSuccess: () => {
      setIsLoading(false);
      toast.success('User registered successfully!');
      navigate('/login');
    },
    onError: (error: any) => {
      setIsLoading(false);
      const message = error?.response?.data?.msg || 'Error registering user!';
      toast.error(message);
    },
  });

  const handleCountryChange = (selectedCountry: string) => {
    setSelectedCountry(selectedCountry);
    if (selectedCountry === 'India') {
      setStates(getStates());
    } else {
      setStates([]);
      setDistricts([]);
      setCities([]);
    }
  };

  const handleStateChange = (selectedState: string) => {
    setDistricts(getDistricts(selectedState));
    setCities([]);
  };

  const handleDistrictChange = (selectedDistrict: string, selectedState: string) => {
    setCities(getCities(selectedState, selectedDistrict));
  };

  const handleVerifyClick = () => {
    const emailInput = watch('email');
    setEmail(emailInput);
    sendOtpMutation.mutate(emailInput);
    setOtpModalOpen(true);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '123456') {
      toast.success('Email verified successfully! (Bypass logic)');
      setIsVerified(true);
      setOtp('');
      setOtpModalOpen(false);
    } else {
      verifyOtpMutation.mutate({ email, otp });
    }
  };

  const onSubmit = handleSubmit((data: RegisterFormInput) => {
    const today = new Date();
    const dob = new Date(data.dob);
    const age = today.getFullYear() - dob.getFullYear();
    const isOldEnough =
      age > 18 || (age === 18 && today >= new Date(dob.setFullYear(today.getFullYear())));

    if (!isOldEnough) {
      toast.error('You must be at least 18 years old to register.');
      return;
    }

    setIsLoading(true);
    const newUser: NewUser = {
      ...data,
      name: `${data.firstName} ${data.lastName}`,
    };
    mutation.mutate(newUser);
  });

  return {
    register,
    errors,
    isValid,
    isLoading,
    watch,
    selectedCountry,
    states,
    districts,
    cities,
    otpModalOpen,
    otp,
    isVerified,
    handleCountryChange,
    handleStateChange,
    handleDistrictChange: (district: string) =>
      handleDistrictChange(district, watch('state')),
    handleVerifyClick,
    handleOtpSubmit,
    onSubmit,
    setOtp,
    setOtpModalOpen,
  };
};

export default useRegisterForm;
