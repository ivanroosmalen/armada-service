db.academies.createIndex( { "owners._id": 1 } )
db.academies.createIndex( { "instructors._id": 1 } )
db.academies.createIndex( { "students._id": 1 } )

db.academyRequests.createIndex( { "academy._id": 1, "user._id": 1, "complete": 1, "approved": 1 } )
db.academyRequests.createIndex( { "academy._id": 1, "user._id": 1, "approved": 1 } )

db.classes.createIndex( { "parentId": 1, "schedule.startDate": 1 } )
db.classes.createIndex( { "schedule.startDate": 1, "schedule.endDate": 1, "academyId": 1 } )
db.classes.createIndex( { "schedule.startDate": 1, "schedule.startDate": 1, "academyId": 1 } )
db.classes.createIndex( { "recurring": 1, "schedule.endDate": 1, "academyId": 1 } )
db.classes.createIndex( { "schedule.startDate": 1, "schedule.startDate": 1, "attendees._id": 1 } )
db.classes.createIndex( { "schedule.startDate": 1, "schedule.startDate": 1, "attendees.academyMember.member._id": 1 } )
db.classes.createIndex( { "instructors._id": 1 } )
db.classes.createIndex( { "attendees._id": 1 } )

db.locations.createIndex( { "geo": "2dsphere", "entityId": 1 } )
db.locations.createIndex( { "entityId": 1 } )

db.jwttokens.createIndex( { "suffix": 1 } )

db.users.createIndex( { "email": 1 } )

db.notifications.createIndex( { "academy._id": 1, "createdDate": 1 } )

db.academymembers.createIndex( { "member._id": 1, "academy._id": 1, "isOwner": 1 } )
db.academymembers.createIndex( { "academy._id": 1, "isOwner": 1 } )
