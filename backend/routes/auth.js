const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Hod = require('../models/Hod');
const PrincipalModel = require('../models/Principal');

// Login user
router.post('/login', async (req, res) => {
  try {
    const { erpstaffid, password, role } = req.body;
    console.log('Login attempt:', { erpstaffid, role });

    // Faculty login: authenticate against faculty table
    if (role === 'faculty') {
      const facultyRec = await Faculty.findByErpStaffId(erpstaffid);
      if (!facultyRec) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const isMatchFaculty = await Faculty.comparePassword(password, facultyRec.passwordHash);
      if (!isMatchFaculty) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      // Create JWT token for faculty
      const token = jwt.sign(
        { erpStaffId: facultyRec.erpStaffId, role: 'faculty' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      // Return faculty data and token
      return res.json({
        token,
        user: {
          erpStaffId: facultyRec.erpStaffId,
          name: facultyRec.name,
          role: 'faculty'
        }
      });
    }

    // HOD login
    if (role === 'hod') {
      console.log('Attempting HOD login for ERP ID:', erpstaffid);
      const hodRec = await Hod.findByErpStaffId(erpstaffid);
      console.log('HOD record found:', hodRec);

      if (!hodRec) {
        console.log('No HOD record found for ERP ID:', erpstaffid);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!hodRec.isActive) {
        console.log('HOD account is inactive for ERP ID:', erpstaffid);
        return res.status(401).json({ message: 'Account is inactive' });
      }

      console.log('Comparing passwords for HOD...');
      const isMatch = await Hod.comparePassword(password, hodRec.passwordHash);
      console.log('Password match result:', isMatch);

      if (!isMatch) {
        console.log('Password does not match for HOD');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log('HOD login successful, generating token...');
      console.log('HOD department ID:', hodRec.departmentId);
      
      const token = jwt.sign(
        { 
          id: hodRec.id,
          erpStaffId: hodRec.erpStaffId,
          role: 'hod',
          departmentId: hodRec.departmentId
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('HOD login successful, sending response...');
      res.json({
        token,
        user: {
          id: hodRec.id,
          erpStaffId: hodRec.erpStaffId,
          name: hodRec.name,
          email: hodRec.email,
          role: 'hod',
          department: hodRec.departmentId
        }
      });
      return;
    }

    // Principal login: authenticate against principal data
    if (role === 'principal') {
      console.log('Attempting principal login for:', erpstaffid);
      
      const principalRec = await PrincipalModel.findByErp(erpstaffid);
      console.log('Found principal record:', principalRec ? 'Yes' : 'No');
      
      if (!principalRec) {
        console.log('Principal not found');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check if account is active
      if (!principalRec.isActive) {
        console.log('Principal account is inactive');
        return res.status(401).json({ message: 'Account is inactive' });
      }

      console.log('Comparing passwords...');
      const isMatchPrincipal = await PrincipalModel.comparePassword(password, principalRec.passwordHash);
      console.log('Password match result:', isMatchPrincipal);

      if (!isMatchPrincipal) {
        console.log('Password does not match');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create JWT token for principal
      const token = jwt.sign(
        { id: principalRec.erpid, role: 'principal' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Login successful, returning token and user data');
      return res.json({
        token,
        user: {
          id: principalRec.erpid,
          erpStaffId: principalRec.erpid,
          name: principalRec.name,
          email: principalRec.email,
          role: 'principal'
        }
      });
    }

    // If role is not recognized
    return res.status(400).json({ message: 'Invalid role' });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 