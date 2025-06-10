const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const path = require('path');
const fontkit = require('fontkit');

 

const generateInvoicePDF = async (trip, format = 'pdf') => {
    try {
        const templatePath = path.join(__dirname, '../services/template.pdf');
        const outputPath = path.join(__dirname, `../invoices/invoice_${trip.tripId}.${format}`);
        const templateBytes = fs.readFileSync(templatePath);

        const pdfDoc = await PDFDocument.load(templateBytes);
        pdfDoc.registerFontkit(fontkit);

        const montserratFontPath = path.join(__dirname, 'Montserrat-Regular.ttf');
        const montserratFontBytes = fs.readFileSync(montserratFontPath);
        const montserratFont = await pdfDoc.embedFont(montserratFontBytes);

        const montserratBoldFontPath = path.join(__dirname, 'Montserrat-SemiBold.ttf');
        const montserratBoldFontBytes = fs.readFileSync(montserratBoldFontPath);
        const montserratBoldFont = await pdfDoc.embedFont(montserratBoldFontBytes);

        const montserratFullBoldFontPath = path.join(__dirname, 'Montserrat-Bold.ttf');
        const montserratFullBoldFontBytes = fs.readFileSync(montserratFullBoldFontPath);
        const montserratFullBoldFont = await pdfDoc.embedFont(montserratFullBoldFontBytes);

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        

        const invo = {
            car: trip.car,
            car_no: trip.car_no,
            driver: trip.driver,
            customerName: trip.customerName,
            customerEmail: trip.customerEmail,
            tripId: trip.tripId,
            tripInvo : trip.invoiceNo,
            tripStartDate: new Date(trip.tripStartDate).toLocaleDateString(),
            tripEndDate:   new Date(trip.tripEndDate).toLocaleDateString(),
            tripAdvance: trip.tripAdvance,
            tripBalance: trip.tripBalance,
            tripStart : trip.tripStartKm,
            tripEnd : trip.tripEndKm,
            tripKm: trip.tripKm,
            tripgst: trip.gstPercentage,
            tripgstAmt: trip.gstAmount,
            paymentDate: new Date(trip.paymentDate).toLocaleDateString(),
            discount: trip.discount,
            tripExpense: trip.tripExpense,
        };
        let currentY = 550;
    const leftColumnX = 50;
    const rightColumnX = 400;
    const lineSpacing = 25;

    firstPage.drawText(`Invoice No: ${invo.tripInvo}`, { 
        x: leftColumnX + 150, 
        y: currentY, 
        size: 14, 
        color: rgb(0, 0, 0),
        font: montserratFullBoldFont
    });
    currentY -= lineSpacing + 10;

    firstPage.drawText(`Customer Name:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(`${invo.customerName}`, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;

    firstPage.drawText(`Customer Email:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(`${invo.customerEmail}`, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;

    firstPage.drawText(`Driver:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(`${invo.driver}`, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;

    firstPage.drawText(`Vehicle:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(`${invo.car}`, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;

    firstPage.drawText(`Vehicle No:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(`${invo.car_no}`, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;

    firstPage.drawText(`Trip Date:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(invo.tripStartDate, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;

    firstPage.drawText(`Trip End Date:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(invo.tripEndDate, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;

    firstPage.drawText(`Trip StartKm:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(`${invo.tripStart} km`, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;

    firstPage.drawText(`Trip EndKm:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(`${invo.tripEnd} km`, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;

    firstPage.drawText(`Trip Distance:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(`${invo.tripKm} km`, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;

    firstPage.drawText(`Advance:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(`Rs .${invo.tripAdvance}`, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;

    

    firstPage.drawText(`Gst %:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(`${invo.tripgst}%`, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;

    firstPage.drawText(`Gst Amount:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(`Rs.${invo.tripgstAmt}`, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;


    firstPage.drawText(`Discount:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(`Rs.${invo.discount}`, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;


    firstPage.drawText(`Trip Expense:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(`Rs.${invo.tripExpense}`, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;
    
    firstPage.drawText(`Balance:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(`Rs.${invo.tripBalance}`, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });
    currentY -= lineSpacing;


    firstPage.drawText(`Payment Date:`, { x: leftColumnX, y: currentY, size: 12, font: montserratBoldFont });
    firstPage.drawText(invo.paymentDate, { x: rightColumnX, y: currentY, size: 12, font: montserratFont });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

   
     return outputPath;
        // Continue with PDF generation...
    } catch (error) {
        console.error("Error in generateInvoicePDF:", error);
    }
};





module.exports = {generateInvoicePDF}; // Export the function to be used elsewhere