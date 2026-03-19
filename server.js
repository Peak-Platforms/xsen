const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ─── HEALTH CHECK FIRST ───────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// ─── MAIN PAGE ROUTING ────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/sooners', (req, res) => {
    res.sendFile(path.join(__dirname, 'sooners.html'));
});

app.get('/okstate', (req, res) => {
    res.sendFile(path.join(__dirname, 'okstate.html'));
});

app.get('/longhorns', (req, res) => {
    res.sendFile(path.join(__dirname, 'longhorns.html'));
});

// ─── STATIC PAGE ROUTES ───────────────────────────────
app.get('/landing.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

app.get('/channels.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'channels.html'));
});
app.get('/manifesto.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'manifesto.html'));
});
// ─── CHAT APP ROUTING ─────────────────────────────────
app.get('/sooners/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'sooners/app.html'));
});

app.get('/okstate/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'okstate/app.html'));
});

app.get('/longhorns/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'longhorns/app.html'));
});

// ─── LOGIN ROUTING ────────────────────────────────────
app.get('/sooners/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'sooners/login.html'));
});

app.get('/okstate/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'okstate/login.html'));
});

app.get('/longhorns/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'longhorns/login.html'));
});

// ─── SUBDOMAIN REDIRECTS (keep for 30 days) ───────────
app.use((req, res, next) => {
    const hostname = req.hostname;
    if (hostname === 'sooners.xsen.fun') {
        return res.redirect(301, `https://xsen.fun/sooners${req.path === '/' ? '' : req.path}`);
    }
    if (hostname === 'okstate.xsen.fun') {
        return res.redirect(301, `https://xsen.fun/okstate${req.path === '/' ? '' : req.path}`);
    }
    if (hostname === 'longhorns.xsen.fun') {
        return res.redirect(301, `https://xsen.fun/longhorns${req.path === '/' ? '' : req.path}`);
    }
    next();
});

// ─── STATIC FILES LAST ────────────────────────────────
app.use(express.static(__dirname));

// ─── HANDLE SIGTERM GRACEFULLY ────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
