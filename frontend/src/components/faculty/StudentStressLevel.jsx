import React, { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import {
  Search,
  Users,
  AlertTriangle,
  Shield,
  TrendingUp,
  Moon,
  Sun,
  Eye,
  Heart,
  Brain,
  Activity,
  Zap,
  Target,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  X,
  Calendar,
  Clock,
  Smile,
  Frown,
  Meh,
  ArrowLeft,
  User,
  BarChart3,
} from "lucide-react";

const statusColors = {
  "At Risk": "#EF4444",
  "Stressed": "#F59E0B",
  "Stable": "#10B981",
  "Normal": "#10B981",
  "Critical": "#DC2626",
  "Warning": "#F59E0B",
};

const statusIcons = {
  "At Risk": AlertTriangle,
  "Stressed": Activity,
  "Stable": Shield,
  "Normal": Shield,
  "Critical": AlertTriangle,
  "Warning": Activity,
};

const StudentStressDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [stressData, setStressData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [filterStatus, setFilterStatus] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const fetchRef = useRef(false);

  // Fetch data from the backend
  useEffect(() => {
    if (fetchRef.current) return;
    fetchRef.current = true;

    const fetchStressData = async () => {
      try {
        const response = await fetch('http://69.62.83.14:9000/api/faculty/student-stress-level', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stress data');
        }
        const data = await response.json();

        // Transform the data to match the component's expected property names
        const transformedData = data
          .map(student => ({
            id: student.id,
            name: student.name,
            rollNo: student.erpid,
            erpid: student.erpid,
            score: Math.round(parseFloat(student.confidence_score) * 100),
            confidence_score: student.confidence_score,
            status: student.stress_status,
            stress_status: student.stress_status,
            timestamp: student.timestamp,
            trend: 'stable'
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by timestamp descending

        setStressData(transformedData);
        setError(null);
      } catch (error) {
        console.error('Error fetching stress data:', error);
        setError(error.message);
        setStressData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStressData();
  }, []);

  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [stressData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('http://69.62.83.14:9000/api/faculty/student-stress-level', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh stress data');
      }
      const data = await response.json();

      const transformedData = data
        .map(student => ({
          id: student.id,
          name: student.name,
          rollNo: student.erpid,
          erpid: student.erpid,
          score: Math.round(parseFloat(student.confidence_score) * 100),
          confidence_score: student.confidence_score,
          status: student.stress_status,
          stress_status: student.stress_status,
          timestamp: student.timestamp,
          trend: 'stable'
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setStressData(transformedData);
      setAnimationKey(prev => prev + 1);
      setError(null);
    } catch (error) {
      console.error('Error refreshing stress data:', error);
      setError(error.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get unique students
  const getUniqueStudents = () => {
    const studentMap = new Map();
    
    stressData.forEach(entry => {
      const key = entry.erpid;
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          erpid: entry.erpid,
          name: entry.name,
          latestEntry: entry,
          totalEntries: 1,
          statuses: [entry.status]
        });
      } else {
        const existing = studentMap.get(key);
        existing.totalEntries++;
        existing.statuses.push(entry.status);
        // Keep the latest entry (assuming data is already sorted by timestamp desc)
        if (new Date(entry.timestamp) > new Date(existing.latestEntry.timestamp)) {
          existing.latestEntry = entry;
        }
      }
    });

    return Array.from(studentMap.values());
  };

  // Get all entries for a specific student
  const getStudentEntries = (erpid) => {
    return stressData
      .filter(entry => entry.erpid === erpid)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const uniqueStudents = getUniqueStudents();
  
  const filteredStudents = uniqueStudents.filter((student) => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.erpid?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || student.latestEntry.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Calculate status counts from unique students
  const statusCounts = uniqueStudents.reduce((acc, student) => {
    const status = student.latestEntry.status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([status, value]) => ({
    name: status,
    value,
  }));

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const themeClass = isDarkMode
    ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white"
    : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-900";

  const cardClass = isDarkMode
    ? "bg-slate-800/50 backdrop-blur-sm border border-slate-700/50"
    : "bg-white/70 backdrop-blur-sm border border-white/50";

  const inputClass = isDarkMode
    ? "bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
    : "bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500";

  const uniqueStatuses = ["All", ...Object.keys(statusCounts)];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-purple-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-t-4 border-b-4 border-pink-500 mx-auto animate-spin animation-delay-1000"></div>
          </div>
          <div className="text-2xl text-white animate-pulse font-semibold">Loading Dashboard...</div>
          <div className="text-purple-300 mt-2">Analyzing stress data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="text-center">
          <AlertTriangle className="h-20 w-20 text-red-400 mx-auto mb-6 animate-bounce" />
          <div className="text-2xl text-red-400 font-bold mb-2">Error Loading Data</div>
          <div className="text-red-300">{error}</div>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300 transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Student Detail View
  if (viewMode === 'detail' && selectedStudent) {
    const studentEntries = getStudentEntries(selectedStudent);
    const studentInfo = uniqueStudents.find(s => s.erpid === selectedStudent);
    
    if (!studentInfo) {
      setViewMode('list');
      setSelectedStudent(null);
      return null;
    }

    // Prepare chart data for the selected student
    const chartData = studentEntries.map((entry, index) => ({
      entry: `Entry ${studentEntries.length - index}`,
      score: entry.score,
      timestamp: new Date(entry.timestamp).toLocaleString(),
      status: entry.status,
      fullTimestamp: entry.timestamp
    })).reverse(); // Reverse to show chronological order

    return (
      <div className={`min-h-screen transition-all duration-500 ${themeClass}`}>
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-8 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="relative z-10 p-6">
          {/* Header with Back Button */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => {
                setViewMode('list');
                setSelectedStudent(null);
              }}
              className={`mr-4 p-3 rounded-xl transition-all duration-300 hover:scale-105 ${cardClass}`}
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-2xl mr-4 shadow-xl">
                {studentInfo.name?.charAt(0) || 'N'}
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  {studentInfo.name}
                </h1>
                <p className="text-xl opacity-80">ERP ID: {studentInfo.erpid}</p>
                <p className="text-sm opacity-60">{studentEntries.length} entries tracked</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`p-6 rounded-2xl shadow-xl ${cardClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Latest Score</p>
                  <p className="text-3xl font-bold text-purple-400">{studentInfo.latestEntry.score}%</p>
                </div>
                <Target className="h-10 w-10 text-purple-400" />
              </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-xl ${cardClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Current Status</p>
                  <p className="text-xl font-bold" style={{ color: statusColors[studentInfo.latestEntry.status] }}>
                    {studentInfo.latestEntry.status}
                  </p>
                </div>
                <Activity className="h-10 w-10" style={{ color: statusColors[studentInfo.latestEntry.status] }} />
              </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-xl ${cardClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Total Entries</p>
                  <p className="text-3xl font-bold text-green-400">{studentEntries.length}</p>
                </div>
                <BarChart3 className="h-10 w-10 text-green-400" />
              </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-xl ${cardClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Last Updated</p>
                  <p className="text-lg font-bold text-blue-400">
                    {formatTimestamp(studentInfo.latestEntry.timestamp)}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Trend Chart */}
            <div className={`p-8 rounded-2xl shadow-xl ${cardClass}`}>
              <div className="flex items-center mb-6">
                <TrendingUp className="h-6 w-6 text-purple-400 mr-3" />
                <h3 className="text-xl font-semibold">Confidence Score Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="entry" 
                    tick={{ fill: isDarkMode ? "#E5E7EB" : "#374151", fontSize: 11 }}
                  />
                  <YAxis 
                    tick={{ fill: isDarkMode ? "#E5E7EB" : "#374151" }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                    }}
                    formatter={(value, name) => [`${value}%`, "Confidence"]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return `${label} - ${payload[0].payload.timestamp}`;
                      }
                      return label;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution */}
            <div className={`p-8 rounded-2xl shadow-xl ${cardClass}`}>
              <div className="flex items-center mb-6">
                <Target className="h-6 w-6 text-blue-400 mr-3" />
                <h3 className="text-xl font-semibold">Status History</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(
                  studentEntries.reduce((acc, entry) => {
                    acc[entry.status] = (acc[entry.status] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: statusColors[status] || '#6B7280' }}
                      ></div>
                      <span>{status}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm opacity-70 mr-2">{count} times</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            backgroundColor: statusColors[status] || '#6B7280',
                            width: `${(count / studentEntries.length) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Entries Table */}
          <div className={`rounded-2xl shadow-xl overflow-hidden ${cardClass}`}>
            <div className="p-6 border-b border-gray-200/20">
              <h3 className="text-xl font-semibold">All Entries</h3>
              <p className="text-sm opacity-70">Complete history of stress assessments</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50/50'}`}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Confidence</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Time Ago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/20">
                  {studentEntries.map((entry, index) => (
                    <tr key={entry.id} className="hover:bg-purple-500/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold">{entry.score}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                backgroundColor: entry.score >= 70 ? '#10B981' : entry.score >= 50 ? '#F59E0B' : '#EF4444',
                                width: `${entry.score}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                          style={{ 
                            backgroundColor: `${statusColors[entry.status] || '#6B7280'}20`,
                            color: statusColors[entry.status] || '#6B7280',
                            border: `1px solid ${statusColors[entry.status] || '#6B7280'}40`
                          }}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm opacity-70">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className={`min-h-screen transition-all duration-500 ${themeClass}`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Brain className="h-16 w-16 text-purple-400 mr-4 animate-bounce" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Stress Analytics
              </h1>
              <p className="text-xl opacity-80 mt-2">Individual student monitoring system</p>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-6 text-sm opacity-70">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {uniqueStudents.length} students monitored
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 animate-slide-up">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or ERP ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-12 pr-4 py-4 w-full rounded-2xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 shadow-lg ${inputClass}`}
            />
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-4 rounded-2xl border transition-all duration-300 hover:scale-105 shadow-lg flex items-center ${cardClass}`}
              >
                <Filter className="h-5 w-5 mr-2" />
                Filter: {filterStatus}
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {showFilters && (
                <div className={`absolute top-full mt-2 right-0 rounded-xl shadow-xl border overflow-hidden z-10 animate-fade-in ${cardClass}`}>
                  {uniqueStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setFilterStatus(status);
                        setShowFilters(false);
                      }}
                      className={`block w-full text-left px-4 py-3 hover:bg-purple-500/20 transition-colors ${
                        filterStatus === status ? 'bg-purple-500/30' : ''
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`px-6 py-4 rounded-2xl border transition-all duration-300 hover:scale-105 shadow-lg ${cardClass}`}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-6 py-4 rounded-2xl border transition-all duration-300 hover:scale-105 shadow-lg ${cardClass}`}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(statusCounts).map(([status, count], index) => {
            const Icon = statusIcons[status] || Activity;
            const color = statusColors[status] || "#6B7280";
            
            return (
              <div
                key={status}
                className={`p-6 rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105 animate-fade-in ${cardClass}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="p-3 rounded-xl mr-3"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon className="h-6 w-6" style={{ color }} />
                    </div>
                    <h3 className="text-lg font-semibold">{status}</h3>
                  </div>
                  <div className="text-3xl font-bold" style={{ color }}>
                    {count}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-1000"
                    style={{
                      backgroundColor: color,
                      width: `${uniqueStudents.length > 0 ? (count / uniqueStudents.length) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm opacity-70 mt-3">
                  {uniqueStudents.length > 0 ? ((count / uniqueStudents.length) * 100).toFixed(1) : 0}% of students
                </p>
              </div>
            );
          })}
        </div>

        {/* Students List */}
        <div className={`rounded-2xl shadow-xl overflow-hidden transition-all duration-500 ${cardClass}`}>
          <div className="p-6 border-b border-gray-200/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Student Stress Levels</h3>
                <p className="text-sm opacity-70">Click on any student to view detailed analytics</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm opacity-70">Showing {filteredStudents.length} of {uniqueStudents.length}</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50/50'}`}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">ERP ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Latest Score</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/20">
                {filteredStudents.map((student, index) => (
                  <tr 
                    key={student.erpid} 
                    className="hover:bg-purple-500/10 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedStudent(student.erpid);
                      setViewMode('detail');
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm mr-4">
                          {student.name?.charAt(0) || 'N'}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{student.name}</div>
                          <div className="text-sm opacity-70">{student.totalEntries} entries</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {student.erpid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold">{student.latestEntry.score}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              backgroundColor: student.latestEntry.score >= 70 ? '#10B981' : student.latestEntry.score >= 50 ? '#F59E0B' : '#EF4444',
                              width: `${student.latestEntry.score}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                        style={{ 
                          backgroundColor: `${statusColors[student.latestEntry.status] || '#6B7280'}20`,
                          color: statusColors[student.latestEntry.status] || '#6B7280',
                          border: `1px solid ${statusColors[student.latestEntry.status] || '#6B7280'}40`
                        }}
                      >
                        {student.latestEntry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm opacity-70">
                      {formatTimestamp(student.latestEntry.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student.erpid);
                          setViewMode('detail');
                        }}
                        className="p-2 rounded-lg hover:bg-purple-500/20 transition-colors"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredStudents.length === 0 && (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No students found</h3>
              <p className="text-sm opacity-70">
                {searchTerm ? 'Try adjusting your search terms' : 'No students match the current filter'}
              </p>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Pie Chart */}
          <div className={`p-8 rounded-2xl shadow-xl ${cardClass}`}>
            <div className="flex items-center mb-6">
              <Target className="h-6 w-6 text-purple-400 mr-3" />
              <h3 className="text-xl font-semibold">Status Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.name] || "#6B7280"} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className={`p-8 rounded-2xl shadow-xl ${cardClass}`}>
            <div className="flex items-center mb-6">
              <BarChart3 className="h-6 w-6 text-blue-400 mr-3" />
              <h3 className="text-xl font-semibold">Score Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pieData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: isDarkMode ? "#E5E7EB" : "#374151", fontSize: 11 }}
                />
                <YAxis 
                  tick={{ fill: isDarkMode ? "#E5E7EB" : "#374151" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                  }}
                />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentStressDashboard;