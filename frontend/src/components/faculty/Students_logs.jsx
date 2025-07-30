import React, { useState, useEffect } from 'react';
import { Search, Calendar, BookOpen, Users, Clock, MapPin, Monitor, User, Filter, RefreshCw, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import axios from 'axios';

const StudentLogs = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all sessions for faculty only when both date and subject are selected
  useEffect(() => {
    if (!filterDate || !filterSubject) {
      setSessions([]);
      return;
    }
    const fetchSessions = async () => {
      setLoadingSessions(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        let url = 'http://69.62.83.14:9000/api/faculty/sessions';
        const params = [`date=${filterDate}`, `subject_id=${filterSubject}`];
        url += '?' + params.join('&');
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSessions(response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch sessions');
      }
      setLoadingSessions(false);
    };
    fetchSessions();
  }, [filterDate, filterSubject]);

  // Fetch attendance logs for selected session
  const handleSessionSelect = async (session) => {
    setSelectedSession(session);
    setLoadingLogs(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://69.62.83.14:9000/api/faculty/session-logs/${session.session_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceLogs(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance logs');
    }
    setLoadingLogs(false);
  };

  const filteredSessions = sessions.filter(session => {
    const matchesDate = !filterDate || session.session_date === filterDate;
    const matchesSubject = !filterSubject || String(session.subject_id).toLowerCase().includes(filterSubject.toLowerCase());
    const matchesSearch = !searchTerm || 
      String(session.subject_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.subject_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      session.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSubject && matchesSearch;
  });

  const getAttendanceStats = () => {
    if (!attendanceLogs.length) return { total: 0, onTime: 0, late: 0 };
    const total = attendanceLogs.length;
    const onTime = attendanceLogs.filter(log => {
      if (!selectedSession) return false;
      const logTime = new Date(`2024-01-15T${new Date(log.detected_at).toTimeString().slice(0, 5)}`);
      const startTime = new Date(`2024-01-15T${selectedSession.start_time}`);
      return logTime <= new Date(startTime.getTime() + 10 * 60000); // 10 min grace period
    }).length;
    return { total, onTime, late: total - onTime };
  };

  const stats = getAttendanceStats();

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
              <p className="text-slate-600 mt-2">Monitor and track student attendance across sessions</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="text-slate-600" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Filters & Search</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Search className="mr-2" size={16} />
                Search Sessions
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by subject, location..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Calendar className="mr-2" size={16} />
                Filter by Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <BookOpen className="mr-2" size={16} />
                Subject Filter
              </label>
              <input
                type="text"
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                placeholder="Subject ID"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50"
              />
            </div>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Available Sessions</h2>
            <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {filterDate && filterSubject ? `${sessions.length} sessions found` : 'Select date and subject code'}
            </div>
          </div>
          {(!filterDate || !filterSubject) ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-slate-400 mb-4" size={48} />
              <p className="text-slate-600">Please select both a date and a subject code to view sessions.</p>
            </div>
          ) : loadingSessions ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-blue-600 mr-3" size={24} />
              <span className="text-slate-600">Loading sessions...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-slate-400 mb-4" size={48} />
              <p className="text-slate-600">No sessions found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map(session => (
                <div
                  key={session.session_id}
                  className={`group cursor-pointer transition-all duration-300 rounded-xl border-2 p-5 hover:shadow-lg ${
                    selectedSession?.session_id === session.session_id
                      ? 'border-blue-500 bg-blue-50/50 shadow-lg'
                      : 'border-slate-200 bg-white/50 hover:border-blue-300'
                  }`}
                  onClick={() => handleSessionSelect(session)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                      {session.subject_id}
                    </div>
                    <Eye className="text-slate-400 group-hover:text-blue-500 transition-colors" size={18} />
                  </div>
                  
                  <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">
                    {session.subject_name || session.subject_id}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center">
                      <Calendar className="mr-2 text-blue-500" size={14} />
                      {session.session_date}
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 text-green-500" size={14} />
                      {session.start_time} - {session.end_time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-2 text-red-500" size={14} />
                      {session.location}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs">
                        Div: {session.division}
                      </span>
                      {session.batch && (
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs">
                          Batch: {session.batch}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Session Details */}
        {selectedSession && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Monitor className="text-blue-600" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Session Details</h2>
                <p className="text-slate-600">{selectedSession.subject_id} - {selectedSession.session_date}</p>
              </div>
            </div>

            {/* Attendance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Present</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Users className="text-blue-200" size={24} />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">On Time</p>
                    <p className="text-2xl font-bold">{stats.onTime}</p>
                  </div>
                  <CheckCircle2 className="text-green-200" size={24} />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Late Arrival</p>
                    <p className="text-2xl font-bold">{stats.late}</p>
                  </div>
                  <Clock className="text-orange-200" size={24} />
                </div>
              </div>
            </div>

            {/* Attendance Logs */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Attendance Logs</h3>
              
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="animate-spin text-blue-600 mr-3" size={24} />
                  <span className="text-slate-600">Loading attendance logs...</span>
                </div>
              ) : attendanceLogs.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto text-slate-400 mb-4" size={48} />
                  <p className="text-slate-600">No attendance logs found for this session.</p>
                </div>
              ) : (
                <div className="bg-white/70 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Student</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ERP ID</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Detection Time</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Location</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Confidence</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Log ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceLogs.map((log, index) => {
                          const logTime = new Date(log.detected_at);
                          const startTime = new Date(`2024-01-15T${selectedSession.start_time}`);
                          const isLate = logTime > new Date(startTime.getTime() + 10 * 60000);
                          
                          return (
                            <tr 
                              key={log.log_id} 
                              className={`hover:bg-slate-50/50 transition-colors duration-200 ${
                                index % 2 === 0 ? 'bg-white/30' : 'bg-white/50'
                              }`}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isLate ? 'bg-orange-100' : 'bg-green-100'
                                  }`}>
                                    <User className={`${isLate ? 'text-orange-600' : 'text-green-600'}`} size={16} />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-800">{log.detected_name}</p>
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4">
                                <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                                  {log.detected_erpid}
                                </span>
                              </td>
                              
                              <td className="px-6 py-4">
                                <div className="text-sm">
                                  <p className="font-medium text-slate-800">
                                    {logTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  <p className="text-slate-500 text-xs">
                                    {logTime.toLocaleDateString()}
                                  </p>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  isLate 
                                    ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                                    : 'bg-green-100 text-green-800 border border-green-200'
                                }`}>
                                  {isLate ? (
                                    <>
                                      <Clock className="mr-1" size={12} />
                                      Late
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="mr-1" size={12} />
                                      On Time
                                    </>
                                  )}
                                </span>
                              </td>
                              
                              <td className="px-6 py-4">
                                <div className="flex items-center text-sm text-slate-600">
                                  <MapPin className="mr-2 text-slate-400" size={14} />
                                  {log.location}
                                </div>
                              </td>
                              
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className={`w-full bg-slate-200 rounded-full h-2 mr-2 ${
                                    log.confidence >= 95 ? 'max-w-[60px]' : 'max-w-[50px]'
                                  }`}>
                                    <div 
                                      className={`h-2 rounded-full ${
                                        log.confidence >= 95 ? 'bg-green-500' : 
                                        log.confidence >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${log.confidence}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-slate-700">
                                    {log.confidence}%
                                  </span>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4">
                                <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                  {log.log_id}
                                </span>
                              </td>
                            </tr> 
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Table Footer with Summary */}
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-6 py-3">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Showing {attendanceLogs.length} attendance records</span>
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          On Time: {stats.onTime}
                        </span>
                        <span className="flex items-center">
                          <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                          Late: {stats.late}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-3" size={20} />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLogs;