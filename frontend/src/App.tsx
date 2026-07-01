// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import AuthPage from './components/AuthPage';
// import Dashboard from './Dashboard';

// // A simple protector component
// const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
//   return localStorage.getItem('token') ? children : <Navigate to="/auth" />;
// };

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/auth" element={<AuthPage />} />
//         <Route 
//           path="/" 
//           element={
//             <ProtectedRoute>
//               <Dashboard />
//             </ProtectedRoute>
//           } 
//         />
//         {/* Redirect any unknown routes to the dashboard */}
//         <Route path="*" element={<Navigate to="/" />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
// import AuthPage from './components/AuthPage';
// import AskEngineer from './components/AskEngineer';
// import PaddockChat from './components/PaddockChat';
// import Sidebar from './components/Sidebar';


// // 1. Your Protector Component (Perfect as it is)
// const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
//   // Added 'replace' to Navigate so the back button doesn't trap users in a loop
//   return localStorage.getItem('token') ? children : <Navigate to="/auth" replace />;
// };

// // 2. A Shared Layout for your protected pages
// // This keeps your navigation bar at the top, while the content changes below
// const DashboardLayout = () => {
//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     window.location.href = '/auth'; // Force hard reload to clear socket state
//   };

//   return (
//     // 🚨 FIX: Added flex-col right here so the layout stacks top-to-bottom
//     <div className="flex flex-col h-screen bg-black text-white">
      
//       {/* Top Navigation Bar */}
//       <nav className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-950">
//         <div className="flex gap-6">
//           <Link to="/engineer" className="text-sm font-bold hover:text-blue-500 transition-colors">
//             🏎️ Ask Engineer
//           </Link>
//           <Link to="/paddock" className="text-sm font-bold hover:text-blue-500 transition-colors">
//             🏁 Paddock Chat
//           </Link>
//         </div>
//         <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-400 font-bold">
//           LOGOUT
//         </button>
//       </nav>

//       {/* Outlet is where React Router injects the active component */}
//       <div className="flex-1 overflow-hidden relative">
//         <Outlet /> 
//       </div>
//     </div>
//   );
// };

// // 3. The Main App Router
// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* Public Route */}
//         <Route path="/auth" element={<AuthPage />} />

//         {/* Protected Parent Route */}
//         <Route 
//           path="/" 
//           element={
//             <ProtectedRoute>
//               <DashboardLayout />
//             </ProtectedRoute>
//           }
//         >
//           {/* Default redirect: If they just type localhost:5173, send to Engineer */}
//           <Route index element={<Navigate to="/engineer" replace />} />
          
//           {/* Nested Protected Routes */}
//           <Route path="engineer" element={<AskEngineer />} />
//           <Route path="paddock" element={<PaddockChat />} />
//         </Route>

//         {/* Catch-all: Redirect unknown URLs back to the app */}
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import AskEngineer from './components/AskEngineer';
import PaddockChat from './components/PaddockChat';
import Sidebar from './components/Sidebar';

// 1. Your Protector Component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  return localStorage.getItem('token') ? children : <Navigate to="/auth" replace />;
};

// 2. Shared Layout (Sidebar on the left, Content on the right)
const DashboardLayout = () => {
  return (
    // 'flex' makes it a horizontal row. Sidebar sits left, Outlet fills the right.
    <div className="flex h-screen w-screen bg-black overflow-hidden">
      
      {/* 👈 Your Sidebar Component is injected here */}
      <Sidebar />

      {/* 👉 Outlet is where React Router injects the active component (Engineer or Paddock) */}
      <div className="flex-1 relative overflow-hidden bg-black text-white">
        <Outlet /> 
      </div>
      
    </div>
  );
};

// 3. The Main App Router
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected Parent Route */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Default redirect: If they just type localhost:5173, send to Engineer */}
          <Route index element={<Navigate to="/engineer" replace />} />
          
          {/* Nested Protected Routes */}
          <Route path="engineer" element={<AskEngineer />} />
          <Route path="paddock" element={<PaddockChat />} />
          {/* <Route path="abudhabi" element={<AbuDhabiDataComponent />} /> 
          <Route path="spanish" element={<SpanishGPComponent />} /> */}
        </Route>

        {/* Catch-all: Redirect unknown URLs back to the app */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}