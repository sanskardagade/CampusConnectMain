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
            MorningSlot: 'neutral', // Default value since not in backend
            AfternoonSlot: 'neutral', // Default value since not in backend
            score: Math.round(parseFloat(student.confidence_score) * 100), // Convert to percentage
            confidence_score: student.confidence_score,
            status: student.stress_status,
            stress_status: student.stress_status,
            timestamp: student.timestamp,
            trend: 'stable' // Default value
          }))
          .sort((a, b) => a.id - b.id); // Sort by ID in ascending order

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

      // Transform the data to match the component's expected property names
      const transformedData = data
        .map(student => ({
          id: student.id,
          name: student.name,
          rollNo: student.erpid,
          erpid: student.erpid,
          MorningSlot: 'neutral',
          AfternoonSlot: 'neutral',
          score: Math.round(parseFloat(student.confidence_score) * 100),
          confidence_score: student.confidence_score,
          status: student.stress_status,
          stress_status: student.stress_status,
          timestamp: student.timestamp,
          trend: 'stable'
        }))
        .sort((a, b) => a.id - b.id);

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

  const filteredStudents = stressData.filter((student) => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.erpid?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || student.stress_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusCounts = stressData.reduce((acc, student) => {
    const status = student.stress_status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([status, value]) => ({
    name: status,
    value,
  }));

  // Convert confidence score to percentage for chart display
  const chartData = filteredStudents.map((student) => ({
    name: student.name?.split(' ')[0] || student.erpid,
    score: Math.round(parseFloat(student.confidence_score || 0) * 100),
    fullName: student.name,
    erpid: student.erpid,
    status: student.stress_status,
    timestamp: student.timestamp,
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

  return (
    <div className={`min-h-screen transition-all duration-500 ${themeClass}`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Enhanced Header */}
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
              <p className="text-xl opacity-80 mt-2">Real-time wellbeing monitoring system</p>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-6 text-sm opacity-70">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {stressData.length} individuals monitored
            </div>
          </div>
        </div>

        {/* Enhanced Controls */}
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

        {/* Status Cards */}
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
                      width: `${stressData.length > 0 ? (count / stressData.length) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm opacity-70 mt-3">
                  {stressData.length > 0 ? ((count / stressData.length) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
          {/* Confidence Score Bar Chart */}
          <div className={`p-8 rounded-2xl shadow-xl transition-all duration-500 hover:shadow-2xl ${cardClass}`}>
            <div className="flex items-center mb-6">
              <TrendingUp className="h-6 w-6 text-purple-400 mr-3" />
              <h3 className="text-xl font-semibold">Confidence Scores</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData.slice(0, 10)} key={animationKey}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: isDarkMode ? "#E5E7EB" : "#374151", fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
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
                />
                <Bar 
                  dataKey="score" 
                  fill="url(#barGradient)" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={`p-8 rounded-2xl shadow-xl transition-all duration-500 hover:shadow-2xl ${cardClass}`}>
            <div className="flex items-center mb-6">
              <Target className="h-6 w-6 text-blue-400 mr-3" />
              <h3 className="text-xl font-semibold">Status Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  dataKey="value"
                  animationDuration={1000}
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

          {/* Trend Analysis Area Chart */}
          <div className={`p-8 rounded-2xl shadow-xl transition-all duration-500 hover:shadow-2xl ${cardClass}`}>
            <div className="flex items-center mb-6">
              <Activity className="h-6 w-6 text-green-400 mr-3" />
              <h3 className="text-xl font-semibold">Confidence Trends</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData}>
                <XAxis 
                  dataKey="name" 
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
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#8B5CF6"
                  fill="url(#areaGradient)"
                  strokeWidth={3}
                  animationDuration={1500}
                />
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enhanced Student Table */}
        <div className={`rounded-2xl shadow-xl overflow-hidden transition-all duration-500 ${cardClass}`}>
          <div className="p-8 border-b border-gray-200/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-purple-400 mr-3" />
                <h3 className="text-2xl font-semibold">Individual Analysis</h3>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm opacity-70">
                  Showing {filteredStudents.length} of {stressData.length} individuals
                </span>
                <button className="p-2 rounded-lg hover:bg-purple-500/20 transition-colors">
                  <Download className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50/50'}`}>
                <tr>
                  <th className="px-8 py-6 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                  <th className="px-8 py-6 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                  <th className="px-8 py-6 text-left text-xs font-medium uppercase tracking-wider">ERP ID</th>
                  <th className="px-8 py-6 text-left text-xs font-medium uppercase tracking-wider">Confidence</th>
                  <th className="px-8 py-6 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-8 py-6 text-left text-xs font-medium uppercase tracking-wider">Last Update</th>
                  <th className="px-8 py-6 text-left text-xs font-medium uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/20">
                {filteredStudents.map((student, index) => (
                  <tr 
                    key={student.id} 
                    className={`transition-all duration-300 hover:bg-purple-500/10 animate-fade-in`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                      #{student.id}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-lg mr-4 shadow-lg">
                          {student.name?.charAt(0) || 'N'}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{student.name || 'Unknown'}</div>
                          <div className="text-xs opacity-60">ID: {student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {student.erpid || student.rollNo}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-bold">{student.score}%</div>
                        <div className="w-20 bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all duration-1000"
                            style={{
                              backgroundColor: student.score >= 70 ? '#10B981' : student.score >= 50 ? '#F59E0B' : '#EF4444',
                              width: `${student.score}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span 
                        className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
                        style={{ 
                          backgroundColor: `${statusColors[student.status] || '#6B7280'}20`,
                          color: statusColors[student.status] || '#6B7280',
                          border: `1px solid ${statusColors[student.status] || '#6B7280'}40`
                        }}
                      >
                        <div 
                          className="w-2 h-2 rounded-full mr-2 animate-pulse"
                          style={{ backgroundColor: statusColors[student.status] || '#6B7280' }}
                        ></div>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm opacity-70">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTimestamp(student.timestamp)}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                        className="text-purple-400 hover:text-purple-300 transition-all duration-200 hover:scale-110 transform p-2 rounded-lg hover:bg-purple-500/20"
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
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4 opacity-50" />
              <div className="text-xl text-gray-400 mb-2">No data found</div>
              <div className="text-sm opacity-60">
                {stressData.length === 0 ? 'No stress data available' : 'Try adjusting your search or filter criteria'}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className={`max-w-3xl w-full rounded-3xl shadow-2xl p-8 transform transition-all duration-300 scale-100 ${cardClass}`}>
              {(() => {
                const student = stressData.find(s => s.id === selectedStudent);
                if (!student) return null;
                
                return (
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-2xl mr-6 shadow-xl">
                          {student.name?.charAt(0) || 'N'}
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold mb-1">{student.name || 'Unknown'}</h3>
                          <p className="text-lg opacity-70">ERP ID: {student.erpid}</p>
                          <p className="text-sm opacity-50">ID: #{student.id}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedStudent(null)}
                        className="text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 transform p-3 rounded-full hover:bg-red-500/20"
                      >
                        <X className="h-8 w-8" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                        <Target className="h-10 w-10 mx-auto mb-3 text-blue-400" />
                        <div className="text-sm opacity-70 mb-1">Confidence Score</div>
                        <div className="text-3xl font-bold text-blue-400">
                          {student.score}%
                        </div>
                      </div>
                      
                      <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                        <Activity className="h-10 w-10 mx-auto mb-3 text-purple-400" />
                        <div className="text-sm opacity-70 mb-1">Current Status</div>
                        <div className="text-xl font-bold" style={{ color: statusColors[student.status] || '#6B7280' }}>
                          {student.status}
                        </div>
                      </div>
                      
                      <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30">
                        <Clock className="h-10 w-10 mx-auto mb-3 text-green-400" />
                        <div className="text-sm opacity-70 mb-1">Last Updated</div>
                        <div className="text-lg font-bold text-green-400">
                          {formatTimestamp(student.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg opacity-70">Stress Assessment</span>
                        <span className="text-3xl font-bold">{student.score}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                        <div
                          className="h-4 rounded-full transition-all duration-1000 shadow-lg"
                          style={{
                            backgroundColor: student.score >= 70 ? '#10B981' : student.score >= 50 ? '#F59E0B' : '#EF4444',
                            width: `${student.score}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs opacity-60">
                        <span>Low Risk</span>
                        <span>Moderate</span>
                        <span>High Risk</span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <span 
                        className="inline-flex items-center px-8 py-4 rounded-2xl text-xl font-medium border-2"
                        style={{ 
                          backgroundColor: `${statusColors[student.status] || '#6B7280'}20`,
                          color: statusColors[student.status] || '#6B7280',
                          borderColor: `${statusColors[student.status] || '#6B7280'}40`
                        }}
                      >
                        <div 
                          className="w-4 h-4 rounded-full mr-3 animate-pulse"
                          style={{ backgroundColor: statusColors[student.status] || '#6B7280' }}
                        ></div>
                        Current Status: {student.status}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Enhanced Footer */}
        <div className="mt-16 text-center opacity-70">
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Last updated: {new Date().toLocaleString()}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Monitoring {stressData.length} individuals
            </div>
            <div className="flex items-center">
              <Activity className="h-4 w-4 mr-1" />
              System Status: Active
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        /* Smooth transitions for all interactive elements */
        * {
          transition: all 0.2s ease-in-out;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }

        /* Hover effects */
        .hover-glow:hover {
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
        }
        
        /* Loading animation for refresh button */
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StudentStressDashboard;