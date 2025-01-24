const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoicePDF = async (invoice) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });

        // Define the file path for saving the PDF
        const filePath = path.join(__dirname, `../invoices/invoice_${invoice.tripId}.pdf`);
        const stream = fs.createWriteStream(filePath);

        // Handle error in case something goes wrong with file stream
        stream.on('error', (err) => {
            console.error('Error writing PDF to file:', err);
            reject(err);
        });

        // Pipe the PDF content to the file stream
        doc.pipe(stream);

        // Header Section
        doc.fontSize(20).text('Travel Invoice', { align: 'center', underline: true });
        doc.moveDown(1.5);

        // Company Information (Placeholder)
        doc.fontSize(12).text('Gokulam Travles', { align: 'left' });
        doc.text('Your Company Address');
        doc.text('Your City, Your State, Your ZIP Code');
        doc.text('Phone: 123-456-7890');
        doc.moveDown();

        // Invoice Information
        doc.fontSize(12).text(`Invoice Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.text(`Invoice ID: ${invoice.tripId}`, { align: 'right' });
        doc.moveDown(2);

        // Customer and Driver Info in two columns
        doc.fontSize(12).text(`Customer Name: ${invoice.customerName}`, { align: 'left' });
        doc.text(`Customer Email: ${invoice.customerEmail}`, { align: 'left' });
        doc.moveDown();
        doc.text(`Driver: ${invoice.driver}`, { align: 'left' });
        doc.text(`Car: ${invoice.car}`, { align: 'left' });
        doc.moveDown(1.5);

        // Divider Line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1.5);

        // Trip Details Section
        doc.fontSize(14).text('Trip Details', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Trip Start Date: ${new Date(invoice.tripDate).toLocaleDateString()}`);
        doc.text(`Trip End Date: ${new Date(invoice.tripEndDate).toLocaleDateString()}`);
        doc.text(`Total Kilometers: ${invoice.tripKm} km`);
        doc.text(`Remarks: ${invoice.remarks || 'N/A'}`);
        doc.moveDown(1.5);

        // Divider Line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1.5);

        // Payment Details Section
        doc.fontSize(14).text('Payment Details', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Trip Advance: Rs.${invoice.tripAdvance}`);
        doc.text(`Trip Balance: Rs.${invoice.tripBalance}`);
        doc.text(`Trip Discount: Rs.${invoice.discount}`);
        doc.text(`Trip Expense: Rs.${invoice.tripExpense}`);
        doc.text(`Trip Total Income: Rs.${invoice.tripIncome}`);
        doc.text(`Amount Paid: Rs.${invoice.tripAdvance}`);
        doc.text(`Amount Due: Rs.${invoice.tripBalance + invoice.tripExpense}`);
        doc.text(`Payment Date: ${new Date(invoice.paymentDate).toLocaleDateString()}`);
        doc.moveDown(2);

        // Footer with thank you note
        doc.fontSize(10).text('Thank you for choosing our services!', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(10).text('For any inquiries regarding this invoice, please contact us at 123-456-7890', { align: 'center' });

        // Finalize the PDF and close the stream
        doc.end();

        // Handle the finish event to resolve the Promise after file is fully written
        stream.on('finish', () => {
            resolve(filePath); // Resolve with file path after successful creation
        });
    });
};

module.exports = { generateInvoicePDF };
