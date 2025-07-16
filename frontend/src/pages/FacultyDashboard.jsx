import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FacultyLogForFaculty from '../components/faculty/FacultyLogForFaculty';

const getInitials = (name) => {
  if (!name) return '';
  const names = name.split(' ');
  return names.map(n => n[0]).join('').toUpperCase();
};

// Helper to get yesterday's date in yyyy-mm-dd format
const getYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const FacultyDashboard = () => {
  const [profile, setProfile] = useState({ name: '', erpStaffId: '', logs: [] });
  const [selectedDate, setSelectedDate] = useState(getYesterday);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('http://69.62.83.14:9000/api/faculty/dashboard', {
          params: { date: selectedDate },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProfile({
          name: response.data.name,
          erpStaffId: response.data.erpStaffId,
          logs: response.data.logs || []
        });
      } catch (err) {
        setProfile({ name: 'Unknown', erpStaffId: 'Unknown', logs: [] });
      }
    };
    fetchDashboard();
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-5 px-2 sm:px-4 md:px-8 lg:px-16 flex flex-col items-center">
      {/* Header Section */}
      <div className="w-full max-w-3xl mx-auto rounded-2xl shadow-lg bg-gradient-to-r from-blue-600 to-indigo-500 p-5 flex flex-col sm:flex-row items-center gap-4 mb-6 relative overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg border-4 border-indigo-200">
          <span className="text-2xl font-bold text-indigo-600">{getInitials(profile.name)}</span>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-1 drop-shadow">Welcome, {profile.name || 'Faculty'}!</h1>
          <p className="text-indigo-100 text-base sm:text-lg font-medium leading-tight">Empowering your daily teaching journey</p>
        </div>
        {/* Decorative circle */}
        <div className="absolute -top-8 -right-8 w-28 h-28 bg-white opacity-10 rounded-full z-0"></div>
      </div>

      {/* ERP ID Card */}
      <div className="w-full max-w-3xl mx-auto mb-4">
        <div className="bg-white rounded-xl shadow-md p-3 flex items-center justify-between">
          <span className="text-gray-700 font-semibold text-lg">ERP ID:</span>
          <span className="text-indigo-600 font-bold text-xl tracking-wider">{profile.erpStaffId}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full max-w-3xl mx-auto flex items-center mb-6">
        <div className="flex-grow border-t border-indigo-200"></div>
        <span className="mx-3 text-indigo-400 font-semibold text-sm uppercase tracking-widest">Activity</span>
        <div className="flex-grow border-t border-indigo-200"></div>
      </div>

      {/* Logs Card */}
      <div className="w-full max-w-3xl mx-auto">
        <FacultyLogForFaculty
          logs={profile.logs}
          facultyName={profile.name}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </div>
    </div>
  );
};

export default FacultyDashboard;