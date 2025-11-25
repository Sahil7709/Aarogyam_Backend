// Controller for contact message operations

import ContactMessage from '../models/ContactMessage.js';

// Submit contact message
export const submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    const contactMessage = new ContactMessage({
      name,
      email,
      subject,
      message,
    });
    
    await contactMessage.save();
    
    res.status(201).json({
      message: 'Message sent successfully',
      contactMessage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get contact messages (admin only)
export const getContactMessages = async (req, res) => {
  try {
    // In a real app, you would check if user is admin
    // For now, we'll just return all messages
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update contact message status (admin only)
export const updateContactMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['unread', 'read', 'replied'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json({
      message: 'Contact message status updated successfully',
      contactMessage: message,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete contact message (admin only)
export const deleteContactMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};