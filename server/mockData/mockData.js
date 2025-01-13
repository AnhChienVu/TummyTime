
export const mockData =
{
    "users": [
      { "userId": 1, "email": "john.doe@example.com", "firstName": "John", "lastName": "Doe", "relationshipType": "Father", "userBabyId": 1 },
      { "userId": 2, "email": "jane.smith@example.com", "firstName": "Jane", "lastName": "Smith", "relationshipType": "Mother", "userBabyId": 2 }
    ],
  
    "userBaby": [
      { "userBabyId": 1, "userId": 1, "babyId": 1 },
      { "userBabyId": 2, "userId": 2, "babyId": 2 }
    ],
  
    "babies": [
      { "babyId": 1, "firstName": "Baby", "lastName": "Doe", "age": 1, "weight": 3.5, "height": 50.0, "sex": "M", "dateOfBirth": "2023-01-01", "userBabyId": 1 },
      { "babyId": 2, "firstName": "Baby", "lastName": "Smith", "age": 1, "weight": 3.2, "height": 48.0, "sex": "F", "dateOfBirth": "2023-05-15", "userBabyId": 2 }
    ],
  
    "healthAnomalies": [
      { "anomalyId": 1, "babyId": 1, "description": "Mild rash on left cheek", "anomalyDate": "2024-11-10", "createdAt": "2024-11-10T00:00:00Z" },
      { "anomalyId": 2, "babyId": 2, "description": "Slight fever", "anomalyDate": "2024-11-11", "createdAt": "2024-11-11T00:00:00Z" }
    ],
  
    "feedingSchedules": [
      { "feedingScheduleId": 1, "babyId": 1, "scheduleDate": "2024-11-17" },
      { "feedingScheduleId": 2, "babyId": 2, "scheduleDate": "2024-11-17" }
    ],
  
    "meals": [
      { "mealId": 1, "mealName": "Milk Feed", "mealType": "Breast Milk", "amount": 200.0, "note": "Morning feeding", "date": "2024-11-17", "feedingScheduleId": 1 },
      { "mealId": 2, "mealName": "Solid Food", "mealType": "Puree", "amount": 150.0, "note": "First solid food", "date": "2024-11-17", "feedingScheduleId": 1 },
      { "mealId": 3, "mealName": "Milk Feed", "mealType": "Formula", "amount": 180.0, "note": "Evening feeding", "date": "2024-11-17", "feedingScheduleId": 2 }
    ],
  
    "feedingDocuments": [
      { "feedingDocumentId": 1, "documentId": 1, "feedingScheduleId": 1 },
      { "feedingDocumentId": 2, "documentId": 2, "feedingScheduleId": 2 }
    ],
  
    "exportedDocuments": [
      { "documentId": 1, "fileName": "feeding_schedule_1.pdf", "format": "PDF", "date": "2024-11-18" },
      { "documentId": 2, "fileName": "feeding_schedule_2.pdf", "format": "PDF", "date": "2024-11-18" }
    ],
  
    "reminders": [
      { "reminderId": 1, "babyId": 1, "reminderType": "Doctor Appointment", "reminderInterval": "1 month", "reminderEnd": "2025-01-01", "createdAt": "2024-11-15T00:00:00Z" },
      { "reminderId": 2, "babyId": 2, "reminderType": "Vaccination", "reminderInterval": "6 weeks", "reminderEnd": "2025-01-15", "createdAt": "2024-11-15T00:00:00Z" }
    ],
  
    "medicalProfessionals": [
      { "medicalProfId": 1, "firstName": "Alice", "lastName": "Johnson", "location": "123 Medical Plaza, Springfield", "phone": "555-123-4567", "specialty": "Pediatrician", "userId": 3 },
      { "medicalProfId": 2, "firstName": "Bob", "lastName": "Brown", "location": "456 Health Blvd, Metropolis", "phone": "555-987-6543", "specialty": "Nutritionist", "userId": 4 }
    ],
  
    "healthInsights": [
      { "insightId": 1, "babyId": 1, "insightType": "Weight Gain", "insightValue": "+0.5kg", "insightDate": "2024-11-20", "createdAt": "2024-11-20T00:00:00Z" },
      { "insightId": 2, "babyId": 2, "insightType": "Height Growth", "insightValue": "+2cm", "insightDate": "2024-11-21", "createdAt": "2024-11-21T00:00:00Z" }
    ],
  
    "curatedTips": [
      { "tipId": 1, "minAge": 0, "maxAge": 12, "category": "Health", "description": "Always keep your baby hydrated." },
      { "tipId": 2, "minAge": 6, "maxAge": 24, "category": "Feeding", "description": "Introduce solid foods gradually to prevent allergies." }
    ],
  
    "journalEntries": [
      { "journalId": 1, "date": "2024-11-15", "content": "Baby's first smile today!", "image": null, "userId": 1 },
      { "journalId": 2, "date": "2024-11-17", "content": "Doctor said baby is healthy.", "image": "doctor_visit.jpg", "userId": 2 }
    ],
  
    "journalTags": [
      { "journalTagId": 1, "journalId": 1, "tagId": 1 },
      { "journalTagId": 2, "journalId": 2, "tagId": 5 }
    ],
  
    "tags": [
      { "tagId": 1, "tagName": "Milestone", "userId": 1 },
      { "tagId": 2, "tagName": "Health", "userId": 2 }
    ],
  
    "forumPosts": [
      { "postId": 1, "title": "Best Baby Food Recipes", "content": "Looking for baby food recipes.", "date": "2024-11-15", "userId": 1 },
      { "postId": 2, "title": "Managing Baby Sleep", "content": "Tips for getting my baby to sleep through the night.", "date": "2024-11-16", "userId": 2 }
    ],
  
    "forumReplies": [
      { "replyId": 1, "date": "2024-11-15", "content": "Try mashed avocado!", "postId": 1 },
      { "replyId": 2, "date": "2024-11-16", "content": "Create a consistent bedtime routine.", "postId": 2 }
    ]
}
  
