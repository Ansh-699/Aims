"use client";
import React, { useState } from "react";
import { User, Key, LogIn, Mail, AlertCircle } from "lucide-react";

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

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
  //       <div className="relative bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 animate-fadeIn">
  //         <div className="flex flex-col items-center justify-center gap-4">
  //           <div className="relative w-16 h-16">
  //             <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
  //             <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
  //           </div>
  //           <p className="text-white/80 text-lg font-medium">Signing you in...</p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

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
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                <Mail className="h-5 w-5 text-white/40 group-focus-within:text-blue-500 transition-colors duration-300" />
              </div>
              <input
                type="text"
                placeholder="Username or Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white placeholder-white/40 transition-all duration-300"
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                <Key className="h-5 w-5 text-white/40 group-focus-within:text-blue-500 transition-colors duration-300" />
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white placeholder-white/40 transition-all duration-300"
                required
              />
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