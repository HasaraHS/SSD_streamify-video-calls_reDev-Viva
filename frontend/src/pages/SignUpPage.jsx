import { useState, useEffect } from "react";
import { ShipWheelIcon } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import useSignUp from "../hooks/useSignUp";
import DOMPurify from "dompurify";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const SignUpPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [rateLimitError, setRateLimitError] = useState("");
  const [formError, setFormError] = useState(""); // store normal signup errors here

  const { isPending, signupMutation } = useSignUp();

  // Capture rate-limit errors from URL params (OAuth)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setRateLimitError(errorParam);
      searchParams.delete("error");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSignup = (e) => {
    e.preventDefault();
    const { email, password } = signupData;
    setFormError(""); // reset error before validation

    // Validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError("Please provide a valid email address");
      return;
    }
    if (!passwordPattern.test(password)) {
      setFormError(
        "Password must be at least 8 chars, include uppercase, lowercase, number & special character"
      );
      return;
    }

    signupMutation(signupData, {
      onSuccess: () => {
        navigate("/onboarding");
      },
      onError: (err) => {
        setFormError(
          DOMPurify.sanitize(err?.response?.data?.message || "Signup failed")
        );
      },
    });
  };

  return (
    <div
      className="h-screen flex items-center justify-center p-4 sm:p-6 md:p-8"
      data-theme="forest"
    >
      <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-base-100 rounded-xl shadow-lg overflow-hidden">
        {/* SIGNUP FORM - LEFT SIDE */}
        <div className="w-full lg:w-1/2 p-4 sm:p-8 flex flex-col">
          {/* LOGO */}
          <div className="mb-4 flex items-center justify-start gap-2">
            <ShipWheelIcon className="size-9 text-primary" />
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              Streamify
            </span>
          </div>

          {/* RATE LIMIT ERROR */}
          {rateLimitError && (
            <div className="bg-yellow-400 border border-yellow-500 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-black flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-black font-bold text-lg mb-1">
                    Too Many Attempts
                  </h3>
                  <p className="text-black text-sm">{rateLimitError}</p>
                  <p className="text-black text-sm mt-1">Try again in 15 minutes</p>
                </div>
              </div>
            </div>
          )}

          {/* FORM ERROR - same style but red */}
          {formError && !rateLimitError && (
            <div className="bg-red-500/10 border border-red-200 rounded-lg p-4 mb-4 text-red-500">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="font-bold text-lg mb-1">Signup Error</h3>
                  <p className="text-sm">{formError}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSignup}>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Create an Account</h2>
                <p className="text-sm opacity-70">
                  Join Streamify and start your language learning adventure!
                </p>
              </div>

              <div className="space-y-3">
                {/* FULL NAME */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Full Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="input input-bordered w-full"
                    value={signupData.fullName}
                    onChange={(e) =>
                      setSignupData({ ...signupData, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                {/* EMAIL */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="john@gmail.com"
                    className="input input-bordered w-full"
                    value={signupData.email}
                    onChange={(e) =>
                      setSignupData({ ...signupData, email: e.target.value })
                    }
                    required
                  />
                </div>

                {/* PASSWORD */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Password</span>
                  </label>
                  <input
                    type="password"
                    placeholder="********"
                    className="input input-bordered w-full"
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData({ ...signupData, password: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs opacity-70 mt-1">
                    Password must be at least 8 characters long
                  </p>
                </div>

                {/* TERMS CHECKBOX */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" className="checkbox checkbox-sm" required />
                    <span className="text-xs leading-tight">
                      I agree to the{" "}
                      <span className="text-primary hover:underline">
                        terms of service
                      </span>{" "}
                      and{" "}
                      <span className="text-primary hover:underline">
                        privacy policy
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <button
                className="btn btn-primary w-full"
                type="submit"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Loading...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <hr />
              <div className="flex justify-center">
                <p className="text-sm opacity-70">or </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
                  }}
                  className="btn btn-outline w-full flex items-center justify-center gap-2"
                >
                  <img src="/google.png" alt="Google Logo" className="w-5 h-5" />
                  Sign up with Google
                </button>
              </div>

              <div className="text-center mt-4">
                <p className="text-sm">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* RIGHT SIDE IMAGE */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
          <div className="max-w-md p-8">
            <div className="relative aspect-square max-w-sm mx-auto">
              <img src="/i.png" alt="Illustration" className="w-full h-full" />
            </div>

            <div className="text-center space-y-3 mt-6">
              <h2 className="text-xl font-semibold">
                Connect with language partners worldwide
              </h2>
              <p className="opacity-70">
                Practice conversations, make friends, and improve your language skills
                together
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
