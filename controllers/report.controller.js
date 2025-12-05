// Controller for medical report-related operations

import MedicalReport from '../models/MedicalReport.js';
import { getReportStatistics, normalizeTestResults, getAbnormalValues } from '../utils/reportUtils.js';
import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// Create a new medical report
export const createMedicalReport = asyncHandler(async (req, res, next) => {
  const { category, date, results, attachments, notes } = req.body;
  
  // Normalize test results based on report type
  const normalizedResults = normalizeTestResults(results, category);
  
  const report = new MedicalReport({
    userId: req.user.userId,
    category,
    date,
    results: normalizedResults,
    attachments,
    notes,
  });
  
  await report.save();
  
  res.status(201).json({
    success: true,
    message: 'Medical report created successfully',
    report,
  });
});

// Get user medical reports
export const getUserMedicalReports = asyncHandler(async (req, res, next) => {
  // Use lean() for better performance
  const reports = await MedicalReport.find({ userId: req.user.userId })
    .sort({ date: -1 })
    .lean();
  
  res.json({
    success: true,
    count: reports.length,
    reports
  });
});

// Get specific medical report
export const getMedicalReportById = asyncHandler(async (req, res, next) => {
  // Use lean() for better performance
  const report = await MedicalReport.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  }).lean();
  
  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }
  
  res.json({
    success: true,
    report
  });
});

// Update medical report
export const updateMedicalReport = asyncHandler(async (req, res, next) => {
  const { category, date, results, attachments, notes } = req.body;
  
  // Check if report exists and belongs to user
  const existingReport = await MedicalReport.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  });
  
  if (!existingReport) {
    return next(new ErrorResponse('Report not found', 404));
  }
  
  // Update the report
  const report = await MedicalReport.findByIdAndUpdate(
    req.params.id,
    {
      category,
      date,
      results,
      attachments,
      notes,
    },
    { new: true, lean: true }
  );
  
  res.json({
    success: true,
    message: 'Medical report updated successfully',
    report,
  });
});

// Delete medical report
export const deleteMedicalReport = asyncHandler(async (req, res, next) => {
  const report = await MedicalReport.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.userId,
  });
  
  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }
  
  res.json({ 
    success: true,
    message: 'Medical report deleted successfully' 
  });
});

// Get user medical report statistics
export const getMedicalReportStats = asyncHandler(async (req, res, next) => {
  // Use lean() for better performance
  const reports = await MedicalReport.find({ userId: req.user.userId })
    .sort({ date: -1 })
    .lean();
  
  const stats = getReportStatistics(reports);
  
  res.json({
    success: true,
    stats
  });
});

// Get abnormal values in a report
export const getReportAbnormalities = asyncHandler(async (req, res, next) => {
  const report = await MedicalReport.findOne({
    _id: req.params.id,
    userId: req.user.userId,
  });
  
  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }
  
  const abnormalities = getAbnormalValues(report.results, report.category);
  
  res.json({
    success: true,
    reportId: report._id,
    reportType: report.category,
    abnormalities
  });
});