const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const client = new Client();

// WhatsApp authentication
client.on('qr', (qr) => {
    // Clear terminal before showing QR
    console.clear();
    console.log('Scan the QR code below to authenticate:');
    console.log('\n');
    qrcode.generate(qr, { small: true });
    console.log('\n');
    console.log('Waiting for scan...');
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

// Initialize WhatsApp client
client.initialize();

// Endpoint to send message
app.get('/send-message', async (req, res) => {
    try {
        const { message, number } = req.query;
        
        if (!message || !number) {
            return res.status(400).json({ error: 'Message and number are required' });
        }

        // Format the number (add country code if not present)
        const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;

        // Send message
        await client.sendMessage(formattedNumber, message);
        
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});