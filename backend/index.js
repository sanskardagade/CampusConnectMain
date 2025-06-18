const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authenticateToken = require('./middleware/auth');
const sql = require('./config/neonsetup');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const facultyRoutes = require('./routes/faculty');
const hodRoutes = require('./routes/hod');
const principalRoutes = require('./routes/principal');
const chatbotRoutes = require('./routes/chatbot');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/chatbot', chatbotRoutes);


app.get('/api/hod/faculty-log', authenticateToken, async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM faculty_logs
    `;
    res.json(rows);
  } catch (error) {
    console.error("Error fetching faculty log:", error);
    res.status(500).json({ message: "Error fetching faculty log" });
  }
});

//HOD Leave Approval
app.get('/api/hod/leave-approval', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM faculty_leave
      WHERE "HodApproval" = 'Pending'
    `;
    console.log(rows);
    res.json(rows);
  } catch (error) {
    console.error("Detailed error in /leave-approval route:", error);
    res.status(500).json({ message: "Error fetching all leave applications" });
  }
});

app.put('/api/hod/leave-approval/:erpStaffId', async (req, res) => {
  const { erpStaffId } = req.params;
  const { HodApproval } = req.body;

  try {
    // Validate the approval status
    if (!['Approved', 'Rejected'].includes(HodApproval)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }

    if (HodApproval === 'Rejected') {
      // If rejected, update all status fields to Rejected
      await sql`
        UPDATE faculty_leave 
        SET "HodApproval" = ${HodApproval},
            "PrincipalApproval" = 'Rejected',
            "FinalStatus" = 'Rejected'
        WHERE "ErpStaffId" = ${erpStaffId}
      `;
    } else {
      // If approved, only update HOD approval
      await sql`
        UPDATE faculty_leave 
        SET "HodApproval" = ${HodApproval}
        WHERE "ErpStaffId" = ${erpStaffId}
      `;
    }
    res.json({ message: 'Leave approval updated successfully' });
  } catch (error) {
    console.error('Error updating leave approval:', error);
    res.status(500).json({ error: 'Error updating leave approval' });
  }
});

//Principal Leave Approval
app.get('/api/principal/faculty-leave-approval', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM faculty_leave
      WHERE "HodApproval" = 'Approved'
    `;
    console.log(rows);
    res.json(rows);
  } catch (error) {
    console.error("Detailed error in /leave-approval route:", error);
    res.status(500).json({ message: "Error fetching all leave applications" });
  }
});

app.put('/api/principal/faculty-leave-approval/:erpStaffId', async (req, res) => {
  const { erpStaffId } = req.params;
  const { PrincipalApproval} = req.body;

  try {
    // Validate the approval status
    if (!['Approved', 'Rejected'].includes(PrincipalApproval)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }

    // Update both PrincipalApproval and FinalStatus
    await sql`
      UPDATE faculty_leave 
      SET "PrincipalApproval" = ${PrincipalApproval},
          "FinalStatus" = ${PrincipalApproval}
      WHERE "ErpStaffId" = ${erpStaffId}
    `;
    res.json({ message: 'Leave approval updated successfully' });
  } catch (error) {
    console.error('Error updating leave approval:', error);
    res.status(500).json({ error: 'Error updating leave approval' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Test database connection and start server
async function startServer() {
  try {
    // Test the database connection
    const result = await sql`SELECT version()`;
    console.log('✅ Successfully connected to Neon DB');
    console.log('📦 PostgreSQL Version:', result[0].version);

    // Start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
    process.exit(1);
  }
}

// Start the server
startServer();