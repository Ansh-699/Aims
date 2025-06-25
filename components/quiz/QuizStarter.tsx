import React, { useState, useEffect } from 'react';

export function QuizStarter() {
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [pin, setPin] = useState("");
  const [quizCode, setQuizCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);

  useEffect(() => {
    setAdmissionNumber(localStorage.getItem("admissionNumber") || "");
    setPin(localStorage.getItem("studentPin") || "");
  }, []);

  useEffect(() => {
    if (countdown <= 0 || !quizStartTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((quizStartTime.getTime() - now.getTime()) / 1000);
      setCountdown(diff > 0 ? diff : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [quizStartTime, countdown]);

  const handleSubmit = async (code: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        "https://faas-blr1-8177d592.doserverless.co/api/v1/web/fn-1c23ee6f-939a-44b2-9c4e-d17970ddd644/abes/fetchQuizDetails",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quiz_uc: code,
            user_unique_code: admissionNumber,
            pin: pin,
          }),
        }
      );

      const data = await res.json();
      const quizData = data?.response?.data;
      
      if (!quizData) throw new Error("Quiz data not found");
      
      if (
        data?.msg === "Invalid Quiz ID" ||
        !data?.response?.data ||
        data.response.data.length === 0
      ) {
        throw new Error("Invalid Quiz Code. Please try again.");
      }

      const now = new Date();
      const quizStart = new Date(quizData.login_time);
      const quizEnd = new Date(quizData.end_time);

      if (now < quizStart) {
        const secondsLeft = Math.floor((quizStart.getTime() - now.getTime()) / 1000);
        setCountdown(secondsLeft);
        setQuizStartTime(quizStart);
        return;
      }

      if (now >= quizEnd) {
        setError("Quiz has already ended. You cannot attempt it now.");
        return;
      }

      localStorage.setItem("admissionNumber", admissionNumber);
      localStorage.setItem("studentPin", pin);
      localStorage.setItem("quizCode", code);

      const today = new Date().toISOString().split("T")[0];
      const finalId = quizData.cf_id;
      const reqIdPlain = `${today}_${admissionNumber}_${code}_${finalId}`;
      const encodedReqId = btoa(reqIdPlain);

      setTimeout(() => {
        const targetUrl = `https://abesquiz.netlify.app/#/access-quiz?req_id=${encodedReqId}`;
        window.location.href = targetUrl;
      }, 300);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mt-6 shadow">
      <h2 className="text-lg font-semibold mb-0 text-gray-800">Start Quiz</h2>
      <div className="grid gap-4">
        <input
          type="text"
          value={quizCode}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            if (v.length <= 4) {
              setQuizCode(v);
              setError("");
            }
          }}
          maxLength={4}
          placeholder="Enter 4-character Quiz Code"
          className={`w-full px-4 py-2 border rounded-md text-center ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        {countdown > 0 && (
          <p className="text-center text-gray-500">
            Quiz starts in: {Math.floor(countdown / 60)}:
            {String(countdown % 60).padStart(2, "0")}
          </p>
        )}

        <button
          onClick={() => {
            if (quizCode.length === 4) {
              handleSubmit(quizCode);
            } else {
              setError("Please enter a valid 4-digit quiz code");
            }
          }}
          disabled={loading || quizCode.length !== 4 || countdown > 0}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Start Quiz"}
        </button>
      </div>
    </div>
  );
}
