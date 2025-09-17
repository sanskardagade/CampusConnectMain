import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FaBars, FaHome, FaUser, FaBook,
} from "react-icons/fa";
import { MdMessage } from "react-icons/md";
import { BiAnalyse, BiSearch, BiCog } from "react-icons/bi";
import {
  AiOutlineLogout,
  AiFillEye,
  AiFillDatabase,
} from "react-icons/ai";
import { CgTranscript } from "react-icons/cg";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SidebarMenu from "./SideBarMenu";
import { useIsMobile } from "../hooks/use-mobile";

const routes = [
  { path: "/student", name: "Dashboard", icon: <FaHome /> },
  { path: "/student/student-profile", name: "Profile", icon: <FaUser /> },
  { path: "/student/subjects", name: "Subjects", icon: <FaBook/> },
  // { path: "/student/attendance", name: "Attendance", icon: <FaUser /> },
  { path: "/student/transcript", name: "Transcript", icon: <CgTranscript /> },
  {
    path: "/student/student-settings",
    name: "Settings",
    icon: <BiCog />,
    subRoutes: [
      {
        path: "/student/student-settings/edit-profile",
        name: "Edit Profile",
        icon: <AiFillDatabase />,
      },
      {
        path: "/student/student-settings/change-password",
        name: "Change Password",
        icon: <AiFillEye />,
      },
    ],
  },
  { path: "/", name: "Logout", icon: <AiOutlineLogout /> },
];

function MobileBottomTabsStudent({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = [
    { path: "/student", label: "Dashboard", icon: <FaHome /> },
    { path: "/student/subjects", label: "Subjects", icon: <FaBook /> },
    // { path: "/student/attendance", label: "Attendance", icon: <FaUser /> },
    { path: "/student/student-profile", label: "Profile", icon: <FaUser /> },
    
    { path: "/", label: "Logout", icon: <AiOutlineLogout />, isLogout: true },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-[#330000] text-white flex justify-between items-center px-1 py-1 shadow-t border-t border-[#1a0000]">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => {
            if (tab.isLogout) {
              onLogout();
            } else {
              navigate(tab.path);
            }
          }}
          className={`flex flex-col items-center flex-1 px-1 py-1 focus:outline-none ${location.pathname === tab.path ? 'text-[#d1a550]' : ''}`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span className="text-[10px] leading-none">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

const StudentSideBar = ({ children }) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Move handleLogout above its first use
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  if (isMobile) {
    return (
      <div className="relative min-h-screen bg-[#1a0000] pb-14">
        <main className="flex-1 p-2 sm:p-4 overflow-auto">{children}</main>
        <MobileBottomTabsStudent onLogout={handleLogout} />
      </div>
    );
  }

  const inputAnimation = {
    hidden: { width: 0, padding: 0, transition: { duration: 0.2 } },
    show: { width: "140px", padding: "5px 15px", transition: { duration: 0.2 } },
  };

  const showAnimation = {
    hidden: { width: 0, opacity: 0, transition: { duration: 0.3 } },
    show: { opacity: 1, width: "auto", transition: { duration: 0.3 } },
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setShowLogoutModal(false);
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="flex h-screen bg-[#1a0000] text-white">
      <motion.div
        animate={{
          width: isOpen ? "200px" : "60px",
          transition: { duration: 0.5, type: "spring", damping: 10 },
        }}
        className="bg-[#330000] h-full shadow-lg flex flex-col p-2 overflow-hidden"
      >
        <div className="flex items-center justify-between py-3 px-2">
          <AnimatePresence>
            {isOpen && (
              <motion.h1
                className="text-lg font-semibold"
                variants={showAnimation}
                initial="hidden"
                animate="show"
                exit="hidden"
              >
                CampusConnect
              </motion.h1>
            )}
          </AnimatePresence>
          <FaBars className="cursor-pointer text-xl" onClick={toggle} />
        </div>

        <div className="flex items-center gap-2 px-2 py-2">
          <BiSearch />
          <AnimatePresence>
            {isOpen && (
              <motion.input
                variants={inputAnimation}
                initial="hidden"
                animate="show"
                exit="hidden"
                type="text"
                placeholder="Search"
                className="bg-[#1a0000] border border-gray-600 text-sm px-2 py-1 rounded outline-none w-full"
              />
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 mt-4">
          {routes.map((route, index) => {
            if (route.subRoutes) {
              return (
                <SidebarMenu
                  key={index}
                  route={route}
                  showAnimation={showAnimation}
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                />
              );
            }
            if (route.name === 'Logout') {
              return (
                <button
                  key={index}
                  className="flex items-center gap-3 p-2 rounded hover:bg-[#d1a550] transition w-full text-left"
                  onClick={handleLogout}
                >
                  <div className="text-xl">{route.icon}</div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        variants={showAnimation}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                        className="text-sm"
                      >
                        {route.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            }
            return (
              <NavLink
                to={route.path}
                key={index}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 my-1 rounded transition-all duration-200 ${
                    isActive ? "bg-[#d1a550]" : "hover:bg-[#d1a550]"
                  }`
                }
                onClick={() => {
                  if (location.pathname === route.path) {
                    window.location.reload();
                  }
                }}
              >
                <div className="text-lg">{route.icon}</div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      className="text-sm"
                      variants={showAnimation}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                    >
                      {route.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>
      </motion.div>

      <main className="flex-1 p-4 overflow-y-auto bg-[#1a0000]">{children}</main>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-red-700">Confirm Logout</h2>
            <p className="mb-6 text-gray-700">Are you sure you want to logout?</p>
            <div className="flex justify-end gap-3">
              <button onClick={cancelLogout} className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
              <button onClick={confirmLogout} className="px-4 py-2 rounded bg-[#b22b2f] text-white hover:bg-[#a02529]">Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSideBar;


// import { NavLink } from "react-router-dom";
// import {
//   FaBars, FaHome, FaUser, FaBook,
// } from "react-icons/fa";
// import { MdMessage } from "react-icons/md";
// import { BiAnalyse, BiSearch, BiCog } from "react-icons/bi";
// import {
//   AiOutlineLogout,
//   AiFillEye,
//   AiFillDatabase,
// } from "react-icons/ai";
// import { CgTranscript } from "react-icons/cg";
// import { useState } from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import SidebarMenu from "./SideBarMenu";
// import { useNavigate } from 'react-router-dom';

// const routes = [
//   { path: "/student", name: "Dashboard", icon: <FaHome /> },
//   // { path: "/student/attendance", name: "View Attendance", icon: <FaUser /> },
//   // { path: "/student/notes", name: "Download Notes", icon: <BiAnalyse /> },
//   // { path: "/student/stresslevel", name: "View Stress Level", icon: <MdMessage /> },
//   { path: "/student/student-profile", name: "Profile", icon: <FaUser /> },
//    { path: "/student/subjects", name: "Subjects", icon: <FaBook/> },
//    { path: "/student/attendance", name: "Attendance", icon: <FaUser /> },
//    { path: "/student/transcript", name: "Transcript", icon: <CgTranscript /> },
//   {
//     path: "/student/student-settings",
//     name: "Settings",
//     icon: <BiCog />,
//     subRoutes: [
//       {
//         path: "/student/student-settings/edit-profile",
//         name: "Edit Profile",
//         icon: <AiFillDatabase />,
//       },
//       {
//         path: "/student/student-settings/change-password",
//         name: "Change Password",
//         icon: <AiFillEye />,
//       },
//     ],
//   },
//   { path: "#", name: "Logout", icon: <AiOutlineLogout /> },
// ];


// const StudentSideBar = ({ children }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const toggle = () => setIsOpen(!isOpen);
//   const [showLogoutModal, setShowLogoutModal] = useState(false);
//   const navigate = useNavigate();

//   const inputAnimation = {
//     hidden: { width: 0, padding: 0, transition: { duration: 0.2 } },
//     show: { width: "140px", padding: "5px 15px", transition: { duration: 0.2 } },
//   };

//   const showAnimation = {
//     hidden: { width: 0, opacity: 0, transition: { duration: 0.3 } },
//     show: { opacity: 1, width: "auto", transition: { duration: 0.3 } },
//   };

//   const handleLogout = () => {
//     setShowLogoutModal(true);
//   };

//   const confirmLogout = () => {
//     localStorage.removeItem('token');
//     sessionStorage.removeItem('token');
//     setShowLogoutModal(false);
//     navigate('/');
//   };

//   const cancelLogout = () => {
//     setShowLogoutModal(false);
//   };

//   return (
//     <div className="flex h-screen bg-[#1a0000] text-white">
//       <motion.div
//         animate={{
//           width: isOpen ? "200px" : "60px",
//           transition: { duration: 0.5, type: "spring", damping: 10 },
//         }}
//         className="bg-[#330000] h-full shadow-lg flex flex-col p-2 overflow-hidden"
//       >
//         <div className="flex items-center justify-between py-3 px-2">
//           <AnimatePresence>
//             {isOpen && (
//               <motion.h1
//                 className="text-lg font-semibold"
//                 variants={showAnimation}
//                 initial="hidden"
//                 animate="show"
//                 exit="hidden"
//               >
//                 CampusConnect
//               </motion.h1>
//             )}
//           </AnimatePresence>
//           <FaBars className="cursor-pointer text-xl" onClick={toggle} />
//         </div>

//         <div className="flex items-center gap-2 px-2 py-2">
//           <BiSearch />
//           <AnimatePresence>
//             {isOpen && (
//               <motion.input
//                 variants={inputAnimation}
//                 initial="hidden"
//                 animate="show"
//                 exit="hidden"
//                 type="text"
//                 placeholder="Search"
//                 className="bg-[#1a0000] border border-gray-600 text-sm px-2 py-1 rounded outline-none w-full"
//               />
//             )}
//           </AnimatePresence>
//         </div>

//         <nav className="flex-1 mt-4">
//           {routes.map((route, index) => {
//             if (route.subRoutes) {
//               return (
//                 <SidebarMenu
//                   key={index}
//                   route={route}
//                   showAnimation={showAnimation}
//                   isOpen={isOpen}
//                   setIsOpen={setIsOpen}
//                 />
//               );
//             }
//             if (route.name === 'Logout') {
//               return (
//                 <button
//                   key={index}
//                   className="flex items-center gap-3 p-2 rounded hover:bg-[#d1a550] transition w-full text-left"
//                   onClick={handleLogout}
//                 >
//                   <div className="text-xl">{route.icon}</div>
//                   <AnimatePresence>
//                     {isOpen && (
//                       <motion.span
//                         variants={showAnimation}
//                         initial="hidden"
//                         animate="show"
//                         exit="hidden"
//                         className="text-sm"
//                       >
//                         {route.name}
//                       </motion.span>
//                     )}
//                   </AnimatePresence>
//                 </button>
//               );
//             }
//             return (
//               <NavLink
//                 to={route.path}
//                 key={index}
//                 className={({ isActive }) =>
//                   `flex items-center gap-3 px-3 py-2 my-1 rounded transition-all duration-200 ${
//                     isActive ? "bg-[#d1a550]" : "hover:bg-[#d1a550]"
//                   }`
//                 }
//               >
//                 <div className="text-lg">{route.icon}</div>
//                 <AnimatePresence>
//                   {isOpen && (
//                     <motion.span
//                       className="text-sm"
//                       variants={showAnimation}
//                       initial="hidden"
//                       animate="show"
//                       exit="hidden"
//                     >
//                       {route.name}
//                     </motion.span>
//                   )}
//                 </AnimatePresence>
//               </NavLink>
//             );
//           })}
//         </nav>
//       </motion.div>

//       <main className="flex-1 p-4 overflow-y-auto bg-[#1a0000]">{children}</main>

//       {showLogoutModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
//           <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
//             <h2 className="text-xl font-bold mb-4 text-red-700">Confirm Logout</h2>
//             <p className="mb-6 text-gray-700">Are you sure you want to logout?</p>
//             <div className="flex justify-end gap-3">
//               <button onClick={cancelLogout} className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
//               <button onClick={confirmLogout} className="px-4 py-2 rounded bg-[#b22b2f] text-white hover:bg-[#a02529]">Logout</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StudentSideBar;
