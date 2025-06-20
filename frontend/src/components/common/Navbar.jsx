import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes, FaUser, FaChevronDown } from "react-icons/fa";
import { Link as ScrollLink } from "react-scroll";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [activeLink, setActiveLink] = useState("");

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileOpen && !event.target.closest("nav")) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  const navLinks = [
    { id: "features", label: "Features" },
    { id: "about", label: "About" },
    { id: "contact", label: "Contact" }
  ];

  const userMenuItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Profile", to: "/profile" },
    { label: "Settings", to: "/settings" },
    { label: "Logout", to: "/logout" }
  ];

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#3a0000] shadow-xl" : "bg-[#4b0000]"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 flex items-center"
          >
            <Link to="/" className="text-2xl font-bold text-white flex items-center">
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                CampusConnect
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <ScrollLink
                key={link.id}
                to={link.id}
                smooth={true}
                offset={-80}
                duration={500}
                spy={true}
                onSetActive={() => setActiveLink(link.id)}
                className={`relative px-3 py-2 text-sm font-medium cursor-pointer transition-colors ${activeLink === link.id ? "text-red-300" : "text-white hover:text-red-300"}`}
              >
                {link.label}
                {activeLink === link.id && (
                  <motion.span 
                    layoutId="navUnderline"
                    className="absolute left-0 bottom-0 w-full h-0.5 bg-red-400"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </ScrollLink>
            ))}

            {/* User Dropdown */}
            {/* <div className="relative ml-4">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center space-x-1 text-white hover:text-red-300 focus:outline-none transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center">
                  <FaUser className="text-white text-sm" />
                </div>
                <FaChevronDown className={`text-xs transition-transform ${userDropdown ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {userDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <div className="py-1">
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.label}
                          to={item.to}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserDropdown(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>*/}
          </div> 

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-red-300 focus:outline-none transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileOpen ? (
                <FaTimes className="block h-6 w-6" />
              ) : (
                <FaBars className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#3a0000] overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <ScrollLink
                  key={link.id}
                  to={link.id}
                  smooth={true}
                  offset={-80}
                  duration={500}
                  spy={true}
                  onSetActive={() => setActiveLink(link.id)}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${activeLink === link.id ? "bg-red-900 text-white" : "text-white hover:bg-red-800 hover:text-white"}`}
                >
                  {link.label}
                </ScrollLink>
              ))}
              <div className="pt-4 pb-2 border-t border-red-800">
                <div className="flex items-center px-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center">
                      <FaUser className="text-white text-sm" />
                    </div>
                  </div>
                  <div className="ml-3">
                    {/* <div className="text-sm font-medium text-white">User Account</div> */}
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-red-800"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

// import React, { useState } from "react";
// import { Link } from "react-router-dom";
// import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";

// const Navbar = () => {
//   const [mobileOpen, setMobileOpen] = useState(false);

//   return (
//     <nav className="bg-[#4b0000] text-white shadow-md w-full">
//       <div className="w-full px-2 sm:px-4 py-3 flex justify-between items-center">
//         {/* Logo on Left */}
//         <Link to="/" className="text-xl sm:text-2xl font-bold">
//           DYPDPU
//         </Link>

//         {/* Right Side Menu - Desktop */}
//         <div className="hidden md:flex items-center gap-8 sm:gap-6 ml-auto">
//           {/* <Link to="/dashboard/student" className="hover:text-red-300">Dashboard</Link> */}
//           <Link to="/features" className="hover:text-red-300">Features</Link>
//           <Link to="/about" className="hover:text-red-300">About</Link>
//           <Link to="/contact" className="hover:text-red-300">Contact</Link>
//           <Link
//             to="/signin"
//             className="bg-red-700 px-3 py-2 rounded-lg hover:bg-red-800 transition text-sm"
//           >
//             Sign In
//           </Link>
//           {/* <FaUserCircle size={22} className="cursor-pointer" /> */}
//         </div>

//         {/* Mobile Toggle */}
//         <div className="md:hidden ml-auto">
//           <button onClick={() => setMobileOpen(!mobileOpen)}>
//             {mobileOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
//           </button>
//         </div>
//       </div>

//       {/* Mobile Menu */}
//       {mobileOpen && (
//         <div className="md:hidden bg-[#4b0000] px-4 pb-4 space-y-3">
//           {/* <Link to="/dashboard/student" className="block hover:text-red-300">Dashboard</Link> */}
//           <Link to="/features" className="block hover:text-red-300">Features</Link>
//           <Link to="/about" className="block hover:text-red-300">About</Link>
//           <Link to="/contact" className="block hover:text-red-300">Contact</Link>
//           <Link
//             to="/signin"
//             className="block bg-red-700 px-4 py-2 rounded-lg hover:bg-red-800"
//           >
//             Sign In
//           </Link>
//         </div>
//       )}
//     </nav>
//   );
// };

// export default Navbar;
