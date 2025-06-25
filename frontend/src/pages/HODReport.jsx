import React, { useState, useEffect } from 'react';
import { FiDownload, FiFileText, FiUser, FiCalendar, FiFile } from 'react-icons/fi';
import axios from 'axios';

const formats = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
  { value: 'docx', label: 'Word (.docx)' },
];

const HODReport = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [format, setFormat] = useState('xlsx');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [stressFormat, setStressFormat] = useState('xlsx');
  const [stressFaculty, setStressFaculty] = useState('all');
  const [stressDateFrom, setStressDateFrom] = useState('');
  const [stressDateTo, setStressDateTo] = useState('');
  const [stressDownloading, setStressDownloading] = useState(false);
  const [stressError, setStressError] = useState(null);

  useEffect(() => {
    // Fetch faculty list for dropdown
    const fetchFaculty = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://69.62.83.14:9000/api/hod/faculty', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch faculty list');
        const data = await res.json();
        setFacultyList(data);
      } catch (err) {
        setFacultyList([]);
      }
    };
    fetchFaculty();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const params = {
        faculty: selectedFaculty,
        from: dateFrom,
        to: dateTo,
        format,
      };
      // Adjust API endpoint as per backend implementation
      const response = await axios.get('http://69.62.83.14:9000/api/hod/faculty-attendance-report', {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'blob',
      });
      // Get filename from content-disposition or fallback
      const disposition = response.headers['content-disposition'];
      let filename = `report.${format}`;
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

  const handleStressDownload = async () => {
    setStressDownloading(true);
    setStressError(null);
    try {
      const token = localStorage.getItem('token');
      const params = {
        faculty: stressFaculty,
        from: stressDateFrom,
        to: stressDateTo,
        format: stressFormat,
      };
      const response = await axios.get('http://69.62.83.14:9000/api/hod/faculty-stress-report', {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'blob',
      });
      const disposition = response.headers['content-disposition'];
      let filename = `stress_report.${stressFormat}`;
      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setStressError('Failed to download stress report.');
    } finally {
      setStressDownloading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto  bg-white rounded-xl shadow-lg p-10 my-8 border border-gray-200 transition-all duration-300 hover:shadow-xl">
      <div className="flex flex-col h-full">
        {/* Main Faculty Report Section - Expanded */}
        <div className="flex-grow">
          <h2 className="text-4xl font-bold mb-10 flex items-center text-gray-800">
            <FiFileText className="mr-4 text-red-800 text-5xl" /> 
            <span className="bg-gradient-to-r from-red-800 to-red-600 bg-clip-text text-transparent">
              Generate Faculty Report
            </span>
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
            <div className="space-y-3">
              <label className="block text-lg font-medium text-gray-700 mb-3">Faculty</label>
              <select
                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 hover:border-red-400"
                value={selectedFaculty}
                onChange={e => setSelectedFaculty(e.target.value)}
              >
                <option value="all" className="text-lg">All Faculty</option>
                {facultyList.map(faculty => (
                  <option key={faculty.erpid} value={faculty.erpid} className="text-lg">{faculty.name} ({faculty.erpid})</option>
                ))}
              </select>
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
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
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
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
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

        {/* Commented Stress Report Section - kept as reference */}
        {/* 
        <div className="mt-16 pt-12 border-t border-gray-200">
          <h2 className="text-3xl font-bold mb-8 flex items-center text-gray-800">
            <FiFile className="mr-3 text-red-800" /> 
            <span className="bg-gradient-to-r from-red-800 to-red-600 bg-clip-text text-transparent">
              Generate Faculty Stress Report
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 hover:border-red-400"
                value={stressFormat}
                onChange={e => setStressFormat(e.target.value)}
              >
                {formats.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 hover:border-red-400"
                value={stressFaculty}
                onChange={e => setStressFaculty(e.target.value)}
              >
                <option value="all">All Faculty</option>
                {facultyList.map(faculty => (
                  <option key={faculty.erpid} value={faculty.erpid}>{faculty.name} ({faculty.erpid})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-3.5 text-red-700" />
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 hover:border-red-400"
                  value={stressDateFrom}
                  onChange={e => setStressDateFrom(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-3.5 text-red-700" />
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 hover:border-red-400"
                  value={stressDateTo}
                  onChange={e => setStressDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {stressError && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-800 text-red-700 rounded animate-pulse">
              {stressError}
            </div>
          )}
          
          <button
            className={`flex items-center px-8 py-3 bg-gradient-to-r from-red-800 to-red-600 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-opacity-50 ${stressDownloading ? 'opacity-75 cursor-not-allowed' : ''}`}
            onClick={handleStressDownload}
            disabled={stressDownloading}
          >
            <FiDownload className="mr-3 animate-bounce" />
            {stressDownloading ? 'Generating Report...' : 'Download Stress Report'}
            {stressDownloading && (
              <svg className="animate-spin ml-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
          </button>
        </div>
        */}
      </div>
    </div>
  );
};

export default HODReport;