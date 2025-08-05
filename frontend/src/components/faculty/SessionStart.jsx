import { useState, useEffect } from "react";
import axios from "axios";

export default function SessionStart({ isOpen, onClose }) {
  // Add ESC key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Fetch department_id for faculty and set as default
  useEffect(() => {
    if (!isOpen) return;
    const fetchDepartmentId = async () => {
      try {
        const token = localStorage.getItem('token');
        const today = new Date().toISOString().split('T')[0];
        const response = await axios.get(`http://69.62.83.14:9000/api/faculty/dashboard?date=${today}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.department) {
          setFormData(prev => ({ ...prev, department_id: response.data.department }));
        }
      } catch (error) {
        console.error('Failed to fetch department_id:', error);
      }
    };
    fetchDepartmentId();
    // Only run when modal opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const [formData, setFormData] = useState({
    subject_id: "",
    department_id: "",
    year: "",
    semester: "",
    division: "",
    batch: "",
    session_date: new Date().toISOString().split('T')[0], // Current date
    start_time: "",
    end_time: "",
    location: ""
  });
  const [loading, setLoading] = useState(false);
  const [sessionCreated, setSessionCreated] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSessionStart = async () => {
    // Validate required fields
    const requiredFields = ['subject_id', 'department_id', 'year', 'semester', 'division', 'start_time', 'end_time', 'location'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      // Prepare data for backend
      const sessionData = {
        ...formData,
        batch: formData.batch || null // Allow batch to be null
      };

      const response = await axios.post(
        'http://69.62.83.14:9000/api/faculty/start-session',
        sessionData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            'Content-Type': 'application/json'
          },
        }
      );

      setSessionId(response.data.session_id || response.data.id);
      setSessionCreated(true);
      alert("Session started successfully!");
      
    } catch (error) {
      console.error("Error starting session:", error);
      alert(error.response?.data?.message || "Error starting session");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      subject_id: "",
      department_id: "",
      year: "",
      semester: "",
      division: "",
      batch: "",
      session_date: new Date().toISOString().split('T')[0],
      start_time: "",
      end_time: "",
      location: ""
    });
    setSessionCreated(false);
    setSessionId(null);
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" 
      onClick={handleOverlayClick}
    >
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-lg w-full mx-4 relative max-h-[80vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-lg font-semibold mb-4">Start Attendance Session</h2>

        {!sessionCreated ? (
          <form className="space-y-3">
            {/* Subject ID */}
            <div>
              <label className="block mb-1 font-medium text-sm">Subject ID *</label>
              <input
                type="text"
                name="subject_id"
                value={formData.subject_id}
                onChange={handleInputChange}
                className="border rounded px-2 py-1.5 w-full text-sm"
                placeholder="Enter subject ID"
              />
            </div>

            {/* Department ID */}
            <div>
              <label className="block mb-1 font-medium text-sm">Department ID *</label>
              <input
                type="text"
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
                className="border rounded px-2 py-1.5 w-full text-sm"
                placeholder="Enter department ID"
              />
            </div>

            {/* Year and Semester */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium text-sm">Year *</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="border rounded px-2 py-1.5 w-full text-sm"
                >
                  <option value="">Select Year</option>
                  <option value="1">First Year</option>
                  <option value="2">Second Year</option>
                  <option value="3">Third Year</option>
                  <option value="4">Fourth Year</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium text-sm">Semester *</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="">Select Semester</option>
                  <option value="1">1st Semester</option>
                  <option value="2">2nd Semester</option>
                </select>
              </div>
            </div>

            {/* Division and Batch */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium text-sm">Division *</label>
                <input
                  type="text"
                  name="division"
                  value={formData.division}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="e.g., A, B, C"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium text-sm">Batch (Optional)</label>
                <input
                  type="text"
                  name="batch"
                  value={formData.batch}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="e.g., B1, B2"
                />
              </div>
            </div>

            {/* Session Date */}
            <div>
              <label className="block mb-2 font-medium text-sm">Session Date</label>
              <input
                type="date"
                name="session_date"
                value={formData.session_date}
                onChange={handleInputChange}
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            {/* Start Time and End Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium text-sm">Start Time *</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium text-sm">End Time *</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block mb-2 font-medium text-sm">Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="border rounded px-3 py-2 w-full"
                placeholder="e.g., Room 101, Lab A"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleSessionStart}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50 flex-1"
              >
                {loading ? "Starting Session..." : "Start Session"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
              >
                Reset
              </button>
            </div>
            {/* Show session details after successful creation */}
            {sessionCreated && (
              <div className="mt-6 p-4 border border-green-300 bg-green-50 rounded">
                <h3 className="font-semibold text-green-700 mb-2">Session Started!</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Subject ID:</strong> {formData.subject_id}</li>
                  <li><strong>Department ID:</strong> {formData.department_id}</li>
                  <li><strong>Year:</strong> {formData.year}</li>
                  <li><strong>Semester:</strong> {formData.semester}</li>
                  <li><strong>Division:</strong> {formData.division}</li>
                  {formData.batch && <li><strong>Batch:</strong> {formData.batch}</li>}
                  <li><strong>Date:</strong> {formData.session_date}</li>
                  <li><strong>Start Time:</strong> {formData.start_time}</li>
                  <li><strong>End Time:</strong> {formData.end_time}</li>
                  <li><strong>Location:</strong> {formData.location}</li>
                </ul>
              </div>
            )}
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-green-600 mb-2">Session Started Successfully!</h3>
              {sessionId && (
                <p className="text-gray-600 mb-3 text-sm">Session ID: {sessionId}</p>
              )}
              <div className="space-y-1.5 text-sm text-gray-600">
                <p><strong>Subject:</strong> {formData.subject_id}</p>
                <p><strong>Department:</strong> {formData.department_id}</p>
                <p><strong>Year:</strong> {formData.year} | <strong>Semester:</strong> {formData.semester}</p>
                <p><strong>Division:</strong> {formData.division} {formData.batch && `| Batch: ${formData.batch}`}</p>
                <p><strong>Time:</strong> {formData.start_time} - {formData.end_time}</p>
                <p><strong>Location:</strong> {formData.location}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex-1"
              >
                Start Another Session
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded flex-1"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}