const customerModel = require("../models/customerInfo.model");
const { sendMail } = require("../services/gmail.service");
const { getContactMailTemplate } = require("../static/mailTemplate");

// Controller to create a new customer
const createCustomer = async (req, res) => {
    try {
        const { name, email, phone, age, panCard } = req.body;
        const newCustomer = new customerModel({
            name,
            email,
            phone,
            age,
            panCard,
        });
        const savedCustomer = await newCustomer.save();

        await sendMail(
            {
                to: email,
                subject: "Welcome to Kanakdhara Investments",
                htmlMessage: getContactMailTemplate(
                    { name: name, email: email, phone: phone, message: "Meet you soon" }
                )
            }
        )
        res.status(201).json(savedCustomer);
    } catch (error) {
        res.status(500).json({ error: "Server Error: Unable to create customer.", detail: error });
    }
};

// Controller to get customer by ID
const getCustomerById = async (req, res) => {
    try {
        const customerId = req.params.id;
        const customer = await customerModel.findById(customerId);
        if (!customer) {
            return res.status(404).json({ error: "Customer not found." });
        }
        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ error: "Server Error: Unable to fetch customer." });
    }
};
// Get all customers
const getAllCustomers = async (req, res) => {
    try {
        const customers = await customerModel.find();
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ error: "Server Error: Unable to fetch customers." });
    }
};

module.exports = {
    createCustomer,
    getCustomerById,
    getAllCustomers,
};