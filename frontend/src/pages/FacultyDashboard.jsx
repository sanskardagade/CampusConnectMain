import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import FacultyLogDisplay from "../components/faculty/FacultyLogDisplay"
import HeaderFaculty from '../components/common/HeaderFaculty';
// import { FaBell, FaTasks, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
// import FacultyLogDisplay from "../components/faculty/FacultyLogDisplay"

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    name: '',
    erpStaffId: '',
    logs: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('http://69.62.83.14:9000/api/faculty/dashboard', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Dashboard response:', response.data); // Debug log
        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <HeaderFaculty />
      
      <div className="px-2 sm:px-4 md:px-8 lg:px-16 mt-16 sm:mt-8 w-full max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4">Welcome, {dashboardData.name}!</h1>
        <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Your Erp id is : {dashboardData.erpStaffId}</p>
        <div className="bg-white rounded-lg shadow p-2 sm:p-4 mb-4">
          <FacultyLogDisplay logs={dashboardData.logs || null} facultyName={dashboardData.name} />
        </div>
      </div>
    </>
  );
};

export default FacultyDashboard;