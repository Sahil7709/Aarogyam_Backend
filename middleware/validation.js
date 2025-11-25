// Validation middleware for the Aarogyam backend

const validateRegistration = (req, res, next) => {
  const { name, email, password, phone } = req.body;
  
  // Either email or phone is required
  if (!email && !phone) {
    return res.status(400).json({
      message: 'Either email or phone number is required'
    });
  }
  
  // If email is provided, validate it
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Invalid email format'
      });
    }
    
    if (!password || password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }
  }
  
  // If phone is provided, validate it
  if (phone) {
    // Simple phone validation (you might want to use a more comprehensive regex)
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        message: 'Invalid phone number format'
      });
    }
  }
  
  if (!name) {
    return res.status(400).json({
      message: 'Name is required'
    });
  }
  
  next();
};

const validateAppointment = (req, res, next) => {
  const { name, phone, email, date, time } = req.body;
  
  // Validate required fields (matching our new structure)
  if (!name || !phone || !email || !date || !time) {
    return res.status(400).json({
      message: 'Name, phone, email, date, and time are required'
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Invalid email format'
    });
  }
  
  // Validate phone number
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({
      message: 'Invalid phone number format'
    });
  }
  
  // Validate date format
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({
      message: 'Invalid date format'
    });
  }
  
  // Validate that appointment is not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dateObj < today) {
    return res.status(400).json({
      message: 'Appointment date cannot be in the past'
    });
  }
  
  next();
};

const validateMedicalReport = (req, res, next) => {
  const { title, reportType, date } = req.body;
  
  // Validate required fields
  if (!title || !reportType || !date) {
    return res.status(400).json({
      message: 'Title, report type, and date are required'
    });
  }
  
  // Validate date format
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({
      message: 'Invalid date format'
    });
  }
  
  // Validate report type
  const validReportTypes = ['blood-test', 'urine-test', 'x-ray', 'mri', 'ct-scan', 'ecg', 'other'];
  if (!validReportTypes.includes(reportType)) {
    return res.status(400).json({
      message: 'Invalid report type'
    });
  }
  
  next();
};

const validateContactMessage = (req, res, next) => {
  const { name, email, subject, message } = req.body;
  
  // Validate required fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      message: 'Name, email, subject, and message are required'
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Invalid email format'
    });
  }
  
  // Validate message length
  if (message.length < 10) {
    return res.status(400).json({
      message: 'Message must be at least 10 characters long'
    });
  }
  
  next();
};

export {
  validateRegistration,
  validateAppointment,
  validateMedicalReport,
  validateContactMessage
};