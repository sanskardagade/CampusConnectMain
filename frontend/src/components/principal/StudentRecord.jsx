import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

const AVAILABLE_FIELDS = [
  { key: "erpid", label: "ERP ID" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "department_name", label: "Department" },
  { key: "year", label: "Year" },
  { key: "semester", label: "Semester" },
  { key: "division", label: "Division" },
  { key: "roll_no", label: "Roll No" },
  { key: "gender", label: "Gender" },
  { key: "dob", label: "DOB" },
  { key: "contact_no", label: "Contact" },
];

const StudentRecord = () => {
  const [erpid, setErpid] = useState("");
  const [selectedFields, setSelectedFields] = useState([
    "erpid",
    "name",
    "email",
    "department_name",
  ]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {}, []);

  const columns = useMemo(() => selectedFields, [selectedFields]);

  const toggleField = (key) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        fields: columns.join(","),
      };
      if (erpid) params.erpid = erpid;
      const { data } = await api.get("/api/principal/student-records", { params });
      setRows(data.rows || []);
    } catch (e) {
      setError(e.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const exportFile = async (fmt) => {
    try {
      const params = {
        fields: columns.join(","),
        format: fmt,
      };
      if (erpid) params.erpid = erpid;
      const res = await api.get("/api/principal/student-records", {
        params,
        responseType: fmt === "csv" ? "blob" : "arraybuffer",
      });
      const blob = new Blob([res.data], {
        type:
          fmt === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fmt === "xlsx" ? "student_records.xlsx" : "student_records.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || "Export failed");
    }
  };

  return (
    <div className="p-4 w-full">
      <h2 className="text-xl font-semibold mb-3">Student Report</h2>

      <div className="flex gap-4 flex-wrap items-end mb-4">
        <div>
          <label className="block text-sm">Search by ERP ID</label>
          <input
            type="text"
            value={erpid}
            onChange={(e) => setErpid(e.target.value)}
            className="border rounded px-2 py-1 w-52"
            placeholder="Enter ERP ID"
          />
        </div>
        <button onClick={fetchData} className="bg-blue-600 text-white px-3 py-2 rounded">
          Fetch
        </button>
        <button onClick={() => exportFile("xlsx")} className="bg-emerald-600 text-white px-3 py-2 rounded">
          Export XLSX
        </button>
        <button onClick={() => exportFile("csv")} className="bg-gray-700 text-white px-3 py-2 rounded">
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
        {AVAILABLE_FIELDS.map((f) => (
          <label key={f.key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedFields.includes(f.key)}
              onChange={() => toggleField(f.key)}
            />
            {f.label}
          </label>
        ))}
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : rows.length === 0 ? (
        <div className="border rounded px-3 py-4">No data</div>
      ) : (
        <div className="space-y-4">
          {rows.map((r, idx) => (
            <div key={idx} className="overflow-auto border rounded">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-3 py-2">FIELD</th>
                    <th className="text-left px-3 py-2">VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map((c) => (
                    <tr key={c} className="border-t">
                      <th className="px-3 py-2 align-top font-semibold whitespace-nowrap">
                        {c.replace(/_/g, ' ').toUpperCase()}
                      </th>
                      <td className="px-3 py-2 break-all">{r[c] ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentRecord;


