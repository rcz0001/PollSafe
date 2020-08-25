class User {
    constructor(con, name, meta, session) {
        this.con = con;
        this.name = name;
        this.meta = meta;
        this.session = session;
    }
}

process.title = 'server-main';
var wsServerPort = 1337;
var webSocketServer = require('websocket').server;
var http = require('http');
var sql = require('mysql');
var formidable = require('formidable');
var fs = require('fs');
var clients = [];
var scon = sql.createConnection({
    host: "localhost",
    user: "root",
    password: "asdfdsa$132435",
    database: "polls"
});
function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 50; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
function validate(username, sessionid) {
    var loggedIn = -1;
    for (var i = 0; i < clients.length; i++) {
        if (clients[i].name === username) loggedIn = i;
    }
    if (loggedIn === -1) return false;
    else if (clients[loggedIn].session !== sessionid) return false;
    return true;
}
function getUser(username) {
    for (var i = 0; i < clients.length; i++) {
        if (clients[i].name === username) return clients[i];
    }
    return false;
}
var server = http.createServer(function(req, res) {});
server.listen(wsServerPort, function() {
    console.log((new Date()) + " Server is listening on port "
            + wsServerPort);
});
var wsServer = new webSocketServer({ httpServer: server });
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin '
            + request.origin + '.');
    var con = request.accept(null, request.origin); 
    console.log((new Date()) + ' Connection accepted.');
    con.on('message', function(message) {
        var data = message.utf8Data.split('~');
        console.log(data[0]);
        if (data[0] === "login") {
            var command = 'SELECT * FROM users2 WHERE Username = ' + sql.escape(data[1]);
            scon.query(command, function(err, result) {
                if (err) throw err;
                console.log(result);
                if (result.length === 0) {
                    con.sendUTF('false');
                }
                else {
                    var metadata = JSON.parse(result[0].Data);
                    if (result[0].Password === data[2]) {
                        for (var i = 0; i < clients.length; i++) {
                            if (clients[i].name === result[0].Username) {
                                clients.splice(i, 1);
                                console.log("account logged out");
                            }
                        }
                        var id = makeid();
                        if (metadata.type === 'admin') con.sendUTF('admin~' + result[0].Username + '~' + id);
                        else con.sendUTF('standard~' + result[0].Username + '~' + id);
                        var user = new User(con, result[0].Username, metadata, id);
                        clients.push(user);
                    }
                    else con.sendUTF('false');
                }
            });
        }
        else if (data[0] === "signOut") {
            var user = JSON.parse(data[1]);
            if (validate(user.username, user.sessionid) === true) {
                for (var i = 0; i < clients.length; i++) {
                    if (clients[i].name === user.username) {
                        clients.splice(i, 1);
                        console.log("account logged out");
                    }
                }
            }
        }
        else if (data[0] === "getPoll") {
            var user = JSON.parse(data[1]);
            if (validate(user.username, user.sessionid) === true) {
                var userData = getUser(user.username);
                var command = 'SELECT * FROM ' + userData.meta.region + ' WHERE Type = \'description\'';
                scon.query(command, function(err, result) {
                    if (err) throw err;
                    console.log(result);
                    con.sendUTF("info~" + result[0].Response);
                });
            }
        }
        else if (data[0] === "getRegion") {
            var user = JSON.parse(data[1]);
            if (validate(user.username, user.sessionid) === true) {
                var region = getUser(user.username).meta.region
                con.sendUTF("region~" + region);
            }
        }
        else if (data[0] === "getCandidates") {
            var user = JSON.parse(data[1]);
            if (validate(user.username, user.sessionid) === true) {
                var userData = getUser(user.username);
                var command = 'SELECT * FROM ' + userData.meta.region + ' WHERE Type = \'candidate\'';
                scon.query(command, function(err, result) {
                    if (err) throw err;
                    console.log(result);
                    var candidates = [];
                    for (var i = 0; i < result.length; i++) {
                        candidates.push({"name":result[i].Response, "votes":result[i].Votes});
                    }
                    con.sendUTF("candidates~" + JSON.stringify(candidates));
                });
            }
        }
        else if (data[0] === "getPendingAdmin") {
            var user = JSON.parse(data[1]);
            if (validate(user.username, user.sessionid) === true) {
                var userData = getUser(user.username);
                var command = 'SELECT * FROM ' + userData.meta.region + ' WHERE Type = \'pending\'';
                scon.query(command, function(err, result) {
                    if (err) throw err;
                    console.log(result);
                    if (result.length === 0) {
                        con.sendUTF('null');
                    }
                    else {
                        con.sendUTF("pending~" + result[0].Response);
                    }
                });
            }
        }
        else if (data[0] === "addAccountAdmin") {
            var user = JSON.parse(data[1]);
            if (validate(user.username, user.sessionid) === true) {
                var newAcc = JSON.parse(data[2]);
                var command = "INSERT INTO users2 (Username, Password, Data) VALUES (" + sql.escape(newAcc.username) + ", " + sql.escape(newAcc.password) + ", '{ \"type\":\"standard\" , \"region\":\"" + getUser(user.username).meta.region + "\" }')";
                scon.query(command, function(err, result) {
                    if (err) throw err;
                    console.log("New Account added");
                });
            }
        }
        else if (data[0] === "addPending") {
            var user = JSON.parse(data[1]);
            if (validate(user.username, user.sessionid) === true) {
                var command = "INSERT INTO " + data[2] + " (Type, Response) VALUES ('pending', " + sql.escape(data[3] + data[4]) + ")";
                scon.query(command, function(err, result) {
                    if (err) throw err;
                    console.log(data[3]);
                });
            }
        }
        else if (data[0] === "removePendingAdmin") {
            var user = JSON.parse(data[1]);
            if (validate(user.username, user.sessionid) === true) {
                var userData = getUser(user.username);
                command = 'DELETE FROM ' + userData.meta.region + ' WHERE Response = ' + sql.escape((data[2] + data[3]).toString());
                scon.query(command, function(err, result) {
                    if (err) throw err;
                    console.log(result);
                });
            }
        }
        else if (data[0] === "cashIn") {
            var user = JSON.parse(data[1]);
            if (validate(user.username, user.sessionid) === true) {
                console.log(data[2]);
                var userData = getUser(user.username);
                var command = 'SELECT * FROM ' + userData.meta.region + ' WHERE Response = ' + sql.escape(data[2].toString());
                var numVotes;
                var willContinue = false;
                scon.query(command, function(err, result) {
                    if (err) throw err;
                    if (result.length === 0) {
                        console.log("No KW");
                    }
                    else {
                        numVotes = result[0].Votes + 1;
                        willContinue = true;
                        console.log(result[0]);
                        if (willContinue === true) {
                            command = 'UPDATE ' + userData.meta.region + ' SET Votes = ' + numVotes.toString() + ' WHERE Response = ' + sql.escape(data[2].toString());
                            console.log(command);
                            scon.query(command, function(err, result) {
                                if (err) throw err;
                            });
                        }
                    }
                });
            }
        }
    });
});