const express = require('express');
let port = process.env.PORT || 8000;
const app = express();

app.use('/', require('./routes'));

app.listen(port, function(err) {
    if (err) {
        console.log('Error in running the server: '+err);
        return;
    }
    console.log('Server is running perfectly fine in port: '+port);
});