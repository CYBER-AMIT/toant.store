 // controllers/supportController.js
const Ticket = require('../models/ticketModel');
const Sponsorship = require('../models/sponsorshipModel');

// Controller function to submit a new ticket
exports.submitTicket = async (req, res) => {
    try {
         
        const { userName, userEmail, subject, problemDescription } = req.body;

        console.log("Server received ticket data:", { userName, userEmail, subject, problemDescription });  

        // Basic validation (can be enhanced with Joi/Express-validator)
        if (!userName || !userEmail || !subject || !problemDescription) {
            console.log("Validation failed: Missing fields for ticket submission."); 
            return res.status(400).json({ success: false, message: 'All required ticket fields must be filled.' });
        }

        const newTicket = new Ticket({
            userName,
            userEmail,
            subject,
            problemDescription
        });

        await newTicket.save();
        res.status(201).json({
            success: true,
            message: 'Ticket submitted successfully!',
            ticketId: newTicket.ticketId // Send the generated ticket ID back to the frontend
        });
    } catch (error) {
        console.error('Error submitting ticket:', error);
        res.status(500).json({ success: false, message: 'Failed to submit ticket', error: error.message });
    }
};

// Controller function to submit a sponsorship request  
exports.submitSponsorship = async (req, res) => {
    try {
        const { sponsorName, sponsorProjectName, sponsorProjectLink, sponsorBusinessEmail, userNeed, budget, projectDescription } = req.body;

        // Basic validation
        if (!sponsorName || !sponsorProjectName || !sponsorBusinessEmail || !userNeed || !projectDescription) {
            return res.status(400).json({ success: false, message: 'All required sponsorship fields must be filled.' });
        }

        const newSponsorship = new Sponsorship({
            sponsorName,
            sponsorProjectName,
            sponsorProjectLink,
            sponsorBusinessEmail,
            userNeed,
            budget,
            projectDescription
        });

        await newSponsorship.save();
        res.status(201).json({ success: true, message: 'Sponsorship application submitted successfully!' });
    } catch (error) {
        console.error('Error submitting sponsorship:', error);
        res.status(500).json({ success: false, message: 'Failed to submit sponsorship application', error: error.message });
    }
};