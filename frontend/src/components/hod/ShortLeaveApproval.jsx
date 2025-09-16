import { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, X, AlertCircle } from 'lucide-react';

export default function ShortLeaveApproval() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [selectedTab, setSelectedTab] = useState('Pending');

  useEffect(() => {
    const fetchShortLeaves = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Missing auth token');
        const res = await axios.get('http://localhost:5000/api/hod/short-leaves', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(res.data)
        if (Array.isArray(res.data)) {
          setApplications(res.data);
        } else {
          setApplications([]);
        }
      } catch (e) {
        addNotification('Error fetching short leave applications');
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchShortLeaves();
  }, []);

  const addNotification = (message) => {
    const n = { id: Date.now(), message };
    setNotifications((prev) => [...prev, n]);
    setTimeout(() => {
      setNotifications((curr) => curr.filter((x) => x.id !== n.id));
    }, 4000);
  };

  const handleApprove = async (app) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Missing auth token');
      await axios.put(
        `http://localhost:5000/api/hod/short-leaves/${app.id}`,
        { status: 'Approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(app.id);
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: 'Approved' } : a)));
      if (selected?.id === app.id) setSelected({ ...app, status: 'Approved' });
      addNotification(`Approved short leave for ${app.name}`);
    } catch (e) {
      addNotification('Error approving short leave');
    }
  };

  const handleReject = async (app) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Missing auth token');
      await axios.put(
        `http://localhost:5000/api/hod/short-leaves/${app.id}`,
        { status: 'Rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: 'Rejected' } : a)));
      if (selected?.id === app.id) setSelected({ ...app, status: 'Rejected' });
      addNotification(`Rejected short leave for ${app.name}`);
    } catch (e) {
      addNotification('Error rejecting short leave');
    }
  };

  const formatDateTime = (dateIso, timeStr) => {
    try {
      const date = new Date(dateIso);
      if (!timeStr) return date.toLocaleString();
      const [hh = '00', mm = '00', ss = '00'] = String(timeStr).split(':');
      const d = new Date(date);
      d.setHours(parseInt(hh, 10), parseInt(mm, 10), parseInt(ss, 10), 0);
      return d.toLocaleString();
    } catch {
      return new Date(dateIso).toLocaleString();
    }
  };

  const filterByTab = (app) => {
    const status = app?.status;
    if (!status) return selectedTab === 'Pending';
    return status === selectedTab;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-purple-900">Short Leaves</h2>
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {applications.filter(filterByTab).length} {selectedTab.toLowerCase()}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex mb-4 rounded-lg overflow-hidden shadow divide-x divide-gray-200 bg-white">
              {['Pending', 'Approved', 'Rejected'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`flex-1 px-4 py-2 font-semibold text-sm transition-colors duration-150 ${
                    selectedTab === tab
                      ? tab === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : tab === 'Approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a 8 8 0 018-8v8z"></path>
                </svg>
                <span className="ml-2 text-purple-700 font-medium">Loading...</span>
              </div>
            ) : (
              <>
                {applications.filter(filterByTab).map((app) => (
                  <div
                    key={app.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                      selected?.id === app.id ? 'border-purple-300 bg-purple-50' : 'border-purple-200 bg-purple-50 hover:border-purple-300'
                    }`}
                    onClick={() => setSelected(app)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 overflow-hidden mr-3 flex items-center justify-center">
                        <span className="text-purple-800 font-medium">{app.name?.charAt(0)}</span>
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-gray-900">{app.name}</span>
                            <p className="text-xs text-gray-500 mt-1">ID: {app.erpid || app.staffid}</p>
                          </div>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Short Leave</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          {formatDateTime(app.leave_date, app.start_time)} - {formatDateTime(app.leave_date, app.end_time)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {applications.filter(filterByTab).length === 0 && (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p>No {selectedTab.toLowerCase()} short leaves</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="lg:col-span-2">
        {selected ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold text-purple-900">Short Leave Details</h2>
                <p className="text-sm text-gray-500">Requested on {formatDateTime(selected.applied_on)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-purple-600">
                <X size={20} />
              </button>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium text-purple-800 mb-3">Faculty Information</h3>
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mr-3">
                    <span className="flex items-center justify-center h-full text-gray-600 text-xl">{selected.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{selected.name}</h4>
                    <p className="text-xs text-gray-500">ID: {selected.erpid || selected.staffid}</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-purple-800 mb-3">Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="font-medium">{formatDateTime(selected.leave_date, selected.start_time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">To</p>
                    <p className="font-medium">{formatDateTime(selected.leave_date, selected.end_time)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Reason</p>
                  <p className="p-3 bg-gray-50 rounded-md mt-1">{selected.reason}</p>
                </div>
                {selected.status === 'Pending' && (
                  <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={() => handleReject(selected)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center">
                      <X size={18} className="mr-2" />
                      Reject
                    </button>
                    <button onClick={() => handleApprove(selected)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center">
                      <Check size={18} className="mr-2" />
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>Select a short leave to view details</p>
          </div>
        )}
      </div>

      {/* Local notifications for this view */}
      <div className="fixed bottom-4 right-4 space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className="bg-white rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ease-in-out">
            <p className="text-gray-800">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
