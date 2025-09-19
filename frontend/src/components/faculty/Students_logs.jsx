import React, { useState, useEffect } from 'react';
import { Users, User, RefreshCw, AlertCircle, Filter, Download, Info, Calendar, Edit2 } from 'lucide-react';

const StudentLogs = () => {
  // States for subjects dropdown
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectsError, setSubjectsError] = useState('');

  // Direct filter states
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    subject_id: "",
    division: "",
    year: "",
    selecteddate: "",
    start_date: "",
    end_date: ""
  });
  const [directFiltersError, setDirectFiltersError] = useState('');

  // Status update states
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [statusUpdateError, setStatusUpdateError] = useState('');

  // Fetch subjects when component mounts
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      setSubjectsError('');
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/faculty/subjects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch subjects: ${response.status}`);
        }
        const data = await response.json();
        if (!data || data.length === 0) {
          setSubjectsError('No subjects found');
          setSubjects([]);
        } else {
          setSubjects(data);
        }
      } catch (err) {
        setSubjectsError('Failed to load subjects. Please try again.');
        setSubjects([]);
      }
      setLoadingSubjects(false);
    };
    fetchSubjects();
  }, []);

  // Validate direct filters
  const validateDirectFilters = () => {
    const requiredFields = [];
    if (!filters.subject_id.trim()) requiredFields.push('Subject ID');
    if (!filters.division.trim()) requiredFields.push('Division');
    if (!filters.year.trim()) requiredFields.push('Year');

    const hasSingleDate = !!filters.selecteddate;
    const hasRange = !!filters.start_date && !!filters.end_date;
    if (!hasSingleDate && !hasRange) {
      requiredFields.push('Date or Start/End Date');
    }

    if (requiredFields.length > 0) {
      setDirectFiltersError(`Please fill in: ${requiredFields.join(', ')}`);
      return false;
    }
    setDirectFiltersError('');
    return true;
  };

  // Fetch logs with direct filters
  const fetchLogs = async () => {
    if (!validateDirectFilters()) return;
    setLoading(true);
    setDirectFiltersError('');
    const token = localStorage.getItem("token");

    // Build query: prefer range if both provided, else single date
    const params = new URLSearchParams();
    params.set('subject_id', filters.subject_id);
    params.set('division', filters.division);
    params.set('year', filters.year);
    if (filters.start_date && filters.end_date) {
      params.set('start_date', filters.start_date);
      params.set('end_date', filters.end_date);
    } else if (filters.selecteddate) {
      params.set('selecteddate', filters.selecteddate);
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/faculty/students-logs?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      console.log(data)
      if (!data || data.length === 0) {
        setDirectFiltersError('No logs found for the specified criteria');
        setLogs([]);
      } else {
        setLogs(data);
        setDirectFiltersError('');
      }
    } catch (error) {
      setDirectFiltersError(error.message || "Failed to fetch logs. Please try again.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

    const normalizeToISO = (dateStr) => {
    const ISOTime = new Date(dateStr);
    const inSQLFormat = ISOTime.toLocaleDateString('en-CA');
    return inSQLFormat;
  };

  // Build pivot data: unique dates and rows per student
  const uniqueDates = Array.from(new Set(logs.map(l => l.session_date))).sort();

  //convert to ISO
  const inISO = Array.from(uniqueDates.map(l => normalizeToISO(l)));

  const rowsByStudent = logs.reduce((acc, l) => {
    const key = l.student_id + '|' + l.student_name;
    if (!acc[key]) acc[key] = { student_id: l.student_id, student_name: l.student_name, statusByDate: {} };
    acc[key].statusByDate[l.session_date] = l.status;
    return acc;
  }, {});
  const studentRows = Object.values(rowsByStudent);
  
  const statusClass = (status) => (
    status === 'Present' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
    status === 'Absent' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
    'bg-slate-100 text-slate-700 hover:bg-slate-200'
  );

  // Toggle attendance status for a specific student/date cell
  const toggleAttendanceStatusByDate = async (studentId, date, currentStatus) => {
    const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    console.log(date);
    const cellKey = `${studentId}_${date}`;
    setUpdatingStatus(prev => ({ ...prev, [cellKey]: true }));
    setStatusUpdateError('');

    try {
      const token = localStorage.getItem('token');
      const formattedDate = normalizeToISO(date);
      console.log(formattedDate);
      const response = await fetch('http://localhost:5000/api/faculty/students-logs/update-attendance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: studentId,
          subject_id: filters.subject_id,
          session_date: formattedDate,
          status: newStatus
        })
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No attendance record found for this date to update.');
        }
        throw new Error(`Failed to update status: ${response.status}`);
      }
      await response.json();
      // Update local logs array (match against both original and normalized date)
      setLogs(prev => prev.map(l => (
        l.student_id === studentId && (normalizeToISO(l.session_date) === formattedDate)
          ? { ...l, status: newStatus }
          : l
      )));
    } catch (error) {
      setStatusUpdateError(error.message);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [cellKey]: false }));
    }
  };

  // Download report functionality (pivoted)
  const downloadReport = () => {
    if (studentRows.length === 0) return;
    const header = ['Student Name', ...uniqueDates];
    const csvRows = studentRows.map(r => [
      r.student_name,
      ...uniqueDates.map(d => r.statusByDate[d] || '-')
    ]);
    const csvContent = [header, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const nameSuffix = filters.start_date && filters.end_date
        ? `${filters.start_date}_to_${filters.end_date}`
        : filters.selecteddate;
      link.setAttribute('download', `attendance_logs_${filters.subject_id}_${nameSuffix}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Error message component
  const ErrorMessage = ({ message, type = 'error' }) => (
    <div className={`flex items-center space-x-2 p-4 rounded-xl border ${
      type === 'error' 
        ? 'bg-red-50 border-red-200 text-red-700' 
        : 'bg-blue-50 border-blue-200 text-blue-700'
    }`}>
      {type === 'error' ? (
        <AlertCircle size={16} className="flex-shrink-0" />
      ) : (
        <Info size={16} className="flex-shrink-0" />
      )}
      <span className="text-sm">{message}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Student Attendance Logs
              </h1>
              <p className="text-slate-600 mt-2">
                Use the filters below to fetch logs.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Direct Filters Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="text-slate-600" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Filters</h2>
          </div>

          {/* Subjects Error */}
          {subjectsError && (
            <div className="mb-4">
              <ErrorMessage message={subjectsError} />
            </div>
          )}

          {/* Direct Filters Error */}
          {directFiltersError && (
            <div className="mb-4">
              <ErrorMessage message={directFiltersError} />
            </div>
          )}

          {/* Status Update Error */}
          {statusUpdateError && (
            <div className="mb-4">
              <ErrorMessage message={statusUpdateError} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={filters.subject_id}
                onChange={(e) => setFilters({ ...filters, subject_id: e.target.value })}
                disabled={loadingSubjects}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 disabled:opacity-50"
              >
                <option value="">
                  {loadingSubjects ? 'Loading subjects...' : 'Select a subject'}
                </option>
                {subjects.map((subject) => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Division <span className="text-red-500">*</span>
              </label>
              <select
                value={filters.division}
                onChange={(e) => setFilters({ ...filters, division: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50"
              >
                <option value="">Select Division</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Year <span className="text-red-500">*</span>
              </label>
              <select 
                name="year" 
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50"
              >
              <option value="">Select Year</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
             
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Date (single)
              </label>
              <input
                type="date"
                value={filters.selecteddate}
                onChange={(e) => setFilters({ ...filters, selecteddate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Start Date (range)
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                End Date (range)
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-4">Tip: Provide either a single Date or both Start and End Date to fetch a range.</p>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
            <span>{loading ? 'Fetching...' : 'Fetch Logs'}</span>
          </button>
        </div>

        {/* Direct Logs Results */}
        {studentRows.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Logs Results</h2>
              <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {studentRows.length} students • {uniqueDates.length} dates
              </div>
              <button
                onClick={downloadReport}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center space-x-2"
              >
                <Download size={16} />
                <span>Download CSV</span>
              </button>
            </div>
            <div className="bg-white/70 rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Student Name</th>
                      {inISO.map(d => (
                        <th key={d} className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentRows.map((row) => (
                      <tr key={row.student_id} className="hover:bg-slate-50/50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                              <User className="text-blue-600" size={16} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{row.student_name}</p>
                            </div>
                          </div>
                        </td>
                        {uniqueDates.map((d) => {
                          const status = row.statusByDate[d] || '-';
                          const cellKey = `${row.student_id}_${d}`;
                          const isUpdating = !!updatingStatus[cellKey];
                          return (
                            <td key={d} className="px-6 py-4">
                              {status === '-' ? (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">-</span>
                              ) : (
                                <button
                                  onClick={() => toggleAttendanceStatusByDate(row.student_id, d, status)}
                                  disabled={isUpdating}
                                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer hover:scale-105 disabled:opacity-50 ${statusClass(status)}`}
                                >
                                  {isUpdating ? 'Updating...' : status}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLogs;