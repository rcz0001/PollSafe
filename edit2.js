process.title = 'edit-database';
var sql = require('mysql');
var con = sql.createConnection({
    host: "localhost",
    user: "root",
    password: "asdfdsa$132435",
    database: "polls"
});
con.connect(function(err){
    if (err) throw err;
    console.log("Connected!");
    var command = "CREATE TABLE United_States___California (Type VARCHAR(255), Votes INT, Response LONGTEXT, Captcha LONGBLOB)";
    con.query(command, function(err, result) {
        if (err) throw err;
        console.log("Table created");
    });
});