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
    var command = "INSERT INTO United_States___California (Type, Response) VALUES ('Candidate', 'Kanye West')";
    con.query(command, function(err, result) {
        if (err) throw err;
        console.log("Value added to USERS");
    });
});