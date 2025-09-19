import { useState } from "react";
import { Calendar, Clock, FileText, Send, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

function ShortLeaves() {
    const [leaveForm, setLeaveForm] = useState({
        leavedate: "",
        startTime: "",
        endTime: "",
        reason: "",
    });
    const [formStatus, setFormStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New: My Short Leaves state
    const [myLeaves, setMyLeaves] = useState([]);
    const [isLoadingLeaves, setIsLoadingLeaves] = useState(false);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [isSectionCollapsed, setIsSectionCollapsed] = useState(false);

    const fetchMyShortLeaves = async () => {
        setIsLoadingLeaves(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch("http://localhost:5000/api/faculty/short-leave", {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setMyLeaves(data);
            } else if (Array.isArray(data?.short_leaves)) {
                setMyLeaves(data.short_leaves);
            } else {
                setMyLeaves([]);
            }
        } catch (e) {
            console.error("Error fetching short leaves:", e);
            setMyLeaves([]);
        } finally {
            setIsLoadingLeaves(false);
        }
    };

    const handleSubmit = async (e) => {
        setFormStatus(null);
        setIsSubmitting(true);
        
        try {
            // Simulate token from memory storage instead of localStorage
            const token = localStorage.getItem('token');  
            
            const response = await fetch("http://localhost:5000/api/faculty/short-leave", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(leaveForm)
            });
            
            const data = await response.json();
            console.log(data);

            if (response.ok) {
                setLeaveForm({
                    leavedate: "",
                    startTime: "",
                    endTime: "",
                    reason: "",
                });
                setFormStatus("success");
                // Refresh the list after successful submit
                fetchMyShortLeaves();
            } else {
                setFormStatus("error");
            }
        } catch (err) {
            console.error("Error submitting form:", err);
            setFormStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setLeaveForm({ ...leaveForm, [e.target.name]: e.target.value });
    };

    const isFormValid = leaveForm.leavedate && leaveForm.startTime && leaveForm.endTime && leaveForm.reason.trim();

    const formatDateTime = (dateLike, timeLike) => {
        try {
            const date = new Date(dateLike);
            if (!timeLike) return date.toLocaleString();
            const [hh = '00', mm = '00', ss = '00'] = String(timeLike).split(':');
            const d = new Date(date);
            d.setHours(parseInt(hh, 10), parseInt(mm, 10), parseInt(ss, 10), 0);
            return d.toLocaleString();
        } catch {
            return String(dateLike);
        }
    };

    const getDisplayStatus = (lv) => lv?.FinalStatus
    const getStatusClass = (status) => (
        status === 'Approved' ? 'bg-green-100 text-green-700' :
        status === 'Rejected' ? 'bg-red-100 text-red-700' :
        'bg-yellow-100 text-yellow-700'
    );

    const toggleExpanded = (id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSection = async () => {
        setIsSectionCollapsed(prev => !prev);
    };

    const leavesCount = myLeaves.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                <Calendar className="w-8 h-8 text-blue-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Short Leave Application</h1>
                            <p className="text-gray-600">Submit your short leave request for approval</p>
                        </div>

                        {/* Status Messages */}
                        {formStatus === "success" && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <p className="text-green-800 font-medium">Short leave applied successfully!</p>
                            </div>
                        )}
                        
                        {formStatus === "error" && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <p className="text-red-800 font-medium">Error submitting form. Please try again.</p>
                            </div>
                        )}

                        {/* Form */}
                        <div className="space-y-6">
                            {/* Leave Date */}
                            <div>
                                <label htmlFor="leavedate" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Leave Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="date"
                                        id="leavedate"
                                        name="leavedate"
                                        value={leaveForm.leavedate}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>
                            </div>

                            {/* Time Range */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Start Time */}
                                <div>
                                    <label htmlFor="startTime" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Start Time
                                    </label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="time"
                                            id="startTime"
                                            name="startTime"
                                            value={leaveForm.startTime}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                {/* End Time */}
                                <div>
                                    <label htmlFor="endTime" className="block text-sm font-semibold text-gray-700 mb-2">
                                        End Time
                                    </label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="time"
                                            id="endTime"
                                            name="endTime"
                                            value={leaveForm.endTime}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason for Leave
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <textarea
                                        id="reason"
                                        name="reason"
                                        value={leaveForm.reason}
                                        onChange={handleChange}
                                        required
                                        rows={4}
                                        placeholder="Please provide a brief reason for your leave request..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!isFormValid || isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        <span>Submit Leave Request</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* My Short Leaves Status - Compact */}
                    <div className={`bg-white rounded-xl shadow-md ${isSectionCollapsed ? 'p-3' : 'p-4'} self-start`}>
                        <button
                            type="button"
                            onClick={toggleSection}
                            className="w-full flex items-center justify-between hover:bg-gray-50 rounded-lg p-2 transition-colors"
                            aria-expanded={!isSectionCollapsed}
                        >
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold text-gray-900">My Leaves</h2>
                                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 min-w-[20px] text-center">
                                    {leavesCount}
                                </span>
                            </div>
                            {isSectionCollapsed ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                            )}
                        </button>

                        <div className={`transition-all duration-300 ease-in-out ${
                            isSectionCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[400px] opacity-100 overflow-auto'
                        }`}>
                            {!isSectionCollapsed && (
                                <div className="mt-3 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-gray-500">Recent requests</div>
                                        <button
                                            type="button"
                                            onClick={fetchMyShortLeaves}
                                            className="px-2 py-1 text-xs font-medium rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                                        >
                                            {isLoadingLeaves ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    Loading
                                                </span>
                                            ) : (
                                                'Refresh'
                                            )}
                                        </button>
                                    </div>

                                    {isLoadingLeaves ? (
                                        <div className="flex items-center justify-center py-4 text-gray-500">
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            <span className="text-xs">Loading...</span>
                                        </div>
                                    ) : myLeaves.length === 0 ? (
                                        <div className="flex items-center p-2 bg-gray-50 rounded-lg text-gray-600">
                                            <AlertCircle className="w-4 h-4 mr-2 text-gray-400" />
                                            <span className="text-xs">No leaves found</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                            {myLeaves.map((lv) => {
                                                const isExpanded = expandedIds.has(lv.id);
                                                const displayStatus = getDisplayStatus(lv);
                                                return (
                                                    <div key={lv.id} className="border border-gray-100 rounded-lg p-2 hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-medium text-gray-900 truncate text-xs">
                                                                    {lv.reason}
                                                                </p>
                                                                <p className="text-xs text-gray-500 truncate">
                                                                    {formatDateTime(lv.leave_date || lv.leavedate, lv.start_time || lv.startTime)}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusClass(displayStatus)}`}>
                                                                    {displayStatus}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleExpanded(lv.id)}
                                                                    className="text-xs px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-600"
                                                                >
                                                                    {isExpanded ? '−' : '+'}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                                                                {lv.applied_on && (
                                                                    <p><span className="text-gray-400">Applied:</span> {formatDateTime(lv.applied_on)}</p>
                                                                )}
                                                                <p><span className="text-gray-400">Date:</span> {formatDateTime(lv.leave_date || lv.leavedate)}</p>
                                                                <p><span className="text-gray-400">Time:</span> {formatDateTime(lv.leave_date || lv.leavedate, lv.start_time || lv.startTime)} - {formatDateTime(lv.leave_date || lv.leavedate, lv.end_time || lv.endTime)}</p>
                                                                {(lv.staffid || lv.erpid) && (
                                                                    <p><span className="text-gray-400">ID:</span> {lv.erpid || lv.staffid}</p>
                                                                )}
                                                                {/* Per-role statuses */}
                                                                <div className="flex flex-wrap gap-2 pt-1">
                                                                    <span className="text-gray-500">Status:</span>
                                                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${getStatusClass(lv.HodStatus || 'Pending')}`}>HOD: {lv.HodStatus || 'Pending'}</span>
                                                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${getStatusClass(lv.PrincipalRegistrar || 'Pending')}`}>Principal: {lv.PrincipalRegistrar || 'Pending'}</span>
                                                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${getStatusClass(lv.FinalStatus || 'Pending')}`}>Final: {lv.FinalStatus || 'Pending'}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShortLeaves;