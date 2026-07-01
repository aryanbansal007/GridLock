// // src/components/Sidebar.tsx
// import { NavLink } from 'react-router-dom';

// export default function Sidebar() {
//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     window.location.href = '/auth'; // Force hard reload to clear socket state
//   };

//   return (
//     <div className="w-64 h-full bg-neutral-950 border-r border-neutral-800 flex flex-col justify-between p-6 flex-shrink-0">
      
//       {/* Top Section: Logo & Nav */}
//       <div>
//         <h1 className="text-2xl font-black text-white mb-8 tracking-tighter">
//           GRID<span className="text-blue-600">LOCK</span>
//         </h1>
        
//         <nav className="flex flex-col gap-2">
//           <NavLink 
//             to="/engineer" 
//             className={({ isActive }) => 
//               `px-4 py-3 rounded-xl text-sm font-bold transition-all ${
//                 isActive 
//                   ? 'bg-blue-600 text-white' 
//                   : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
//               }`
//             }
//           >
//             🏎️ Ask Engineer
//           </NavLink>
          
//           <NavLink 
//             to="/paddock" 
//             className={({ isActive }) => 
//               `px-4 py-3 rounded-xl text-sm font-bold transition-all ${
//                 isActive 
//                   ? 'bg-blue-600 text-white' 
//                   : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
//               }`
//             }
//           >
//             🏁 Paddock Chat
//           </NavLink>
//         </nav>
//       </div>

//       {/* Bottom Section: Logout */}
//       <button 
//         onClick={handleLogout} 
//         className="w-full py-3 px-4 bg-neutral-900 text-red-500 font-bold rounded-xl text-sm hover:bg-red-950 hover:text-red-400 transition-colors"
//       >
//         LOGOUT
//       </button>

//     </div>
//   );
// }

import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth'; // Force hard reload to clear socket state
  };

  return (
    <div className="w-64 h-full bg-neutral-950 border-r border-neutral-800 flex flex-col justify-between p-6 flex-shrink-0">
      
      {/* Top Section: Logo & Nav */}
      <div>
        <h1 className="text-2xl font-black text-white mb-8 tracking-tighter">
          GRID<span className="text-blue-600">LOCK</span>
        </h1>
        
        <nav className="flex flex-col gap-2">
          <NavLink 
            to="/abudhabi" 
            className={({ isActive }) => 
              `px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
              }`
            }
          >
            📊 Abu Dhabi Data
          </NavLink>

          <NavLink 
            to="/spanish" 
            className={({ isActive }) => 
              `px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
              }`
            }
          >
            🇪🇸 Spanish GP
          </NavLink>

          {/* Horizontal Divider for visual separation */}
          <hr className="border-neutral-800 my-2" />
          
          <NavLink 
            to="/engineer" 
            className={({ isActive }) => 
              `px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
              }`
            }
          >
            🏎️ Ask Engineer
          </NavLink>
          
          <NavLink 
            to="/paddock" 
            className={({ isActive }) => 
              `px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
              }`
            }
          >
            🏁 Paddock Chat
          </NavLink>
        </nav>
      </div>

      {/* Bottom Section: Logout */}
      <button 
        onClick={handleLogout} 
        className="w-full py-3 px-4 bg-neutral-900 text-red-500 font-bold rounded-xl text-sm hover:bg-red-950 hover:text-red-400 transition-colors"
      >
        LOGOUT
      </button>

    </div>
  );
}