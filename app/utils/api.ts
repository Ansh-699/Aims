 "use client";
 import { useEffect, useState } from "react";
 
 const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok)
          throw new Error(data.message || "Failed to fetch attendance");

        setAttendance(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    setTimeout(() => {
      fetchData();
    }, 0);
  }, []);