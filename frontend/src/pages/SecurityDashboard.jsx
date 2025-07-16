import React, { useEffect, useState } from 'react';
import axios from 'axios';

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

const SecurityDashboard = () => {
  const [facultyOnLeave, setFacultyOnLeave] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState(null);
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('today');
  const [customDate, setCustomDate] = useState(formatDate(new Date()));
  const [showEditModal, setShowEditModal] = useState(false);
  const [editErpId, setEditErpId] = useState(null);

  const getSelectedDate = () => {
    if (filter === 'today') return formatDate(new Date());
    if (filter === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return formatDate(d);
    }
    return customDate;
  };

  const fetchFacultyOnLeave = async () => {
    setLoading(true);
    setError('');
    try {
      const date = getSelectedDate();
      const res = await axios.get('http://69.62.83.14:9000/api/registrar/security-dashboard', { params: { date } });
      let data = res.data;
      if (!Array.isArray(data)) {
        if (data == null) data = [];
        else if (typeof data === 'object') data = Object.values(data);
        else data = [];
      }
      setFacultyOnLeave(data);
    } catch (err) {
      setError('Failed to fetch faculty leave data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyOnLeave();
    // eslint-disable-next-line
  }, [filter, customDate]);

  const handleMarkExit = async (erpStaffId) => {
    setMarking(erpStaffId);
    setSuccess('');
    try {
      await axios.post('http://69.62.83.14:9000/api/registrar/security-dashboard/exit', { erpStaffId });
      setSuccess('Exit marked successfully!');
      fetchFacultyOnLeave();
    } catch (err) {
      setError('Failed to mark exit.');
    } finally {
      setMarking(null);
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  // Remove toggle logic, just allow updating exit time if already exited
  const handleEditExit = (erpStaffId) => {
    setEditErpId(erpStaffId);
    setShowEditModal(true);
  };

  const confirmEditExit = async () => {
    if (!editErpId) return;
    setMarking(editErpId);
    setSuccess('');
    setShowEditModal(false);
    try {
      await axios.post('http://69.62.83.14:9000/api/registrar/security-dashboard/unexit', { erpStaffId: editErpId });
      setSuccess('Exit unmarked successfully!');
      fetchFacultyOnLeave();
    } catch (err) {
      setError('Failed to unmark exit.');
    } finally {
      setMarking(null);
      setEditErpId(null);
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-4 sm:p-8 mt-8">
        <h1 className="text-2xl font-bold text-red-800 mb-4 text-center">Security Dashboard</h1>
        <p className="text-gray-600 text-center mb-6">Faculty on leave. Mark exit when faculty leaves the campus.</p>
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <button
            className={`px-3 py-2 rounded-lg font-semibold ${filter === 'today' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setFilter('today')}
          >
            Today
          </button>
          <button
            className={`px-3 py-2 rounded-lg font-semibold ${filter === 'yesterday' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setFilter('yesterday')}
          >
            Yesterday
          </button>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customDate}
              onChange={e => { setCustomDate(e.target.value); setFilter('custom'); }}
              className="px-2 py-2 border rounded-lg text-gray-700 bg-gray-50"
              max={formatDate(new Date())}
            />
            <button
              className={`px-3 py-2 rounded-lg font-semibold ${filter === 'custom' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setFilter('custom')}
            >
              Custom Date
            </button>
          </div>
        </div>
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600 py-8">{error}</div>
        ) : facultyOnLeave.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No faculty on leave for selected date.</div>
        ) : (
          <div className="space-y-4">
            {facultyOnLeave.map((f) => (
              <div key={f.id} className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50">
                <div>
                  <div className="font-semibold text-lg text-red-900">{f.faculty_name || f.StaffName}</div>
                  <div className="text-sm text-gray-700">ERP ID: {f.ErpStaffId}</div>
                  <div className="text-sm text-gray-700">Email: {f.email}</div>
                  <div className="text-sm text-gray-700">Leave: {f.fromDate} to {f.toDate}</div>
                  <div className="text-sm text-gray-700">Reason: {f.reason}</div>
                  <div className="text-sm text-gray-700">Type: {f.leaveType}</div>
                  <div className="text-sm text-gray-700">Exited: {f.exitStatus ? 'Yes' : 'No'}</div>
                </div>
                <div className="mt-4 sm:mt-0 flex flex-col items-end">
                  {!f.exitStatus ? (
                    <button
                      className={`px-4 py-2 rounded-lg font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors ${marking === f.ErpStaffId ? 'opacity-60 cursor-wait' : ''}`}
                      onClick={() => handleMarkExit(f.ErpStaffId)}
                      disabled={marking === f.ErpStaffId}
                    >
                      {marking === f.ErpStaffId ? 'Marking...' : 'Mark Exit'}
                    </button>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="px-4 py-2 rounded-lg font-semibold text-green-700 bg-green-100">Exited</span>
                      <button
                        className="px-3 py-2 rounded-lg font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                        onClick={() => handleEditExit(f.ErpStaffId)}
                        disabled={marking === f.ErpStaffId}
                      >
                        Edit
                      </button>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {success && <div className="text-green-700 text-center mt-4 font-semibold">{success}</div>}
      </div>
      {/* Edit Exit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4 text-center">Unmark Exit</h2>
            <p className="mb-4 text-gray-700 text-center">Are you sure you want to unmark exit for this faculty? This will allow marking exit again for today.</p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-700 hover:bg-blue-800"
                onClick={confirmEditExit}
                disabled={marking}
              >
                Yes, Unmark
              </button>
              <button
                className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300"
                onClick={() => { setShowEditModal(false); setEditErpId(null); }}
                disabled={marking}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard; 