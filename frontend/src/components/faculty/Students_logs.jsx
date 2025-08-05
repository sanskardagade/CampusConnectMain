import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, User, RefreshCw, AlertCircle, CheckCircle2, Clock, Eye, BookOpen, Filter } from 'lucide-react';
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

  // Fetch sessions for the selected date and subject
  useEffect(() => {
    setSelectedSession(null);
    setAttendanceLogs([]);
    if (!filterDate || !filterSubject) {
      setSessions([]);
      return;
    }
    const fetchSessions = async () => {
      setLoadingSessions(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const url = `http://69.62.83.14:9000/api/faculty/sessions?date=${filterDate}&subject_id=${filterSubject}`;
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

  // Fetch logs for the selected session only
  useEffect(() => {
    if (!selectedSession) {
      setAttendanceLogs([]);
      return;
    }
    const fetchLogs = async () => {
      setLoadingLogs(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://69.62.83.14:9000/api/faculty/session-logs/${selectedSession.session_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAttendanceLogs(response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch attendance logs');
      }
      setLoadingLogs(false);
    };
    fetchLogs();
  }, [selectedSession]);

  // Filter sessions by search term
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = !searchTerm ||
      String(session.subject_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.subject_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      session.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Attendance stats
  const getAttendanceStats = () => {
    if (!attendanceLogs.length) return { total: 0 };
    return { total: attendanceLogs.length };
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
              <p className="text-slate-600 mt-2">
                Select date and subject to view available sessions. Click a session to view logs.
              </p>
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
                <Filter className="mr-2" size={16} />
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
          </div>
        </div>

        {/* Sessions Grid */}
        {filterDate && filterSubject && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800">Available Sessions</h2>
              <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {loadingSessions
                  ? "Loading..."
                  : filteredSessions.length
                  ? `${filteredSessions.length} sessions found`
                  : "No sessions for this date/subject"}
              </div>
            </div>
            {loadingSessions ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="animate-spin text-blue-600 mr-3" size={24} />
                <span className="text-slate-600">Loading sessions...</span>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto text-slate-400 mb-4" size={48} />
                <p className="text-slate-600">No sessions found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSessions.map(session => (
                  <div
                    key={session.session_id}
                    className={`group cursor-pointer transition-all duration-300 rounded-xl border-2 p-5 hover:shadow-lg ${
                      selectedSession?.session_id === session.session_id
                        ? 'border-blue-500 bg-blue-50/50 shadow-lg'
                        : 'border-slate-200 bg-white/50 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedSession(session)}
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
        )}

        {/* Attendance Logs Table (only if a session is selected) */}
        {selectedSession && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">
                Attendance Logs for Session: {selectedSession.subject_id}
              </h2>
              <button
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                onClick={() => setSelectedSession(null)}
              >
                Back to Sessions
              </button>
            </div>
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
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Location</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Confidence</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Log ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceLogs.map((log, index) => {
                        const logTime = new Date(log.detected_at);
                        return (
                          <tr
                            key={log.log_id}
                            className={`hover:bg-slate-50/50 transition-colors duration-200 ${
                              index % 2 === 0 ? 'bg-white/30' : 'bg-white/50'
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                                  <User className="text-blue-600" size={16} />
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
                                {log.detected_at}
                              </p>
                            </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center text-sm text-slate-600">
                                <MapPin className="mr-2 text-slate-400" size={14} />
                                {log.location}
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
                    <span className="flex items-center">
                      <Users className="mr-2 text-blue-500" size={16} />
                      Total: {stats.total}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
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
        )}
      </div>
    </div>
  );
};

export default StudentLogs;