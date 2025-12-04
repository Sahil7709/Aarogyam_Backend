import ChatConversation from '../models/ChatConversation.js';
import { processMedicalMessage } from '../utils/medicalNLP.js';
import mongoose from 'mongoose';

// Create a new chat conversation
export const createConversation = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user.userId; // Extracted from JWT token by auth middleware

    const conversation = new ChatConversation({
      userId,
      title: title || 'Medical Consultation'
    });

    await conversation.save();

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Get all conversations for a user
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    const conversations = await ChatConversation.find({ userId })
      .select('-messages') // Don't include messages in the list
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Get a specific conversation by ID
export const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Validate conversation ID
    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }

    const conversation = await ChatConversation.findOne({
      _id: id,
      userId
    }).populate('userId', 'name email');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Add a message to a conversation and generate AI response
export const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { sender, content } = req.body;
    const userId = req.user.userId;

    // Validate conversation ID
    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }

    // Validate sender
    if (!['user', 'ai'].includes(sender)) {
      return res.status(400).json({
        success: false,
        message: 'Sender must be either "user" or "ai"'
      });
    }

    // Find the conversation
    const conversation = await ChatConversation.findOne({
      _id: id,
      userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Add the user message
    conversation.messages.push({
      sender,
      content
    });

    // If this is a user message, generate an AI response
    if (sender === 'user') {
      // Process the message with our NLP utility
      const analysis = processMedicalMessage(content);
      
      // Add the AI response to the conversation
      conversation.messages.push({
        sender: 'ai',
        content: analysis.response
      });
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Delete a conversation
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Validate conversation ID
    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }

    const conversation = await ChatConversation.findOneAndDelete({
      _id: id,
      userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};