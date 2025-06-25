import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate, useNavigate } from "react-router-dom";
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
import { Check, X } from 'lucide-react';
import axios from 'axios';
import FacultyLogDisplay from '../components/faculty/FacultyLogDisplay';

const HODDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCard, setExpandedCard] = useState(null);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [facultyLogs, setFacultyLogs] = useState([]);
  const [facultyStressData, setFacultyStressData] = useState([]);
  const [facultyStressLoading, setFacultyStressLoading] = useState(true);
  const [facultyStressError, setFacultyStressError] = useState(null);
  
  // State for all data with proper initialization
  const [dashboardData, setDashboardData] = useState({
    studentAttendance: [],
    facultyAttendance: [],
    researchProjects: [],
    staffCount: 0,
    attendanceLogsCount: 0,
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

  const [nonTeachingStaff, setNonTeachingStaff] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null); // { type, id, name }
  const [profileLogs, setProfileLogs] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const navigate = useNavigate();

  // Add a ref for the non-teaching staff section
  const nonTeachingStaffRef = useRef(null);

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

        // Fetch faculty logs for last active location
        const logsResponse = await fetch('http://69.62.83.14:9000/api/hod/faculty-log', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        let logsData = [];
        if (logsResponse.ok) {
          const logsJson = await logsResponse.json();
          // logsJson can be { logs, faculty } or just logs array
          logsData = Array.isArray(logsJson.logs) ? logsJson.logs : logsJson;
        }
        setFacultyLogs(logsData);

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

        // Fetch non-teaching staff list for department
        let staffList = [];
        try {
          const staffRes = await fetch('http://69.62.83.14:9000/api/hod/nonteaching', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          });
          if (staffRes.ok) {
            staffList = await staffRes.json();
          }
        } catch (e) { staffList = []; }
        setNonTeachingStaff(staffList);

        // Fetch attendance logs count for department
        let attendanceLogsCount = 0;
        try {
          const logsRes = await fetch('http://69.62.83.14:9000/api/hod/faculty-log', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          });
          if (logsRes.ok) {
            const logsJson = await logsRes.json();
            attendanceLogsCount = Array.isArray(logsJson.logs) ? logsJson.logs.length : 0;
          }
        } catch (e) {
          attendanceLogsCount = 0;
        }

        // Update state with safeguards for all arrays
        setDashboardData(prevData => ({
          ...dashboardData,
          staffCount: staffList.length,
          attendanceLogsCount,
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

  // Fetch faculty stress data
  useEffect(() => {
    const fetchFacultyStress = async () => {
      setFacultyStressLoading(true);
      try {
        const response = await fetch('http://69.62.83.14:9000/api/faculty/student-stress-level', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch faculty stress data');
        const data = await response.json();
        // Filter for faculty only (assuming faculty have a property or by exclusion)
        // If all are faculty, just use as is
        const transformed = data.map(item => ({
          id: item.id,
          name: item.name,
          erpid: item.erpid,
          score: Math.round(parseFloat(item.confidence_score) * 100),
          status: item.stress_status,
          timestamp: item.timestamp
        }));
        // Group by ERP ID, keep latest entry
        const facultyMap = new Map();
        transformed.forEach(entry => {
          if (!facultyMap.has(entry.erpid) || new Date(entry.timestamp) > new Date(facultyMap.get(entry.erpid).timestamp)) {
            facultyMap.set(entry.erpid, entry);
          }
        });
        setFacultyStressData(Array.from(facultyMap.values()));
        setFacultyStressError(null);
      } catch (err) {
        setFacultyStressError(err.message);
        setFacultyStressData([]);
      } finally {
        setFacultyStressLoading(false);
      }
    };
    fetchFacultyStress();
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

  const handlePersonClick = (type, id, name) => {
    setSelectedPerson({ type, id, name });
    setShowProfileModal(true);
    setProfileLoading(true);
    setProfileLogs([]);
    const url = type === 'faculty'
      ? `http://69.62.83.14:9000/api/hod/faculty-profile/${id}`
      : `http://69.62.83.14:9000/api/hod/staff-profile/${id}`;
    fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        // Use all logs returned from the backend for this person
        setProfileLogs(Array.isArray(data.logs) ? data.logs : []);
        setProfileLoading(false);
      })
      .catch(() => setProfileLoading(false));
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
            <div className="flex space-x-2 mb-6">
              {['overview', 'faculty', 'nonteaching', 'students'].map((tab) => (
                <motion.button
                  key={tab}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                    activeTab === tab ? theme.primary + ' text-white' : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                  onClick={() => setActiveTab(tab)}
                  whileHover={{ scale: 1.05 }}
                >
                  {tab === 'overview' ? <FiHome className="inline mr-1" /> : 
                   tab === 'faculty' ? <FiUserCheck className="inline mr-1" /> : 
                   tab === 'students' ? <FiUsers className="inline mr-1" /> :
                   tab === 'nonteaching' ? <FiUsers className="inline mr-1" /> : null}
                  {tab === 'nonteaching' ? 'Non-Teaching Staff' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                },
                { 
                  title: 'Faculty Members', 
                  value: dashboardData.departmentStats?.totalFaculty || 0, 
                  icon: <FiUserCheck className="text-white" size={24} />, 
                  trend: 'neutral',
                  onClick: () => setActiveTab('faculty')
                },
                { 
                  title: 'Non-Teaching Staff',
                  value: dashboardData.staffCount || 0,
                  icon: <FiUsers className="text-white" size={24} />,
                  trend: 'neutral',
                  onClick: () => {
                    setActiveTab('faculty');
                    setTimeout(() => {
                      if (nonTeachingStaffRef.current) {
                        nonTeachingStaffRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }
                },
                { 
                  title: 'Attendance Logs',
                  value: dashboardData.attendanceLogsCount || 0,
                  icon: <FiClock className="text-white" size={24} />,
                  trend: 'neutral',
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.title}
                  variants={itemVariants}
                  whileHover="hover"
                  className={`${theme.primary} text-white rounded-xl p-5 shadow-lg ${stat.onClick ? 'cursor-pointer' : ''}`}
                  onClick={stat.onClick}
                >
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-lg bg-white bg-opacity-20 flex items-center justify-center mb-4">
                      {stat.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                  <p className="text-sm opacity-90">{stat.title}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Custom Quick Sections: Top 5 Faculty Logs & Recent Leave Approvals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 5 Recent Faculty Logs */}
              <RecentFacultyLogs facultyMembers={facultyMembers} handlePersonClick={handlePersonClick} />
              {/* Recent Leave Approvals */}
              <RecentLeaveApprovals />
            </div>

            {/* Faculty Stress Level Insights */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mt-6"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <FiActivity className="mr-2 text-red-800" /> Faculty Stress Level Insights
              </h3>
              {facultyStressLoading ? (
                <div className="text-gray-500">Loading...</div>
              ) : facultyStressError ? (
                <div className="text-red-500">{facultyStressError}</div>
              ) : facultyStressData.length === 0 ? (
                <div className="text-gray-500">No faculty stress data found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                        <th className="pb-3">Name</th>
                        <th className="pb-3">ERP ID</th>
                        <th className="pb-3">Latest Score</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facultyStressData.map(faculty => (
                        <tr key={faculty.erpid} className="border-b border-gray-100 hover:bg-red-50">
                          <td className="py-3 font-medium cursor-pointer" onClick={() => handlePersonClick('faculty', faculty.id, faculty.name)}>{faculty.name}</td>
                          <td className="py-3">{faculty.erpid}</td>
                          <td className="py-3">{faculty.score}%</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${faculty.status === 'Stressed' || faculty.status === 'At Risk' ? 'bg-red-100 text-red-800' : faculty.status === 'Stable' || faculty.status === 'Normal' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{faculty.status}</span>
                          </td>
                          <td className="py-3 text-xs text-gray-500">{faculty.timestamp ? new Date(faculty.timestamp).toLocaleString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
              ref={nonTeachingStaffRef}
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
                        <th className="pb-3">Last Active Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facultyMembers.map((faculty) => {
                        const logsForFaculty = facultyLogs.filter(log => log.erp_id === faculty.erpid);
                        let lastLocation = 'N/A';
                        if (logsForFaculty.length > 0) {
                          logsForFaculty.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                          lastLocation = logsForFaculty[0].classroom || 'N/A';
                        }
                        return (
                          <motion.tr
                            key={faculty.id}
                            variants={itemVariants}
                            className="border-b border-gray-100 hover:bg-red-50 cursor-pointer"
                            whileHover={{ x: 5 }}
                            onClick={() => handlePersonClick('faculty', faculty.id, faculty.name)}
                          >
                            <td className="py-4 font-medium">{faculty.erpid || 'N/A'}</td>
                            <td className="py-4">{faculty.name || 'Unknown'}</td>
                            <td className="py-4">{faculty.email || 'N/A'}</td>
                            <td className="py-4">{lastLocation}</td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Non-Teaching Staff Tab */}
        {activeTab === 'nonteaching' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              ref={nonTeachingStaffRef}
              variants={itemVariants}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <FiUsers className={`mr-2 ${theme.text}`} />
                  Non-Teaching Staff ({nonTeachingStaff.length})
                </h2>
              </div>
              {nonTeachingStaff.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No non-teaching staff found in your department.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                        <th className="pb-3">ERP ID</th>
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nonTeachingStaff.map((staff) => (
                        <motion.tr
                          key={staff.id}
                          variants={itemVariants}
                          className="border-b border-gray-100 hover:bg-red-50 cursor-pointer"
                          whileHover={{ x: 5 }}
                          onClick={() => handlePersonClick('staff', staff.id, staff.name)}
                        >
                          <td className="py-4 font-medium">{staff.erpid || 'N/A'}</td>
                          <td className="py-4">{staff.name || 'Unknown'}</td>
                          <td className="py-4">{staff.email || 'N/A'}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

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

        {/* Profile Modal */}
        <AnimatePresence>
          {showProfileModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowProfileModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center">
                    {selectedPerson?.name || (selectedPerson?.type === 'faculty' ? 'Faculty' : 'Non-Teaching Staff')} Logs
                  </h2>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FiX size={24} />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                  <FacultyLogDisplay logs={profileLogs || []} loading={profileLoading} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

function RecentFacultyLogs({ facultyMembers = [], handlePersonClick }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://69.62.83.14:9000/api/hod/recent-faculty-logs', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch logs');
        const data = await res.json();
        if (isMounted) setLogs(data);
      } catch (err) {
        if (isMounted) setError('Failed to load logs');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 600000); // 10 minutes
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <FiUserCheck className="mr-2 text-red-800" /> Recent Faculty Logs
      </h3>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : logs.length === 0 ? (
        <div className="text-gray-500">No logs found.</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {logs.map((log, idx) => (
            <li key={log.id || idx} className="py-3 flex flex-col">
              <div className="flex items-center justify-between">
                <span
                  className="font-medium text-gray-900 cursor-pointer"
                  onClick={() => {
                    let facultyId = log.faculty_id;
                    let facultyName = log.person_name;
                    if (!facultyId && log.erp_id && Array.isArray(facultyMembers)) {
                      const found = facultyMembers.find(f => f.erpid === log.erp_id);
                      if (found) facultyId = found.id;
                    }
                    if (facultyId) handlePersonClick('faculty', facultyId, facultyName);
                  }}
                >
                  {log.person_name || 'Unknown Faculty'}
                </span>
                <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">Location: {log.classroom || 'N/A'} | IP: {log.camera_ip || 'N/A'}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecentLeaveApprovals() {
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // id of leave being processed

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://69.62.83.14:9000/api/hod/leave-approval');
        setLeaveApplications(Array.isArray(res.data) ? res.data.filter(app => app.HodApproval === 'Pending').slice(0, 5) : []);
      } catch (err) {
        setError('Could not load leave requests');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  const handleAction = async (application, action) => {
    setActionLoading(application.ErpStaffId);
    try {
      await axios.put(`http://69.62.83.14:9000/api/hod/leave-approval/${application.ErpStaffId}`, {
        HodApproval: action === 'approve' ? 'Approved' : 'Rejected',
      });
      setLeaveApplications(prev => prev.filter(app => app.ErpStaffId !== application.ErpStaffId));
    } catch (err) {
      alert('Failed to update leave status');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <FiBook className="mr-2 text-red-800" /> Recent Leave Approval Requests
      </h3>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : leaveApplications.length === 0 ? (
        <div className="text-gray-500">No pending leave requests.</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {leaveApplications.map((app, idx) => (
            <li key={app.ErpStaffId || idx} className="py-3 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{app.StaffName}</span>
                <span className="text-xs text-gray-500">{app.leaveType}</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">{app.fromDate} to {app.toDate}</div>
              <div className="flex gap-2 mt-2">
                <button
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center text-xs disabled:opacity-50"
                  disabled={actionLoading === app.ErpStaffId}
                  onClick={() => handleAction(app, 'approve')}
                >
                  <Check size={14} className="mr-1" /> Approve
                </button>
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center text-xs disabled:opacity-50"
                  disabled={actionLoading === app.ErpStaffId}
                  onClick={() => handleAction(app, 'reject')}
                >
                  <X size={14} className="mr-1" /> Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HODDashboard;       
            