const users = []

const addUser = ({id, username, room})=> {
    username=username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    if (!username || !room) {
        return { error: 'user and room name are required', undefined }
    }
    
    //check for existing user
    const existingUser = users.find((user)=> {
        return user.username === username && user.room === room 
    })    

    if (existingUser) {
        return ({
            error: "user name already exist", undefined 
        })
    }
    user = {id, username, room}
    users.push(user)
    console.log("User List:", users)
    return ({undefined, user})
}

const removeUser = (id) => {
    const userIndex = users.findIndex((user) => id === user.id)
    if(userIndex != -1) {
        return users.splice(userIndex, 1)[0]
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    const userInRoom = users.filter((user) => {
        return user.room === room
    })
    return userInRoom
}
module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}
