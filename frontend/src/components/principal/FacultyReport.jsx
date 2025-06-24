import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiDownload } from 'react-icons/fi';

const FacultyReport = () => {
  const [departments, setDepartments] = useState([]);
  const [reportDept, setReportDept] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Fetch departments for dropdown
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://69.62.83.14:9000/api/principal/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDepartments(response.data.departments || []);
      } catch (err) {
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);

  const handleDownloadAttendance = async (format) => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://69.62.83.14:9000/api/principal/faculty-attendance-report', {
        headers: { Authorization: `Bearer ${token}` },
        params: { departmentId: reportDept, fromDate, toDate, format },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const departmentName = reportDept === 'all' ? 'all' : departments.find(d => d.id === parseInt(reportDept, 10))?.name.replace(/\s+/g, '_');
      const ext = format === 'pdf' ? 'pdf' : 'csv';
      const filename = `faculty_attendance_report_${departmentName}_${new Date().toISOString().split('T')[0]}.${ext}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Error downloading attendance report:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200 max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Download Faculty Attendance Reports</h2>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-1/2">
          <label htmlFor="report-dept" className="block text-sm font-medium text-gray-700 mb-1">
            Select Department
          </label>
          <select
            id="report-dept"
            value={reportDept}
            onChange={(e) => setReportDept(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2 mt-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                max={toDate || undefined}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                min={fromDate || undefined}
              />
            </div>
          </div>
        </div>
        <div className="w-full sm:w-auto mt-auto flex gap-2">
          <button
            onClick={() => handleDownloadAttendance('csv')}
            disabled={downloading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            <FiDownload />
            <span>{downloading ? 'Downloading CSV...' : 'Download CSV'}</span>
          </button>
          <button
            onClick={() => handleDownloadAttendance('pdf')}
            disabled={downloading}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            <FiDownload />
            <span>{downloading ? 'Downloading PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacultyReport;
