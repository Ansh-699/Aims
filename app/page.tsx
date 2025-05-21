"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { LogIn, Mail, AlertCircle, Key } from "lucide-react";
import Animation from "./animation2.json";

// ✅ Dynamically import Lottie to disable SSR
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const SignIn = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsSubmitting(true);

    try {
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok || !loginData.token) {
        setMessage(loginData.msg || loginData.error || "Login failed");
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem("token", loginData.token);
      window.location.href = "/userdashboard";
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const Cryhandler = () => {
    alert("cry");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="relative bg-gray-800/70 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 animate-fadeIn transition-all duration-300 hover:shadow-gray-500/20">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl rotate-45 flex items-center justify-center shadow-xl group-hover:rotate-180 transition-transform duration-700">
            <Lottie animationData={Animation} style={{ height: 100 }} />
          </div>
        </div>

        <div className="mt-14 mb-8">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-gray-400 to-gray-500 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-center text-gray-300 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6 text-white p-2">
            {/* Username Input */}
            <div className="relative group">
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-transparent peer"
                  placeholder=" "
                />
                <label
                  htmlFor="username"
                  className="pl-2 absolute left-10 top-3.5 text-gray-300 pointer-events-none transition-all duration-200 
                    peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base
                    peer-focus:-translate-y-8 peer-focus:text-sm
                    -translate-y-8 text-sm"
                >
                  Admission Number
                </label>
                <Mail className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-gray-500 transition-colors duration-300" />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-transparent peer"
                  placeholder=" "
                />
                <label
                  htmlFor="password"
                  className="pl-2 absolute left-10 top-3.5 text-gray-300 pointer-events-none transition-all duration-200 
                    peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base
                    peer-focus:-translate-y-8 peer-focus:text-sm
                    -translate-y-8 text-sm"
                >
                  Password
                </label>
                <Key className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-gray-500 transition-colors duration-300" />
              </div>
            </div>
          </div>

          {message && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-500 text-sm">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl transition duration-300 transform hover:translate-y-[-2px] hover:shadow-lg hover:shadow-gray-500/25 active:translate-y-0 group ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <LogIn className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-[-2px]" />
            <span className="font-medium transition-transform duration-300 group-hover:translate-x-[-2px]">
              Sign In
            </span>
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={Cryhandler}
            className="text-gray-300 hover:text-white text-sm transition-colors duration-300"
          >
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
