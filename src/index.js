const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const { generateMessage } = require('./utils/messages.js')

const port = process.env.PORT || 3000
const app = express()
const server = http.createServer(app)
const io = socketio(server)
io.eio.pingTimeout = 120000; // 2 minutes
io.eio.pingInterval = 5000;  // 5 seconds

//to serve static assets
const pubDir = path.join(__dirname, '../public')
app.use(express.static(pubDir))
let conCounter = 0
io.on("connection", (socket)=>{
    let userName = ""
    console.log("New socket connection: ",socket.id)
    console.log("total websocket connections", conCounter++)
    console.log("All users: ", getUsersInRoom("chatroom"))
    
    //join event
    socket.on('join', (options, callback)=> {
        try {
            console.log("Received join event: ", options)
            const {error, user} = addUser({id: socket.id, ...options})
            console.log(error)
            if(error) {
                return callback(error)
            } 
            socket.join(user.room)
            socket.emit('message', generateMessage(`Welcome ${user.username}`, "App"))
            io.to(user.room).emit("message", generateMessage('user has joined the room', user.username))
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
            callback()
        } catch(e) {
            console.log(e)
            callback(e.message)
        }
    })

    //Broadcast event
    socket.on('broadcastMessage', (msg, callback)=> {
        try {
            console.log("Received broadcastMessage event: ", msg)
            user = getUser(socket.id)
            if (!user)
            {
                socket.emit("ServerError", "User not found")
            } else {
                io.to(user.room).emit("message", generateMessage(msg.text, msg.username))
                callback('Delivered')
            }
        } catch(e) {
            console.log(e)
            callback(e.message)
        }
    })
    
    //location event
    socket.on('sendLocation', (location)=> {
        try {
            console.log("Received sendLocation event: ", location)
            user = getUser(socket.id)
            msg = `https://google.com/maps?q=${location.latitude},${location.longitude}`
            io.to(user.room).emit("locationMsg", generateMessage(msg, user.username))
            //callback('location shared')
        } catch(e) {
            console.log(e)
            //callback(e.message)
        }
    })
    
    //disconnect event
    socket.on('disconnect', ()=> {
        const user = removeUser(socket.id)
        console.log("received disconnect event", user)
        if (user) {
            try {
                io.to(user.room).emit("message", generateMessage('user has left', user.username))
                io.to(user.room).emit("roomData", {
                    room: user.room,
                    users: getUsersInRoom(user.room)
                })
            } catch(e) {
                console.log(e)
            }
        }
    }) 
})

// ############### Sample Counter application ##################
// let count = 0
// let connectionCount = 0
// io.on('connection', (socket) => {
//     console.log("new websocket connection", connectionCount++)
//     socket.emit('countUpdate', count)
//     socket.on('increment', ()=> {
//         console.log("increment event")
//         //socket.emit('countUpdate', ++count) - emits for given socket
//         io.emit('countUpdate', ++count)
//     })
// })


server.listen(port, ()=>{
    console.log("Express app is running on port", port)
})