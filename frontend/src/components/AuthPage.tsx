import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    const response = await fetch(`http://localhost:5050${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (response.ok) {
      if (isLogin) {
        localStorage.setItem('token', data.token); // Store the "key"
        window.location.href = '/engineer'; // Go to dashboard
      } else {
        alert("Registered! Now log in.");
        setIsLogin(true);
      }
    } else {
      alert(data.error || "Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white font-mono">
      <form onSubmit={handleSubmit} className="bg-neutral-900 p-8 rounded-xl border border-neutral-800 w-96">
        <h1 className="text-2xl font-bold mb-6">{isLogin ? 'LOGIN' : 'REGISTER'}</h1>
        {!isLogin && (
          <input className="w-full bg-neutral-800 p-3 mb-4 rounded" placeholder="Username" 
                 onChange={(e) => setFormData({...formData, username: e.target.value})} />
        )}
        <input className="w-full bg-neutral-800 p-3 mb-4 rounded" placeholder="Email" 
               onChange={(e) => setFormData({...formData, email: e.target.value})} />
        <input className="w-full bg-neutral-800 p-3 mb-6 rounded" type="password" placeholder="Password" 
               onChange={(e) => setFormData({...formData, password: e.target.value})} />
        <button className="w-full bg-blue-600 p-3 rounded font-bold hover:bg-blue-700">
          {isLogin ? 'ENTER PADDOCK' : 'JOIN PADDOCK'}
        </button>
        <p className="mt-4 text-sm text-neutral-500 cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </p>
      </form>
    </div>
  );
}