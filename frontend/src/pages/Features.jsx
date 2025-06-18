import React, { useState } from 'react';
import { Users, Calendar, Brain, Bell, Book, BarChart, MessageSquare, FileText, Star, Award, Zap } from 'lucide-react';

const Features = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [completedFeatures, setCompletedFeatures] = useState(new Set());

  const featuresList = [
    {
      icon: <Users size={40} />,
      title: "CCTV Face Recognition Attendance",
      description: "Automated attendance tracking using AI-powered face recognition through existing CCTV infrastructure, eliminating manual roll calls and reducing administrative burden.",
      points: 100,
      badge: "🎯"
    },
    {
      icon: <Calendar size={40} />,
      title: "Student Tracking",
      description: "Comprehensive tracking system for monitoring student activities, academic progress, and campus presence to enhance security and provide valuable insights to educators.",
      points: 85,
      badge: "📍"
    },
    {
      icon: <Brain size={40} />,
      title: "Student Stress Management",
      description: "Mental wellness tools and resources to help students manage academic stress, including mood tracking, meditation resources, and direct counselor connections.",
      points: 120,
      badge: "💚"
    },
    {
      icon: <Bell size={40} />,
      title: "Real-Time Notifications",
      description: "Instant alerts for important campus announcements, emergency notifications, and personalized academic updates.",
      points: 75,
      badge: "⚡"
    },
    {
      icon: <Book size={40} />,
      title: "Course Management",
      description: "Centralized platform for syllabus access, assignment submissions, and educational resource distribution.",
      points: 90,
      badge: "📚"
    },
    {
      icon: <BarChart size={40} />,
      title: "Performance Analytics",
      description: "Data-driven insights on academic performance with visual representations of progress and improvement areas.",
      points: 110,
      badge: "📊"
    },
    {
      icon: <MessageSquare size={40} />,
      title: "Communication Hub",
      description: "Secure messaging system connecting students, faculty, and administrative staff for seamless communication.",
      points: 80,
      badge: "💬"
    },
    {
      icon: <FileText size={40} />,
      title: "Document Management",
      description: "Digital repository for academic documents, certificates, and important institutional paperwork.",
      points: 95,
      badge: "📄"
    }
  ];

  const handleFeatureClick = (index) => {
    setCompletedFeatures(prev => new Set([...prev, index]));
  };

  const totalPoints = Array.from(completedFeatures).reduce((sum, index) => sum + featuresList[index].points, 0);

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-red-900 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-red-700 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-red-800 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Header with gamification elements */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="bg-gradient-to-r from-red-900 to-red-700 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              <Zap size={16} className="inline mr-2" />
             Explore our features
            </div>
            {totalPoints > 0 && (
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                <Star size={16} className="inline mr-1" />
                {totalPoints} Points
              </div>
            )}
          </div>
          
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-red-900 via-red-800 to-red-700 bg-clip-text text-transparent">
            Campus Connect Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transforming campus management with cutting-edge technology and student-centered solutions
          </p>
          
          {/* Progress indicator */}
          {/* <div className="mt-8 max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Features Explored</span>
              <span>{completedFeatures.size}/{featuresList.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-800 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(completedFeatures.size / featuresList.length) * 100}%` }}
              ></div>
            </div>
          </div> */}
        </div>
        
        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuresList.map((feature, index) => {
            const isCompleted = completedFeatures.has(index);
            const isHovered = hoveredCard === index;
            
            return (
              <div 
                key={index}
                className="group relative cursor-pointer"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleFeatureClick(index)}
              >
                {/* Card */}
                <div className={`
                  bg-white rounded-2xl shadow-lg p-8 h-full transition-all duration-500 transform
                  ${isHovered ? 'scale-105 shadow-2xl' : 'hover:shadow-xl'}
                  ${isCompleted ? 'ring-2 ring-green-400 bg-gradient-to-br from-green-50 to-white' : ''}
                  border-l-4 border-red-900 relative overflow-hidden
                `}>
                  
                  {/* Floating badge */}
                  <div className="absolute top-4 right-4 text-2xl">
                    {feature.badge}
                  </div>
                  
                  {/* Completion checkmark */}
                  {isCompleted && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1">
                      <Award size={16} />
                    </div>
                  )}
                  
                  {/* Icon container */}
                  <div className={`
                    mb-6 p-4 rounded-xl inline-block transition-all duration-300
                    ${isHovered ? 'bg-red-900 shadow-lg' : 'bg-gradient-to-br from-red-100 to-red-50'}
                  `}>
                    <div className={`transition-colors duration-300 ${isHovered ? 'text-white' : 'text-red-900'}`}>
                      {feature.icon}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold mb-4 text-red-900 group-hover:text-red-800 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Points indicator */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500 font-medium">
                      Click to explore
                    </span>
                    <div className="flex items-center text-red-700 font-semibold">
                      <Star size={14} className="mr-1" />
                      {feature.points}
                    </div>
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-t from-red-900/5 to-transparent 
                    transition-opacity duration-300 rounded-2xl
                    ${isHovered ? 'opacity-100' : 'opacity-0'}
                  `}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to action with achievement system */}
        <div className="mt-20 text-center">
          {completedFeatures.size === featuresList.length && (
            <div className="mb-8 p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl border border-green-200 max-w-md mx-auto">
              <div className="text-4xl mb-2">🏆</div>
              <h3 className="text-lg font-bold text-green-800 mb-1">These were all features</h3>
              <p className="text-green-700 text-sm">You have explored All the features !</p>
            </div>
          )}
          
          {/* <button className="
            bg-gradient-to-r from-red-900 to-red-800 text-white font-semibold 
            py-4 px-8 rounded-xl shadow-lg transition-all duration-300 
            hover:from-red-800 hover:to-red-700 hover:shadow-xl hover:scale-105
            focus:outline-none focus:ring-4 focus:ring-red-200
          ">
            <span className="flex items-center justify-center gap-2">
              Explore All Features
              <Zap size={18} />
            </span>
          </button> */}
        </div>
      </div>
    </section>
  );
};

export default Features;


// import React from 'react';
// import { Users, Calendar, Brain, Bell, Book, ChartBar, MessageSquare, FileText } from 'lucide-react';
// import Footer from '../components/common/Footer';
// import Navbar from '../components/common/Navbar';

// const Features = () => {
//   const featuresList = [
//     {
//       icon: <Users size={40} />,
//       title: "CCTV Face Recognition Attendance",
//       description: "Automated attendance tracking using AI-powered face recognition through existing CCTV infrastructure, eliminating manual roll calls and reducing administrative burden."
//     },
//     {
//       icon: <Calendar size={40} />,
//       title: "Student Tracking",
//       description: "Comprehensive tracking system for monitoring student activities, academic progress, and campus presence to enhance security and provide valuable insights to educators."
//     },
//     {
//       icon: <Brain size={40} />,
//       title: "Student Stress Management",
//       description: "Mental wellness tools and resources to help students manage academic stress, including mood tracking, meditation resources, and direct counselor connections."
//     },
//     {
//       icon: <Bell size={40} />,
//       title: "Real-Time Notifications",
//       description: "Instant alerts for important campus announcements, emergency notifications, and personalized academic updates."
//     },
//     {
//       icon: <Book size={40} />,
//       title: "Course Management",
//       description: "Centralized platform for syllabus access, assignment submissions, and educational resource distribution."
//     },
//     {
//       icon: <ChartBar size={40} />,
//       title: "Performance Analytics",
//       description: "Data-driven insights on academic performance with visual representations of progress and improvement areas."
//     },
//     {
//       icon: <MessageSquare size={40} />,
//       title: "Communication Hub",
//       description: "Secure messaging system connecting students, faculty, and administrative staff for seamless communication."
//     },
//     {
//       icon: <FileText size={40} />,
//       title: "Document Management",
//       description: "Digital repository for academic documents, certificates, and important institutional paperwork."
//     }
//   ];

//   return (
//     <>
//     <Navbar/>
//     <section className="py-16 bg-gray-50">
//       <div className="container mx-auto px-4">
//         <div className="text-center mb-16">
//           <h2 className="text-3xl font-bold text-gray-800 mb-4">Campus Connect Features</h2>
//           <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//             Transforming campus management with cutting-edge technology and student-centered solutions
//           </p>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//           {featuresList.map((feature, index) => (
//             <div 
//               key={index} 
//               className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
//             >
//               <div className="text-red-900 mb-4">
//                 {feature.icon}
//               </div>
//               <h3 className="text-xl font-semibold text-red-900 mb-3">
//                 {feature.title}
//               </h3>
//               <p className="text-gray-600">
//                 {feature.description}
//               </p>
//             </div>
//           ))}
//         </div>
        
//         <div className="mt-16 text-center">
//           <button className="bg-red-900 text-white font-semibold py-3 px-8 rounded-lg hover:bg-red-800 transition-all duration-300">
//             Explore All Features
//           </button>
//         </div>
//       </div>
//     </section>
//     <Footer/>
//     </>
//   );
// };

// export default Features;