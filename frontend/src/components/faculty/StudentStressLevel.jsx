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
  "At Risk": "#DC2626",
  "Stressed": "#EA580C",
  "Stable": "#16A34A",
  "Normal": "#16A34A",
  "Critical": "#B91C1C",
  "Warning": "#D97706",
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
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode
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
        const response = await fetch('http://localhost:5000/api/faculty/student-stress-level', {
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
    ? "bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white"
    : "bg-gradient-to-br from-red-50 via-white to-red-50 text-gray-900";

  const cardClass = isDarkMode
    ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700/50"
    : "bg-white/90 backdrop-blur-sm border border-gray-200/80";

  const inputClass = isDarkMode
    ? "bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
    : "bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500";

  const uniqueStatuses = ["All", ...Object.keys(statusCounts)];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-red-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-t-4 border-b-4 border-pink-500 mx-auto animate-spin animation-delay-1000"></div>
          </div>
          <div className="text-2xl text-gray-800 animate-pulse font-semibold">Loading Dashboard...</div>
          <div className="text-red-400 mt-2">Analyzing stress data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
        <div className="text-center">
          <AlertTriangle className="h-20 w-20 text-red-600 mx-auto mb-6 animate-bounce" />
          <div className="text-2xl text-red-600 font-bold mb-2">Error Loading Data</div>
          <div className="text-red-500">{error}</div>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
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
          <div className="absolute -top-4 -right-4 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-8 -left-4 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
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
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl mr-4 shadow-xl">
                {studentInfo.name?.charAt(0) || 'N'}
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-red-400 bg-clip-text text-transparent">
                  {studentInfo.name}
                </h1>
                <p className="text-xl text-gray-700">ERP ID: {studentInfo.erpid}</p>
                <p className="text-sm text-gray-500">{studentEntries.length} entries tracked</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`p-6 rounded-2xl shadow-xl ${cardClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Latest Score</p>
                  <p className="text-3xl font-bold text-red-600">{studentInfo.latestEntry.score}%</p>
                </div>
                <Target className="h-10 w-10 text-red-600" />
              </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-xl ${cardClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Status</p>
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
                  <p className="text-sm text-gray-600">Total Entries</p>
                  <p className="text-3xl font-bold text-green-600">{studentEntries.length}</p>
                </div>
                <BarChart3 className="h-10 w-10 text-green-600" />
              </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-xl ${cardClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatTimestamp(studentInfo.latestEntry.timestamp)}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Trend Chart */}
            <div className={`p-8 rounded-2xl shadow-xl ${cardClass}`}>
              <div className="flex items-center mb-6">
                <TrendingUp className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-800">Confidence Score Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="entry" 
                    tick={{ fill: "#374151", fontSize: 11 }}
                  />
                  <YAxis 
                    tick={{ fill: "#374151" }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#FFFFFF",
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
                    stroke="#DC2626"
                    strokeWidth={3}
                    dot={{ fill: '#DC2626', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#DC2626', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution */}
            <div className={`p-8 rounded-2xl shadow-xl ${cardClass}`}>
              <div className="flex items-center mb-6">
                <Target className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-800">Status History</h3>
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
                      <span className="text-gray-700">{status}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">{count} times</span>
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
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">All Entries</h3>
              <p className="text-sm text-gray-500">Complete history of stress assessments</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Ago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {studentEntries.map((entry, index) => (
                    <tr key={entry.id} className="hover:bg-red-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold text-gray-900">{entry.score}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                backgroundColor: entry.score >= 70 ? '#16A34A' : entry.score >= 50 ? '#D97706' : '#DC2626',
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
        <div className="absolute -top-4 -right-4 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 -left-4 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Brain className="h-16 w-16 text-red-600 mr-4 animate-bounce" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-red-400 bg-clip-text text-transparent">
                Stress Analytics
              </h1>
              <p className="text-xl text-gray-700 mt-2">Individual student monitoring system</p>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-gray-500" />
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1 text-gray-500" />
              {uniqueStudents.length} faculty monitored
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
              className={`pl-12 pr-4 py-4 w-full rounded-2xl border focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 shadow-lg ${inputClass}`}
            />
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-4 rounded-2xl border transition-all duration-300 hover:scale-105 shadow-lg flex items-center ${cardClass}`}
              >
                <Filter className="h-5 w-5 mr-2 text-gray-600" />
                <span className="text-gray-700">Filter: {filterStatus}</span>
                <ChevronDown className={`h-4 w-4 ml-2 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
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
                      className={`block w-full text-left px-4 py-3 hover:bg-red-50 transition-colors text-gray-700 ${
                        filterStatus === status ? 'bg-red-100' : ''
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
              <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-6 py-4 rounded-2xl border transition-all duration-300 hover:scale-105 shadow-lg ${cardClass}`}
            >
              {isDarkMode ? <Sun className="h-5 w-5 text-gray-600" /> : <Moon className="h-5 w-5 text-gray-600" />}
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
                    <h3 className="text-lg font-semibold text-gray-800">{status}</h3>
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
                <p className="text-sm text-gray-500 mt-3">
                  {uniqueStudents.length > 0 ? ((count / uniqueStudents.length) * 100).toFixed(1) : 0}% of students
                </p>
              </div>
            );
          })}
        </div>

        {/* Students List */}
        <div className={`rounded-2xl shadow-xl overflow-hidden transition-all duration-500 ${cardClass}`}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Faculty Stress Levels</h3>
                <p className="text-sm text-gray-500">Click on any student to view detailed analytics</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Showing {filteredStudents.length} of {uniqueStudents.length}</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ERP ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latest Score</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student, index) => (
                  <tr 
                    key={student.erpid} 
                    className="hover:bg-red-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedStudent(student.erpid);
                      setViewMode('detail');
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm mr-4">
                          {student.name?.charAt(0) || 'N'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.totalEntries} entries</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.erpid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-900">{student.latestEntry.score}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              backgroundColor: student.latestEntry.score >= 70 ? '#16A34A' : student.latestEntry.score >= 50 ? '#D97706' : '#DC2626',
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(student.latestEntry.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student.erpid);
                          setViewMode('detail');
                        }}
                        className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Eye className="h-5 w-5 text-gray-600" />
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
              <h3 className="text-lg font-medium text-gray-800 mb-2">No students found</h3>
              <p className="text-sm text-gray-500">
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
              <Target className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-800">Status Distribution</h3>
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
                    backgroundColor: "#FFFFFF",
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
              <BarChart3 className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-800">Score Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pieData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "#374151", fontSize: 11 }}
                />
                <YAxis 
                  tick={{ fill: "#374151" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#FFFFFF",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                  }}
                />
                <Bar dataKey="value" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentStressDashboard;

// import React, { useState, useEffect, useRef } from "react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";
// import {
//   Search,
//   Users,
//   AlertTriangle,
//   Shield,
//   TrendingUp,
//   Eye,
//   Activity,
//   Target,
//   Filter,
//   RefreshCw,
//   ChevronDown,
//   X,
//   Clock,
// } from "lucide-react";

// const statusColors = {
//   "At Risk": "#DC2626",
//   "Stressed": "#EF4444",
//   "Stable": "#059669",
//   "Normal": "#059669",
//   "Critical": "#B91C1C",
//   "Warning": "#DC2626",
// };

// const statusIcons = {
//   "At Risk": AlertTriangle,
//   "Stressed": Activity,
//   "Stable": Shield,
//   "Normal": Shield,
//   "Critical": AlertTriangle,
//   "Warning": Activity,
// };

// const StudentStressDashboard = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [stressData, setStressData] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedStudent, setSelectedStudent] = useState(null);
//   const [filterStatus, setFilterStatus] = useState("All");
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [showFilters, setShowFilters] = useState(false);
//   const fetchRef = useRef(false);

//   // Fetch data from the backend
//   useEffect(() => {
//     if (fetchRef.current) return;
//     fetchRef.current = true;

//     const fetchStressData = async () => {
//       try {
//         const response = await fetch('http://localhost:5000/api/faculty/student-stress-level', {
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('token')}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         if (!response.ok) {
//           throw new Error('Failed to fetch stress data');
//         }
//         const data = await response.json();

//         // Transform the data to match the component's expected property names
//         const transformedData = data
//           .map(student => ({
//             id: student.id,
//             name: student.name,
//             rollNo: student.erpid,
//             erpid: student.erpid,
//             score: Math.round(parseFloat(student.confidence_score) * 100),
//             confidence_score: student.confidence_score,
//             status: student.stress_status,
//             stress_status: student.stress_status,
//             timestamp: student.timestamp,
//           }))
//           .sort((a, b) => a.id - b.id);

//         setStressData(transformedData);
//         setError(null);
//       } catch (error) {
//         console.error('Error fetching stress data:', error);
//         setError(error.message);
//         setStressData([]);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchStressData();
//   }, []);

//   const handleRefresh = async () => {
//     setIsRefreshing(true);
//     try {
//       const response = await fetch('http://localhost:5000/api/faculty/student-stress-level', {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         throw new Error('Failed to refresh stress data');
//       }
//       const data = await response.json();

//       const transformedData = data
//         .map(student => ({
//           id: student.id,
//           name: student.name,
//           rollNo: student.erpid,
//           erpid: student.erpid,
//           score: Math.round(parseFloat(student.confidence_score) * 100),
//           confidence_score: student.confidence_score,
//           status: student.stress_status,
//           stress_status: student.stress_status,
//           timestamp: student.timestamp,
//         }))
//         .sort((a, b) => a.id - b.id);

//       setStressData(transformedData);
//       setError(null);
//     } catch (error) {
//       console.error('Error refreshing stress data:', error);
//       setError(error.message);
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   const filteredStudents = stressData.filter((student) => {
//     const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          student.erpid?.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filterStatus === "All" || student.stress_status === filterStatus;
//     return matchesSearch && matchesFilter;
//   });

//   const statusCounts = stressData.reduce((acc, student) => {
//     const status = student.stress_status || "Unknown";
//     acc[status] = (acc[status] || 0) + 1;
//     return acc;
//   }, {});

//   const pieData = Object.entries(statusCounts).map(([status, value]) => ({
//     name: status,
//     value,
//   }));

//   const chartData = filteredStudents.map((student) => ({
//     name: student.name?.split(' ')[0] || student.erpid,
//     score: Math.round(parseFloat(student.confidence_score || 0) * 100),
//     fullName: student.name,
//     erpid: student.erpid,
//     status: student.stress_status,
//     timestamp: student.timestamp,
//   }));

//   const formatTimestamp = (timestamp) => {
//     if (!timestamp) return "Unknown";
//     const date = new Date(timestamp);
//     const now = new Date();
//     const diffMs = now - date;
//     const diffMins = Math.floor(diffMs / 60000);
    
//     if (diffMins < 1) return "Just now";
//     if (diffMins < 60) return `${diffMins} mins ago`;
//     if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
//     return date.toLocaleDateString();
//   };

//   const uniqueStatuses = ["All", ...Object.keys(statusCounts)];

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-red-50">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
//           <div className="text-xl text-red-800 font-semibold">Loading Dashboard...</div>
//           <div className="text-red-600 mt-2">Analyzing stress data...</div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-red-50">
//         <div className="text-center">
//           <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
//           <div className="text-2xl text-red-800 font-bold mb-2">Error Loading Data</div>
//           <div className="text-red-600 mb-4">{error}</div>
//           <button 
//             onClick={handleRefresh}
//             className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-red-50 text-gray-900">
//       <div className="p-6">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="flex items-center justify-center mb-4">
//             <AlertTriangle className="h-12 w-12 text-red-600 mr-3" />
//             <div className="text-left">
//               <h1 className="text-4xl font-bold text-red-800">Student Stress Dashboard</h1>
//               <p className="text-lg text-red-600 mt-1">Real-time wellbeing monitoring system</p>
//             </div>
//           </div>
//           <div className="flex items-center justify-center space-x-6 text-sm text-red-700">
//             <div className="flex items-center">
//               <Clock className="h-4 w-4 mr-1" />
//               Last updated: {new Date().toLocaleTimeString()}
//             </div>
//             <div className="flex items-center">
//               <Users className="h-4 w-4 mr-1" />
//               {stressData.length} students monitored
//             </div>
//           </div>
//         </div>

//         {/* Controls */}
//         <div className="flex flex-col lg:flex-row gap-4 mb-8">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search by name or ERP ID..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10 pr-4 py-3 w-full rounded-lg border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
//             />
//           </div>
          
//           <div className="flex gap-3">
//             <div className="relative">
//               <button
//                 onClick={() => setShowFilters(!showFilters)}
//                 className="px-4 py-3 rounded-lg border border-red-200 bg-white hover:bg-red-50 transition-colors flex items-center"
//               >
//                 <Filter className="h-5 w-5 mr-2" />
//                 Filter: {filterStatus}
//                 <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
//               </button>
              
//               {showFilters && (
//                 <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-red-200 overflow-hidden z-10">
//                   {uniqueStatuses.map((status) => (
//                     <button
//                       key={status}
//                       onClick={() => {
//                         setFilterStatus(status);
//                         setShowFilters(false);
//                       }}
//                       className={`block w-full text-left px-4 py-2 hover:bg-red-50 transition-colors ${
//                         filterStatus === status ? 'bg-red-100' : ''
//                       }`}
//                     >
//                       {status}
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
            
//             <button
//               onClick={handleRefresh}
//               disabled={isRefreshing}
//               className="px-4 py-3 rounded-lg border border-red-200 bg-white hover:bg-red-50 transition-colors"
//             >
//               <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
//             </button>
//           </div>
//         </div>

//         {/* Status Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           {Object.entries(statusCounts).map(([status, count]) => {
//             const Icon = statusIcons[status] || Activity;
//             const color = statusColors[status] || "#6B7280";
            
//             return (
//               <div
//                 key={status}
//                 className="p-6 rounded-lg bg-white border border-red-200 shadow-sm"
//               >
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="flex items-center">
//                     <div 
//                       className="p-3 rounded-lg mr-3"
//                       style={{ backgroundColor: `${color}20` }}
//                     >
//                       <Icon className="h-6 w-6" style={{ color }} />
//                     </div>
//                     <h3 className="text-lg font-semibold">{status}</h3>
//                   </div>
//                   <div className="text-3xl font-bold" style={{ color }}>
//                     {count}
//                   </div>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div
//                     className="h-2 rounded-full"
//                     style={{
//                       backgroundColor: color,
//                       width: `${stressData.length > 0 ? (count / stressData.length) * 100 : 0}%`,
//                     }}
//                   ></div>
//                 </div>
//                 <p className="text-sm text-gray-600 mt-2">
//                   {stressData.length > 0 ? ((count / stressData.length) * 100).toFixed(1) : 0}% of total
//                 </p>
//               </div>
//             );
//           })}
//         </div>

//         {/* Charts Section */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//           {/* Confidence Score Bar Chart */}
//           <div className="p-6 rounded-lg bg-white border border-red-200 shadow-sm">
//             <div className="flex items-center mb-4">
//               <TrendingUp className="h-6 w-6 text-red-600 mr-3" />
//               <h3 className="text-xl font-semibold">Confidence Scores</h3>
//             </div>
//             <ResponsiveContainer width="100%" height={300}>
//               <BarChart data={chartData.slice(0, 10)}>
//                 <XAxis 
//                   dataKey="name" 
//                   tick={{ fill: "#374151", fontSize: 12 }}
//                   angle={-45}
//                   textAnchor="end"
//                   height={60}
//                 />
//                 <YAxis 
//                   tick={{ fill: "#374151" }}
//                   domain={[0, 100]}
//                 />
//                 <Tooltip 
//                   contentStyle={{ 
//                     backgroundColor: "#FFFFFF",
//                     border: "1px solid #FCA5A5",
//                     borderRadius: "8px"
//                   }}
//                   formatter={(value) => [`${value}%`, "Confidence"]}
//                 />
//                 <Bar 
//                   dataKey="score" 
//                   fill="#DC2626" 
//                   radius={[4, 4, 0, 0]}
//                 />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Status Distribution Pie Chart */}
//           <div className="p-6 rounded-lg bg-white border border-red-200 shadow-sm">
//             <div className="flex items-center mb-4">
//               <Target className="h-6 w-6 text-red-600 mr-3" />
//               <h3 className="text-xl font-semibold">Status Distribution</h3>
//             </div>
//             <ResponsiveContainer width="100%" height={300}>
//               <PieChart>
//                 <Pie
//                   data={pieData}
//                   cx="50%"
//                   cy="50%"
//                   labelLine={false}
//                   label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//                   outerRadius={100}
//                   dataKey="value"
//                 >
//                   {pieData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={statusColors[entry.name] || "#6B7280"} />
//                   ))}
//                 </Pie>
//                 <Tooltip 
//                   contentStyle={{ 
//                     backgroundColor: "#FFFFFF",
//                     border: "1px solid #FCA5A5",
//                     borderRadius: "8px"
//                   }}
//                 />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Student Table */}
//         <div className="rounded-lg bg-white border border-red-200 shadow-sm overflow-hidden">
//           <div className="p-6 border-b border-red-200">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center">
//                 <Users className="h-6 w-6 text-red-600 mr-3" />
//                 <h3 className="text-2xl font-semibold">Student Details</h3>
//               </div>
//               <span className="text-sm text-gray-600">
//                 Showing {filteredStudents.length} of {stressData.length} students
//               </span>
//             </div>
//           </div>
          
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-red-50">
//                 <tr>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ERP ID</th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Confidence</th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Last Update</th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-red-200">
//                 {filteredStudents.map((student) => (
//                   <tr key={student.id} className="hover:bg-red-25">
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                       #{student.id}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold mr-3">
//                           {student.name?.charAt(0) || 'N'}
//                         </div>
//                         <div>
//                           <div className="text-sm font-medium">{student.name || 'Unknown'}</div>
//                           <div className="text-xs text-gray-500">ID: {student.id}</div>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                         {student.erpid || student.rollNo}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center space-x-3">
//                         <div className="text-lg font-bold">{student.score}%</div>
//                         <div className="w-16 bg-gray-200 rounded-full h-2">
//                           <div
//                             className="h-2 rounded-full"
//                             style={{
//                               backgroundColor: student.score >= 70 ? '#059669' : student.score >= 50 ? '#DC2626' : '#B91C1C',
//                               width: `${student.score}%`,
//                             }}
//                           ></div>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span 
//                         className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
//                         style={{ 
//                           backgroundColor: `${statusColors[student.status] || '#6B7280'}20`,
//                           color: statusColors[student.status] || '#6B7280',
//                         }}
//                       >
//                         <div 
//                           className="w-2 h-2 rounded-full mr-2"
//                           style={{ backgroundColor: statusColors[student.status] || '#6B7280' }}
//                         ></div>
//                         {student.status}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
//                       <div className="flex items-center">
//                         <Clock className="h-4 w-4 mr-1" />
//                         {formatTimestamp(student.timestamp)}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm">
//                       <button
//                         onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
//                         className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-lg hover:bg-red-50"
//                       >
//                         <Eye className="h-5 w-5" />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
          
//           {filteredStudents.length === 0 && (
//             <div className="text-center py-12">
//               <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
//               <div className="text-xl text-gray-600 mb-2">No data found</div>
//               <div className="text-sm text-gray-500">
//                 {stressData.length === 0 ? 'No stress data available' : 'Try adjusting your search or filter criteria'}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Student Detail Modal */}
//         {selectedStudent && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
//               {(() => {
//                 const student = stressData.find(s => s.id === selectedStudent);
//                 if (!student) return null;
                
//                 return (
//                   <div>
//                     <div className="flex items-center justify-between mb-6">
//                       <div className="flex items-center">
//                         <div className="h-16 w-16 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-xl mr-4">
//                           {student.name?.charAt(0) || 'N'}
//                         </div>
//                         <div>
//                           <h3 className="text-2xl font-bold">{student.name || 'Unknown'}</h3>
//                           <p className="text-gray-600">ERP ID: {student.erpid}</p>
//                           <p className="text-sm text-gray-500">ID: #{student.id}</p>
//                         </div>
//                       </div>
//                       <button
//                         onClick={() => setSelectedStudent(null)}
//                         className="text-gray-400 hover:text-gray-600 p-2"
//                       >
//                         <X className="h-6 w-6" />
//                       </button>
//                     </div>
                    
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//                       <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
//                         <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
//                         <div className="text-sm text-gray-600 mb-1">Confidence Score</div>
//                         <div className="text-2xl font-bold text-blue-600">
//                           {student.score}%
//                         </div>
//                       </div>
                      
//                       <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
//                         <Activity className="h-8 w-8 mx-auto mb-2 text-red-600" />
//                         <div className="text-sm text-gray-600 mb-1">Current Status</div>
//                         <div className="text-lg font-bold" style={{ color: statusColors[student.status] || '#6B7280' }}>
//                           {student.status}
//                         </div>
//                       </div>
                      
//                       <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
//                         <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
//                         <div className="text-sm text-gray-600 mb-1">Last Updated</div>
//                         <div className="text-sm font-bold text-green-600">
//                           {formatTimestamp(student.timestamp)}
//                         </div>
//                       </div>
//                     </div>
                    
//                     <div className="mb-6">
//                       <div className="flex items-center justify-between mb-2">
//                         <span className="text-lg font-medium">Stress Assessment</span>
//                         <span className="text-2xl font-bold">{student.score}/100</span>
//                       </div>
//                       <div className="w-full bg-gray-200 rounded-full h-3">
//                         <div
//                           className="h-3 rounded-full"
//                           style={{
//                             backgroundColor: student.score >= 70 ? '#059669' : student.score >= 50 ? '#DC2626' : '#B91C1C',
//                             width: `${student.score}%`,
//                           }}
//                         ></div>
//                       </div>
//                       <div className="flex justify-between text-xs text-gray-500 mt-1">
//                         <span>Low Risk</span>
//                         <span>Moderate</span>
//                         <span>High Risk</span>
//                       </div>
//                     </div>
                    
//                     <div className="text-center">
//                       <span 
//                         className="inline-flex items-center px-6 py-3 rounded-lg text-lg font-medium border-2"
//                         style={{ 
//                           backgroundColor: `${statusColors[student.status] || '#6B7280'}20`,
//                           color: statusColors[student.status] || '#6B7280',
//                           borderColor: `${statusColors[student.status] || '#6B7280'}40`
//                         }}
//                       >
//                         <div 
//                           className="w-3 h-3 rounded-full mr-2"
//                           style={{ backgroundColor: statusColors[student.status] || '#6B7280' }}
//                         ></div>
//                         Current Status: {student.status}
//                       </span>
//                     </div>
//                   </div>
//                 );
//               })()}
//             </div>
//           </div>
//         )}

//         {/* Footer */}
//         <div className="mt-12 text-center text-gray-600">
//           <div className="flex items-center justify-center space-x-8 text-sm">
//             <div className="flex items-center">
//               <Clock className="h-4 w-4 mr-1" />
//               Last updated: {new Date().toLocaleString()}
//             </div>
//             <div className="flex items-center">
//               <Users className="h-4 w-4 mr-1" />
//               Monitoring {stressData.length} students
//             </div>
//             <div className="flex items-center">
//               <Activity className="h-4 w-4 mr-1" />
//               System Status: Active
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StudentStressDashboard;
