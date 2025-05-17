"use client";
import { useState } from "react";
import { User, Key, LogIn } from "lucide-react"; 

const Index = () => {
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
      window.location.href = "/dashboard";
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 rounded-lg shadow-md bg-white w-full max-w-md">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-700"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 rounded-lg shadow-lg bg-white w-full max-w-md transition-all duration-300 hover:shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-gray-600" strokeWidth={1.5} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Sign In</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50 text-gray-700"
              required
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50 text-gray-700"
              required
            />
          </div>
          
          <div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition duration-300 shadow-md hover:shadow-lg"
            >
              <LogIn className="h-5 w-5" />
              <span>Sign In</span>
            </button>
          </div>
          
          {message && (
            <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
              <p>{message}</p>
            </div>
          )}
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account? <a href="#" className="text-gray-800 hover:underline font-medium">Register here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
