import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaUser } from "react-icons/fa";
import { Link as ScrollLink } from "react-scroll";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../context/UserContext";
import { FiLogIn, FiAlertCircle } from "react-icons/fi";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const navigate = useNavigate();
  const { updateUser } = useUser();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminForm, setAdminForm] = useState({ username: "", password: "" });
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

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
    { id: "contact", label: "Contact", to: "/contact" }
  ];

  const userMenuItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Profile", to: "/profile" },
    { label: "Settings", to: "/settings" },
    { label: "Logout", to: "/logout" }
  ];

  const handleAdminChange = (e) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError("");
    setAdminLoading(true);
    try {
      const endpoint = "http://69.62.83.14:9000/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          erpstaffid: adminForm.username,
          password: adminForm.password,
          role: "principal"
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.message || "Login failed");
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role);
      updateUser(data.user);
      setShowAdminLogin(false);
      navigate("/principal");
    } catch (err) {
      setAdminError(err.message || "An error occurred during login");
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#3a0000] shadow-xl" : "bg-[#4b0000]"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
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
              link.id === "contact" ? (
                <Link
                  key={link.id}
                  to={link.to}
                  className={`relative px-3 py-2 text-sm font-medium cursor-pointer transition-colors ${activeLink === link.id ? "text-red-300" : "text-white hover:text-red-300"}`}
                  onClick={() => setActiveLink(link.id)}
                >
                  {link.label}
                  {activeLink === link.id && (
                    <motion.span 
                      layoutId="navUnderline"
                      className="absolute left-0 bottom-0 w-full h-0.5 bg-red-400"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              ) : (
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
              )
            ))}
            {/* Admin Quick Login Button */}
            <button
              className="ml-4 text-sm text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
              onClick={() => setShowAdminLogin(true)}
              type="button"
            >
              <FiLogIn /> Admin Quick Login
            </button>
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

      {/* Admin Quick Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowAdminLogin(false)}
            >
              <FaTimes className="h-5 w-5" />
            </button>
            <h2 className="text-center text-2xl mb-5">Admin Quick Login</h2>
            <form onSubmit={handleAdminLogin} className="flex flex-col gap-3">
              <input
                type="text"
                name="username"
                placeholder="Admin Username"
                value={adminForm.username}
                onChange={handleAdminChange}
                required
                className="p-3 text-sm border rounded-md"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={adminForm.password}
                onChange={handleAdminChange}
                required
                className="p-3 text-sm border rounded-md"
              />
              <button
                type="submit"
                disabled={adminLoading}
                className="bg-green-700 text-white p-3 rounded-md hover:bg-green-800 transition-colors flex items-center justify-center gap-2"
              >
                {adminLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FiLogIn />
                    Admin Login
                  </>
                )}
              </button>
              {adminError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded flex items-center mt-2">
                  <FiAlertCircle className="mr-2" />
                  {adminError}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

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
                link.id === "contact" ? (
                  <Link
                    key={link.id}
                    to={link.to}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${activeLink === link.id ? "bg-red-900 text-white" : "text-white hover:bg-red-800 hover:text-white"}`}
                    onClick={() => { setActiveLink(link.id); setMobileOpen(false); }}
                  >
                    {link.label}
                  </Link>
                ) : (
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
                )
              ))}
              {/* Admin Quick Login Button for Mobile */}
              <button
                className="w-full mt-2 text-sm text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2 justify-center"
                onClick={() => { setShowAdminLogin(true); setMobileOpen(false); }}
                type="button"
              >
                <FiLogIn /> Admin Quick Login
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
