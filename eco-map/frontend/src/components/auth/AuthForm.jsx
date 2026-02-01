import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const AuthForm = ({ isRegisterMode, toggleMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Reset admin flag 
  useEffect(() => {
    if (!isRegisterMode) setIsAdmin(false);
  }, [isRegisterMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        // --- REGISTER LOGIC ---
        const response = await fetch('http://localhost:8000/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username,
            password: password,
            is_admin: isAdmin
          })
        });

        if (!response.ok) throw new Error('Registration failed');
        
        // Auto-login after registration 
        alert('Account created! Logging you in...');
        await login(username, password); 
        navigate(isAdmin ? '/admin' : '/dashboard');
        
      } else {
        // --- LOGIN LOGIC ---
        const user = await login(username, password);
        if (user.is_admin) navigate('/admin');
        else navigate('/dashboard');
      }
    } catch (err) {
      alert(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-sm w-full mx-auto bg-white border border-slate-200 shadow-sm rounded-xl py-12 px-6 md:px-8 transition-all duration-300">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {isRegisterMode ? 'Create an account' : 'Welcome back'}
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          {isRegisterMode 
            ? 'Enter your details below to create your account' 
            : 'Enter your credentials to access your account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Username</label>
          <Input
            required
            placeholder="mapper_01"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Password</label>
          <Input
            required
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Custom Checkbox for is_admin */}
        {isRegisterMode && (
          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdmin(!isAdmin)}
              className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${
                isAdmin ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 bg-white'
              }`}
            >
              {isAdmin && <Check className="w-3 h-3" />}
            </button>
            <label onClick={() => setIsAdmin(!isAdmin)} className="text-sm font-medium leading-none cursor-pointer text-slate-700">
              Sign up as Mission Maker (Admin)
            </label>
          </div>
        )}

        <Button type="submit" className="w-full mt-2">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isRegisterMode ? "Create Account" : "Log In")}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500">
          {isRegisterMode ? "Already have an account? " : "Don't have an account? "}
          <span 
            onClick={toggleMode} 
            className="underline cursor-pointer text-slate-900 font-medium hover:text-blue-600 transition-colors"
          >
            {isRegisterMode ? "Log In" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
};