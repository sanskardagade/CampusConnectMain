import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { Users, RefreshCw, BarChart3, Calendar, User, Clock, TrendingUp, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function HODFacultyStressLevel() {
  const [loading, setLoading] = useState(false);
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState([]); // array of selected options
  const [stressData, setStressData] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    setLoading(true);
    setFaculty([]);
    setSelectedFaculty([]);
    setStressData([]);
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://69.62.83.14:9000/api/hod/faculty-stress-members',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFaculty(response.data.members || []);
    } catch (err) {
      setFaculty([]);
      console.error('Error fetching faculty:', err);
    } finally {
      setProfileLoading(false);
      setLoading(false);
    }
  };

  // Fetch logs for all selected faculty
  useEffect(() => {
    if (!selectedFaculty || selectedFaculty.length === 0) {
      setStressData([]);
      return;
    }
    setProfileLoading(true);
    setStressData([]);
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem('token');
        const allLogs = await Promise.all(
          selectedFaculty.map(fac =>
            axios.get(
              `http://69.62.83.14:9000/api/hod/view-stress-level?facultyId=${fac.value}`,
              { headers: { Authorization: `Bearer ${token}` } }
            ).then(res => (res.data || []).map(item => ({ ...item, name: fac.label })))
          )
        );
        // Flatten and sort by timestamp desc
        const combined = allLogs.flat().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setStressData(combined);
      } catch (err) {
        setStressData([]);
        console.error('Error fetching stress data:', err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchAll();
  }, [selectedFaculty]);

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [stressData, selectedDate]);

  // Dropdown options
  const facultyOptions = faculty.map(f => ({ value: f.erpid, label: f.name, email: f.email }));

  // Filtered by date
  const filteredData = useMemo(() => {
    return stressData.filter(item => {
      const itemDate = new Date(item.timestamp);
      const selected = new Date(selectedDate);
      return (
        itemDate.getFullYear() === selected.getFullYear() &&
        itemDate.getMonth() === selected.getMonth() &&
        itemDate.getDate() === selected.getDate()
      );
    });
  }, [stressData, selectedDate]);

  const chartData = useMemo(() => {
    const counts = {
      L1: 0, L2: 0, L3: 0,
      A1: 0, A2: 0, A3: 0
    };
    filteredData.forEach(item => {
      if (counts.hasOwnProperty(item.stress_level)) {
        counts[item.stress_level]++;
      }
    });
    return [
      { level: 'L1', count: counts.L1, type: 'stressed', color: '#991b1b' },
      { level: 'L2', count: counts.L2, type: 'stressed', color: '#dc2626' },
      { level: 'L3', count: counts.L3, type: 'stressed', color: '#fca5a5' },
      { level: 'A1', count: counts.A1, type: 'active', color: '#065f46' },
      { level: 'A2', count: counts.A2, type: 'active', color: '#22c55e' },
      { level: 'A3', count: counts.A3, type: 'active', color: '#bbf7d0' }
    ];
  }, [filteredData]);

  const stats = useMemo(() => {
    const stressed = filteredData.filter(item =>
      typeof item.stress_status === 'string' && item.stress_status.trim().toLowerCase() === 'stressed'
    ).length;
    const active = filteredData.filter(item =>
      typeof item.stress_status === 'string' &&
      ['active', 'unstress'].includes(item.stress_status.trim().toLowerCase())
    ).length;
    const total = filteredData.length;
    return {
      stressed,
      active,
      total,
      stressPercentage: total > 0 ? Math.round((stressed / total) * 100) : 0,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }, [filteredData]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status) => {
    if (status === 'Stressed') {
      return {
        icon: AlertTriangle,
        className: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
      };
    }
    return {
      icon: CheckCircle,
      className: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
    };
  };

  const getLevelBadge = (level) => {
    const isStressed = level && level.startsWith('L');
    return {
      className: isStressed 
        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg ring-2 ring-red-200' 
        : 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg ring-2 ring-green-200',
      pulse: isStressed
    };
  };

  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-red-800/5"></div>
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg">
                      <BarChart3 className="text-white" size={24} />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">
                        Faculty Stress Levels
                      </h1>
                      <p className="text-slate-600 font-medium"> stress monitoring and insights</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={fetchFaculty}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <RefreshCw size={18} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Faculty Dropdown Selection */}
          <div className="bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden p-8">
            <div className="mb-6">
              <label className="block text-lg font-semibold mb-2 text-gray-900">Select Faculty (one or more)</label>
              <Select
                isMulti
                isSearchable
                options={facultyOptions}
                value={selectedFaculty}
                onChange={setSelectedFaculty}
                placeholder="Search and select faculty..."
                classNamePrefix="react-select"
                menuPortalTarget={document.body}
                menuPlacement="auto"
                styles={{
                  menu: base => ({ ...base, zIndex: 9999, maxHeight: 350, overflowY: 'auto' }),
                  control: base => ({ ...base, minHeight: 48 }),
                }}
              />
            </div>
          </div>

          {/* Analytics, Chart, and Stress Records */}
          {profileLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : selectedFaculty.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400" size={48} />
              <h3 className="text-xl font-semibold text-gray-600 mt-4">No Faculty Selected</h3>
              <p className="text-gray-500">Please select at least one faculty member to view stress logs.</p>
            </div>
          ) : (
            <>
              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Records</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Activity className="text-blue-600" size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Stressed</p>
                      <p className="text-2xl font-bold text-red-600">{stats.stressed}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-lg">
                      <AlertTriangle className="text-red-600" size={24} />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Stress Rate</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.stressPercentage}%</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <TrendingUp className="text-orange-600" size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Filter */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4">
                  <Calendar className="text-gray-600" size={20} />
                  <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Chart */}
              {filteredData.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Stress Level Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="level" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8">
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Stress Records */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Stress Records</h3>
                </div>
                {filteredData.length === 0 ? (
                  <div className="p-8 text-center">
                    <Clock className="mx-auto text-gray-400" size={48} />
                    <h3 className="text-xl font-semibold text-gray-600 mt-4">No Records for Selected Date</h3>
                    <p className="text-gray-500">Try selecting a different date to view stress records.</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-200">
                      {paginatedData.map((record, index) => {
                        const statusBadge = getStatusBadge(record.stress_status);
                        const levelBadge = getLevelBadge(record.stress_level);
                        const StatusIcon = statusBadge.icon;
                        return (
                          <div
                            key={record.id || index}
                            className="p-6 hover:bg-gray-50 transition-colors group relative"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`p-2 rounded-lg ${statusBadge.className}`}>
                                  <StatusIcon size={20} />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-3">
                                    <span className="font-semibold text-gray-900">{record.stress_status}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelBadge.className} ${levelBadge.pulse ? 'animate-pulse' : ''}`}>
                                      {record.stress_level}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                    <div className="flex items-center space-x-1">
                                      <Calendar size={14} />
                                      <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Clock size={14} />
                                      <span>{formatTime(record.timestamp)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-500 font-medium">Faculty:</span>
                                <span className="bg-gradient-to-r from-red-100 to-red-200 px-3 py-1 rounded-lg font-mono font-bold text-red-800">
                                  {record.name}
                                </span>
                                <span className="text-sm text-gray-500 font-medium">ID:</span>
                                <span className="bg-gradient-to-r from-red-100 to-red-200 px-3 py-1 rounded-lg font-mono font-bold text-red-800">
                                  {record.id}
                                </span>
                              </div>
                            </div>
                            {/* Hover effect indicator */}
                            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-red-500 to-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-4 py-4">
                        <button
                          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Prev
                        </button>
                        <span className="text-sm text-gray-700">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default HODFacultyStressLevel; 