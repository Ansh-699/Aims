"use client";
import { useState } from "react";
import styles from "./page.module.css"; // if you have CSS
type Attendance = {
  course: string;
  present: number;
  total: number;
  percent: number;
};

export default function AuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<{
    totalPresent: number;
    totalClasses: number;
    overallPercentage: number;
    batch: string;
    section: string;
    branch: string;
    studentId: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // 1️⃣ Login
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

    // 2️⃣ Fetch processed attendance
    const attRes = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: loginData.token }),
    });
    const attData = await attRes.json();
    if (!attRes.ok) {
      setMessage(attData.error || "Failed to fetch attendance");
      setLoading(false);
      return;
    }

    // 3️⃣ Render
    setAttendance(attData.dailyAttendance);
    setSummary({
      totalPresent: attData.totalPresent,
      totalClasses: attData.totalClasses,
      overallPercentage: attData.overallPercentage,
      batch: attData.batch,
      section: attData.section,
      branch: attData.branch,
      studentId: attData.studentId,
    });

    setLoading(false);
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {!summary ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-bold">Sign In</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Log In
          </button>
          {message && <p className="text-red-600">{message}</p>}
        </form>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4">Attendance Summary</h2>
          <p>
            Batch: {summary.batch} | Section: {summary.section} | Branch:{" "}
            {summary.branch} | Student ID: {summary.studentId}
          </p>
          <p>
            Overall: {summary.totalPresent}/{summary.totalClasses} (
            {summary.overallPercentage}%)
          </p>
          <table className="w-full mt-4 table-auto border-collapse">
            <thead>
              <tr>
                <th className="border p-2">Course</th>
                <th className="border p-2">Present</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Percent</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((rec) => (
                <tr key={rec.course}>
                  <td className="border p-2">{rec.course}</td>
                  <td className="border p-2">{rec.present}</td>
                  <td className="border p-2">{rec.total}</td>
                  <td className="border p-2">{rec.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
