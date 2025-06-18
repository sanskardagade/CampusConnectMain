import React, { useState, useMemo } from 'react';
import { 
  User, 
  MapPin, 
  Clock, 
  Camera, 
  Activity, 
  Calendar,
  TrendingUp,
  Eye,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const FacultyLogDisplay = ({ logs = [] }) => {
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');

  // Handle null logs
  if (!logs || logs === null) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-12 rounded-xl text-center">
        <Activity className="mx-auto mb-4 text-gray-400" size={48} />
        <p className="text-gray-600 text-xl font-medium">No faculty logs for today</p>
        <p className="text-gray-500 mt-2">Check back later for updates</p>
      </div>
    );
  }

  // Data processing for charts
  const chartData = useMemo(() => {
    const classroomCounts = logs.reduce((acc, log) => {
      acc[log.classroom] = (acc[log.classroom] || 0) + 1;
      return acc;
    }, {});

    const hourlyData = logs.reduce((acc, log) => {
      const hour = new Date(log.timestamp).getHours();
      const hourKey = `${hour}:00`;
      acc[hourKey] = (acc[hourKey] || 0) + 1;
      return acc;
    }, {});

    return {
      classroomData: Object.entries(classroomCounts).map(([name, value]) => ({ name, value })),
      hourlyData: Object.entries(hourlyData).map(([hour, count]) => ({ hour, count }))
    };
  }, [logs]);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const stats = {
    totalLogs: logs.length,
    uniqueClassrooms: new Set(logs.map(log => log.classroom)).size,
    activeFaculty: new Set(logs.map(log => log.person_name)).size,
    activeCameras: new Set(logs.map(log => log.camera_ip)).size
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Activity className="text-blue-600" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Faculty Activity Dashboard</h1>
                <p className="text-gray-600">Real-time monitoring and analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Activities</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalLogs}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Activity className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="text-green-500 mr-1" size={16} />
              <span className="text-green-500 font-medium">+12%</span>
              <span className="text-gray-600 ml-1">from last hour</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Locations</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.uniqueClassrooms}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <MapPin className="text-green-600" size={24} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-gray-600">Classrooms monitored</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Faculty</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeFaculty}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <User className="text-purple-600" size={24} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-gray-600">Currently tracked</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Cameras</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeCameras}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Camera className="text-orange-600" size={24} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <Eye className="text-blue-500 mr-1" size={16} />
              <span className="text-gray-600">Online and recording</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location Activity Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Location Activity</h3>
              <MapPin className="text-gray-400" size={20} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.classroomData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Activity Distribution</h3>
              <Activity className="text-gray-400" size={20} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.classroomData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.classroomData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Filter size={16} />
                  <span>Filter</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Calendar size={16} />
                  <span>Date Range</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faculty Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Camera IP
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <User className="text-blue-600" size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.person_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ERP: {log.erp_id}
                          </div>
                        </div>

                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="text-gray-400 mr-2" size={16} />
                        <span className="text-sm font-medium text-gray-900">{log.classroom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Camera className="text-gray-400 mr-2" size={16} />
                        <span className="text-sm text-gray-600 font-mono">{log.camera_ip}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="text-gray-400 mr-2" size={16} />
                        <span className="text-sm text-gray-900">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        Active
                      </span>
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
};

export default FacultyLogDisplay;