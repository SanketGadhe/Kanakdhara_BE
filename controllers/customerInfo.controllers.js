const customerModel = require("../models/customerInfo.model");
const { sendMail } = require("../services/gmail.service");
const { getContactMailTemplate } = require("../static/mailTemplate");

// Input validation helpers
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
};

const validatePAN = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
};

const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]*>/g, '');
};

const validateAge = (age) => {
    const numAge = Number(age);
    return !isNaN(numAge) && numAge >= 18 && numAge <= 120;
};

// Controller to create a new customer
const createCustomer = async (req, res) => {
    try {
        const { name, email, phone, age, panCard } = req.body;

        // Validate required fields
        const requiredFields = ['name', 'email', 'phone'];
        const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].toString().trim() === '');

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields
            });
        }

        // Sanitize inputs
        const sanitizedData = {
            name: sanitizeInput(name),
            email: email.trim().toLowerCase(),
            phone: sanitizeInput(phone),
            age: age ? Number(age) : null,
            panCard: panCard ? sanitizeInput(panCard).toUpperCase() : null
        };

        // Validate email format
        if (!validateEmail(sanitizedData.email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate phone format
        if (!validatePhone(sanitizedData.phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        // Validate age if provided
        if (sanitizedData.age && !validateAge(sanitizedData.age)) {
            return res.status(400).json({
                success: false,
                message: 'Age must be between 18 and 120'
            });
        }

        // Validate PAN if provided
        if (sanitizedData.panCard && !validatePAN(sanitizedData.panCard)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid PAN card format (e.g., ABCDE1234F)'
            });
        }

        // Validate field lengths
        if (sanitizedData.name.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Name must be less than 100 characters'
            });
        }

        // Check if customer already exists
        const existingCustomer = await customerModel.findOne({ email: sanitizedData.email });

        if (existingCustomer) {
            // Send welcome email to existing customer
            try {
                await sendMail({
                    to: sanitizedData.email,
                    subject: "Welcome Back to Kanakdhara Investments",
                    htmlMessage: getContactMailTemplate({
                        name: existingCustomer.name,
                        email: existingCustomer.email,
                        phone: existingCustomer.phone,
                        message: "Thank you for your continued interest. We'll be in touch soon."
                    })
                });
            } catch (emailError) {
                console.error('Failed to send welcome email to existing customer:', emailError);
                // Don't fail the request if email fails
            }

            return res.status(200).json({
                success: true,
                message: 'Customer already exists',
                data: {
                    id: existingCustomer._id,
                    name: existingCustomer.name,
                    email: existingCustomer.email,
                    phone: existingCustomer.phone,
                    age: existingCustomer.age,
                    panCard: existingCustomer.panCard
                }
            });
        }

        // Create new customer if doesn't exist
        const newCustomer = new customerModel({
            name: sanitizedData.name,
            email: sanitizedData.email,
            phone: sanitizedData.phone,
            age: sanitizedData.age,
            panCard: sanitizedData.panCard,
        });

        const savedCustomer = await newCustomer.save();

        // Send welcome email to new customer
        try {
            await sendMail({
                to: sanitizedData.email,
                subject: "Welcome to Kanakdhara Investments",
                htmlMessage: getContactMailTemplate({
                    name: sanitizedData.name,
                    email: sanitizedData.email,
                    phone: sanitizedData.phone,
                })
            });
        } catch (emailError) {
            console.error('Failed to send welcome email to new customer:', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: {
                id: savedCustomer._id,
                name: savedCustomer.name,
                email: savedCustomer.email,
                phone: savedCustomer.phone,
                age: savedCustomer.age,
                panCard: savedCustomer.panCard,
                createdAt: savedCustomer.createdAt
            }
        });

    } catch (error) {
        console.error('Create customer error:', {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' ? error.message : 'Server Error: Unable to create customer'
        });
    }
};

// Controller to get customer by ID
const getCustomerById = async (req, res) => {
    try {
        const customerId = req.params.id;

        // Validate MongoDB ObjectId format
        if (!customerId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID format'
            });
        }

        const customer = await customerModel.findById(customerId).select('-__v');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            success: true,
            data: customer
        });

    } catch (error) {
        console.error('Get customer by ID error:', {
            message: error.message,
            customerId: req.params.id,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to fetch customer'
        });
    }
};
// Get all customers
const getAllCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, sortBy } = req.query;

        // Validate pagination parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100'
            });
        }

        // Build search query
        let query = {};
        if (search && search.trim()) {
            const searchTerm = sanitizeInput(search.trim());
            query = {
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } },
                    { phone: { $regex: searchTerm, $options: 'i' } }
                ]
            };
        }

        // Determine sort order - if sortBy is 'oldDate', sort by oldest first
        const sortOrder = sortBy === 'oldDate' ? { createdAt: 1 } : { createdAt: -1 };

        const skip = (pageNum - 1) * limitNum;

        const [customers, totalCount] = await Promise.all([
            customerModel.find(query)
                .select('-__v')
                .sort(sortOrder)
                .skip(skip)
                .limit(limitNum),
            customerModel.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.status(200).json({
            success: true,
            data: customers,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });

    } catch (error) {
        console.error('Get all customers error:', {
            message: error.message,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to fetch customers'
        });
    }
};

module.exports = {
    createCustomer,
    getCustomerById,
    getAllCustomers,
};