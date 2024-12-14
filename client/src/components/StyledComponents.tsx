import React from 'react';

// Layout component that provides consistent padding and max-width
export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {children}
    </div>
  </div>
);

// Main heading component with Spotify-inspired styling
export const MainHeading = ({ children }: { children: React.ReactNode }) => (
  <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 mb-8 text-center">
    {children}
  </h1>
);

// Card component for content sections
export const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-gray-800 rounded-xl shadow-xl p-6 mb-8 border border-gray-700">
    {children}
  </div>
);

// Button component with different variants
interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit';
}

export const Button = ({ 
  onClick, 
  children, 
  disabled = false,
  variant = 'primary',
  type = 'button'
}: ButtonProps) => {
  const baseStyles = "w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800";
  const variants = {
    primary: `${baseStyles} ${
      disabled 
        ? 'bg-gray-600 cursor-not-allowed' 
        : 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
    } text-white`,
    secondary: `${baseStyles} ${
      disabled 
        ? 'bg-gray-700 cursor-not-allowed' 
        : 'bg-gray-700 hover:bg-gray-600 focus:ring-gray-500'
    } text-gray-200`
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={variants[variant]}
    >
      {children}
    </button>
  );
};

// Input component
interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}

export const Input = ({ 
  value, 
  onChange, 
  placeholder,
  disabled = false,
  type = 'text'
}: InputProps) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
              disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors duration-200"
  />
);

// Alert component for errors and notifications
interface AlertProps {
  type?: 'error' | 'warning' | 'success';
  message: string;
}

export const Alert = ({ 
  type = 'error',
  message 
}: AlertProps) => {
  const types = {
    error: 'bg-red-900/50 border-red-500 text-red-200',
    warning: 'bg-yellow-900/50 border-yellow-500 text-yellow-200',
    success: 'bg-green-900/50 border-green-500 text-green-200'
  };

  return (
    <div className={`${types[type]} border-l-4 p-4 rounded-r-lg mb-4`}>
      <p>{message}</p>
    </div>
  );
};

// Score display component
interface ScoreDisplayProps {
  score: number;
  timeLeft: number;
}

export const ScoreDisplay = ({ score, timeLeft }: ScoreDisplayProps) => (
  <div className="flex justify-between items-center mb-6 bg-gray-700 p-4 rounded-lg">
    <div className="text-xl font-semibold text-white">
      Score: <span className="text-green-400">{score}</span>
    </div>
    <div className="text-xl font-semibold text-white">
      Time: <span className="text-yellow-400">{timeLeft}s</span>
    </div>
  </div>
);

// Game progress indicator
interface GameProgressProps {
  current: number;
  total: number;
}

export const GameProgress = ({ current, total }: GameProgressProps) => (
  <div className="bg-gray-700 p-4 rounded-lg mb-6">
    <div className="flex justify-between items-center mb-2">
      <span className="text-gray-300">Progress</span>
      <span className="text-gray-300">{current}/{total}</span>
    </div>
    <div className="w-full bg-gray-600 rounded-full h-2">
      <div 
        className="bg-green-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  </div>
);