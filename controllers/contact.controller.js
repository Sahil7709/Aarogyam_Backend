// Controller for contact message operations

import ContactMessage from '../models/ContactMessage.js';
import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// Submit contact message
export const submitContactMessage = asyncHandler(async (req, res, next) => {
  const { name, email, subject, message } = req.body;
  
  const contactMessage = new ContactMessage({
    name,
    email,
    subject,
    message,
  });
  
  await contactMessage.save();
  
  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    contactMessage,
  });
});

// Get contact messages (admin only)
export const getContactMessages = asyncHandler(async (req, res, next) => {
  // In a real app, you would check if user is admin
  // For now, we'll just return all messages
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
  res.json({
    success: true,
    count: messages.length,
    messages
  });
});

// Update contact message status (admin only)
export const updateContactMessageStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['unread', 'read', 'replied'];
  
  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse('Invalid status', 400));
  }
  
  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, lean: true }
  );
  
  if (!message) {
    return next(new ErrorResponse('Message not found', 404));
  }
  
  res.json({
    success: true,
    message: 'Contact message status updated successfully',
    contactMessage: message,
  });
});

// Delete contact message (admin only)
export const deleteContactMessage = asyncHandler(async (req, res, next) => {
  const message = await ContactMessage.findByIdAndDelete(req.params.id);
  
  if (!message) {
    return next(new ErrorResponse('Message not found', 404));
  }
  
  res.json({ 
    success: true,
    message: 'Contact message deleted successfully' 
  });
});