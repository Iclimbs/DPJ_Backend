# Collaboration Routes :-

# Testing Again

# Creating Collaboration Between Artists

url :- http://localhost:4500/api/v1/collaborator/add

Payload :- {
"title":"Testing",
"description":"Testing",
"category":"Category Testing",
"banner":File Uploding,
"startDate":"2024-12-06",
"endDate":"2024-12-12",
"startTime":"05:00",
"endTime":"11:00",
}

# Response From Server

For Success
{
"status": "success",
message: `Collaboration Created Successfully`,
}

For Error
{
"status": "error",
message: `Failed To Add New Event ${error.message}`,
}

# Creating Artists As Collaboration

url :- http://localhost:4500/api/v1/collaborator/add/collaborator/:id

Payload :-{
"collaborators":[
{
id:Candidate Id,
name:"Testing",
email:"testing@gmail.com",
amount:2500
},
{
id:Candidate Id,
name:"Testing",
email:"testing@gmail.com",
amount:2500
}
]
}

# Response From Server

For Success
{
"status": "success",
"message": "Successfully Added Collaborators in The Following Collaboration Event",
}

For Error
{
"status": "error",
"message": "Failed To Add New Event ${error.message}",
}


# Creating Artists As Collaboration

url :- http://localhost:4500/api/v1/collaborator/add/collaborator/:id

Payload :-{
"collaborators":[
{
id:Candidate Id,
name:"Testing",
email:"testing@gmail.com",
amount:2500
},
{
id:Candidate Id,
name:"Testing",
email:"testing@gmail.com",
amount:2500
}
]
}

# Response From Server

For Success
{
"status": "success",
"message": "Successfully Added Collaborators in The Following Collaboration Event",
}

For Error
{
"status": "error",
"message": "Failed To Add New Event ${error.message}",
}



# Get List Of All The Collaboration Event Created By The Artist

GET url :- http://localhost:4500/api/v1/collaborator/list
           Need Token In Headers 

# Response From Server

For Success
{
    "status": "success",
    "data": [
        {
            "_id": "675985018656c3942a842276",
            "address": "Testing",
            "title": "Testing New Collabboration",
            "description": "Testing",
            "category": "Karaoke",
            "banner": "1733920001688Screenshot 2024-12-03 at 1.07.21 AM.png",
            "startDateTime": "Wed Dec 11 2024 04:00:00 GMT+0530 (India Standard Time)",
            "endDateTime": "Tue Dec 17 2024 14:00:00 GMT+0530 (India Standard Time)",
            "createdBy": "6752a004efaca432a3075c9c",
            "type": "Collaboration",
            "eventType": "Virtual",
            "CreatedAt": "2024-12-11T12:26:41.699Z",
            "__v": 0
        }
    ]
}

For Error
{ status: "error",
message: `Unable To Find Collaboration Events ${error.message}` }




# Get List Of All The Collaborators Added In A Particular Event

GET url :- http://localhost:4500/api/v1/collaborator/list/artists/:id
           Need Token In Headers 

# Response From Server

For Success
{
    "status": "success",
    "data": [
        {
            "_id": "675a78f4713a7083951cb727",
            "userId": "6752a004efaca432a3075c9c",
            "email": "uttamkr5599@gmail.com",
            "name": "Uttam Kumar Shaw",
            "amount": 4500,
            "status": "Pending",
            "eventId": "675985018656c3942a842276",
            "CreatedAt": "2024-12-12T05:47:32.059Z",
            "__v": 0
        }
    ]
}

For Error
{ status: "error", message: `Unable To Find Collaborators List In This Events ${error.message}` }





# Update Event Details 

POST url :- http://localhost:4500/api/v1/collaborator/edit/basic/:id
           Need Token In Headers 

Payload :{
  address:Testing For Edit Function
title:Testing For Edit Function
description:Testing For Edit Function
category:Karaoke
startDate:2024-12-11
endDate:2024-12-17
startTime:04:00
endTime:14:00,
banner:file
}

# Response From Server

For Success
{
    "status": "success",
    "message": "Event Successfully Updatec"
}

For Error
{
    "status": "error",
    "message": "Event Successfully Updatec"
}





# Update Collaborator Event Status 

POST url :- http://localhost:4500/api/v1/collaborator/update/collab/status/:id
           Need Token In Headers 

Payload :{
    "status":"Status"
}

# Response From Server

For Success
      { status: "success", message: "Updated Collaborator Status" }


For Error
    { status: "error", message: `Unable To Update Collaborators Status In This Events ${error.message}` }




# Get Collaborations Request List

url :- http://localhost:4500/api/v1/collaborator/request/list
           Need Token In Headers 

# Response From Server

For Success
{
    "status": "success",
    "data": [
        {
            "_id": "675a78f4713a7083951cb727",
            "userId": "6752a004efaca432a3075c9c",
            "email": "uttamkr5599@gmail.com",
            "name": "Uttam Kumar Shaw",
            "amount": 4500,
            "eventId": "675985018656c3942a842276",
            "CreatedAt": "2024-12-12T05:47:32.059Z",
            "__v": 0,
            "status": "Pending"
        }
    ]
}

For Error
    res.json({ status: "error", message: `Unable To Find Collaboration Events Requests ${error.message}` })

