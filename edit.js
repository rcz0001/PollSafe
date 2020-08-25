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
    var command = "INSERT INTO users2 (Username, Password, Data) VALUES ('ProminentActivist', 'asdf', '{ \"type\":\"admin\" , \"region\":\"United_States___California\" }')";
    con.query(command, function(err, result) {
        if (err) throw err;
        console.log("Value added to USERS");
    });
});