import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FiUsers, FiUser, FiBook, FiBriefcase, 
  FiChevronDown, FiChevronRight, FiRefreshCw,
  FiMail, FiCalendar, FiActivity, FiBarChart2,
  FiSearch, FiX
} from 'react-icons/fi';
import ProfileView from './ProfileView';

const PrincipalDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    departments: 0,
    students: 0,
    faculty: 0,
    staff: 0
  });
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showMemberTypes, setShowMemberTypes] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://69.62.83.14:9000/api/principal/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
      setDepartments(response.data.departments);
      resetSelections();
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetSelections = () => {
    setSelectedDept(null);
    setSelectedType(null);
    setMembers([]);
    setSelectedMember(null);
    setProfileData(null);
    setSearchTerm('');
    setIsSearching(false);
    setShowMemberTypes(false);
    setShowMembersList(false);
  };

  const fetchAllMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://69.62.83.14:9000/api/principal/all-members',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMembers(response.data.members);
    } catch (err) {
      console.error('Error fetching all members:', err);
    }
  };

  const fetchDepartmentMembers = async (deptId, type) => {
    try {
      setSelectedType(type);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://69.62.83.14:9000/api/principal/members?deptId=${deptId}&type=${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMembers(response.data.members);
      setShowMembersList(true);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const fetchMemberProfile = async (memberId) => {
    try {
      setProfileLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://69.62.83.14:9000/api/principal/profile/${memberId}?type=${selectedType}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileData(response.data);
      setSelectedMember(memberId);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDepartmentSelect = (deptId) => {
    setSelectedDept(deptId);
    setSelectedType(null);
    setMembers([]);
    setSelectedMember(null);
    setProfileData(null);
    setShowMemberTypes(true);
    setShowMembersList(false);
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsSearching(term.length > 0);
    
    if (term.length > 0 && !selectedDept) {
      fetchAllMembers();
    }
  };

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.erpid && member.erpid.toString().includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="text-red-600"
        >
          <FiRefreshCw size={32} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <motion.div 
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
              Principal Dashboard
            </h1>
            <p className="text-gray-600">Institutional Overview and Management</p>
          </motion.div>
          
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "#f3f4f6" }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
          >
            <FiRefreshCw className="text-red-600" />
            <span>Refresh Data</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Stats Overview */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <StatCard 
          icon={<FiBook size={20} />}
          title="Departments"
          value={stats.departments}
          color="from-blue-500 to-blue-600"
          delay={0.1}
        />
        <StatCard 
          icon={<FiUsers size={20} />}
          title="Students"
          value={stats.students}
          color="from-green-500 to-green-600"
          delay={0.2}
        />
        <StatCard 
          icon={<FiUser size={20} />}
          title="Faculty"
          value={stats.faculty}
          color="from-red-500 to-red-600"
          delay={0.3}
        />
        <StatCard 
          icon={<FiBriefcase size={20} />}
          title="Staff"
          value={stats.staff}
          color="from-purple-500 to-purple-600"
          delay={0.4}
        />
      </motion.div>

      {/* Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative mb-6"
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name or ERP ID (works without department selection)"
          className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
          value={searchTerm}
          onChange={handleSearch}
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setIsSearching(false);
              if (!selectedDept) setMembers([]);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <FiX className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </motion.div>

      {/* Department Selection - Horizontal */}
      <motion.div 
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Departments</h3>
          <span className="text-sm text-gray-500">
            {selectedDept ? departments.find(d => d.id === selectedDept)?.name : 'Select a department'}
          </span>
        </div>
        <div className="flex overflow-x-auto pb-2 px-2 hide-scrollbar">
          {departments.map((dept) => (
            <motion.button
              key={dept.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleDepartmentSelect(dept.id)}
              className={`flex-shrink-0 m-2 p-3 rounded-lg flex flex-col items-center transition-all ${
                selectedDept === dept.id 
                  ? 'bg-red-100 border-2 border-red-500 shadow-md' 
                  : 'bg-gray-50 border border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-2 transition-colors ${
                selectedDept === dept.id 
                  ? 'bg-red-600 text-white' 
                  : 'bg-red-100 text-red-600'
              }`}>
                <FiBook size={16} />
              </div>
              <span className="text-sm font-medium text-center max-w-[80px] truncate">
                {dept.name}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Member Type Selection */}
      {selectedDept && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 mb-4 overflow-hidden"
        >
          <button
            onClick={() => setShowMemberTypes(!showMemberTypes)}
            className="w-full p-4 border-b border-gray-200 flex justify-between items-center hover:bg-gray-50"
          >
            <h3 className="font-bold text-gray-900">Member Type</h3>
            <motion.div
              animate={{ rotate: showMemberTypes ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiChevronDown className="text-gray-500" />
            </motion.div>
          </button>
          
          <AnimatePresence>
            {showMemberTypes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-3 gap-2 p-3">
                  <MemberTypeButton
                    active={selectedType === 'students'}
                    onClick={() => fetchDepartmentMembers(selectedDept, 'students')}
                    icon={<FiUsers size={16} />}
                    label="Students"
                    color="bg-blue-600"
                  />
                  <MemberTypeButton
                    active={selectedType === 'faculty'}
                    onClick={() => fetchDepartmentMembers(selectedDept, 'faculty')}
                    icon={<FiUser size={16} />}
                    label="Faculty"
                    color="bg-red-600"
                  />
                  <MemberTypeButton
                    active={selectedType === 'staff'}
                    onClick={() => fetchDepartmentMembers(selectedDept, 'staff')}
                    icon={<FiBriefcase size={16} />}
                    label="Staff"
                    color="bg-purple-600"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Members List */}
      {(selectedType || isSearching) && (members.length > 0 || isSearching) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 overflow-hidden"
        >
          <button
            onClick={() => setShowMembersList(!showMembersList)}
            className="w-full p-4 border-b border-gray-200 flex justify-between items-center hover:bg-gray-50"
          >
            <div className="flex items-center">
              <h3 className="font-bold text-gray-900 mr-2">
                {selectedType 
                  ? `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Members` 
                  : 'Search Results'}
              </h3>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                {filteredMembers.length} {filteredMembers.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <motion.div
              animate={{ rotate: showMembersList ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiChevronDown className="text-gray-500" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showMembersList && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <motion.div
                        key={member.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedMember === member.id 
                            ? 'bg-red-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => fetchMemberProfile(member.id)}
                      >
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            selectedType === 'students' ? 'bg-blue-100 text-blue-600' :
                            selectedType === 'faculty' ? 'bg-red-100 text-red-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {selectedType === 'students' ? <FiUsers size={14} /> :
                             selectedType === 'faculty' ? <FiUser size={14} /> :
                             <FiBriefcase size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{member.name}</h4>
                            <div className="flex items-center text-sm text-gray-600">
                              <FiMail className="mr-1 flex-shrink-0" size={12} />
                              <span className="truncate">{member.email}</span>
                            </div>
                            {member.erpid && (
                              <div className="text-xs text-gray-500 mt-1">
                                ERP ID: {member.erpid}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No matching {selectedType || 'members'} found
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Profile View */}
      <AnimatePresence mode="wait">
        {profileData ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200"
          >
            <ProfileView 
              data={profileData} 
              type={selectedType} 
              loading={profileLoading} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 h-64 flex items-center justify-center"
          >
            <div className="text-center p-8">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"
              >
                <FiUser className="text-gray-400" size={24} />
              </motion.div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Profile Selected</h3>
              <p className="text-gray-500">
                {selectedType 
                  ? `Select a ${selectedType.slice(0, -1)} to view details` 
                  : "Select a member to view profile"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ icon, title, value, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`bg-gradient-to-br ${color} rounded-xl shadow-lg text-white p-4 cursor-pointer transition-all`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium opacity-90">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
      <motion.div 
        whileHover={{ rotate: 10 }}
        className="p-2 bg-white bg-opacity-20 rounded-lg"
      >
        {icon}
      </motion.div>
    </div>
  </motion.div>
);

const MemberTypeButton = ({ active, onClick, icon, label, color }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`p-3 rounded-lg flex flex-col items-center transition-all ${
      active 
        ? `${color} text-white shadow-md` 
        : 'bg-gray-100 text-gray-600 hover:shadow-sm'
    }`}
  >
    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
      active ? 'bg-white bg-opacity-20' : 'bg-white'
    }`}>
      {React.cloneElement(icon, { 
        className: active ? 'text-white' : 'text-current'
      })}
    </div>
    <span className="text-xs font-medium">{label}</span>
  </motion.button>
);

export default PrincipalDashboard;


// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import axios from 'axios';
// import { 
//   FiUsers, 
//   FiUser,
//   FiBook,
//   FiBriefcase,
//   FiChevronDown,
//   FiChevronRight,
//   FiRefreshCw,
//   FiMail,
//   FiCalendar,
//   FiActivity,
//   FiBarChart2
// } from 'react-icons/fi';
// import ProfileView from './ProfileView';

// const PrincipalDashboard = () => {
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({
//     departments: 0,
//     students: 0,
//     faculty: 0,
//     staff: 0
//   });
//   const [departments, setDepartments] = useState([]);
//   const [selectedDept, setSelectedDept] = useState(null);
//   const [selectedType, setSelectedType] = useState(null);
//   const [members, setMembers] = useState([]);
//   const [selectedMember, setSelectedMember] = useState(null);
//   const [profileData, setProfileData] = useState(null);
//   const [profileLoading, setProfileLoading] = useState(false);

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const response = await axios.get('http://69.62.83.14:9000/api/principal/dashboard', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setStats(response.data.stats);
//       setDepartments(response.data.departments);
//       setSelectedDept(null);
//       setSelectedType(null);
//       setMembers([]);
//       setSelectedMember(null);
//       setProfileData(null);
//     } catch (err) {
//       console.error('Error fetching dashboard data:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchDepartmentMembers = async (deptId, type) => {
//     try {
//       setSelectedType(type);
//       const token = localStorage.getItem('token');
//       const response = await axios.get(
//         `http://69.62.83.14:9000/api/principal/members?deptId=${deptId}&type=${type}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setMembers(response.data.members);
//     } catch (err) {
//       console.error('Error fetching members:', err);
//     }
//   };

//   const fetchMemberProfile = async (memberId) => {
//     try {
//       setProfileLoading(true);
//       const token = localStorage.getItem('token');
//       const response = await axios.get(
//         `http://69.62.83.14:9000/api/principal/profile/${memberId}?type=${selectedType}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setProfileData(response.data);
//       setSelectedMember(memberId);
//     } catch (err) {
//       console.error('Error fetching profile:', err);
//     } finally {
//       setProfileLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 flex items-center justify-center">
//         <motion.div
//           animate={{ rotate: 360 }}
//           transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
//           className="text-red-600"
//         >
//           <FiRefreshCw size={32} />
//         </motion.div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">
//       {/* Header */}
//       <motion.header
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100"
//       >
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Principal Dashboard</h1>
//             <p className="text-gray-600">Institutional Overview and Management</p>
//           </div>
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={fetchDashboardData}
//             className="mt-4 md:mt-0 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium flex items-center"
//           >
//             <FiRefreshCw className="mr-2" />
//             Refresh Data
//           </motion.button>
//         </div>
//       </motion.header>

//       {/* Stats Overview */}
//       <motion.div 
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ delay: 0.2 }}
//         className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
//       >
//         <StatCard 
//           icon={<FiBook size={24} />}
//           title="Departments"
//           value={stats.departments}
//           color="bg-blue-100 text-blue-600"
//         />
//         <StatCard 
//           icon={<FiUsers size={24} />}
//           title="Students"
//           value={stats.students}
//           color="bg-green-100 text-green-600"
//         />
//         <StatCard 
//           icon={<FiUser size={24} />}
//           title="Faculty"
//           value={stats.faculty}
//           color="bg-red-100 text-red-600"
//         />
//         <StatCard 
//           icon={<FiBriefcase size={24} />}
//           title="Staff"
//           value={stats.staff}
//           color="bg-purple-100 text-purple-600"
//         />
//       </motion.div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Department and Member Selection */}
//         <div className="lg:col-span-1 space-y-6">
//           {/* Department Selection */}
//           <motion.div 
//             className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
//             whileHover={{ y: -2 }}
//           >
//             <div className="p-4 border-b border-gray-100">
//               <h3 className="font-bold text-gray-900">Select Department</h3>
//             </div>
//             <div className="divide-y divide-gray-100">
//               {departments.map((dept) => (
//                 <motion.div 
//                   key={dept.id}
//                   whileHover={{ backgroundColor: "#f9fafb" }}
//                   className={`p-4 cursor-pointer ${selectedDept === dept.id ? 'bg-gray-50' : ''}`}
//                   onClick={() => {
//                     setSelectedDept(dept.id);
//                     setSelectedType(null);
//                     setMembers([]);
//                     setSelectedMember(null);
//                     setProfileData(null);
//                   }}
//                 >
//                   <div className="flex justify-between items-center">
//                     <div className="flex items-center">
//                       <div className="w-8 h-8 rounded-md bg-red-100 text-red-600 flex items-center justify-center mr-3">
//                         <FiBook size={16} />
//                       </div>
//                       <span className="font-medium">{dept.name}</span>
//                     </div>
//                     <FiChevronRight className="text-gray-400" />
//                   </div>
//                 </motion.div>
//               ))}
//             </div>
//           </motion.div>

//           {/* Type Selection */}
//           {selectedDept && (
//             <motion.div 
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
//             >
//               <div className="p-4 border-b border-gray-100">
//                 <h3 className="font-bold text-gray-900">Select Member Type</h3>
//               </div>
//               <div className="grid grid-cols-3 divide-x divide-gray-100">
//                 <MemberTypeButton
//                   active={selectedType === 'students'}
//                   onClick={() => fetchDepartmentMembers(selectedDept, 'students')}
//                   icon={<FiUsers size={18} />}
//                   label="Students"
//                 />
//                 <MemberTypeButton
//                   active={selectedType === 'faculty'}
//                   onClick={() => fetchDepartmentMembers(selectedDept, 'faculty')}
//                   icon={<FiUser size={18} />}
//                   label="Faculty"
//                 />
//                 <MemberTypeButton
//                   active={selectedType === 'staff'}
//                   onClick={() => fetchDepartmentMembers(selectedDept, 'staff')}
//                   icon={<FiBriefcase size={18} />}
//                   label="Staff"
//                 />
//               </div>
//             </motion.div>
//           )}

//           {/* Members List */}
//           {selectedType && members.length > 0 && (
//             <motion.div 
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
//             >
//               <div className="p-4 border-b border-gray-100">
//                 <h3 className="font-bold text-gray-900">
//                   {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} List
//                 </h3>
//               </div>
//               <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
//                 {members.map((member) => (
//                   <motion.div
//                     key={member.id}
//                     whileHover={{ backgroundColor: "#f9fafb" }}
//                     className={`p-4 cursor-pointer ${selectedMember === member.id ? 'bg-red-50' : ''}`}
//                     onClick={() => fetchMemberProfile(member.id)}
//                   >
//                     <div className="flex items-center">
//                       <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
//                         selectedType === 'students' ? 'bg-blue-100 text-blue-600' :
//                         selectedType === 'faculty' ? 'bg-red-100 text-red-600' :
//                         'bg-purple-100 text-purple-600'
//                       }`}>
//                         {selectedType === 'students' ? <FiUsers size={16} /> :
//                          selectedType === 'faculty' ? <FiUser size={16} /> :
//                          <FiBriefcase size={16} />}
//                       </div>
//                       <div>
//                         <h4 className="font-medium">{member.name}</h4>
//                         <p className="text-sm text-gray-600">{member.email}</p>
//                       </div>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>
//           )}
//         </div>

//         {/* Profile View */}
//         <div className="lg:col-span-2">
//           {profileData ? (
//             <ProfileView 
//               data={profileData} 
//               type={selectedType} 
//               loading={profileLoading} 
//             />
//           ) : (
//             <motion.div 
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex items-center justify-center"
//             >
//               <div className="text-center p-8">
//                 <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
//                   <FiUser className="text-gray-400" size={24} />
//                 </div>
//                 <h3 className="text-lg font-medium text-gray-900 mb-1">No Profile Selected</h3>
//                 <p className="text-gray-500">
//                   {selectedType 
//                     ? `Select a ${selectedType.slice(0, -1)} to view details` 
//                     : "Select a department and member type first"}
//                 </p>
//               </div>
//             </motion.div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// const StatCard = ({ icon, title, value, color }) => (
//   <motion.div 
//     whileHover={{ y: -5 }}
//     className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
//   >
//     <div className="flex items-center">
//       <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mr-4`}>
//         {icon}
//       </div>
//       <div>
//         <p className="text-sm font-medium text-gray-500">{title}</p>
//         <h3 className="text-2xl font-bold">{value}</h3>
//       </div>
//     </div>
//   </motion.div>
// );

// const MemberTypeButton = ({ active, onClick, icon, label }) => (
//   <motion.button
//     whileHover={{ scale: 1.03 }}
//     whileTap={{ scale: 0.97 }}
//     onClick={onClick}
//     className={`p-4 flex flex-col items-center justify-center ${active ? 'bg-red-50 text-red-600' : 'text-gray-600'}`}
//   >
//     <div className={`w-10 h-10 rounded-full mb-2 flex items-center justify-center ${
//       active ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
//     }`}>
//       {icon}
//     </div>
//     <span className="text-sm font-medium">{label}</span>
//   </motion.button>
// );

// export default PrincipalDashboard;

// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import axios from 'axios';
// import { 
//   FiUsers, 
//   FiUserCheck,
//   FiActivity,
//   FiTrendingUp,
//   FiTrendingDown,
//   FiBarChart2,
//   FiChevronDown,
//   FiChevronRight,
//   FiRefreshCw,
//   FiMail,
//   FiUser
// } from 'react-icons/fi';

// const PrincipalDashboard = () => {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [facultyData, setFacultyData] = useState([]);
//   const [expandedDept, setExpandedDept] = useState(null);

//   useEffect(() => {
//     fetchFacultyData();
//   }, []);

//   const fetchFacultyData = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const response = await axios.get('http://69.62.83.14:9000/api/principalu/faculty', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setFacultyData(response.data.departments);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching faculty data:', err);
//       setError('Failed to fetch faculty data. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const refreshData = () => {
//     fetchFacultyData();
//   };

//   if (loading) {
//     return (
//       <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 flex items-center justify-center">
//         <motion.div
//           animate={{ rotate: 360 }}
//           transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
//           className="text-red-600"
//         >
//           <FiRefreshCw size={32} />
//         </motion.div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 flex items-center justify-center">
//         <div className="text-center">
//           <p className="text-red-600 mb-4">{error}</p>
//           <button
//             onClick={refreshData}
//             className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">
//       {/* Header */}
//       <motion.header
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ type: "spring", stiffness: 300 }}
//         className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100"
//       >
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Faculty Overview</h1>
//             <p className="text-gray-600">Department-wise Faculty List</p>
//           </div>
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={refreshData} 
//             className="mt-4 md:mt-0 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium flex items-center"
//           >
//             <FiRefreshCw className="mr-2" />
//             Refresh Data
//           </motion.button>
//         </div>
//       </motion.header>

//       {/* Faculty List */}
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ delay: 0.2 }}
//         className="grid grid-cols-1 gap-6"
//       >
//         {facultyData.map((department) => (
//           <motion.div
//             key={department.department_id}
//             whileHover={{ y: -5 }}
//             className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
//           >
//             <motion.button
//               onClick={() => setExpandedDept(expandedDept === department.department_id ? null : department.department_id)}
//               className="w-full flex justify-between items-center p-4 hover:bg-gray-50 transition-colors"
//             >
//               <div className="flex items-center">
//                 <div className="w-10 h-10 rounded-lg mr-3 bg-red-100 text-red-700 flex items-center justify-center">
//                   <FiUsers size={20} />
//                 </div>
//                 <div className="text-left">
//                   <h3 className="font-bold text-gray-900">{department.department_name}</h3>
//                   <p className="text-sm text-gray-600">{department.faculty.length} Faculty Members</p>
//                 </div>
//               </div>
//               <motion.div
//                 animate={{ rotate: expandedDept === department.department_id ? 180 : 0 }}
//               >
//                 <FiChevronDown />
//               </motion.div>
//             </motion.button>

//             <AnimatePresence>
//               {expandedDept === department.department_id && (
//                 <motion.div
//                   initial={{ opacity: 0, height: 0 }}
//                   animate={{ opacity: 1, height: 'auto' }}
//                   exit={{ opacity: 0, height: 0 }}
//                   transition={{ duration: 0.3 }}
//                   className="px-4 pb-4"
//                 >
//                   <div className="space-y-4">
//                     {department.faculty.map((faculty) => (
//                       <motion.div
//                         key={faculty.id}
//                         initial={{ opacity: 0, x: -20 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
//                       >
//                         <div className="flex items-center">
//                           <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center mr-3">
//                             <FiUser size={16} />
//                           </div>
//                           <div>
//                             <h4 className="font-medium text-gray-900">{faculty.name}</h4>
//                             <div className="flex items-center text-sm text-gray-600">
//                               <FiMail className="mr-1" size={14} />
//                               {faculty.email}
//                             </div>
//                           </div>
//                         </div>
//                         <div className="flex items-center">
//                           <span className={`text-xs px-2 py-1 rounded-full ${
//                             faculty.isActive 
//                               ? 'bg-green-100 text-green-800' 
//                               : 'bg-red-100 text-red-800'
//                           }`}>
//                             {faculty.isActive ? 'Active' : 'Inactive'}
//                           </span>
//                         </div>
//                       </motion.div>
//                     ))}
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </motion.div>
//         ))}
//       </motion.div>
//     </div>
//   );
// };

// export default PrincipalDashboard;