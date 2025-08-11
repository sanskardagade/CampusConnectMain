import React, { useEffect, useState } from 'react';
import axios from 'axios';

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

const getApprovalStatus = (hodApproval, principalApproval, finalStatus) => {
  if (finalStatus === 'Approved') return 'Fully Approved';
  if (finalStatus === 'Rejected') return 'Rejected';
  if (principalApproval === 'Approved') return 'Principal Approved (Pending Final)';
  if (hodApproval === 'Approved') return 'HOD Approved (Pending Principal)';
  return 'Pending Approval';
};

const getApprovalRemark = (hodApproval, principalApproval, finalStatus) => {
  if (finalStatus === 'Approved') return 'Approved by both HOD and Principal';
  if (finalStatus === 'Rejected') return 'Leave application rejected';
  if (principalApproval === 'Approved') return 'Approved by Principal, pending final approval';
  if (hodApproval === 'Approved') return 'Approved by HOD, pending Principal approval';
  return 'Awaiting initial approval';
};

const SecurityDashboard = () => {
  // State declarations
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
      
      // Ensure data is always an array
      if (!Array.isArray(data)) {
        data = [];
      }
      
      // Filter out any dummy entries if they exist
      data = data.filter(item => item.id !== -1 && item.ErpStaffId !== 'DUMMY');
      
      setFacultyOnLeave(data);
    } catch (err) {
      setError('Failed to fetch faculty leave data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyOnLeave();
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
    <div className="w-full h-screen bg-gray-50">
      <div className="w-full h-full mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
          <h1 className="text-2xl font-bold text-red-800 mb-4 text-center">Security Dashboard</h1>
          <p className="text-gray-600 text-center mb-6">Faculty leave applications for selected date. Mark exit when faculty leaves the campus (including pending applications).</p>
          
          {/* Summary Stats */}
          {facultyOnLeave.length > 0 && (
            <div className="flex flex-wrap gap-4 justify-center mb-4 text-sm">
              <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg">
                Total: {facultyOnLeave.length}
              </div>
              <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg">
                Pending: {facultyOnLeave.filter(f => f.FinalStatus === 'Pending').length}
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg">
                Approved: {facultyOnLeave.filter(f => f.FinalStatus === 'Approved').length}
              </div>
              <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg">
                Rejected: {facultyOnLeave.filter(f => f.FinalStatus === 'Rejected').length}
              </div>
            </div>
          )}

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
                onChange={(e) => { setCustomDate(e.target.value); setFilter('custom'); }}
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
            <div className="text-center text-gray-500 py-8">No faculty leave applications found for selected date.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                <thead className="bg-red-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-center font-semibold border-b border-red-700">Sr. No</th>
                    <th className="px-4 py-3 text-left font-semibold border-b border-red-700">Faculty Name</th>
                    <th className="px-4 py-3 text-left font-semibold border-b border-red-700">ERP ID</th>
                    <th className="px-4 py-3 text-left font-semibold border-b border-red-700">Leave Period</th>
                    <th className="px-4 py-3 text-left font-semibold border-b border-red-700">Leave Type</th>
                    <th className="px-4 py-3 text-left font-semibold border-b border-red-700">HOD Approval</th>
                    <th className="px-4 py-3 text-left font-semibold border-b border-red-700">Principal Approval</th>
                    <th className="px-4 py-3 text-left font-semibold border-b border-red-700">Final Status</th>
                    <th className="px-4 py-3 text-left font-semibold border-b border-red-700">Remarks</th>
                    <th className="px-4 py-3 text-center font-semibold border-b border-red-700">Exit Status</th>
                    <th className="px-4 py-3 text-center font-semibold border-b border-red-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyOnLeave.map((f, index) => (
                    <tr key={f.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}>
                      <td className="px-4 py-3 border-b border-gray-200 text-center text-gray-700">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200">
                        <div className="font-semibold text-red-900">{f.StaffName}</div>
                        {f.FinalStatus === 'Pending' && (
                          <div className="text-xs text-orange-600 font-medium">(Pending Approval)</div>
                        )}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
                        {f.ErpStaffId}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
                        <div className="text-sm">
                          <div>From: {new Date(f.fromDate).toLocaleDateString()}</div>
                          <div>To: {new Date(f.toDate).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
                        {f.leaveType}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          f.HodApproval === 'Approved' ? 'bg-green-100 text-green-800' :
                          f.HodApproval === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {f.HodApproval}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          f.PrincipalApproval === 'Approved' ? 'bg-green-100 text-green-800' :
                          f.PrincipalApproval === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {f.PrincipalApproval}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          f.FinalStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                          f.FinalStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {f.FinalStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 text-gray-700 text-sm">
                        {getApprovalRemark(f.HodApproval, f.PrincipalApproval, f.FinalStatus)}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          f.exitStatus 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {f.exitStatus ? 'Exited' : 'Not Exited'}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 text-center">
                        {!f.exitStatus ? (
                          <button
                            className={`px-4 py-2 rounded-lg font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors ${
                              marking === f.ErpStaffId ? 'opacity-60 cursor-wait' : ''
                            }`}
                            onClick={() => handleMarkExit(f.ErpStaffId)}
                            disabled={marking === f.ErpStaffId}
                            title="Mark faculty exit from campus"
                          >
                            {marking === f.ErpStaffId ? 'Marking...' : 'Mark Exit'}
                          </button>
                        ) : (
                          <button
                            className="px-3 py-2 rounded-lg font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                            onClick={() => handleEditExit(f.ErpStaffId)}
                            disabled={marking === f.ErpStaffId}
                            title="Unmark exit status"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {success && <div className="text-green-700 text-center mt-4 font-semibold">{success}</div>}
          
          {/* Info Note */}
          {facultyOnLeave.length > 0 && (
            <div className="text-center text-gray-600 text-sm mt-4">
              <p>💡 <strong>Note:</strong> Exit can be marked for both approved and pending leave applications.</p>
            </div>
          )}
        </div>
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

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// function formatDate(date) {
//   return date.toISOString().split('T')[0];
// }

// const SecurityDashboard = () => {
//   const [facultyOnLeave, setFacultyOnLeave] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [marking, setMarking] = useState(null);
//   const [success, setSuccess] = useState('');
//   const [filter, setFilter] = useState('today');
//   const [customDate, setCustomDate] = useState(formatDate(new Date()));
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [editErpId, setEditErpId] = useState(null);

//   const getSelectedDate = () => {
//     if (filter === 'today') return formatDate(new Date());
//     if (filter === 'yesterday') {
//       const d = new Date();
//       d.setDate(d.getDate() - 1);
//       return formatDate(d);
//     }
//     return customDate;
//   };

//   const fetchFacultyOnLeave = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const date = getSelectedDate();
//       const res = await axios.get('http://69.62.83.14:9000/api/registrar/security-dashboard', { params: { date } });
//       let data = res.data;
//       if (!Array.isArray(data)) {
//         if (data == null) data = [];
//         else if (typeof data === 'object') data = Object.values(data);
//         else data = [];
//       }
//       setFacultyOnLeave(data);
//     } catch (err) {
//       setError('Failed to fetch faculty leave data.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchFacultyOnLeave();
//     // eslint-disable-next-line
//   }, [filter, customDate]);

//   const handleMarkExit = async (erpStaffId) => {
//     setMarking(erpStaffId);
//     setSuccess('');
//     try {
//       await axios.post('http://69.62.83.14:9000/api/registrar/security-dashboard/exit', { erpStaffId });
//       setSuccess('Exit marked successfully!');
//       fetchFacultyOnLeave();
//     } catch (err) {
//       setError('Failed to mark exit.');
//     } finally {
//       setMarking(null);
//       setTimeout(() => setSuccess(''), 2000);
//     }
//   };

//   const handleEditExit = (erpStaffId) => {
//     setEditErpId(erpStaffId);
//     setShowEditModal(true);
//   };

//   const confirmEditExit = async () => {
//     if (!editErpId) return;
//     setMarking(editErpId);
//     setSuccess('');
//     setShowEditModal(false);
//     try {
//       await axios.post('http://69.62.83.14:9000/api/registrar/security-dashboard/unexit', { erpStaffId: editErpId });
//       setSuccess('Exit unmarked successfully!');
//       fetchFacultyOnLeave();
//     } catch (err) {
//       setError('Failed to unmark exit.');
//     } finally {
//       setMarking(null);
//       setEditErpId(null);
//       setTimeout(() => setSuccess(''), 2000);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="container mx-auto px-4 py-8">
//         <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
//           <h1 className="text-2xl font-bold text-red-800 mb-4 text-center">Security Dashboard</h1>
//           <p className="text-gray-600 text-center mb-6">Faculty on leave. Mark exit when faculty leaves the campus.</p>
          
//           {/* Filter Controls */}
//           <div className="flex flex-wrap gap-2 justify-center mb-6">
//             <button
//               className={`px-3 py-2 rounded-lg font-semibold ${filter === 'today' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}
//               onClick={() => setFilter('today')}
//             >
//               Today
//             </button>
//             <button
//               className={`px-3 py-2 rounded-lg font-semibold ${filter === 'yesterday' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}
//               onClick={() => setFilter('yesterday')}
//             >
//               Yesterday
//             </button>
//             <div className="flex items-center gap-2">
//               <input
//                 type="date"
//                 value={customDate}
//                 onChange={e => { setCustomDate(e.target.value); setFilter('custom'); }}
//                 className="px-2 py-2 border rounded-lg text-gray-700 bg-gray-50"
//                 max={formatDate(new Date())}
//               />
//               <button
//                 className={`px-3 py-2 rounded-lg font-semibold ${filter === 'custom' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}
//                 onClick={() => setFilter('custom')}
//               >
//                 Custom Date
//               </button>
//             </div>
//           </div>

//           {loading ? (
//             <div className="text-center text-gray-500 py-8">Loading...</div>
//           ) : error ? (
//             <div className="text-center text-red-600 py-8">{error}</div>
//           ) : facultyOnLeave.length === 0 ? (
//             <div className="text-center text-gray-500 py-8">No faculty on leave for selected date.</div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full bg-white border border-gray-300 rounded-lg">
//                 <thead className="bg-red-800 text-white">
//                   <tr>
//                     <th className="px-4 py-3 text-left font-semibold border-b border-red-700">Faculty Name</th>
//                     <th className="px-4 py-3 text-left font-semibold border-b border-red-700">ERP ID</th>
//                     <th className="px-4 py-3 text-left font-semibold border-b border-red-700">Email</th>
//                     <th className="px-4 py-3 text-left font-semibold border-b border-red-700">Leave Period</th>
//                     <th className="px-4 py-3 text-left font-semibold border-b border-red-700">Leave Type</th>
//                     <th className="px-4 py-3 text-left font-semibold border-b border-red-700">Reason</th>
//                     <th className="px-4 py-3 text-center font-semibold border-b border-red-700">Exit Status</th>
//                     <th className="px-4 py-3 text-center font-semibold border-b border-red-700">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {facultyOnLeave.map((f, index) => (
//                     <tr key={f.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}>
//                       <td className="px-4 py-3 border-b border-gray-200">
//                         <div className="font-semibold text-red-900">{f.faculty_name || f.StaffName}</div>
//                       </td>
//                       <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
//                         {f.ErpStaffId}
//                       </td>
//                       <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
//                         {f.email}
//                       </td>
//                       <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
//                         <div className="text-sm">
//                           <div>From: {f.fromDate}</div>
//                           <div>To: {f.toDate}</div>
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
//                         {f.leaveType}
//                       </td>
//                       <td className="px-4 py-3 border-b border-gray-200 text-gray-700">
//                         <div className="max-w-xs truncate" title={f.reason}>
//                           {f.reason}
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 border-b border-gray-200 text-center">
//                         <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
//                           f.exitStatus 
//                             ? 'bg-green-100 text-green-800' 
//                             : 'bg-red-100 text-red-800'
//                         }`}>
//                           {f.exitStatus ? 'Exited' : 'Not Exited'}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3 border-b border-gray-200 text-center">
//                         {!f.exitStatus ? (
//                           <button
//                             className={`px-4 py-2 rounded-lg font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors ${
//                               marking === f.ErpStaffId ? 'opacity-60 cursor-wait' : ''
//                             }`}
//                             onClick={() => handleMarkExit(f.ErpStaffId)}
//                             disabled={marking === f.ErpStaffId}
//                           >
//                             {marking === f.ErpStaffId ? 'Marking...' : 'Mark Exit'}
//                           </button>
//                         ) : (
//                           <button
//                             className="px-3 py-2 rounded-lg font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
//                             onClick={() => handleEditExit(f.ErpStaffId)}
//                             disabled={marking === f.ErpStaffId}
//                           >
//                             Edit
//                           </button>
//                         )}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
          
//           {success && <div className="text-green-700 text-center mt-4 font-semibold">{success}</div>}
//         </div>
//       </div>

//       {/* Edit Exit Modal */}
//       {showEditModal && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
//           <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
//             <h2 className="text-lg font-bold mb-4 text-center">Unmark Exit</h2>
//             <p className="mb-4 text-gray-700 text-center">Are you sure you want to unmark exit for this faculty? This will allow marking exit again for today.</p>
//             <div className="flex justify-center gap-4">
//               <button
//                 className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-700 hover:bg-blue-800"
//                 onClick={confirmEditExit}
//                 disabled={marking}
//               >
//                 Yes, Unmark
//               </button>
//               <button
//                 className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300"
//                 onClick={() => { setShowEditModal(false); setEditErpId(null); }}
//                 disabled={marking}
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SecurityDashboard;

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// function formatDate(date) {
//   return date.toISOString().split('T')[0];
// }

// const SecurityDashboard = () => {
//   const [facultyOnLeave, setFacultyOnLeave] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [marking, setMarking] = useState(null);
//   const [success, setSuccess] = useState('');
//   const [filter, setFilter] = useState('today');
//   const [customDate, setCustomDate] = useState(formatDate(new Date()));
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [editErpId, setEditErpId] = useState(null);

//   const getSelectedDate = () => {
//     if (filter === 'today') return formatDate(new Date());
//     if (filter === 'yesterday') {
//       const d = new Date();
//       d.setDate(d.getDate() - 1);
//       return formatDate(d);
//     }
//     return customDate;
//   };

//   const fetchFacultyOnLeave = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const date = getSelectedDate();
//       const res = await axios.get('http://69.62.83.14:9000/api/registrar/security-dashboard', { params: { date } });
//       let data = res.data;
//       if (!Array.isArray(data)) {
//         if (data == null) data = [];
//         else if (typeof data === 'object') data = Object.values(data);
//         else data = [];
//       }
//       setFacultyOnLeave(data);
//     } catch (err) {
//       setError('Failed to fetch faculty leave data.');
//     } finally {
//       setLoading(false);
//     }u
//   };

//   useEffect(() => {
//     fetchFacultyOnLeave();
//     // eslint-disable-next-line
//   }, [filter, customDate]);

//   const handleMarkExit = async (erpStaffId) => {
//     setMarking(erpStaffId);
//     setSuccess('');
//     try {
//       await axios.post('http://69.62.83.14:9000/api/registrar/security-dashboard/exit', { erpStaffId });
//       setSuccess('Exit marked successfully!');u
//       fetchFacultyOnLeave();
//     } catch (err) {
//       setError('Failed to mark exit.');
//     } finally {
//       setMarking(null);
//       setTimeout(() => setSuccess(''), 2000);
//     }
//   };

//   // Remove toggle logic, just allow updating exit time if already exited
//   const handleEditExit = (erpStaffId) => {
//     setEditErpId(erpStaffId);
//     setShowEditModal(true);
//   };

//   const confirmEditExit = async () => {
//     if (!editErpId) return;
//     setMarking(editErpId);
//     setSuccess('');
//     setShowEditModal(false);
//     try {
//       await axios.post('http://69.62.83.14:9000/api/registrar/security-dashboard/unexit', { erpStaffId: editErpId });
//       setSuccess('Exit unmarked successfully!');
//       fetchFacultyOnLeave();
//     } catch (err) {
//       setError('Failed to unmark exit.');
//     } finally {
//       setMarking(null);
//       setEditErpId(null);
//       setTimeout(() => setSuccess(''), 2000);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
//       <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-4 sm:p-8 mt-8">
//         <h1 className="text-2xl font-bold text-red-800 mb-4 text-center">Security Dashboard</h1>
//         <p className="text-gray-600 text-center mb-6">Faculty on leave. Mark exit when faculty leaves the campus.</p>
//         {/* Filter Controls */}
//         <div className="flex flex-wrap gap-2 justify-center mb-6">
//           <button
//             className={`px-3 py-2 rounded-lg font-semibold ${filter === 'today' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}
//             onClick={() => setFilter('today')}
//           >
//             Today
//           </button>
//           <button
//             className={`px-3 py-2 rounded-lg font-semibold ${filter === 'yesterday' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}
//             onClick={() => setFilter('yesterday')}
//           >
//             Yesterday
//           </button>
//           <div className="flex items-center gap-2">
//             <input
//               type="date"
//               value={customDate}
//               onChange={e => { setCustomDate(e.target.value); setFilter('custom'); }}
//               className="px-2 py-2 border rounded-lg text-gray-700 bg-gray-50"
//               max={formatDate(new Date())}
//             />
//             <button
//               className={`px-3 py-2 rounded-lg font-semibold ${filter === 'custom' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}
//               onClick={() => setFilter('custom')}
//             >
//               Custom Date
//             </button>
//           </div>
//         </div>
//         {loading ? (
//           <div className="text-center text-gray-500 py-8">Loading...</div>
//         ) : error ? (
//           <div className="text-center text-red-600 py-8">{error}</div>
//         ) : facultyOnLeave.length === 0 ? (
//           <div className="text-center text-gray-500 py-8">No faculty on leave for selected date.</div>
//         ) : (
//           <div className="space-y-4">
//             {facultyOnLeave.map((f) => (
//               <div key={f.id} className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50">
//                 <div>
//                   <div className="font-semibold text-lg text-red-900">{f.faculty_name || f.StaffName}</div>
//                   <div className="text-sm text-gray-700">ERP ID: {f.ErpStaffId}</div>
//                   <div className="text-sm text-gray-700">Email: {f.email}</div>
//                   <div className="text-sm text-gray-700">Leave: {f.fromDate} to {f.toDate}</div>
//                   <div className="text-sm text-gray-700">Reason: {f.reason}</div>
//                   <div className="text-sm text-gray-700">Type: {f.leaveType}</div>
//                   <div className="text-sm text-gray-700">Exited: {f.exitStatus ? 'Yes' : 'No'}</div>
//                 </div>
//                 <div className="mt-4 sm:mt-0 flex flex-col items-end">
//                   {!f.exitStatus ? (
//                     <button
//                       className={`px-4 py-2 rounded-lg font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors ${marking === f.ErpStaffId ? 'opacity-60 cursor-wait' : ''}`}
//                       onClick={() => handleMarkExit(f.ErpStaffId)}
//                       disabled={marking === f.ErpStaffId}
//                     >
//                       {marking === f.ErpStaffId ? 'Marking...' : 'Mark Exit'}
//                     </button>
//                   ) : (
//                     <span className="flex items-center gap-2">
//                       <span className="px-4 py-2 rounded-lg font-semibold text-green-700 bg-green-100">Exited</span>
//                       <button
//                         className="px-3 py-2 rounded-lg font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
//                         onClick={() => handleEditExit(f.ErpStaffId)}
//                         disabled={marking === f.ErpStaffId}
//                       >
//                         Edit
//                       </button>
//                     </span>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//         {success && <div className="text-green-700 text-center mt-4 font-semibold">{success}</div>}
//       </div>
//       {/* Edit Exit Modal */}
//       {showEditModal && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
//           <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
//             <h2 className="text-lg font-bold mb-4 text-center">Unmark Exit</h2>
//             <p className="mb-4 text-gray-700 text-center">Are you sure you want to unmark exit for this faculty? This will allow marking exit again for today.</p>
//             <div className="flex justify-center gap-4">
//               <button
//                 className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-700 hover:bg-blue-800"
//                 onClick={confirmEditExit}
//                 disabled={marking}
//               >
//                 Yes, Unmark
//               </button>
//               <button
//                 className="px-4 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300"
//                 onClick={() => { setShowEditModal(false); setEditErpId(null); }}
//                 disabled={marking}
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SecurityDashboard; 