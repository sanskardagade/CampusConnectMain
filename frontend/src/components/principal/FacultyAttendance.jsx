import { useState, useEffect, useMemo } from 'react';
import { 
  Users, Calendar, Clock, Activity, Search, RefreshCw, 
  Check, X, AlertTriangle, Shield, Cpu, Globe, 
  Maximize, Minimize, PieChart, BarChart as BarChartIcon,
  Zap, UserCheck, Filter, Download, Eye, EyeOff
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, LineChart, Line
} from 'recharts';

export default function AttendanceTracker({ initialData }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [ipLogs, setIpLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [activeChartType, setActiveChartType] = useState('bar');
  const [showDetails, setShowDetails] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedView, setExpandedView] = useState(false);
  const [facultySearchTerm, setFacultySearchTerm] = useState('');
  
  // COLORS for charts
  const COLORS = ['#4f46e5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Fetch or initialize data when component mounts or initialData changes
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      generateSummaryData(initialData);
      setLoading(false);
    } else {
      setLoading(true);
      const token = localStorage.getItem('token');
      fetch("http://69.62.83.14:9000/api/hod/faculty-log", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error('Network response was not ok');
          }
          return res.json();
        })
        .then(data => {
          setData(data);
          setLoading(false);
          generateSummaryData(data);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to fetch data from server');
          setLoading(false);
        });
    }
  }, [initialData]);

  // Generate summary data from complete dataset
  const generateSummaryData = (data) => {
    if (!data || !Array.isArray(data)) return;

    const summary = {
      totalLogs: data.length,
      totalUsers: new Set(data.map(log => log.person_name)).size,
      totalIPs: new Set(data.map(log => log.camera_ip)).size,
      totalDates: new Set(data.map(log => new Date(log.timestamp).toDateString())).size,
      userActivity: [],
      mostActiveUser: { name: '', logins: 0 },
      ipDistribution: {},
      timeDistribution: {}
    };

    // Group by user
    const userGroups = data.reduce((acc, log) => {
      const userName = log.person_name;
      if (!acc[userName]) {
        acc[userName] = [];
      }
      acc[userName].push(log);
      return acc;
    }, {});

    // Calculate user activity
    Object.entries(userGroups).forEach(([userName, logs]) => {
      const logins = logs.length;
      summary.userActivity.push({ name: userName, logins });
      
      if (logins > summary.mostActiveUser.logins) {
        summary.mostActiveUser = { name: userName, logins };
      }
    });

    // Calculate IP distribution
    data.forEach(log => {
      const ip = log.camera_ip;
      summary.ipDistribution[ip] = (summary.ipDistribution[ip] || 0) + 1;
    });

    // Calculate time distribution (by hour)
    data.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      const hourKey = `${hour}:00`;
      summary.timeDistribution[hourKey] = (summary.timeDistribution[hourKey] || 0) + 1;
    });

    // Sort user activity
    summary.userActivity.sort((a, b) => b.logins - a.logins);
    
    // Convert sets to counts
    summary.totalIPs = summary.totalIPs;
    summary.totalDates = summary.totalDates;
    
    // Format most active user name
    summary.mostActiveUser.name = formatUserName(summary.mostActiveUser.name);
    
    setSummaryData(summary);
  };

  // Get unique users for dropdown and filter based on search
  const filteredUsers = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    const users = [...new Set(data.map(log => log.person_name))].sort();
    return users.filter(user => 
      user.toLowerCase().includes(facultySearchTerm.toLowerCase())
    );
  }, [data, facultySearchTerm]);

  // Get dates available for selected user
  const getDatesForUser = (user) => {
    if (!user || !data || !Array.isArray(data)) return [];
    
    const userLogs = data.filter(log => log.person_name === user);
    const dates = [...new Set(userLogs.map(log => 
      new Date(log.timestamp).toDateString()
    ))];
    
    return dates.sort();
  };

  // Handle user selection
  const handleUserChange = (e) => {
    const user = e.target.value;
    setSelectedUser(user);
    setSelectedDate('');
    setIpLogs([]);
    setChartData([]);
  };

  // Handle date selection
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    
    if (!selectedUser || !date || !data || !Array.isArray(data)) {
      setIpLogs([]);
      setChartData([]);
      return;
    }

    // Filter logs for selected user and date
    const userLogs = data.filter(log => {
      const logDate = new Date(log.timestamp).toDateString();
      return log.person_name === selectedUser && logDate === date;
    });

    // Transform logs to the format expected by the component
    const transformedLogs = userLogs.map(log => ({
      ip: log.camera_ip,
      logId: `log_${log.id}`,
      time: new Date(log.timestamp).toLocaleTimeString(),
      classroom: log.classroom,
      erpId: log.erp_id
    }));

    setIpLogs(transformedLogs);

    // Generate chart data
    const ipChartData = Object.entries(
      transformedLogs.reduce((acc, log) => {
        acc[log.ip] = (acc[log.ip] || 0) + 1;
        return acc;
      }, {})
    ).map(([ip, count]) => ({ ip, count }));

    const timeChartData = Object.entries(
      transformedLogs.reduce((acc, log) => {
        const hour = new Date(log.timestamp).getHours();
        const hourKey = `${hour}:00`;
        acc[hourKey] = (acc[hourKey] || 0) + 1;
        return acc;
      }, {})
    ).map(([hour, count]) => ({ hour, count }));

    setChartData({
      ipDistribution: ipChartData,
      timeDistribution: timeChartData
    });
  };

  // Format user name for display
  const formatUserName = (name) => {
    return name.replace(/_/g, ' ');
  };

  // Filter logs based on search term
  const filteredLogs = ipLogs.filter(log => {
    return (
      log.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.logId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.time.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.classroom.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Refresh data
  const handleRefresh = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch("http://69.62.83.14:9000/api/hod/faculty-log", {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
        generateSummaryData(data);
        
        // Re-apply current selections to refresh the view
        if (selectedUser && selectedDate) {
          handleDateChange({ target: { value: selectedDate } });
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch data from server');
        setLoading(false);
      });
  };

  // Export logs to CSV
  const exportToCSV = () => {
    if (!filteredLogs.length) return;
    
    const headers = ['IP Address', 'Log ID', 'Time', 'Status'];
    const csvData = filteredLogs.map(log => [log.ip, log.logId, log.time, log.status]);
    
    // Add headers
    csvData.unshift(headers);
    
    // Convert to CSV format
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${selectedUser}_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle expanded view
  const toggleExpandedView = () => {
    setExpandedView(!expandedView);
  };

  return (
    <div className={`p-6 ${expandedView ? 'max-w-full' : 'max-w-6xl'} mx-auto bg-white rounded-lg shadow-lg transition-all duration-300`}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-blue-700 flex items-center">
          <UserCheck className="mr-2" size={28} />
          Attendance Tracker
        </h1>
        <div className="flex space-x-2">
          <button 
            onClick={toggleExpandedView} 
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title={expandedView ? "Collapse View" : "Expand View"}
          >
            {expandedView ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <button 
            onClick={handleRefresh} 
            className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>
      
      {loading && (
        <div className="flex flex-col items-center justify-center h-48">
          <RefreshCw size={40} className="text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="flex items-center">
            <AlertTriangle size={20} className="mr-2" />
            <span className="font-bold mr-2">Error:</span> {error}
          </p>
        </div>
      )}
      
      {data && !loading && (
        <div className="space-y-8">
          {/* Summary Cards */}
          {summaryData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-blue-700">Users</h3>
                  <Users size={18} className="text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-2">{summaryData.totalUsers}</p>
                <p className="text-xs text-blue-700 mt-1">Most active: {summaryData.mostActiveUser.name}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-green-700">IP Addresses</h3>
                  <Globe size={18} className="text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-900 mt-2">{summaryData.totalIPs}</p>
                <p className="text-xs text-green-700 mt-1">Most active: {summaryData.mostActiveUser.name}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-purple-700">Login Sessions</h3>
                  <Shield size={18} className="text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-purple-900 mt-2">{summaryData.totalLogs}</p>
                <p className="text-xs text-purple-700 mt-1">Over {summaryData.totalDates} days</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-orange-700">Time Range</h3>
                  <Clock size={18} className="text-orange-500" />
                </div>
                <p className="text-lg font-bold text-orange-900 mt-2">{summaryData.earliestTime} - {summaryData.latestTime}</p>
                <p className="text-xs text-orange-700 mt-1">Activity window</p>
              </div>
            </div>
          )}
          
          {/* Overall Activity Chart */}
          {summaryData && summaryData.userActivity.length > 0 && (
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Activity size={18} className="mr-2 text-indigo-600" />
                Overall User Activity
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summaryData.userActivity.slice(0, 10)} // Show top 10 users
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`${value} logins`, 'Count']}
                      contentStyle={{ borderRadius: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                    <Bar 
                      dataKey="logins" 
                      name="Login Count" 
                      fill="#6366f1" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {/* Selection Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Selection */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-100 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Users size={18} className="mr-2 text-blue-600" />
                Select Faculty:
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search faculty..."
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    value={facultySearchTerm}
                    onChange={(e) => setFacultySearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                </div>
                <select 
                  value={selectedUser} 
                  onChange={handleUserChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                >
                  <option value="">-- Select Faculty --</option>
                  {filteredUsers.map(user => (
                    <option key={user} value={user}>{formatUserName(user)}</option>
                  ))}
                </select>
              </div>
            </div>
          
            {/* Date Selection */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-lg border border-green-100 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar size={18} className="mr-2 text-green-600" />
                Select Date:
              </label>
              <select 
                value={selectedDate} 
                onChange={handleDateChange}
                className="block w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
                disabled={!selectedUser}
              >
                <option value="">-- Select Date --</option>
                {getDatesForUser(selectedUser).map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Logs Display */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Faculty Logs</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw size={16} className="mr-1" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search logs..."
                  className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Faculty Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ERP ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Camera IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Classroom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.logId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <Users className="text-blue-600" size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedUser}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.erpId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.ip}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.classroom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Success
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p>No logs found for the selected criteria</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format date from YYYYMMDD to MM/DD/YYYY
function formatDate(dateString) {
  if (!dateString || dateString.length !== 8) return dateString;
  
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  
  return `${month}/${day}/${year}`;
}