"use client";
import React, { useState } from "react";
import { User, Key, LogIn, Mail, AlertCircle } from "lucide-react";
import { FloatLabel } from "primereact/floatlabel";

const SignIn = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

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
        return;
      }

      localStorage.setItem("token", loginData.token);
      window.location.href = "/userdashboard";
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const Cryhandler = () => {
    alert("cry");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="relative bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 animate-fadeIn transition-all duration-300 hover:shadow-blue-500/20">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl rotate-45 flex items-center justify-center shadow-xl group-hover:rotate-180 transition-transform duration-700">
            <User className="h-12 w-12 text-white -rotate-45 group-hover:rotate-180 transition-transform duration-700" strokeWidth={1.5} />
          </div>
        </div>

        <div className="mt-14 mb-8">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-center text-white/60 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6 text-white p-2">
            {/* Username */}
            <div className="relative group">
              <FloatLabel>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="peer w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-transparent"
                />
                <label
                  htmlFor="username"
                  className=" pl-2  text-white/60 peer-placeholder-shown:translate-y-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-white/40 transition-all duration-200 absolute left-10 top-2.5 pointer-events-none"
                >
                  Admission Number
                </label>
              </FloatLabel>
              <Mail className="absolute left-3 top-3 text-white/40 group-focus-within:text-blue-500 transition-colors duration-300" />
            </div>

            {/* Password */}
            <div className="relative group">
              <FloatLabel>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-transparent"
                />
                <label
                  htmlFor="password"
                  className="pl-2 text-white/60 peer-placeholder-shown:translate-y-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-white/40 transition-all duration-200 absolute left-10 top-2.5 pointer-events-none"
                >
                  Password
                </label>
              </FloatLabel>
              <Key className="absolute left-3 top-3 text-white/40 group-focus-within:text-blue-500 transition-colors duration-300" />
            </div>
          </div>

          {/* Error Message */}
          {message && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-500 text-sm">{message}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl transition duration-300 transform hover:translate-y-[-2px] hover:shadow-lg hover:shadow-blue-500/25 active:translate-y-0 group"
          >
            <LogIn className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-[-2px]" />
            <span className="font-medium transition-transform duration-300 group-hover:translate-x-[-2px]">
              Sign In
            </span>
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={Cryhandler} className="text-white/60 hover:text-white text-sm transition-colors duration-300">
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
