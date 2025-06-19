import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, 
  FiUserCheck,
  FiActivity,
  FiAward,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiTarget,
  FiChevronRight,
  FiHome,
  FiBook,
  FiAlertTriangle,
  FiClock,
  FiPieChart,
  FiMapPin,
  FiX
} from 'react-icons/fi';

const HODDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCard, setExpandedCard] = useState(null);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  
  // State for all data with proper initialization
  const [dashboardData, setDashboardData] = useState({
    studentAttendance: [],
    facultyAttendance: [],
    researchProjects: [],
    stressLevels: {
      students: {
        high: 0,
        medium: 0,
        low: 0,
        trends: {
          weekly: '0%',
          monthly: '0%'
        }
      },
      faculty: {
        high: 0,
        medium: 0,
        low: 0,
        trends: {
          weekly: '0%',
          monthly: '0%'
        }
      }
    },
    departmentStats: {
      totalStudents: 0,
      totalFaculty: 0,
      ongoingProjects: 0,
      avgAttendance: 0
    },
    studentPerformance: [],
    facultyWorkload: []
  });

  // Fetch dashboard data and faculty members
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        console.log('Fetching dashboard and faculty data...');

        // Fetch faculty members first
        const facultyResponse = await fetch('http://69.62.83.14:9000/api/hod/faculty', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (facultyResponse.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }

        if (!facultyResponse.ok) {
          throw new Error('Error fetching faculty data');
        }

        const facultyData = await facultyResponse.json();
        console.log('Faculty data received:', facultyData);
        setFacultyMembers(facultyData || []); // Ensure facultyData is an array

        // Fetch dashboard data
        const dashboardResponse = await fetch('http://69.62.83.14:9000/api/hod/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (!dashboardResponse.ok) {
          throw new Error('Error fetching dashboard data');
        }

        const dashboardData = await dashboardResponse.json();
        console.log('Dashboard data received:', dashboardData);

        // Update state with safeguards for all arrays
        setDashboardData(prevData => ({
          ...dashboardData,
          departmentStats: {
            ...(dashboardData.departmentStats || {}),
            totalFaculty: facultyData.length // Ensure faculty count is preserved
          },
          studentAttendance: dashboardData.studentAttendance || [],
          facultyAttendance: dashboardData.facultyAttendance || [],
          researchProjects: dashboardData.researchProjects || [],
          studentPerformance: dashboardData.studentPerformance || [],
          facultyWorkload: dashboardData.facultyWorkload || [],
          stressLevels: {
            students: {
              ...(dashboardData.stressLevels?.students || prevData.stressLevels.students),
              high: dashboardData.stressLevels?.students?.high || 0,
              medium: dashboardData.stressLevels?.students?.medium || 0,
              low: dashboardData.stressLevels?.students?.low || 0,
              trends: {
                weekly: dashboardData.stressLevels?.students?.trends?.weekly || '0%',
                monthly: dashboardData.stressLevels?.students?.trends?.monthly || '0%'
              }
            },
            faculty: {
              ...(dashboardData.stressLevels?.faculty || prevData.stressLevels.faculty),
              high: dashboardData.stressLevels?.faculty?.high || 0,
              medium: dashboardData.stressLevels?.faculty?.medium || 0,
              low: dashboardData.stressLevels?.faculty?.low || 0,
              trends: {
                weekly: dashboardData.stressLevels?.faculty?.trends?.weekly || '0%',
                monthly: dashboardData.stressLevels?.faculty?.trends?.monthly || '0%'
              }
            }
          }
        }));

      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.message === 'No authentication token found') {
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate percentages
  const calculatePercentage = (present, total) => {
    if (!total || total === 0) return 0;
    return Math.round((present / total) * 100);
  };

  // Red color theme variants
  const theme = {
    primary: 'bg-gradient-to-r from-red-600 to-red-800',
    secondary: 'bg-gradient-to-r from-red-700 to-red-900',
    light: 'bg-red-50',
    accent: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    },
    hover: {
      y: -5,
      boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.3)"
    }
  };

  const cardExpandVariants = {
    collapsed: { height: "auto" },
    expanded: { height: "auto" }
  };

  const handleFacultyCardClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFacultyModal(true);
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-screen"
      >
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.5,
            ease: "linear"
          }}
          className="h-16 w-16 rounded-full border-4 border-t-red-600 border-r-red-600 border-b-transparent border-l-transparent"
        ></motion.div>
      </motion.div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={`bg-white rounded-xl shadow-md p-6 mb-6 border ${theme.border}`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-gray-900"
            >
              HOD <span className={theme.text}>Dashboard</span>
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 space-y-1"
            >
              <p className="font-medium">{dashboardData.name || 'HOD Name'}</p>
              <p className="text-sm">ERP ID: {dashboardData.hodErpId || 'Not Available'}</p>
              <p className="text-sm">{dashboardData.department || 'Department'} - {dashboardData.branch || 'Branch'}</p>
            </motion.div>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 md:mt-0"
          >
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg shadow-inner">
              {['overview', 'students', 'faculty', 'research', 'stress'].map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setExpandedCard(null);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab 
                      ? `${theme.primary} text-white shadow-md` 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab === 'overview' ? <FiHome className="inline mr-1" /> : 
                   tab === 'students' ? <FiUsers className="inline mr-1" /> : 
                   tab === 'faculty' ? <FiUserCheck className="inline mr-1" /> : 
                   tab === 'research' ? <FiAward className="inline mr-1" /> : 
                   <FiActivity className="inline mr-1" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Overview Section */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { 
                  title: 'Total Students', 
                  value: dashboardData.departmentStats?.totalStudents || 0, 
                  icon: <FiUsers className="text-white" size={24} />,
                  trend: 'up',
                  change: '+5% from last year'
                },
                { 
                  title: 'Faculty Members', 
                  value: dashboardData.departmentStats?.totalFaculty || 0, 
                  icon: <FiUserCheck className="text-white" size={24} />,
                  trend: 'neutral',
                  change: 'No change'
                },
                { 
                  title: 'Ongoing Projects', 
                  value: dashboardData.departmentStats?.ongoingProjects || 0, 
                  icon: <FiAward className="text-white" size={24} />,
                  trend: 'up',
                  change: '+2 new projects'
                },
                { 
                  title: 'Avg Attendance', 
                  value: `${dashboardData.departmentStats?.avgAttendance || 0}%`, 
                  icon: <FiBook className="text-white" size={24} />,
                  trend: 'down',
                  change: '-2% from last month'
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.title}
                  variants={itemVariants}
                  whileHover="hover"
                  className={`${theme.primary} text-white rounded-xl p-5 shadow-lg`}
                >
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-lg bg-white bg-opacity-20 flex items-center justify-center mb-4">
                      {stat.icon}
                    </div>
                    <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                  <p className="text-sm opacity-90">{stat.title}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Quick Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Student Attendance Summary */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center">
                    <FiUsers className={`mr-2 ${theme.text}`} />
                    Student Attendance
                  </h3>
                  <span className={`text-xs ${theme.accent} ${theme.text} px-2 py-1 rounded-full`}>
                    Today
                  </span>
                </div>
                <div className="space-y-4">
                  {(dashboardData.studentAttendance || []).slice(0, 3).map((course, index) => {
                    const total = (course.present || 0) + (course.absent || 0);
                    const percentage = calculatePercentage(course.present || 0, total);
                    
                    return (
                      <motion.div
                        key={index}
                        variants={itemVariants}
                        className="group"
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{course.course || 'Unknown Course'}</span>
                          <span className="font-medium">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: index * 0.1, duration: 0.8 }}
                            className={`h-2 rounded-full ${
                              percentage >= 90 ? 'bg-green-500' :
                              percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                            } group-hover:shadow-md group-hover:shadow-red-100`}
                          ></motion.div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Prof: {course.professor || 'Unknown'}</span>
                          <span>Room: {course.room || 'Unknown'}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <motion.button
                  whileHover={{ x: 5 }}
                  className={`mt-4 text-sm ${theme.text} font-medium flex items-center`}
                >
                  View Detailed Report <FiChevronRight className="ml-1" />
                </motion.button>
              </motion.div>

              {/* Faculty Status */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center">
                    <FiUserCheck className={`mr-2 ${theme.text}`} />
                    Faculty Status
                  </h3>
                  <span className={`text-xs ${theme.accent} ${theme.text} px-2 py-1 rounded-full`}>
                    This Month
                  </span>
                </div>
                <div className="space-y-3">
                  {(dashboardData.facultyAttendance || []).slice(0, 3).map((faculty, index) => {
                    const totalDays = (faculty.presentDays || 0) + (faculty.absentDays || 0);
                    const percentage = calculatePercentage(faculty.presentDays || 0, totalDays);
                    
                    return (
                      <motion.div
                        key={index}
                        variants={itemVariants}
                        className="flex items-start p-2 hover:bg-red-50 rounded-lg transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border-2 border-red-200">
                          <img 
                            src={faculty.avatar || '/default-avatar.png'} 
                            alt={faculty.name || 'Faculty'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/default-avatar.png';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">{faculty.name || 'Unknown Faculty'}</h4>
                          <p className="text-xs text-gray-500">{faculty.position || 'Unknown Position'}</p>
                          <div className="flex items-center mt-1">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  percentage >= 90 ? 'bg-green-500' :
                                  percentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{percentage}%</span>
                          </div>
                        </div>
                        {(faculty.absentDays || 0) > 0 && (
                          <FiAlertTriangle className="text-red-500 ml-2" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                <motion.button
                  whileHover={{ x: 5 }}
                  className={`mt-4 text-sm ${theme.text} font-medium flex items-center`}
                >
                  View All Faculty <FiChevronRight className="ml-1" />
                </motion.button>
              </motion.div>

              {/* Stress Levels Overview */}
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center">
                    <FiActivity className={`mr-2 ${theme.text}`} />
                    Stress Overview
                  </h3>
                  <span className={`text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full`}>
                    Alert
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`p-3 rounded-lg ${theme.light}`}>
                    <div className="text-xs font-medium text-red-700 mb-1">Students</div>
                    <div className="text-xl font-bold text-red-800">
                      {dashboardData.stressLevels?.students?.high || 0} High
                    </div>
                    <div className="text-xs text-red-600">
                      {dashboardData.stressLevels?.students?.trends?.weekly || '0%'} weekly
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${theme.light}`}>
                    <div className="text-xs font-medium text-red-700 mb-1">Faculty</div>
                    <div className="text-xl font-bold text-red-800">
                      {dashboardData.stressLevels?.faculty?.high || 0} High
                    </div>
                    <div className="text-xs text-red-600">
                      {dashboardData.stressLevels?.faculty?.trends?.weekly || '0%'} weekly
                    </div>
                  </div>
                </div>
                <div className="relative h-40">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Student Stress */}
                    <motion.path
                      initial={{ strokeDasharray: "0 100" }}
                      animate={{ 
                        strokeDasharray: `${dashboardData.stressLevels?.students?.high || 0} ${100 - (dashboardData.stressLevels?.students?.high || 0)}`,
                        opacity: [0, 1]
                      }}
                      transition={{ delay: 0.2, duration: 1 }}
                      d="M50 10 A40 40 0 1 1 10 50"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />
                    {/* Faculty Stress */}
                    <motion.path
                      initial={{ strokeDasharray: "0 100" }}
                      animate={{ 
                        strokeDasharray: `${dashboardData.stressLevels?.faculty?.high || 0} ${100 - (dashboardData.stressLevels?.faculty?.high || 0)}`,
                        opacity: [0, 1]
                      }}
                      transition={{ delay: 0.4, duration: 1 }}
                      d="M50 10 A40 40 0 0 0 10 50"
                      fill="none"
                      stroke="#fca5a5"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FiActivity className="text-red-200" size={40} />
                  </div>
                </div>
                <motion.button
                  whileHover={{ x: 5 }}
                  className={`mt-4 text-sm ${theme.text} font-medium flex items-center`}
                >
                  View Stress Analysis <FiChevronRight className="ml-1" />
                </motion.button>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center">
                  <FiClock className={`mr-2 ${theme.text}`} />
                  Recent Activity
                </h3>
                <button className={`text-sm ${theme.text} font-medium flex items-center`}>
                  View All <FiChevronRight className="ml-1" />
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { 
                    id: 1,
                    title: "Faculty Meeting", 
                    description: "Monthly department meeting", 
                    time: "Today, 10:30 AM", 
                    type: "meeting",
                    icon: <FiUsers className="text-red-600" />
                  },
                  { 
                    id: 2,
                    title: "Research Proposal Submitted", 
                    description: "New proposal on Quantum Computing", 
                    time: "Yesterday, 2:15 PM", 
                    type: "research",
                    icon: <FiAward className="text-red-600" />
                  },
                  { 
                    id: 3,
                    title: "Student Concerns", 
                    description: "Group of students raised concerns about course workload", 
                    time: "2 days ago, 11:45 AM", 
                    type: "alert",
                    icon: <FiAlertTriangle className="text-red-600" />
                  }
                ].map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    variants={itemVariants}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start p-3 hover:bg-red-50 rounded-lg transition-colors group cursor-pointer"
                    onClick={() => setExpandedCard(expandedCard === activity.id ? null : activity.id)}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${theme.light}`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <AnimatePresence>
                        {expandedCard === activity.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 text-xs text-gray-500"
                          >
                            <p>Additional details about this activity would appear here.</p>
                            <p className="mt-1">Click again to collapse.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedCard === activity.id ? 90 : 0 }}
                      className="text-gray-400 group-hover:text-gray-600"
                    >
                      <FiChevronRight />
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Student Attendance */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <FiUsers className={`mr-2 ${theme.text}`} />
                  Student Attendance
                </h2>
                <button className={`text-sm ${theme.text} font-medium flex items-center`}>
                  View All <FiChevronRight className="ml-1" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                      <th className="pb-3">Course</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Present</th>
                      <th className="pb-3">Absent</th>
                      <th className="pb-3">Late</th>
                      <th className="pb-3">Professor</th>
                      <th className="pb-3">Room</th>
                      <th className="pb-3">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardData.studentAttendance || []).map((course, index) => {
                      const total = (course.present || 0) + (course.absent || 0);
                      const percentage = calculatePercentage(course.present || 0, total);
                      
                      return (
                        <motion.tr
                          key={index}
                          variants={itemVariants}
                          className="border-b border-gray-100 hover:bg-red-50"
                          whileHover={{ x: 5 }}
                        >
                          <td className="py-4 font-medium">{course.course || 'Unknown Course'}</td>
                          <td className="py-4 text-sm">{course.date || 'Unknown Date'}</td>
                          <td className="py-4 text-green-600">{course.present || 0}</td>
                          <td className="py-4 text-red-600">{course.absent || 0}</td>
                          <td className="py-4 text-yellow-600">{course.late || 0}</td>
                          <td className="py-4 text-sm">{course.professor || 'Unknown'}</td>
                          <td className="py-4 text-sm">{course.room || 'Unknown'}</td>
                          <td className="py-4">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    percentage >= 90 ? 'bg-green-500' :
                                    percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span>{percentage}%</span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Student Performance */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <FiBarChart2 className={`mr-2 ${theme.text}`} />
                  Student Performance
                </h2>
                <button className={`text-sm ${theme.text} font-medium flex items-center`}>
                  View All <FiChevronRight className="ml-1" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(dashboardData.studentPerformance || []).map((course, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover="hover"
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-bold text-gray-900 mb-2">{course.course || 'Unknown Course'}</h3>
                    <div className="flex justify-between mb-3">
                      <span className="text-sm text-gray-600">Average Grade:</span>
                      <span className="font-medium">{course.avgGrade || 0}%</span>
                    </div>
                    <div className="flex justify-between mb-3">
                      <span className="text-sm text-gray-600">Top Performer:</span>
                      <span className="font-medium">{course.topPerformer || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Improvement:</span>
                      <span className={`font-medium ${
                        (course.improvement || '').startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {course.improvement || '0%'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Faculty Tab */}
        {activeTab === 'faculty' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Department Faculty List */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <FiUsers className={`mr-2 ${theme.text}`} />
                  Department Faculty ({facultyMembers.length})
                </h2>
              </div>

              {facultyMembers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No faculty members found in your department.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                        <th className="pb-3">ERP ID</th>
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Joined Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facultyMembers.map((faculty) => (
                        <motion.tr
                          key={faculty.id}
                          variants={itemVariants}
                          className="border-b border-gray-100 hover:bg-red-50"
                          whileHover={{ x: 5 }}
                        >
                          <td className="py-4 font-medium">{faculty.erpid || 'N/A'}</td>
                          <td className="py-4">{faculty.name || 'Unknown'}</td>
                          <td className="py-4">{faculty.email || 'N/A'}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              faculty.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {faculty.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 text-sm">
                            {faculty.created_at ? new Date(faculty.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Faculty Attendance */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <FiUserCheck className={`mr-2 ${theme.text}`} />
                  Faculty Attendance
                </h2>
                <button className={`text-sm ${theme.text} font-medium flex items-center`}>
                  View All <FiChevronRight className="ml-1" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(dashboardData.facultyAttendance || []).map((faculty, index) => {
                  const totalDays = (faculty.presentDays || 0) + (faculty.absentDays || 0);
                  const percentage = calculatePercentage(faculty.presentDays || 0, totalDays);
                  
                  return (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      whileHover="hover"
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden mr-3 border-2 border-red-200">
                          <img 
                            src={faculty.avatar || '/default-avatar.png'} 
                            alt={faculty.name || 'Faculty'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/default-avatar.png';
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{faculty.name || 'Unknown Faculty'}</h3>
                          <p className="text-xs text-gray-600">{faculty.position || 'Unknown Position'}</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Present:</span>
                        <span className="font-medium">{faculty.presentDays || 0} days</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Absent:</span>
                        <span className="font-medium text-red-600">{faculty.absentDays || 0} days</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full ${
                            percentage >= 90 ? 'bg-green-500' :
                            percentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Last Active:</span>
                        <span>{faculty.lastActive || 'Unknown'}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Faculty Workload */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <FiActivity className={`mr-2 ${theme.text}`} />
                  Faculty Workload
                </h2>
                <button className={`text-sm ${theme.text} font-medium flex items-center`}>
                  View All <FiChevronRight className="ml-1" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                      <th className="pb-3">Faculty</th>
                      <th className="pb-3">Courses</th>
                      <th className="pb-3">Research</th>
                      <th className="pb-3">Admin</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardData.facultyWorkload || []).map((faculty, index) => (
                      <motion.tr
                        key={index}
                        variants={itemVariants}
                        className="border-b border-gray-100 hover:bg-red-50"
                        whileHover={{ x: 5 }}
                      >
                        <td className="py-4 font-medium">{faculty.name || 'Unknown Faculty'}</td>
                        <td className="py-4">{faculty.courses || 0}</td>
                        <td className="py-4">{faculty.research || 0}</td>
                        <td className="py-4">{faculty.admin || 0}</td>
                        <td className="py-4 font-bold">{faculty.total || 0}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            (faculty.total || 0) <= 4 ? 'bg-green-100 text-green-800' :
                            (faculty.total || 0) <= 6 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {(faculty.total || 0) <= 4 ? 'Light' :
                             (faculty.total || 0) <= 6 ? 'Moderate' : 'Heavy'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Research Tab */}
        {activeTab === 'research' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Research Projects */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <FiAward className={`mr-2 ${theme.text}`} />
                  Research Projects
                </h2>
                <button className={`text-sm ${theme.text} font-medium flex items-center`}>
                  View All <FiChevronRight className="ml-1" />
                </button>
              </div>

              <div className="space-y-4">
                {(dashboardData.researchProjects || []).map((project, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover="hover"
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      project.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{project.title || 'Untitled Project'}</h3>
                        <p className="text-sm text-gray-600">Lead: {project.lead || 'Unknown'}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {project.status || 'unknown'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Funding</p>
                        <p className="font-medium">{project.funding || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Team Size</p>
                        <p className="font-medium">{project.team || 0} members</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="font-medium">
                          {project.startDate || 'Unknown'} to {project.endDate || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{project.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (project.progress || 0) < 50 ? 'bg-red-500' :
                            (project.progress || 0) < 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Milestones</p>
                      <div className="flex flex-wrap gap-2">
                        {(project.milestones || []).map((milestone, idx) => (
                          <span 
                            key={idx}
                            className={`px-2 py-1 text-xs rounded-full ${
                              milestone.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {milestone.name || 'Milestone'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Stress Tab */}
        {activeTab === 'stress' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Student Stress */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <FiActivity className={`mr-2 ${theme.text}`} />
                  Student Stress Levels
                </h2>
                <button className={`text-sm ${theme.text} font-medium flex items-center`}>
                  View All <FiChevronRight className="ml-1" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${theme.light}`}>
                  <div className="text-sm font-medium text-red-700 mb-1">High Stress</div>
                  <div className="text-3xl font-bold text-red-800">
                    {dashboardData.stressLevels?.students?.high || 0}
                  </div>
                  <div className="text-xs text-red-600">
                    {dashboardData.stressLevels?.students?.trends?.weekly || '0%'} weekly change
                  </div>
                </div>
                <div className={`p-4 rounded-lg bg-amber-50`}>
                  <div className="text-sm font-medium text-amber-700 mb-1">Medium Stress</div>
                  <div className="text-3xl font-bold text-amber-800">
                    {dashboardData.stressLevels?.students?.medium || 0}
                  </div>
                  <div className="text-xs text-amber-600">
                    {dashboardData.stressLevels?.students?.trends?.monthly || '0%'} monthly change
                  </div>
                </div>
                <div className={`p-4 rounded-lg bg-green-50`}>
                  <div className="text-sm font-medium text-green-700 mb-1">Low Stress</div>
                  <div className="text-3xl font-bold text-green-800">
                    {dashboardData.stressLevels?.students?.low || 0}
                  </div>
                  <div className="text-xs text-green-600">
                    Baseline healthy students
                  </div>
                </div>
              </div>

              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <FiMapPin className="mx-auto text-red-600 mb-2" size={32} />
                  <p className="text-gray-700">Stress level heatmap would appear here</p>
                  <p className="text-sm text-gray-600">Showing distribution across campus</p>
                </div>
              </div>
            </motion.div>

            {/* Faculty Stress */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <FiUserCheck className={`mr-2 ${theme.text}`} />
                  Faculty Stress Levels
                </h2>
                <button className={`text-sm ${theme.text} font-medium flex items-center`}>
                  View All <FiChevronRight className="ml-1" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${theme.light}`}>
                  <div className="text-sm font-medium text-red-700 mb-1">High Stress</div>
                  <div className="text-3xl font-bold text-red-800">
                    {dashboardData.stressLevels?.faculty?.high || 0}
                  </div>
                  <div className="text-xs text-red-600">
                    {dashboardData.stressLevels?.faculty?.trends?.weekly || '0%'} weekly change
                  </div>
                </div>
                <div className={`p-4 rounded-lg bg-amber-50`}>
                  <div className="text-sm font-medium text-amber-700 mb-1">Medium Stress</div>
                  <div className="text-3xl font-bold text-amber-800">
                    {dashboardData.stressLevels?.faculty?.medium || 0}
                  </div>
                  <div className="text-xs text-amber-600">
                    {dashboardData.stressLevels?.faculty?.trends?.monthly || '0%'} monthly change
                  </div>
                </div>
                <div className={`p-4 rounded-lg bg-green-50`}>
                  <div className="text-sm font-medium text-green-700 mb-1">Low Stress</div>
                  <div className="text-3xl font-bold text-green-800">
                    {dashboardData.stressLevels?.faculty?.low || 0}
                  </div>
                  <div className="text-xs text-green-600">
                    Baseline healthy faculty
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3">Stress Trends</h3>
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <FiActivity className="mx-auto text-red-600 mb-2" size={32} />
                    <p className="text-gray-700">Stress trend analytics would appear here</p>
                    <p className="text-sm text-gray-600">Weekly and monthly comparisons</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Department Stats */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <FiUsers className={`mr-2 ${theme.text}`} />
            Department Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleFacultyCardClick}
              className="w-full text-left bg-red-50 rounded-lg p-4 cursor-pointer hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="w-full"
              >
                <div className="text-sm text-red-600 mb-1">Total Faculty</div>
                <div className="text-2xl font-bold text-red-700">{dashboardData.departmentStats?.totalFaculty || 0}</div>
              </motion.div>
            </button>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-1">Total Students</div>
              <div className="text-2xl font-bold text-blue-700">{dashboardData.departmentStats?.totalStudents || 0}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 mb-1">Ongoing Projects</div>
              <div className="text-2xl font-bold text-green-700">{dashboardData.departmentStats?.ongoingProjects || 0}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 mb-1">Avg Attendance</div>
              <div className="text-2xl font-bold text-purple-700">{dashboardData.departmentStats?.avgAttendance || 0}%</div>
            </div>
          </div>
        </motion.div>

        {/* Faculty Modal */}
        <AnimatePresence>
          {showFacultyModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowFacultyModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center">
                    <FiUsers className="mr-2 text-red-600" />
                    Department Faculty Members ({facultyMembers.length})
                  </h2>
                  <button
                    onClick={() => setShowFacultyModal(false)}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FiX size={24} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
                  {facultyMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No faculty members found in your department.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {facultyMembers.map((faculty) => (
                        <motion.div
                          key={faculty.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-red-50 transition-colors"
                        >
                          <div className="font-semibold text-lg mb-2">{faculty.name || 'N/A'}</div>
                          <div className="text-sm text-gray-600 mb-1">ERP ID: {faculty.erpid || 'N/A'}</div>
                          <div className="text-sm text-gray-600 mb-1">{faculty.email || 'N/A'}</div>
                          <div className="flex items-center mt-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              faculty.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {faculty.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              Joined: {faculty.created_at ? new Date(faculty.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default HODDashboard;

// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { 
//   FiUsers, 
//   FiUserCheck,
//   FiActivity,
//   FiAward,
//   FiCalendar,
//   FiTrendingUp,
//   FiTrendingDown,
//   FiBarChart2,
//   FiTarget,
//   FiChevronRight,
//   FiHome,
//   FiBook,
//   FiAlertTriangle,
//   FiClock,
//   FiPieChart,
//   FiMapPin,
//   FiX
// } from 'react-icons/fi';

// const HODDashboard = () => {
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState('overview');
//   const [expandedCard, setExpandedCard] = useState(null);
//   const [facultyMembers, setFacultyMembers] = useState([]);
//   const [showFacultyModal, setShowFacultyModal] = useState(false);
  
//   // State for all data
//   const [dashboardData, setDashboardData] = useState({
//     studentAttendance: [],
//     facultyAttendance: [],
//     researchProjects: [],
//     stressLevels: {
//       students: {
//         high: 0,
//         medium: 0,
//         low: 0,
//         trends: {
//           weekly: '0%',
//           monthly: '0%'
//         }
//       },
//       faculty: {
//         high: 0,
//         medium: 0,
//         low: 0,
//         trends: {
//           weekly: '0%',
//           monthly: '0%'
//         }
//       }
//     },
//     departmentStats: {
//       totalStudents: 0,
//       totalFaculty: 0,
//       ongoingProjects: 0,
//       avgAttendance: 0
//     },
//     studentPerformance: [],
//     facultyWorkload: []
//   });

//   // Fetch dashboard data and faculty members
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const token = localStorage.getItem('token');
        
//         if (!token) {
//           throw new Error('No authentication token found');
//         }

//         console.log('Fetching dashboard and faculty data...');

//         // Fetch faculty members first
//         const facultyResponse = await fetch('http://69.62.83.14:9000/api/hod/faculty', {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           },
//         });

//         if (facultyResponse.status === 401) {
//           localStorage.removeItem('token');
//           localStorage.removeItem('user');
//           window.location.href = '/login';
//           return;
//         }

//         if (!facultyResponse.ok) {
//           throw new Error('Error fetching faculty data');
//         }

//         const facultyData = await facultyResponse.json();
//         console.log('Faculty data received:', facultyData);
//         setFacultyMembers(facultyData);

//         // Update department stats with faculty count
//         setDashboardData(prevData => ({
//           ...prevData,
//           departmentStats: {
//             ...prevData.departmentStats,
//             totalFaculty: facultyData.length
//           }
//         }));

//         // Fetch dashboard data
//         const dashboardResponse = await fetch('http://69.62.83.14:9000/api/hod/dashboard', {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//           },
//         });

//         if (!dashboardResponse.ok) {
//           throw new Error('Error fetching dashboard data');
//         }

//         const dashboardData = await dashboardResponse.json();
//         console.log('Dashboard data received:', dashboardData);
//         setDashboardData(prevData => ({
//           ...dashboardData,
//           departmentStats: {
//             ...dashboardData.departmentStats,
//             totalFaculty: facultyData.length // Ensure faculty count is preserved
//           }
//         }));

//       } catch (error) {
//         console.error('Error fetching data:', error);
//         if (error.message === 'No authentication token found') {
//           window.location.href = '/login';
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   // Calculate percentages
//   const calculatePercentage = (present, total) => {
//     return Math.round((present / total) * 100);
//   };

//   // Red color theme variants
//   const theme = {
//     primary: 'bg-gradient-to-r from-red-600 to-red-800',
//     secondary: 'bg-gradient-to-r from-red-700 to-red-900',
//     light: 'bg-red-50',
//     accent: 'bg-red-100',
//     text: 'text-red-800',
//     border: 'border-red-200'
//   };

//   // Animation variants
//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1
//       }
//     }
//   };

//   const itemVariants = {
//     hidden: { y: 20, opacity: 0 },
//     visible: {
//       y: 0,
//       opacity: 1,
//       transition: {
//         type: "spring",
//         stiffness: 100,
//         damping: 10
//       }
//     },
//     hover: {
//       y: -5,
//       boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.3)"
//     }
//   };

//   const cardExpandVariants = {
//     collapsed: { height: "auto" },
//     expanded: { height: "auto" }
//   };

//   const handleFacultyCardClick = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     console.log('Faculty card clicked');
//     console.log('Current faculty members:', facultyMembers);
//     setShowFacultyModal(true);
//   };

//   if (loading) {
//     return (
//       <motion.div 
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         className="flex justify-center items-center h-screen"
//       >
//         <motion.div
//           animate={{ 
//             rotate: 360,
//             scale: [1, 1.2, 1]
//           }}
//           transition={{ 
//             repeat: Infinity, 
//             duration: 1.5,
//             ease: "linear"
//           }}
//           className="h-16 w-16 rounded-full border-4 border-t-red-600 border-r-red-600 border-b-transparent border-l-transparent"
//         ></motion.div>
//       </motion.div>
//     );
//   }

//   return (
//     <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">
//       {/* Header */}
//       <motion.header
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ type: "spring", stiffness: 300 }}
//         className={`bg-white rounded-xl shadow-md p-6 mb-6 border ${theme.border}`}
//       >
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
//           <div>
//             <motion.h1 
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               transition={{ delay: 0.1 }}
//               className="text-2xl font-bold text-gray-900"
//             >
//               HOD <span className={theme.text}>Dashboard</span>
//             </motion.h1>
//             <motion.div 
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               transition={{ delay: 0.2 }}
//               className="text-gray-600 space-y-1"
//             >
//               <p className="font-medium">{dashboardData.name || 'HOD Name'}</p>
//               <p className="text-sm">ERP ID: {dashboardData.hodErpId || 'Not Available'}</p>
//               <p className="text-sm">{dashboardData.department || 'Department'} - {dashboardData.branch || 'Branch'}</p>
//             </motion.div>
//           </div>
//           <motion.div 
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ delay: 0.3 }}
//             className="mt-4 md:mt-0"
//           >
//             <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg shadow-inner">
//               {['overview', 'students', 'faculty', 'research', 'stress'].map((tab) => (
//                 <motion.button
//                   key={tab}
//                   onClick={() => {
//                     setActiveTab(tab);
//                     setExpandedCard(null);
//                   }}
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
//                     activeTab === tab 
//                       ? `${theme.primary} text-white shadow-md` 
//                       : 'text-gray-700 hover:bg-gray-200'
//                   }`}
//                 >
//                   {tab === 'overview' ? <FiHome className="inline mr-1" /> : 
//                    tab === 'students' ? <FiUsers className="inline mr-1" /> : 
//                    tab === 'faculty' ? <FiUserCheck className="inline mr-1" /> : 
//                    tab === 'research' ? <FiAward className="inline mr-1" /> : 
//                    <FiActivity className="inline mr-1" />}
//                   {tab.charAt(0).toUpperCase() + tab.slice(1)}
//                 </motion.button>
//               ))}
//             </div>
//           </motion.div>
//         </div>
//       </motion.header>

//       {/* Main Content */}
//       <motion.div 
//         className="space-y-6"
//         variants={containerVariants}
//         initial="hidden"
//         animate="visible"
//       >
//         {/* Overview Section */}
//         {activeTab === 'overview' && (
//           <>
//             {/* Stats Cards */}
//             <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
//               {[
//                 { 
//                   title: 'Total Students', 
//                   value: dashboardData.departmentStats?.totalStudents || 0, 
//                   icon: <FiUsers className="text-white" size={24} />,
//                   trend: 'up',
//                   change: '+5% from last year'
//                 },
//                 { 
//                   title: 'Faculty Members', 
//                   value: dashboardData.departmentStats?.totalFaculty || 0, 
//                   icon: <FiUserCheck className="text-white" size={24} />,
//                   trend: 'neutral',
//                   change: 'No change'
//                 },
//                 { 
//                   title: 'Ongoing Projects', 
//                   value: dashboardData.departmentStats?.ongoingProjects || 0, 
//                   icon: <FiAward className="text-white" size={24} />,
//                   trend: 'up',
//                   change: '+2 new projects'
//                 },
//                 { 
//                   title: 'Avg Attendance', 
//                   value: `${dashboardData.departmentStats?.avgAttendance || 0}%`, 
//                   icon: <FiBook className="text-white" size={24} />,
//                   trend: 'down',
//                   change: '-2% from last month'
//                 }
//               ].map((stat, index) => (
//                 <motion.div
//                   key={stat.title}
//                   variants={itemVariants}
//                   whileHover="hover"
//                   className={`${theme.primary} text-white rounded-xl p-5 shadow-lg`}
//                 >
//                   <div className="flex justify-between items-start">
//                     <div className="w-12 h-12 rounded-lg bg-white bg-opacity-20 flex items-center justify-center mb-4">
//                       {stat.icon}
//                     </div>
//                     <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
//                       {stat.change}
//                     </span>
//                   </div>
//                   <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
//                   <p className="text-sm opacity-90">{stat.title}</p>
//                 </motion.div>
//               ))}
//             </motion.div>

//             {/* Quick Sections */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//               {/* Student Attendance Summary */}
//               <motion.div
//                 variants={itemVariants}
//                 className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
//               >
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="text-lg font-bold flex items-center">
//                     <FiUsers className={`mr-2 ${theme.text}`} />
//                     Student Attendance
//                   </h3>
//                   <span className={`text-xs ${theme.accent} ${theme.text} px-2 py-1 rounded-full`}>
//                     Today
//                   </span>
//                 </div>
//                 <div className="space-y-4">
//                   {dashboardData.studentAttendance?.slice(0, 3).map((course, index) => {
//                     const total = course.present + course.absent;
//                     const percentage = calculatePercentage(course.present, total);
                    
//                     return (
//                       <motion.div
//                         key={index}
//                         variants={itemVariants}
//                         className="group"
//                       >
//                         <div className="flex justify-between mb-1">
//                           <span className="font-medium">{course.course}</span>
//                           <span className="font-medium">{percentage}%</span>
//                         </div>
//                         <div className="w-full bg-gray-200 rounded-full h-2">
//                           <motion.div
//                             initial={{ width: 0 }}
//                             animate={{ width: `${percentage}%` }}
//                             transition={{ delay: index * 0.1, duration: 0.8 }}
//                             className={`h-2 rounded-full ${
//                               percentage >= 90 ? 'bg-green-500' :
//                               percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
//                             } group-hover:shadow-md group-hover:shadow-red-100`}
//                           ></motion.div>
//                         </div>
//                         <div className="flex justify-between text-xs text-gray-500 mt-1">
//                           <span>Prof: {course.professor}</span>
//                           <span>Room: {course.room}</span>
//                         </div>
//                       </motion.div>
//                     );
//                   })}
//                 </div>
//                 <motion.button
//                   whileHover={{ x: 5 }}
//                   className={`mt-4 text-sm ${theme.text} font-medium flex items-center`}
//                 >
//                   View Detailed Report <FiChevronRight className="ml-1" />
//                 </motion.button>
//               </motion.div>

//               {/* Faculty Status */}
//               <motion.div
//                 variants={itemVariants}
//                 className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
//               >
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="text-lg font-bold flex items-center">
//                     <FiUserCheck className={`mr-2 ${theme.text}`} />
//                     Faculty Status
//                   </h3>
//                   <span className={`text-xs ${theme.accent} ${theme.text} px-2 py-1 rounded-full`}>
//                     This Month
//                   </span>
//                 </div>
//                 <div className="space-y-3">
//                   {dashboardData.facultyAttendance?.slice(0, 3).map((faculty, index) => {
//                     const totalDays = faculty.presentDays + faculty.absentDays;
//                     const percentage = calculatePercentage(faculty.presentDays, totalDays);
                    
//                     return (
//                       <motion.div
//                         key={index}
//                         variants={itemVariants}
//                         className="flex items-start p-2 hover:bg-red-50 rounded-lg transition-colors group"
//                       >
//                         <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border-2 border-red-200">
//                           <img 
//                             src={faculty.avatar} 
//                             alt={faculty.name}
//                             className="w-full h-full object-cover"
//                           />
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <h4 className="font-medium text-gray-900">{faculty.name}</h4>
//                           <p className="text-xs text-gray-500">{faculty.position}</p>
//                           <div className="flex items-center mt-1">
//                             <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
//                               <div 
//                                 className={`h-1.5 rounded-full ${
//                                   percentage >= 90 ? 'bg-green-500' :
//                                   percentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
//                                 }`}
//                                 style={{ width: `${percentage}%` }}
//                               ></div>
//                             </div>
//                             <span className="text-xs text-gray-600">{percentage}%</span>
//                           </div>
//                         </div>
//                         {faculty.absentDays > 0 && (
//                           <FiAlertTriangle className="text-red-500 ml-2" />
//                         )}
//                       </motion.div>
//                     );
//                   })}
//                 </div>
//                 <motion.button
//                   whileHover={{ x: 5 }}
//                   className={`mt-4 text-sm ${theme.text} font-medium flex items-center`}
//                 >
//                   View All Faculty <FiChevronRight className="ml-1" />
//                 </motion.button>
//               </motion.div>

//               {/* Stress Levels Overview */}
//               <motion.div
//                 variants={itemVariants}
//                 className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
//               >
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="text-lg font-bold flex items-center">
//                     <FiActivity className={`mr-2 ${theme.text}`} />
//                     Stress Overview
//                   </h3>
//                   <span className={`text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full`}>
//                     Alert
//                   </span>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4 mb-6">
//                   <div className={`p-3 rounded-lg ${theme.light}`}>
//                     <div className="text-xs font-medium text-red-700 mb-1">Students</div>
//                     <div className="text-xl font-bold text-red-800">
//                       {dashboardData.stressLevels?.students?.high || 0} High
//                     </div>
//                     <div className="text-xs text-red-600">
//                       {dashboardData.stressLevels?.students?.trends?.weekly || '0%'} weekly
//                     </div>
//                   </div>
//                   <div className={`p-3 rounded-lg ${theme.light}`}>
//                     <div className="text-xs font-medium text-red-700 mb-1">Faculty</div>
//                     <div className="text-xl font-bold text-red-800">
//                       {dashboardData.stressLevels?.faculty?.high || 0} High
//                     </div>
//                     <div className="text-xs text-red-600">
//                       {dashboardData.stressLevels?.faculty?.trends?.weekly || '0%'} weekly
//                     </div>
//                   </div>
//                 </div>
//                 <div className="relative h-40">
//                   <svg className="w-full h-full" viewBox="0 0 100 100">
//                     {/* Student Stress */}
//                     <motion.path
//                       initial={{ strokeDasharray: "0 100" }}
//                       animate={{ 
//                         strokeDasharray: `${dashboardData.stressLevels?.students?.high || 0} ${100 - (dashboardData.stressLevels?.students?.high || 0)}`,
//                         opacity: [0, 1]
//                       }}
//                       transition={{ delay: 0.2, duration: 1 }}
//                       d="M50 10 A40 40 0 1 1 10 50"
//                       fill="none"
//                       stroke="#ef4444"
//                       strokeWidth="20"
//                       strokeLinecap="round"
//                     />
//                     {/* Faculty Stress */}
//                     <motion.path
//                       initial={{ strokeDasharray: "0 100" }}
//                       animate={{ 
//                         strokeDasharray: `${dashboardData.stressLevels?.faculty?.high || 0} ${100 - (dashboardData.stressLevels?.faculty?.high || 0)}`,
//                         opacity: [0, 1]
//                       }}
//                       transition={{ delay: 0.4, duration: 1 }}
//                       d="M50 10 A40 40 0 0 0 10 50"
//                       fill="none"
//                       stroke="#fca5a5"
//                       strokeWidth="10"
//                       strokeLinecap="round"
//                     />
//                   </svg>
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <FiActivity className="text-red-200" size={40} />
//                   </div>
//                 </div>
//                 <motion.button
//                   whileHover={{ x: 5 }}
//                   className={`mt-4 text-sm ${theme.text} font-medium flex items-center`}
//                 >
//                   View Stress Analysis <FiChevronRight className="ml-1" />
//                 </motion.button>
//               </motion.div>
//             </div>

//             {/* Recent Activity */}
//             <motion.div
//               variants={itemVariants}
//               className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
//             >
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-bold flex items-center">
//                   <FiClock className={`mr-2 ${theme.text}`} />
//                   Recent Activity
//                 </h3>
//                 <button className={`text-sm ${theme.text} font-medium flex items-center`}>
//                   View All <FiChevronRight className="ml-1" />
//                 </button>
//               </div>
//               <div className="space-y-4">
//                 {[
//                   { 
//                     id: 1,
//                     title: "Faculty Meeting", 
//                     description: "Monthly department meeting", 
//                     time: "Today, 10:30 AM", 
//                     type: "meeting",
//                     icon: <FiUsers className="text-red-600" />
//                   },
//                   { 
//                     id: 2,
//                     title: "Research Proposal Submitted", 
//                     description: "New proposal on Quantum Computing", 
//                     time: "Yesterday, 2:15 PM", 
//                     type: "research",
//                     icon: <FiAward className="text-red-600" />
//                   },
//                   { 
//                     id: 3,
//                     title: "Student Concerns", 
//                     description: "Group of students raised concerns about course workload", 
//                     time: "2 days ago, 11:45 AM", 
//                     type: "alert",
//                     icon: <FiAlertTriangle className="text-red-600" />
//                   }
//                 ].map((activity, index) => (
//                   <motion.div
//                     key={activity.id}
//                     variants={itemVariants}
//                     transition={{ delay: index * 0.1 }}
//                     className="flex items-start p-3 hover:bg-red-50 rounded-lg transition-colors group cursor-pointer"
//                     onClick={() => setExpandedCard(expandedCard === activity.id ? null : activity.id)}
//                   >
//                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${theme.light}`}>
//                       {activity.icon}
//                     </div>
//                     <div className="flex-1">
//                       <div className="flex justify-between items-start">
//                         <h4 className="font-medium text-gray-900">{activity.title}</h4>
//                         <span className="text-xs text-gray-500">{activity.time}</span>
//                       </div>
//                       <p className="text-sm text-gray-600">{activity.description}</p>
//                       <AnimatePresence>
//                         {expandedCard === activity.id && (
//                           <motion.div
//                             initial={{ opacity: 0, height: 0 }}
//                             animate={{ opacity: 1, height: "auto" }}
//                             exit={{ opacity: 0, height: 0 }}
//                             className="mt-2 text-xs text-gray-500"
//                           >
//                             <p>Additional details about this activity would appear here.</p>
//                             <p className="mt-1">Click again to collapse.</p>
//                           </motion.div>
//                         )}
//                       </AnimatePresence>
//                     </div>
//                     <motion.div
//                       animate={{ rotate: expandedCard === activity.id ? 90 : 0 }}
//                       className="text-gray-400 group-hover:text-gray-600"
//                     >
//                       <FiChevronRight />
//                     </motion.div>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>
//           </>
//         )}

//         {/* Students Tab */}
//         {activeTab === 'students' && (
//           <motion.div
//             variants={containerVariants}
//             initial="hidden"
//             animate="visible"
//           >
//             {/* Student Attendance */}
//             <motion.div
//               variants={itemVariants}
//               className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6"
//             >
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-xl font-bold flex items-center">
//                   <FiUsers className={`mr-2 ${theme.text}`} />
//                   Student Attendance
//                 </h2>
//                 <button className={`text-sm ${theme.text} font-medium flex items-center`}>
//                   View All <FiChevronRight className="ml-1" />
//                 </button>
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead>
//                     <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
//                       <th className="pb-3">Course</th>
//                       <th className="pb-3">Date</th>
//                       <th className="pb-3">Present</th>
//                       <th className="pb-3">Absent</th>
//                       <th className="pb-3">Late</th>
//                       <th className="pb-3">Professor</th>
//                       <th className="pb-3">Room</th>
//                       <th className="pb-3">Attendance %</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {dashboardData.studentAttendance.map((course, index) => {
//                       const total = course.present + course.absent;
//                       const percentage = calculatePercentage(course.present, total);
                      
//                       return (
//                         <motion.tr
//                           key={index}
//                           variants={itemVariants}
//                           className="border-b border-gray-100 hover:bg-red-50"
//                           whileHover={{ x: 5 }}
//                         >
//                           <td className="py-4 font-medium">{course.course}</td>
//                           <td className="py-4 text-sm">{course.date}</td>
//                           <td className="py-4 text-green-600">{course.present}</td>
//                           <td className="py-4 text-red-600">{course.absent}</td>
//                           <td className="py-4 text-yellow-600">{course.late}</td>
//                           <td className="py-4 text-sm">{course.professor}</td>
//                           <td className="py-4 text-sm">{course.room}</td>
//                           <td className="py-4">
//                             <div className="flex items-center">
//                               <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
//                                 <div 
//                                   className={`h-2 rounded-full ${
//                                     percentage >= 90 ? 'bg-green-500' :
//                                     percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
//                                   }`}
//                                   style={{ width: `${percentage}%` }}
//                                 ></div>
//                               </div>
//                               <span>{percentage}%</span>
//                             </div>
//                           </td>
//                         </motion.tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </motion.div>

//             {/* Student Performance */}
//             <motion.div
//               variants={itemVariants}
//               className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
//             >
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-xl font-bold flex items-center">
//                   <FiBarChart2 className={`mr-2 ${theme.text}`} />
//                   Student Performance
//                 </h2>
//                 <button className={`text-sm ${theme.text} font-medium flex items-center`}>
//                   View All <FiChevronRight className="ml-1" />
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {dashboardData.studentPerformance.map((course, index) => (
//                   <motion.div
//                     key={index}
//                     variants={itemVariants}
//                     whileHover="hover"
//                     className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
//                   >
//                     <h3 className="font-bold text-gray-900 mb-2">{course.course}</h3>
//                     <div className="flex justify-between mb-3">
//                       <span className="text-sm text-gray-600">Average Grade:</span>
//                       <span className="font-medium">{course.avgGrade}%</span>
//                     </div>
//                     <div className="flex justify-between mb-3">
//                       <span className="text-sm text-gray-600">Top Performer:</span>
//                       <span className="font-medium">{course.topPerformer}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-sm text-gray-600">Improvement:</span>
//                       <span className={`font-medium ${
//                         course.improvement.startsWith('+') ? 'text-green-600' : 'text-red-600'
//                       }`}>
//                         {course.improvement}
//                       </span>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>
//           </motion.div>
//         )}

//         {/* Faculty Tab */}
//         {activeTab === 'faculty' && (
//           <motion.div
//             variants={containerVariants}
//             initial="hidden"
//             animate="visible"
//           >
//             {/* Department Faculty List */}
//             <motion.div
//               variants={itemVariants}
//               className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6"
//             >
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-xl font-bold flex items-center">
//                   <FiUsers className={`mr-2 ${theme.text}`} />
//                   Department Faculty ({facultyMembers.length})
//                 </h2>
//               </div>

//               {facultyMembers.length === 0 ? (
//                 <div className="text-center py-8">
//                   <p className="text-gray-500">No faculty members found in your department.</p>
//                 </div>
//               ) : (
//                 <div className="overflow-x-auto">
//                   <table className="w-full">
//                     <thead>
//                       <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
//                         <th className="pb-3">ERP ID</th>
//                         <th className="pb-3">Name</th>
//                         <th className="pb-3">Email</th>
//                         <th className="pb-3">Status</th>
//                         <th className="pb-3">Joined Date</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {facultyMembers.map((faculty) => (
//                         <motion.tr
//                           key={faculty.id}
//                           variants={itemVariants}
//                           className="border-b border-gray-100 hover:bg-red-50"
//                           whileHover={{ x: 5 }}
//                         >
//                           <td className="py-4 font-medium">{faculty.erpid}</td>
//                           <td className="py-4">{faculty.name}</td>
//                           <td className="py-4">{faculty.email}</td>
//                           <td className="py-4">
//                             <span className={`px-2 py-1 text-xs rounded-full ${
//                               faculty.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//                             }`}>
//                               {faculty.is_active ? 'Active' : 'Inactive'}
//                             </span>
//                           </td>
//                           <td className="py-4 text-sm">
//                             {new Date(faculty.created_at).toLocaleDateString()}
//                           </td>
//                         </motion.tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </motion.div>

//             {/* Faculty Attendance */}
//             <motion.div
//               variants={itemVariants}
//               className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6"
//             >
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-xl font-bold flex items-center">
//                   <FiUserCheck className={`mr-2 ${theme.text}`} />
//                   Faculty Attendance
//                 </h2>
//                 <button className={`text-sm ${theme.text} font-medium flex items-center`}>
//                   View All <FiChevronRight className="ml-1" />
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                 {dashboardData.facultyAttendance.map((faculty, index) => {
//                   const totalDays = faculty.presentDays + faculty.absentDays;
//                   const percentage = calculatePercentage(faculty.presentDays, totalDays);
                  
//                   return (
//                     <motion.div
//                       key={index}
//                       variants={itemVariants}
//                       whileHover="hover"
//                       className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
//                     >
//                       <div className="flex items-center mb-3">
//                         <div className="w-12 h-12 rounded-full overflow-hidden mr-3 border-2 border-red-200">
//                           <img 
//                             src={faculty.avatar} 
//                             alt={faculty.name}
//                             className="w-full h-full object-cover"
//                           />
//                         </div>
//                         <div>
//                           <h3 className="font-bold text-gray-900">{faculty.name}</h3>
//                           <p className="text-xs text-gray-600">{faculty.position}</p>
//                         </div>
//                       </div>
//                       <div className="flex justify-between text-sm mb-2">
//                         <span>Present:</span>
//                         <span className="font-medium">{faculty.presentDays} days</span>
//                       </div>
//                       <div className="flex justify-between text-sm mb-2">
//                         <span>Absent:</span>
//                         <span className="font-medium text-red-600">{faculty.absentDays} days</span>
//                       </div>
//                       <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
//                         <div 
//                           className={`h-2 rounded-full ${
//                             percentage >= 90 ? 'bg-green-500' :
//                             percentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
//                           }`}
//                           style={{ width: `${percentage}%` }}
//                         ></div>
//                       </div>
//                       <div className="flex justify-between text-xs">
//                         <span>Last Active:</span>
//                         <span>{faculty.lastActive}</span>
//                       </div>
//                     </motion.div>
//                   );
//                 })}
//               </div>
//             </motion.div>

//             {/* Faculty Workload */}
//             <motion.div
//               variants={itemVariants}
//               className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
//             >
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-xl font-bold flex items-center">
//                   <FiActivity className={`mr-2 ${theme.text}`} />
//                   Faculty Workload
//                 </h2>
//                 <button className={`text-sm ${theme.text} font-medium flex items-center`}>
//                   View All <FiChevronRight className="ml-1" />
//                 </button>
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead>
//                     <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
//                       <th className="pb-3">Faculty</th>
//                       <th className="pb-3">Courses</th>
//                       <th className="pb-3">Research</th>
//                       <th className="pb-3">Admin</th>
//                       <th className="pb-3">Total</th>
//                       <th className="pb-3">Status</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {dashboardData.facultyWorkload.map((faculty, index) => (
//                       <motion.tr
//                         key={index}
//                         variants={itemVariants}
//                         className="border-b border-gray-100 hover:bg-red-50"
//                         whileHover={{ x: 5 }}
//                       >
//                         <td className="py-4 font-medium">{faculty.name}</td>
//                         <td className="py-4">{faculty.courses}</td>
//                         <td className="py-4">{faculty.research}</td>
//                         <td className="py-4">{faculty.admin}</td>
//                         <td className="py-4 font-bold">{faculty.total}</td>
//                         <td className="py-4">
//                           <span className={`px-2 py-1 text-xs rounded-full ${
//                             faculty.total <= 4 ? 'bg-green-100 text-green-800' :
//                             faculty.total <= 6 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
//                           }`}>
//                             {faculty.total <= 4 ? 'Light' :
//                              faculty.total <= 6 ? 'Moderate' : 'Heavy'}
//                           </span>
//                         </td>
//                       </motion.tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}

//         {/* Research Tab */}
//         {activeTab === 'research' && (
//           <motion.div
//             variants={containerVariants}
//             initial="hidden"
//             animate="visible"
//           >
//             {/* Research Projects */}
//             <motion.div
//               variants={itemVariants}
//               className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6"
//             >
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-xl font-bold flex items-center">
//                   <FiAward className={`mr-2 ${theme.text}`} />
//                   Research Projects
//                 </h2>
//                 <button className={`text-sm ${theme.text} font-medium flex items-center`}>
//                   View All <FiChevronRight className="ml-1" />
//                 </button>
//               </div>

//               <div className="space-y-4">
//                 {dashboardData.researchProjects.map((project, index) => (
//                   <motion.div
//                     key={index}
//                     variants={itemVariants}
//                     whileHover="hover"
//                     className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
//                       project.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-gray-200'
//                     }`}
//                   >
//                     <div className="flex justify-between items-start mb-3">
//                       <div>
//                         <h3 className="font-bold text-gray-900">{project.title}</h3>
//                         <p className="text-sm text-gray-600">Lead: {project.lead}</p>
//                       </div>
//                       <span className={`px-2 py-1 text-xs rounded-full ${
//                         project.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
//                       }`}>
//                         {project.status}
//                       </span>
//                     </div>
                    
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                       <div>
//                         <p className="text-xs text-gray-500">Funding</p>
//                         <p className="font-medium">{project.funding}</p>
//                       </div>
//                       <div>
//                         <p className="text-xs text-gray-500">Team Size</p>
//                         <p className="font-medium">{project.team} members</p>
//                       </div>
//                       <div>
//                         <p className="text-xs text-gray-500">Duration</p>
//                         <p className="font-medium">{project.startDate} to {project.endDate}</p>
//                       </div>
//                     </div>
                    
//                     <div className="mb-3">
//                       <div className="flex justify-between text-sm mb-1">
//                         <span>Progress</span>
//                         <span>{project.progress}%</span>
//                       </div>
//                       <div className="w-full bg-gray-200 rounded-full h-2">
//                         <div 
//                           className={`h-2 rounded-full ${
//                             project.progress < 50 ? 'bg-red-500' :
//                             project.progress < 80 ? 'bg-yellow-500' : 'bg-green-500'
//                           }`}
//                           style={{ width: `${project.progress}%` }}
//                         ></div>
//                       </div>
//                     </div>
                    
//                     <div>
//                       <p className="text-xs text-gray-500 mb-1">Milestones</p>
//                       <div className="flex flex-wrap gap-2">
//                         {project.milestones.map((milestone, idx) => (
//                           <span 
//                             key={idx}
//                             className={`px-2 py-1 text-xs rounded-full ${
//                               milestone.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
//                             }`}
//                           >
//                             {milestone.name}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>
//           </motion.div>
//         )}

//         {/* Stress Tab */}
//         {activeTab === 'stress' && (
//           <motion.div
//             variants={containerVariants}
//             initial="hidden"
//             animate="visible"
//           >
//             {/* Student Stress */}
//             <motion.div
//               variants={itemVariants}
//               className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6"
//             >
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-xl font-bold flex items-center">
//                   <FiActivity className={`mr-2 ${theme.text}`} />
//                   Student Stress Levels
//                 </h2>
//                 <button className={`text-sm ${theme.text} font-medium flex items-center`}>
//                   View All <FiChevronRight className="ml-1" />
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//                 <div className={`p-4 rounded-lg ${theme.light}`}>
//                   <div className="text-sm font-medium text-red-700 mb-1">High Stress</div>
//                   <div className="text-3xl font-bold text-red-800">
//                     {dashboardData.stressLevels.students.high}
//                   </div>
//                   <div className="text-xs text-red-600">
//                     {dashboardData.stressLevels.students.trends.weekly} weekly change
//                   </div>
//                 </div>
//                 <div className={`p-4 rounded-lg bg-amber-50`}>
//                   <div className="text-sm font-medium text-amber-700 mb-1">Medium Stress</div>
//                   <div className="text-3xl font-bold text-amber-800">
//                     {dashboardData.stressLevels.students.medium}
//                   </div>
//                   <div className="text-xs text-amber-600">
//                     {dashboardData.stressLevels.students.trends.monthly} monthly change
//                   </div>
//                 </div>
//                 <div className={`p-4 rounded-lg bg-green-50`}>
//                   <div className="text-sm font-medium text-green-700 mb-1">Low Stress</div>
//                   <div className="text-3xl font-bold text-green-800">
//                     {dashboardData.stressLevels.students.low}
//                   </div>
//                   <div className="text-xs text-green-600">
//                     Baseline healthy students
//                   </div>
//                 </div>
//               </div>

//               <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
//                 <div className="text-center">
//                   <FiMapPin className="mx-auto text-red-600 mb-2" size={32} />
//                   <p className="text-gray-700">Stress level heatmap would appear here</p>
//                   <p className="text-sm text-gray-600">Showing distribution across campus</p>
//                 </div>
//               </div>
//             </motion.div>

//             {/* Faculty Stress */}
//             <motion.div
//               variants={itemVariants}
//               className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
//             >
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-xl font-bold flex items-center">
//                   <FiUserCheck className={`mr-2 ${theme.text}`} />
//                   Faculty Stress Levels
//                 </h2>
//                 <button className={`text-sm ${theme.text} font-medium flex items-center`}>
//                   View All <FiChevronRight className="ml-1" />
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//                 <div className={`p-4 rounded-lg ${theme.light}`}>
//                   <div className="text-sm font-medium text-red-700 mb-1">High Stress</div>
//                   <div className="text-3xl font-bold text-red-800">
//                     {dashboardData.stressLevels.faculty.high}
//                   </div>
//                   <div className="text-xs text-red-600">
//                     {dashboardData.stressLevels.faculty.trends.weekly} weekly change
//                   </div>
//                 </div>
//                 <div className={`p-4 rounded-lg bg-amber-50`}>
//                   <div className="text-sm font-medium text-amber-700 mb-1">Medium Stress</div>
//                   <div className="text-3xl font-bold text-amber-800">
//                     {dashboardData.stressLevels.faculty.medium}
//                   </div>
//                   <div className="text-xs text-amber-600">
//                     {dashboardData.stressLevels.faculty.trends.monthly} monthly change
//                   </div>
//                 </div>
//                 <div className={`p-4 rounded-lg bg-green-50`}>
//                   <div className="text-sm font-medium text-green-700 mb-1">Low Stress</div>
//                   <div className="text-3xl font-bold text-green-800">
//                     {dashboardData.stressLevels.faculty.low}
//                   </div>
//                   <div className="text-xs text-green-600">
//                     Baseline healthy faculty
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-gray-100 rounded-lg p-4">
//                 <h3 className="text-lg font-medium mb-3">Stress Trends</h3>
//                 <div className="h-48 flex items-center justify-center">
//                   <div className="text-center">
//                     <FiActivity className="mx-auto text-red-600 mb-2" size={32} />
//                     <p className="text-gray-700">Stress trend analytics would appear here</p>
//                     <p className="text-sm text-gray-600">Weekly and monthly comparisons</p>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}

//         {/* Department Stats */}
//         <motion.div
//           variants={itemVariants}
//           className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
//         >
//           <h2 className="text-xl font-bold mb-6 flex items-center">
//             <FiUsers className={`mr-2 ${theme.text}`} />
//             Department Statistics
//           </h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <button
//               onClick={handleFacultyCardClick}
//               className="w-full text-left bg-red-50 rounded-lg p-4 cursor-pointer hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
//             >
//               <motion.div
//                 whileHover={{ scale: 1.02 }}
//                 className="w-full"
//               >
//                 <div className="text-sm text-red-600 mb-1">Total Faculty</div>
//                 <div className="text-2xl font-bold text-red-700">{dashboardData.departmentStats.totalFaculty}</div>
//               </motion.div>
//             </button>
//             {/* ... other stat cards ... */}
//           </div>
//         </motion.div>

//         {/* Faculty Modal */}
//         <AnimatePresence>
//           {showFacultyModal && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
//               onClick={() => setShowFacultyModal(false)}
//             >
//               <motion.div
//                 initial={{ scale: 0.9, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 exit={{ scale: 0.9, opacity: 0 }}
//                 className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden"
//                 onClick={e => e.stopPropagation()}
//               >
//                 <div className="p-6 border-b border-gray-200 flex justify-between items-center">
//                   <h2 className="text-xl font-bold flex items-center">
//                     <FiUsers className="mr-2 text-red-600" />
//                     Department Faculty Members ({facultyMembers.length})
//                   </h2>
//                   <button
//                     onClick={() => setShowFacultyModal(false)}
//                     className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
//                   >
//                     <FiX size={24} />
//                   </button>
//                 </div>
                
//                 <div className="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
//                   {!facultyMembers || facultyMembers.length === 0 ? (
//                     <div className="text-center py-8">
//                       <p className="text-gray-500">No faculty members found in your department.</p>
//                     </div>
//                   ) : (
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                       {facultyMembers.map((faculty) => (
//                         <motion.div
//                           key={faculty.id}
//                           initial={{ opacity: 0, y: 20 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           className="bg-gray-50 rounded-lg p-4 hover:bg-red-50 transition-colors"
//                         >
//                           <div className="font-semibold text-lg mb-2">{faculty.name || 'N/A'}</div>
//                           <div className="text-sm text-gray-600 mb-1">ERP ID: {faculty.erpid || 'N/A'}</div>
//                           <div className="text-sm text-gray-600 mb-1">{faculty.email || 'N/A'}</div>
//                           <div className="flex items-center mt-2">
//                             <span className={`px-2 py-1 text-xs rounded-full ${
//                               faculty.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//                             }`}>
//                               {faculty.is_active ? 'Active' : 'Inactive'}
//                             </span>
//                             <span className="text-xs text-gray-500 ml-2">
//                               Joined: {faculty.created_at ? new Date(faculty.created_at).toLocaleDateString() : 'N/A'}
//                             </span>
//                           </div>
//                         </motion.div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </motion.div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.div>
//     </div>
//   );
// };

// export default HODDashboard;
       
            