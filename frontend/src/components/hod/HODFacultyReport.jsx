import React, { useState, useEffect, useRef } from 'react';
import { FiDownload, FiFileText, FiCalendar } from 'react-icons/fi';
import axios from 'axios';

const formats = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
];

const reportTypes = [
  { value: 'attendance', label: 'Attendance Report' },
  { value: 'stress', label: 'Stress Report' },
  { value: 'leave', label: 'Leave Report' },
];

const HODFacultyReport = () => {
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [format, setFormat] = useState('csv');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const facultyDropdownOpen = useRef(false);
  const facultyDropdownRef = useRef(null);
  const [reportType, setReportType] = useState('attendance');

  useEffect(() => {
    // Fetch faculty for dropdown
    const fetchFaculty = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://69.62.83.14:9000/api/hod/faculty', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFaculty(response.data || []);
      } catch (err) {
        setFaculty([]);
      }
    };
    fetchFaculty();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (facultyDropdownRef.current && !facultyDropdownRef.current.contains(event.target)) {
        facultyDropdownOpen.current = false;
      }
    }
    if (facultyDropdownOpen.current) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [facultyDropdownOpen.current]);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const params = {
        faculty: selectedFaculty,
        fromDate: fromDate,
        toDate: toDate,
        format,
      };
      let endpoint;
      if (reportType === 'attendance') {
        endpoint = 'http://69.62.83.14:9000/api/hod/faculty-attendance-report';
        params.from = fromDate;
        params.to = toDate;
      } else if (reportType === 'stress') {
        endpoint = 'http://69.62.83.14:9000/api/hod/faculty-stress-report';
        params.from = fromDate;
        params.to = toDate;
      } else if (reportType === 'leave') {
        endpoint = 'http://69.62.83.14:9000/api/hod/faculty-leave-report';
      }
      const response = await axios.get(endpoint, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      // Get filename from content-disposition or fallback
      const disposition = response.headers['content-disposition'];
      let filename;
      if (reportType === 'attendance') {
        filename = `faculty_attendance_report.${format}`;
      } else if (reportType === 'stress') {
        filename = `faculty_stress_report.${format}`;
      } else if (reportType === 'leave') {
        filename = `faculty_leave_report.${format}`;
      }
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }
      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download report.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-10 my-8 border border-gray-200 transition-all duration-300 hover:shadow-xl">
      <div className="flex flex-col h-full">
        <div className="flex-grow">
          <h2 className="text-3xl font-bold mb-10 flex items-center text-gray-800">
            <FiFileText className="mr-4 text-red-800 text-4xl" />
            <span className="bg-gradient-to-r from-red-800 to-red-600 bg-clip-text text-transparent">
              Generate Faculty {reportType === 'attendance' ? 'Attendance' : reportType === 'stress' ? 'Stress' : 'Leave'} Report
            </span>
          </h2>
          <div className="flex justify-center mb-8">
            {reportTypes.map(rt => (
              <button
                key={rt.value}
                className={`px-6 py-3 rounded-xl mx-2 text-lg font-semibold border-2 transition-all duration-200 ${
                  reportType === rt.value
                    ? 'bg-gradient-to-r from-red-800 to-red-600 text-white border-red-700 shadow-lg'
                    : 'bg-white text-red-800 border-red-300 hover:border-red-600'
                }`}
                onClick={() => setReportType(rt.value)}
              >
                {rt.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <div className="space-y-3">
              <label className="block text-lg font-medium text-gray-700 mb-3">Faculty</label>
              <div className="relative" ref={facultyDropdownRef}>
                <select
                  className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg bg-white focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 hover:border-red-400"
                  value={selectedFaculty}
                  onChange={e => setSelectedFaculty(e.target.value)}
                >
                  <option value="all">All Faculty</option>
                  {faculty.map(f => (
                    <option key={f.erpid} value={f.erpid}>{f.name} ({f.erpid})</option>
                  ))}
                </select>
              </div>
              <p className="text-gray-500 text-sm mt-2">Select a faculty or choose 'All Faculty' for the department.</p>
            </div>
            <div className="space-y-3">
              <label className="block text-lg font-medium text-gray-700 mb-3">Format</label>
              <select
                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 hover:border-red-400"
                value={format}
                onChange={e => setFormat(e.target.value)}
              >
                {formats.map(f => (
                  <option key={f.value} value={f.value} className="text-lg">{f.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-lg font-medium text-gray-700 mb-3">From Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-4 top-4 text-red-700 text-2xl" />
                <input
                  type="date"
                  className="w-full border-2 border-gray-300 rounded-xl pl-14 pr-5 py-4 text-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 hover:border-red-400"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-lg font-medium text-gray-700 mb-3">To Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-4 top-4 text-red-700 text-2xl" />
                <input
                  type="date"
                  className="w-full border-2 border-gray-300 rounded-xl pl-14 pr-5 py-4 text-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 hover:border-red-400"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          {error && (
            <div className="mb-8 p-5 bg-red-100 border-l-4 border-red-800 text-red-700 text-lg rounded-lg animate-pulse">
              {error}
            </div>
          )}
          <div className="mt-10 flex items-center justify-center">
            <button
              className={`flex items-center px-10 py-5 text-xl bg-gradient-to-r from-red-800 to-red-600 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-red-700 focus:ring-opacity-50 ${downloading ? 'opacity-75 cursor-not-allowed' : ''}`}
              onClick={handleDownload}
              disabled={downloading}
            >
              <FiDownload className="mr-4 text-2xl animate-bounce" />
              {downloading ? 'Generating Report...' : 'Download Report'}
              {downloading && (
                <svg className="animate-spin ml-4 h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HODFacultyReport; 