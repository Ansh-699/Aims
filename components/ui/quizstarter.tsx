import React, { useState } from 'react';

interface QuizCodeInputProps {
    onCodeChange: (code: string) => void;
    onSubmit: (code: string) => void;
}

const QuizCodeInput: React.FC<QuizCodeInputProps> = ({ onCodeChange, onSubmit }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        // Allow only digits and limit to 4 characters
        if (/^\d*$/.test(value) && value.length <= 4) {
            setCode(value);
            onCodeChange(value);
            if (error) setError(''); // Clear error if user starts typing correctly
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (code.length === 4 && /^\d{4}$/.test(code)) {
            onSubmit(code);
            setError('');
        } else {
            setError('Please enter a valid 4-digit code.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
            <div className="w-full max-w-xs">
                <label htmlFor="quizCode" className="sr-only">
                    Quiz Code
                </label>
                <input
                    type="text"
                    id="quizCode"
                    name="quizCode"
                    value={code}
                    onChange={handleChange}
                    placeholder="Enter 4-digit code"
                    maxLength={4}
                    pattern="\d{4}"
                    required
                    className={`w-full px-4 py-2 border rounded-md text-center text-lg
                                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                            ${error ? 'border-red-500' : 'border-gray-300'}`}
                    aria-describedby={error ? "code-error" : undefined}
                />
                {error && (
                    <p id="code-error" className="mt-1 text-sm text-red-600 text-center">
                        {error}
                    </p>
                )}
            </div>
            <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
                disabled={code.length !== 4}
            >
                Start Quiz
            </button>
        </form>
    );
};

export default QuizCodeInput;