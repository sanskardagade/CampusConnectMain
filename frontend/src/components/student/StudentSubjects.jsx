import React, { useEffect, useState } from 'react';

const brandColors = {
  primary: "#b22b2f",
  secondary: "#d1a550",
  accent: "#6b6d71",
  primaryLight: "#d86a6d",
  secondaryLight: "#e8d4a3",
  accentLight: "#9a9ca0",
};

const StudentSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sample attendance data
  const attendanceData = [
    {
      subject_name: 'Data Structures',
      total_sessions: '5',
      present: '2',
      absent: '3',
      percentage: '40.00'
    },
    {
      subject_name: 'Discrete Functions',
      total_sessions: '1',
      present: '1',
      absent: '0',
      percentage: '100.00'
    }
  ];

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://69.62.83.14:9000/api/students/subjects', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch subjects from server');
        }

        const data = await res.json();
        
        if (data.success && data.data) {
          setSubjects(data.data);
        } else {
          setSubjects([]);
        }
        setError(null);
      } catch (err) {
        console.error(err);
        setError('No Subjects found');
        setSubjects([]);
      }
      setLoading(false);
    };

    fetchSubjects();
  }, []);

  const getAttendanceForSubject = (subjectName) => {
    return attendanceData.find(attendance => 
      attendance.subject_name.toLowerCase() === subjectName.toLowerCase()
    );
  };

  const getAttendanceColor = (percentage) => {
    const percent = parseFloat(percentage);
    if (percent >= 80) return '#22c55e'; // Green
    if (percent >= 60) return brandColors.secondary; // Yellow
    return brandColors.primary; // Red
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6" style={{ color: brandColors.primary }}>
        Your Subjects & Attendance
      </h1>

      {loading && (
        <div className="text-center text-gray-500">Loading...</div>
      )}

      {error && (
        <div className="text-center text-red-500">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.length === 0 ? (
            <div className="text-gray-500">No subjects found.</div>
          ) : (
            subjects.map((subj) => {
              const attendance = getAttendanceForSubject(subj.name);
              return (
                <div
                  key={subj.subject_id}
                  className="bg-white rounded-lg shadow-lg p-4 border-l-4 hover:shadow-xl transition-shadow"
                  style={{ borderColor: brandColors.primary }}
                >
                  <div className="font-semibold text-lg mb-2" style={{ color: brandColors.primary }}>
                    {subj.name}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Code: <span style={{ color: brandColors.secondary }}>{subj.subject_code}</span>
                  </div>
                  
                  {attendance && (
                    <div className="border-t pt-3 mt-3">
                      <div className="text-sm font-medium mb-2" style={{ color: brandColors.accent }}>
                        Attendance Summary
                      </div>
                      
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Sessions:</span>
                        <span className="text-sm text-blue-600 font-medium">{attendance.total_sessions}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Present:</span>
                        <span className="text-sm font-medium text-green-600">{attendance.present}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600">Absent:</span>
                        <span className="text-sm font-medium text-red-600">{attendance.absent}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Percentage:</span>
                        <span 
                          className="text-sm font-bold px-2 py-1 rounded"
                          style={{ 
                            color: getAttendanceColor(attendance.percentage),
                            backgroundColor: `${getAttendanceColor(attendance.percentage)}15`
                          }}
                        >
                          {attendance.percentage}%
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${attendance.percentage}%`,
                            backgroundColor: getAttendanceColor(attendance.percentage)
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-3">
                    Subject ID: {subj.subject_id}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}  
    </div>
  );
};

export default StudentSubjects;

// import React, { useEffect, useState } from 'react';

// const brandColors = {
//   primary: "#b22b2f",
//   secondary: "#d1a550",
//   accent: "#6b6d71",
//   primaryLight: "#d86a6d",
//   secondaryLight: "#e8d4a3",
//   accentLight: "#9a9ca0",
// };

// const StudentSubjects = () => {
//   const [subjects, setSubjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchSubjects = async () => {
//       setLoading(true);
//       try {
//         const token = localStorage.getItem('token');
//         const res = await fetch('http://69.62.83.14:9000/api/students/subjects', {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         if (!res.ok) {
//           throw new Error('Failed to fetch subjects from server');
//         }

//         const data = await res.json();
//         setSubjects(data.result || []);
//         setError(null);
//       } catch (err) {
//         console.error(err);
//         setError('No Subjects found');
//       }
//       setLoading(false);
//     };

//     fetchSubjects();
//   }, []);

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-6" style={{ color: brandColors.primary }}>
//         Your Subjects
//       </h1>

//       {loading && (
//         <div className="text-center text-gray-500">Loading...</div>
//       )}

//       {error && (
//         <div className="text-center text-red-500">{error}</div>
//       )}

//       {!loading && !error && (
//         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//           {subjects.length === 0 ? (
//             <div className="text-gray-500">No subjects found.</div>
//           ) : (
//             subjects.map((subj) => (
//               <div
//                 key={subj.subject_id}
//                 className="bg-white rounded-lg shadow p-4 border-l-4"
//                 style={{ borderColor: brandColors.primary }}
//               >
//                 <div className="font-semibold text-lg" style={{ color: brandColors.primary }}>
//                   {subj.name}
//                 </div>
//                 <div className="text-sm text-gray-600 mt-1">
//                   Code: <span style={{ color: brandColors.secondary }}>{subj.subject_code}</span>
//                 </div>
//                 <div className="text-xs text-gray-400 mt-2">
//                   Subject ID: {subj.subject_id}
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       )}  
//     </div>
//   );
// };

// export default StudentSubjects;
