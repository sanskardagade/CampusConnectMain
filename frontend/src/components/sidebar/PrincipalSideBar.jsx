import { NavLink } from "react-router-dom";
import { FaBars, FaHome, FaUser } from "react-icons/fa";
import { BiAnalyse, BiSearch } from "react-icons/bi";
import {
  AiOutlineSetting,
  AiFillDatabase,
  AiOutlinePlus,
  AiFillEye,
  AiOutlineLogout,
  AiFillBell,
  AiTwotoneFileExclamation,
  AiOutlineFilePdf,
} from "react-icons/ai";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SidebarMenu from "./SideBarMenu";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "../hooks/use-mobile";
import { FiActivity } from "react-icons/fi";


  const routes = [
    {
      path: "/principal",
      name: "Dashboard",
      icon: <FaHome />,
    },
    // {
    //   path: "/principal/view-student",
    //   name: "View Student Attendance",
    //   icon: <FaUser />,
    //},
    // {
    //   path: "/principal/view-faculty",
    //   name: "View Faculty Attendance",
    //   icon: <AiOutlinePlus />,
    // },
    {
      path: "/principal/view-stress-level",
      name: "View Faculty Stress Level",
      icon: <AiTwotoneFileExclamation />,
    },
   
    
    {
      path: "/principal/faculty-leave-approval",
      name: "Faculty Leave Approval",
      icon: <AiFillBell />,
    
    },
    
    // {
    //     path: "/principal/view-student-location",
    //     name: "View Student Location",
    //     icon: <BiAnalyse />,
    //   },
    // {
    //   path: "/principal/department-statistics",
    //   name: "View Department Statistics",
    //   icon: <BiAnalyse />,
    // },
    {
      path: "/principal/faculty-report",
      name: "Faculty Attendance Report",
      icon: <AiOutlineFilePdf />,
    },
    // {
    //   path: "/principal/classroom-distribution",
    //   name: "Classroom Distribution",
    //   icon: <BiAnalyse />,
    // },
    
    {
      path: "/principal/principal-profile",
      name: "Profile",
      icon: <FaUser />,
    },
    {
      path: "/principal/principal-settings",
      name: "Settings",
      icon: <AiOutlineSetting />,
      subRoutes: [
        {
          path: "/principal/principal-settings/edit-profile",
          name: "Edit Profile",
          icon: <AiFillDatabase />,
        },
        {
          path: "/principal/principal-settings/change-password",
          name: "Change Password",
          icon: <AiFillEye />,
        },
      ],
    },
    
    { path: "/", name: "Logout", icon: <AiOutlineLogout /> },
  ];
  

// Mobile bottom tab bar component
function MobileBottomTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = [
    { path: "/principal", label: "Dashboard", icon: <FaHome /> },
    { path: "/principal/faculty-leave-approval", label: "Leaves", icon: <AiFillBell /> },
    { path: "/principal/faculty-report", label: "Report", icon: <AiOutlineFilePdf /> },
    { path: "/principal/view-stress-level", label: "Stress", icon: <FiActivity /> },
    { path: "/principal/principal-settings", label: "Settings", icon: <AiOutlineSetting /> },
    { path: "/", label: "Logout", icon: <AiOutlineLogout /> },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-red-900 text-white flex justify-between items-center px-1 py-1 shadow-t border-t border-red-800">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          className={`flex flex-col items-center flex-1 px-1 py-1 focus:outline-none ${location.pathname === tab.path ? 'text-yellow-300' : ''}`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span className="text-[10px] leading-none">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

const PrincipalSideBar = ({ children }) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  // Sidebar should always be open
  const isOpen = true;

  const inputAnimation = {
    hidden: { width: 0, padding: 0, transition: { duration: 0.2 } },
    show: {
      width: "140px",
      padding: "5px 15px",
      transition: { duration: 0.2 },
    },
  };

  const showAnimation = {
    hidden: { width: 0, opacity: 0, transition: { duration: 0.3 } },
    show: {
      opacity: 1,
      width: "auto",
      transition: { duration: 0.3 },
    },
  };

  if (isMobile) {
    return (
      <div className="w-screen min-h-screen bg-gray-100 pb-14">
        <main className="flex-1 p-2 sm:p-4 overflow-auto">{children}</main>
        <MobileBottomTabs />
      </div>
    );
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <motion.div
        animate={{
          width: "200px",
          transition: { duration: 0.5, type: "spring", damping: 10 },
        }}
        className="bg-red-950 text-white h-full overflow-y-auto shadow-lg"
      >
        <div className="flex items-center justify-between p-3">
          <AnimatePresence>
            {isOpen && (
              <motion.h1
                variants={showAnimation}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="text-lg font-bold"
              >
                CampusConnect
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        {/* Search box */}
        {/* <div className="flex items-center px-2 py-2">
          <BiSearch />
          <AnimatePresence>
            {isOpen && (
              <motion.input
                initial="hidden"
                animate="show"
                exit="hidden"
                variants={inputAnimation}
                type="text"
                placeholder="Search"
                className="ml-2 bg-red-900 text-white rounded px-2 py-1 outline-none w-full"
              />
            )}
          </AnimatePresence>
        </div> */}

        {/* Routes */}
        <nav className="flex flex-col gap-1 px-2">
          {routes.map((route, index) => {
            if (route.subRoutes) {
              return (
                <SidebarMenu
                  key={index}
                  route={route}
                  showAnimation={showAnimation}
                  isOpen={isOpen}
                />
              );
            }

            return (
              <NavLink
                to={route.path}
                key={index}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-2 rounded hover:bg-gray-700 transition ${
                    isActive ? "bg-gray-800" : ""
                  }`
                }
                onClick={() => {
                  if (location.pathname === route.path) {
                    window.location.reload();
                  }
                }}
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
              </NavLink>
            );
          })}
        </nav>
      </motion.div>

      {/* Right side content */}
      <main className="flex-1 bg-gray-100 p-4 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default PrincipalSideBar;
