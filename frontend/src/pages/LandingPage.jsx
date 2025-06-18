import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Contact from "./Contact";
import Features from "./Features";
import About from "./About";

// Animated components
const AnimatedText = ({ text, className }) => {
  const letters = Array.from(text);

  return (
    <motion.div className={className}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.05,
            type: "spring",
            stiffness: 100,
            damping: 10,
          }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

const FloatingElements = () => {
  return (
    <>
      {/* Floating elements in the background */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: 0, x: Math.random() * 100 - 50 }}
          animate={{
            y: [0, Math.random() * 100 - 50, 0],
            x: [Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className={`absolute rounded-full opacity-20 ${i % 2 === 0 ? 'bg-red-400' : 'bg-red-600'}`}
          style={{
            width: `${10 + Math.random() * 20}px`,
            height: `${10 + Math.random() * 20}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </>
  );
};

const ScrollIndicator = () => {
  const controls = useAnimation();
  
  React.useEffect(() => {
    const sequence = async () => {
      while (true) {
        await controls.start({ y: 10, opacity: 0.5 });
        await controls.start({ y: 0, opacity: 1 });
      }
    };
    sequence();
  }, [controls]);

  return (
    <motion.div 
      className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5 }}
    >
      <motion.p className="text-white mb-2 text-sm">Scroll to explore</motion.p>
      <motion.div
        animate={controls}
        transition={{ 
          y: { duration: 1, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 1, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </motion.div>
    </motion.div>
  );
};

const SectionWrapper = ({ children, id, bgColor = "bg-gray-50" }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: false,
  });

  React.useEffect(() => {
    if (inView) {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [controls, inView]);

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 50 },
      }}
      transition={{ duration: 0.6 }}
      id={id}
      className={`py-20 px-4 ${bgColor}`}
    >
      {children}
    </motion.section>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative w-full min-h-screen overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative w-full min-h-screen bg-cover bg-center"
          style={{
            backgroundImage: `url(https://images.shiksha.com/mediadata/images/1744799227phpyYTD3H.jpeg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay for Content Visibility */}
          <div className="absolute inset-0 bg-black/60"></div>
          
          {/* Floating background elements */}
          <FloatingElements />
          
          {/* Centered Content */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white z-10 p-4">
            <div className="max-w-4xl mx-auto text-center">
              <AnimatedText 
                text="Welcome to CampusConnect" 
                className="text-4xl md:text-6xl font-extrabold mb-4"
              />
              
              <motion.p 
                className="text-lg md:text-xl text-gray-200 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 1 }}
              >
                Your all-in-one platform for academic collaboration and campus life.
              </motion.p>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 300 }}
              >
                <button
                  onClick={() => navigate("/signin")}
                  className="px-8 py-3 bg-white text-red-800 rounded-full hover:bg-gray-100 transition font-semibold relative overflow-hidden group"
                >
                  <span className="relative z-10">SignIn</span>
                  <motion.span 
                    className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ width: 0 }}
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                </button>
              </motion.div>
            </div>
            
            <ScrollIndicator />
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <SectionWrapper id="features">
        {/* <div className="max-w-6xl mx-auto"> */}
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
          
          </motion.h2>
          <Features />
        {/* </div> */}
      </SectionWrapper>
        
     
      <section id="about"><About/></section>
      {/* About Section */}
      {/* <SectionWrapper id="about"> 
        <About/>
      </SectionWrapper> */}

      {/* Contact Section */}
      <SectionWrapper id="contact">
        {/* <div className="max-w-6xl mx-auto"> */}
          <Contact />
        {/* </div> */}
      </SectionWrapper>

      {/* Back to Top Button */}
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 bg-red-800 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors z-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </motion.button>

      <Footer />
    </>
  );
};

export default LandingPage;

// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
//   // import CollegeImg from "../assets/dit.jpeg"; // Adjust the image path if needed.
// import Navbar from "../components/common/Navbar";
// import Footer from "../components/common/Footer";

// const LandingPage = () => {
//   const navigate = useNavigate();

//   return (
//     <>
//       <Navbar />
//       <div className="relative w-full min-h-screen">
// {/* Full Screen Image Section */}
// <motion.div
//   initial={{ opacity: 0 }}
//   animate={{ opacity: 1 }}
//   transition={{ duration: 0.6 }}
//   className="relative w-full min-h-screen bg-cover bg-center"
//   style={{
//     backgroundImage: `url(https://images.shiksha.com/mediadata/images/1744799227phpyYTD3H.jpeg)`,
//     backgroundSize: 'cover',
//     backgroundPosition: 'center',
//   }}
// >
//   {/* Overlay for Content Visibility */}
//   <div className="absolute inset-0 bg-black/60"></div>

//   {/* Centered Content */}
//   <div className="absolute inset-0 flex flex-col justify-center items-center text-white z-10 p-4">
//     <h1 className="text-5xl font-extrabold mb-4 text-center">Welcome to CampusConnect</h1>
//     <p className="text-lg text-gray-200 mb-6 text-center">
//       CampusConnect is your all-in-one platform for academic collaboration and campus life.
//     </p>

//     <button
//       onClick={() => navigate("/signin")}
//       className="px-8 py-3 bg-white text-red-800 rounded-full hover:bg-gray-100 transition font-semibold"
//     >
//       Get Started
//     </button>
//   </div>
// </motion.div>

//       </div>

//       <Footer />
//     </>
//   );
// };

// export default LandingPage;
