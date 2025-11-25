// Controller for medical report-related operations

import MedicalReport from '../models/MedicalReport.js';
import { getReportStatistics, normalizeTestResults, getAbnormalValues } from '../utils/reportUtils.js';

// Create a new medical report
export const createMedicalReport = async (req, res) => {
  try {
    const { title, reportType, date, doctor, hospital, results, attachments, notes } = req.body;
    
    // Normalize test results based on report type
    const normalizedResults = normalizeTestResults(results, reportType);
    
    const report = new MedicalReport({
      userId: req.user.userId,
      title,
      reportType,
      date,
      doctor,
      hospital,
      results: normalizedResults,
      attachments,
      notes,
    });
    
    await report.save();
    
    res.status(201).json({
      message: 'Medical report created successfully',
      report,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user medical reports
export const getUserMedicalReports = async (req, res) => {
  try {
    const reports = await MedicalReport.find({ userId: req.user.userId })
      .sort({ date: -1 });
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get specific medical report
export const getMedicalReportById = async (req, res) => {
  try {
    const report = await MedicalReport.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update medical report
export const updateMedicalReport = async (req, res) => {
  try {
    const { title, reportType, date, doctor, hospital, results, attachments, notes } = req.body;
    
    const report = await MedicalReport.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
      },
      {
        title,
        reportType,
        date,
        doctor,
        hospital,
        results,
        attachments,
        notes,
      },
      { new: true }
    );
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json({
      message: 'Medical report updated successfully',
      report,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete medical report
export const deleteMedicalReport = async (req, res) => {
  try {
    const report = await MedicalReport.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json({ message: 'Medical report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user medical report statistics
export const getMedicalReportStats = async (req, res) => {
  try {
    const reports = await MedicalReport.find({ userId: req.user.userId })
      .sort({ date: -1 });
    
    const stats = getReportStatistics(reports);
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get abnormal values in a report
export const getReportAbnormalities = async (req, res) => {
  try {
    const report = await MedicalReport.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    const abnormalities = getAbnormalValues(report.results, report.reportType);
    
    res.json({
      reportId: report._id,
      reportType: report.reportType,
      abnormalities
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};