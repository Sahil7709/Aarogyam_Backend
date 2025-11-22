// Validation middleware for the Aarogyam backend

const validateRegistration = (req, res, next) => {
  const { name, email, password, phone } = req.body;
  
  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      message: 'Name, email, and password are required'
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Invalid email format'
    });
  }
  
  // Validate password strength (at least 6 characters)
  if (password.length < 6) {
    return res.status(400).json({
      message: 'Password must be at least 6 characters long'
    });
  }
  
  // Validate phone number (if provided)
  if (phone) {
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        message: 'Invalid phone number format'
      });
    }
  }
  
  next();
};

const validateAppointment = (req, res, next) => {
  const { doctorId, date, time, reason } = req.body;
  
  // Validate required fields
  if (!doctorId || !date || !time || !reason) {
    return res.status(400).json({
      message: 'Doctor, date, time, and reason are required'
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