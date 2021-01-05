const socket = io()
//elements
const $connectBtn = document.querySelector("#connectBtn")
const $sendBtn = document.querySelector('#sendBtn')
const $msgTxt = document.querySelector("#msgTxt")
const $sendLocationBtn = document.getElementById('sendLocationBtn')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

//Templates
const $msgTemplate = document.querySelector('#message-template').innerHTML
const $locationMsgTemplate = document.querySelector('#location-message-template').innerHTML
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//querystring parsing
const { username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = ()=> {
    //new message element
    const $newMsg = $messages.lastElementChild
    
    //height of the new message
    const newMsgStyles = getComputedStyle($newMsg) 
    const newMsgMargin =  parseInt(newMsgStyles.marginBottom)
    const newMsgHeight = $newMsg.offsetHeight + newMsgMargin
    
    //visible height
    const visibleHeight = $messages.offsetHeight
    
    //container height
    const containerHeight = $messages.scrollHeight

    //how far I scroll
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMsgHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

//Send join event
socket.emit('join', {username, room}, (error) => {
    if(error) {
        console.log(error)
        alert(error)
        location.href = "/"
    }
})

//Receive message events
socket.on('message', (msg)=> {
    const dtObj= new Date(msg.createdAt)
    const html = Mustache.render($msgTemplate, {
        message: msg.text,
        timestamp: dtObj.getHours() + ":" + dtObj.getMinutes(),
        username: msg.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

//Receive roomData events
socket.on('roomData', ({users, room})=> {
    const html = Mustache.render($sidebarTemplate, {users, room})
    $sidebar.innerHTML = html
})

//Receive location message events
socket.on('locationMsg', (msg) => {
    console.log("locationMsg:", msg)
    const dtObj= new Date(msg.createdAt)
    const html = Mustache.render($locationMsgTemplate, {
        message: msg.text,
        timestamp: dtObj.getHours() + ":" + dtObj.getMinutes(),
        username: msg.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('ServerError', (msg) => {
    console.log(msg)
    alert("User has got disconnected")
    location.href = "/"
})

$sendBtn.addEventListener('click', () => {
    if ($msgTxt.value.trim()) {
        const msg = { text: $msgTxt.value, username: username}
        socket.emit('broadcastMessage', msg, (m)=>{
            console.log("Message was ",m)
        })
    }
    $msgTxt.value = ""
    $msgTxt.focus()
})

$sendLocationBtn.addEventListener('click', ()=> {
    if(!navigator.geolocation) {
        console.error("Browser doesn't support geolocation")
        return
    }
    $sendLocationBtn.setAttribute('disabled', 'disabled')
    const geo = navigator.geolocation
    geo.getCurrentPosition((position)=>{ 
            console.log(position)
            socket.emit('sendLocation', {latitude: position.coords.latitude, longitude: position.coords.longitude})
            $sendLocationBtn.removeAttribute('disabled')
        },(error) => {
            if(error)
                console.log("User has declined")
                const dtObj= new Date()
                const html = Mustache.render($msgTemplate, {
                                message: "Please allow browser to get location",
                                timestamp: dtObj.getHours() + ":" + dtObj.getMinutes(),
                                username: "App"
                            })
                $messages.insertAdjacentHTML('beforeend', html)
                $sendLocationBtn.removeAttribute('disabled')
    })
})

// Execute a function when the user releases a key on the keyboard
$msgTxt.addEventListener("keyup", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      event.preventDefault()
      // Trigger the button element with a click
      $sendBtn.click()
    }
  });

// ############### Sample Counter application ##################
// socket.on('countUpdate', (count)=> {
//     console.log(`received count update event. Counter: ${count}`)
//     document.querySelector("#countLbl").innerHTML = count
// })

// const incrBtn = document.querySelector("#incrBtn").addEventListener('click', ()=> {
//     socket.emit('increment')
// })