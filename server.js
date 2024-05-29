const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { eventNames } = require('process');

const app = express();
const PORT = 3000;

const SUPABASE_URL = 'https://txgizngwinakajvvjmls.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4Z2l6bmd3aW5ha2FqdnZqbWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTcwMDM1NTEsImV4cCI6MjAzMjU3OTU1MX0.-kmU84uC-mqwjrmEolZTZ3tb_ts8gxj4gAVBpdQLw3M';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 } // 1 minute session timeout for demo purposes
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/users', async (req, res) => {
    try {
        let { data, error } = await supabase
  .from('users')
  .select('*')

        if (error) {
            console.error('Error fetching users:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log('Fetched users:', data); // Add this line to log the fetched data

        res.json(data);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const { data, error } = await supabase
            .from('users')
            .select('name, department')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !data) {
            return res.send('Invalid username or password');
        }

        req.session.user = {
            username: username,
            name: data.name,
            department: data.department
        };
        res.redirect('/startSite.html');
    } catch (error) {
        console.error('Error querying the database:', error);
        res.send('An error occurred');
    }
});

app.get('/startSite.html', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    res.send(`
        <html>
        <body>
            <h1>Welcome ${req.session.user.name} from ${req.session.user.department}!</h1>
            <button onclick="logout()">Logout</button>
            <script>
                function logout() {
                    fetch('/logout', { method: 'POST' })
                        .then(() => window.location = '/')
                        .catch(err => console.error(err));
                }
            </script>
        </body>
        </html>
    `);
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.send('Error logging out');
        }

        res.redirect('/');
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});