const express = require('express');
const path = require('path');
const { Resend } = require('resend');
const app = express();
const PORT = process.env.PORT || 3000;

const resendManifesto = new Resend(process.env.RESEND_API_KEY_MANIFESTO);

// ─── MIDDLEWARE ───────────────────────────────────────
app.use(express.json());

// ─── HEALTH CHECK FIRST ───────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// ─── MANIFESTO SIGNUP ─────────────────────────────────
app.post('/api/manifesto-signup', async (req, res) => {
    const { email, school, source } = req.body;
    const isPEWatch = source === 'pe_watch';
    const schoolName = school || 'your school';

    try {
        await resendManifesto.emails.send({
            from: 'Kevin at XSEN <kevin@mail.xsen.fun>',
            to: email,
            subject: isPEWatch
                ? "You're on the PE Watch list — XSEN"
                : `We got you — ${schoolName} is coming to XSEN`,
            html: isPEWatch ? `
                <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2A2520">
                    <div style="background:#0F0E0D;padding:2rem;text-align:center;margin-bottom:2rem">
                        <span style="font-family:Arial Black,sans-serif;font-size:2rem;color:#C9A84C">X</span><span style="font-family:Arial Black,sans-serif;font-size:2rem;color:#fff">SEN</span>
                        <p style="color:#D9D2C5;font-style:italic;font-size:0.85rem;margin-top:0.5rem">The Fan's Network™</p>
                    </div>
                    <p style="font-size:1.1rem;line-height:1.8">You're on the watch list.</p>
                    <p style="line-height:1.8">These PE moves happen fast and quiet — Project Rudy, the Big Ten's Evercore process, the Palace Project at OU. We're watching all of it. When something breaks that affects your school, you'll hear from us before it hits the headlines.</p>
                    <p style="line-height:1.8">No spam. Just the deals that matter.</p>
                    <div style="border-left:3px solid #8B0000;padding-left:1rem;margin:2rem 0;font-style:italic;color:#5C5247">"College sports belongs to the fans. No boardroom ever built this. No PE firm ever will."</div>
                    <p style="line-height:1.8">— Kevin Whitaker<br><span style="font-size:0.85rem;color:#5C5247">Founder, XSEN — The Fan's Network™</span></p>
                    <hr style="border:none;border-top:1px solid #D9D2C5;margin:2rem 0"/>
                    <p style="font-size:0.8rem;color:#5C5247">You signed up at thefansnetwork.fun. Reply anytime.</p>
                </div>
            ` : `
                <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2A2520">
                    <div style="background:#0F0E0D;padding:2rem;text-align:center;margin-bottom:2rem">
                        <span style="font-family:Arial Black,sans-serif;font-size:2rem;color:#C9A84C">X</span><span style="font-family:Arial Black,sans-serif;font-size:2rem;color:#fff">SEN</span>
                        <p style="color:#D9D2C5;font-style:italic;font-size:0.85rem;margin-top:0.5rem">The Fan's Network™</p>
                    </div>
                    <p style="font-size:1.1rem;line-height:1.8">We got you.</p>
                    <p style="line-height:1.8">When <strong>${schoolName}</strong> launches on XSEN, you'll be the first to know — and the first to stand up for it.</p>
                    <p style="line-height:1.8">Every fan base deserves a home. Not just the ones with billion-dollar TV deals. We're building ${schoolName}'s channel because fans like you asked for it.</p>
                    <div style="border-left:3px solid #8B0000;padding-left:1rem;margin:2rem 0;font-style:italic;color:#5C5247">"We are not a demographic to be targeted. We are not a revenue stream to be optimized. We are the sport."</div>
                    <p style="line-height:1.8">— Kevin Whitaker<br><span style="font-size:0.85rem;color:#5C5247">Founder, XSEN — The Fan's Network™</span></p>
                    <hr style="border:none;border-top:1px solid #D9D2C5;margin:2rem 0"/>
                    <p style="font-size:0.8rem;color:#5C5247">You signed up at thefansnetwork.fun. Reply anytime.</p>
                </div>
            `
        });
        res.json({ success: true });
    } catch (err) {
        console.error('Manifesto email error:', err);
        res.json({ success: true }); // Supabase insert already worked, don't fail the user
    }
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
