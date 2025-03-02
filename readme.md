# SalonMate Back-End Service

![Modern App Portfolio Mockup Presentation (1)](https://github.com/user-attachments/assets/4e1de125-2fc9-4bc9-8981-92ff577f0c74)

## Before You Start

SalonMate is a mobile application that allows users to discover hair salons in their city and district, book appointments and evaluate their services. Users can make appointments with hair salons for the day and time they want, get service with their preferred stylist and manage their appointments. They can also view the nearest hair salons on the app via a map and review their location information.
SalonMate offers an innovative platform that digitalizes the hair salon experience with its user-friendly interface, secure session management and advanced notification infrastructure.

## Installation

```batch
git clone https://github.com/NuhcanATAR/salonmate_service.git
```

## Document about the Project

<b>English Document (EN) : <a href="https://firebasestorage.googleapis.com/v0/b/caffely-90d9a.appspot.com/o/SalonMakeApp%2Fpdf%2Fabout_en.pdf?alt=media&token=03a2ac3a-7527-4321-8259-e4b791ba7b01">Görüntüle</a></b>

<b>Turkish Document (EN) : <a href="https://firebasestorage.googleapis.com/v0/b/caffely-90d9a.appspot.com/o/SalonMakeApp%2Fpdf%2Fabout_tr.pdf?alt=media&token=add5e960-b5c4-4ab4-a827-0a48c7629bc0">Görüntüle</a></b>

## Database Diagram

![Database Diagram](https://github.com/user-attachments/assets/06959c9d-ae50-48b2-ab03-7f3b012500f8)


## Postman Collections Menu

![postman_collections](https://github.com/user-attachments/assets/881ed51b-6b48-47bb-bd29-648de7a4927a)



## API Usage

# Sign Up

1. EndPoint
```js
TYPE: POST
URL: {{base_url}}register-phone-send-code
Body:
  {
    "phone": "5349881069"
  }
```

2. EndPoint
```js
TYPE: POST
URL: {{base_url}}register-verify-code
Body:
  {
    "phone": "5349881069",
    "resetCode": "127763"
  }
```

3. EndPoint
```js
TYPE: POST
URL: {{base_url}}register
Headers:
  {
    "Content-Type": "application/json"
  }
Body:
  {
    "email": "codxxxxenoah@gmail.com",
    "password": "1234Corum*",
    "username": "xxxxxxx",
    "full_name": "Nuhcan Atar",
    "phone": "6815252266",
    "city": "Çorum",
    "district": "Merkez",
    "address": "Çorum/Merkez Uluavak Mahallesi Çiftlik çayırı 5. Sokak 6/10"
  }
```



# Sign In

```js
TYPE: POST
URL: {{base_url}}login
Body:
  {
    "username": "nuhcanatar",
    "password": "12345Corum*"
  }
```

# Forgot Password

1. EndPoint
```js
TYPE: POST
URL: {{base_url}}request-reset-password
Body:
  {
    "phone": "5349881069"
  }
```

2. EndPoint
```js
TYPE: POST
URL: {{base_url}}verify-reset-code
Body:
  {
  "phone": "5349881069",
  "resetCode": "357256"
  }
```

3. EndPoint
```js
TYPE: POST
URL: {{base_url}}reset-password
Body:
  {
    "userId": 7,
    "newPassword": "codeNoah1234*"
  }

```


# Account

Retrieving User Profile Information
```js
TYPE: GET
URL: {{base_url}}account
Header:
  {
    "Authorization": "Bearer {{token}}"
  }
Response:
  {
     "user": {
       "username": "nuhcanatar",
       "email": "nuhcanatar20@gmail.com",
       "status": 1
     },
     "userDetail": {
       "full_name": "Nuhcan ATAR",
       "phone": "5349881069",
       "city": "Çorum",
       "district": "Merkez",
       "address": ""
     }
  }
```

Update User
```js
TYPE: PUT
URL: {{base_url}}account-update
Header:
  {
    "Authorization": "Bearer {{token}}"
  }
Body:
  {
     "full_name": "Nuhcan ATAR",
     "phone": 5349881010,
     "address": "Adresin Güncellendimi?"
  }
```

Update User City and District
```js
TYPE: PUT
URL: {{base_url}}account-city-district-update
Header:
  {
    "Authorization": "Bearer {{token}}"
  }
Body:
  {
     "city": "İstanbul",
     "district": "Kartal"
  }
```

# Account

Show Appointment Available Date Information
```js
TYPE: GET
URL: {{base_url}}appointments-date
Header:
{
"Authorization": "Bearer {{token}}",
"stylistId": 1
}
Response:
  [
    {
     "date": "2025-03-03",
     "available_times": [
       "09:00",
       "11:00",
       "13:00",
       "14:00",
       "15:00",
       "16:00",
       "17:00",
       "18:00",
       "19:00"
     ]
    }
    // .....
    // NOTE: gives date information from the next day, skipping Sunday and the current day.
  ]
```

Appointment Creation EndPoint
```js
TYPE: POST
URL: {{base_url}}appointment-create
Header:
  {
    "Authorization": "Bearer {{token}}"
  }
Body:
  {
    "salonsId": 1,
    "servicesId": 2,
    "stylistId": 1,
    "appointmentDate": "2025-02-25 19:00:00",
    "servicePrice": 55,
    "totalPrice": 100,
    "paymentType": true,
    "addServices": [
     { "name": "Saç Boyama", "price": 250 },
     { "name": "Sakal Tıraşı", "price": 100 }
     ]
  }
```


User's Appointments EndPoint
```js
TYPE: GET
URL: {{base_url}}appointment-user
Header:
  {
    "Authorization": "Bearer {{token}}",
    "languagecode": "en"
  }
Response:
  {
   "total": 2,
   "page": 1,
   "limit": 10,
   "totalPages": 1,
   "appointments": [
   {
     "id": 56,
     "user_id": 14,
     "salons_id": 1,
     "services_id": 2,
     "stylist_id": 1,
     "appointments_date": "2025-03-03T12:00:00.000Z",
     "created_at": "2025-03-02T09:08:55.000Z",
     "is_deleted": 0,
     "appointments_category_id": 7,
     "salon_id": 1,
     "salon_file_name": "https://firebasestorage.googleapis.com/v0/b/caffely-
     "salon_name": "Fatih Kuaför Salonu",
     "salon_city": "Çorum",
     "salon_district": "Merkez",
     "salon_phone": "5349881069",
     "service_file_name": "https://firebasestorage.googleapis.com/v0/b/caffely
     "service_name": "Saç Kesim",
     "service_description": "Saç Kesim Hizmeti için açıklama",
     "service_duration": 40,
     "salon_email": "fatihkuafor@gmail.com",
    "stylist_file_name": "https://firebasestorage.googleapis.com/v0/b/caffely-
     "stylist_name": "Bekir Demir",
     "stylist_phone": "5435435454",
     "stylist_email": "bekirdemir@gmail.com",
     "appointment_category": "Evaluated Appointment",
     "details": {
       "service_price": 120,
       "total_price": 150,
       "payment_type": 1
     },
     "additionalServices": [
       {
       "service_name": "Saç Yıkama",
       "service_price": 30
       }
     ]
   }
   ]
  }
```

# Appointment Evaluation and Scoring EndPoint

Appointment Evaluation 
```js
TYPE: POST
URL: {{base_url}}evaluation-create
Header:
  {
    "Authorization": "Bearer {{token}}"
  }
Body:
  {
    "appointmentId" : 40,
    "salonId": 1,
    "points": 4.0,
    "description": "Güzel bir deneyim"
  }
```

Receiving Hall Evaluation Number and Score Information
```js
TYPE: GET
URL: {{base_url}}evaluation-salon-scores
Header:
  {
    "Authorization": "Bearer {{token}}",
    "salonId": 1
  }
Response:
  {
    "average_score": 3,
    "total_appointments": 1
  }
```

# Favorites EndPoint

User's Favorite Salons
```js
TYPE: GET
URL: {{base_url}}favorites
Header:
  {
    "Authorization": "Bearer {{token}}",
    "salonId": 1
  }
Response:
  [
    {
       "id": 1,
       "envoirment_id": 1,
       "name": "Fatih Kuaför Salonu",
       "latitude": 40.549835,
       "longitude": 34.953724,
       "is_open": 0,
       "created_at": "2025-02-03T15:46:48.000Z",
       "is_deleted": 0,
       "salon_id": 1,
       "address": "Çorum/Merkez Ulukavak Mahallesi Çiftlikçayırı 5. Soka
       "city": "Çorum",
       "district": "Merkez",
       "phone": "5349881069",
       "email": "fatihkuafor@gmail.com",
       "website": "www.kuaforfatih.com",
       "open_time": "09:00:00",
       "close_time": "18:30:00",
       "is_sunday_open": 1,
       "file_name": "https://firebasestorage.googleapis.com/v0/b/caffely-
       "average_score": 3,
       "total_appointments": 1
    }
  ]
```

Adding and Removing Favorites
```js
TYPE: POST
URL: {{base_url}}favorite-toggle
Header:
  {
    "Authorization": "Bearer {{token}}"
  }
Body:
  {
     "salonId": 1
  }
```

# Notification EndPoint

Get and Save PlayerId When User Logs In
```js
TYPE: POST
URL: {{base_url}}users-update-playerid
Header:
  {
    "Authorization": "Bearer {{token}}"
  }
Body:
  {
     "playerId": "test1234"
  }
```

# Salons EndPoint

Viewing Halls in the City and District where the User is Located
```js
TYPE: GET
URL: {{base_url}}salons
Header:
  {
    "Authorization": "Bearer {{token}}"
  }
Response:
 {
    "salons": [
        {
            "id": 1,
            "envoirment_id": 1,
            "name": "Fatih Kuaför Salonu",
            "latitude": 40.549835,
            "longitude": 34.953724,
            "is_open": 0,
            "created_at": "2025-02-03T15:46:48.000Z",
            "is_deleted": 0,
            "salon_id": 1,
            "address": "Çorum/Merkez Ulukavak Mahallesi Çiftlikçayırı 5. Sokak 6/10",
            "city": "Çorum",
            "district": "Merkez",
            "phone": "5349881069",
            "email": "fatihkuafor@gmail.com",
            "website": "www.kuaforfatih.com",
            "open_time": "09:00:00",
            "close_time": "18:30:00",
            "is_sunday_open": 1,
            "file_name": "https://firebasestorage.googleapis.com/v0/b/caffely-90d9a.appspot.com/o/SalonMakeApp%2Fsalon_covers%2Fsalon_cover_three.png?alt=media&token=75444447-4502-4b4a-a5d5-f7bffeecbd74",
            "average_score": 3,
            "total_appointments": 1
        }
    ]
}
```

View Salon Services
```js
TYPE: GET
URL: {{base_url}}salon-services
Header:
  {
    "Authorization": "Bearer {{token}}",
    "salon-id": 1
  }
Response:
 {
    "message": "Başarılı",
    "services": [
        {
            "id": 2,
            "salon_id": 1,
            "service_category_id": 1,
            "name": "Saç Kesim",
            "description": "Saç Kesim Hizmeti için açıklama",
            "price": 120,
            "duration": 40,
            "is_active": 0,
            "created_at": "2025-02-03T15:54:41.000Z",
            "is_deleted": 0,
            "envoirment_id": 7,
            "envoirment_file_name": "https://firebasestorage.googleapis.com/v0/b/caffely-90d9a.appspot.com/o/SalonMakeApp%2Fservice_covers%2Ferkek-sac-kesimi.webp?alt=media&token=19d2a4a4-440e-4117-9af3-6785bbdb5aa4",
            "add_services": [
                {
                    "id": 1,
                    "services_id": 2,
                    "name": "Saç Yıkama",
                    "price": 30,
                    "is_deleted": 0
                },
                {
                    "id": 2,
                    "services_id": 2,
                    "name": "Saç Bakım",
                    "price": 70,
                    "is_deleted": 0
                },
                {
                    "id": 3,
                    "services_id": 2,
                    "name": "Sakal Kesimi",
                    "price": 60,
                    "is_deleted": 0
                }
            ]
        }
    ]
}
```

View Hall Detail Information
```js
TYPE: GET
URL: {{base_url}}salons-detail
Header:
  {
    "Authorization": "Bearer {{token}}",
    "salon-id": 1
  }
Response:
 {
    "salon": {
        "id": 1,
        "envoirment_id": 1,
        "name": "Fatih Kuaför Salonu",
        "latitude": 40.549835,
        "longitude": 34.953724,
        "is_open": 0,
        "created_at": "2025-02-03T15:46:48.000Z",
        "is_deleted": 0,
        "salon_id": 1,
        "address": "Çorum/Merkez Ulukavak Mahallesi Çiftlikçayırı 5. Sokak 6/10",
        "city": "Çorum",
        "district": "Merkez",
        "phone": "5349881069",
        "email": "fatihkuafor@gmail.com",
        "website": "www.kuaforfatih.com",
        "open_time": "09:00:00",
        "close_time": "18:30:00",
        "is_sunday_open": 1,
        "file_name": "https://firebasestorage.googleapis.com/v0/b/caffely-90d9a.appspot.com/o/SalonMakeApp%2Fsalon_covers%2Fsalon_cover_three.png?alt=media&token=75444447-4502-4b4a-a5d5-f7bffeecbd74",
        "average_score": 3,
        "total_appointments": 1
    }
}
```

# Service Categories EndPoint

Categories Display
```js
TYPE: GET
URL: {{base_url}}categorys
Header:
  {
    "Authorization": "Bearer {{token}}",
    "languageCode": "tr"
  }
Response:
 {
    "message": "Başarılı",
    "services_categories": [
        {
            "category_id": 1,
            "category_name": "Saç Kesim",
            "file_name": "https://firebasestorage.googleapis.com/v0/b/caffely-90d9a.appspot.com/o/SalonMakeApp%2Fservice_icons%2Fhair_cut.png?alt=media&token=bb1b52c9-30ba-4ec6-8c7d-d1f60cd22b45"
        },
        {
            "category_id": 2,
            "category_name": "Saç Stil",
            "file_name": "https://firebasestorage.googleapis.com/v0/b/caffely-90d9a.appspot.com/o/SalonMakeApp%2Fservice_icons%2Fhair_style.png?alt=media&token=a0b1919d-99b4-487e-beed-f0ee1d3522ea"
        },
        {
            "category_id": 3,
            "category_name": "Saç Boyama",
            "file_name": "https://firebasestorage.googleapis.com/v0/b/caffely-90d9a.appspot.com/o/SalonMakeApp%2Fservice_icons%2Fhair_color.png?alt=media&token=e08af8f4-54ac-453e-80ac-eaa414b9013b"
        }
    ]
}
```

Services
```js
TYPE: GET
URL: {{base_url}}services-categorys
Header:
  {
    "Authorization": "Bearer {{token}}",
    "categoryid": 1
  }
Response:
{
    "message": "Başarılı",
    "services": [
        {
            "id": 2,
            "salon_id": 1,
            "service_category_id": 1,
            "name": "Saç Kesim",
            "description": "Saç Kesim Hizmeti için açıklama",
            "price": 120,
            "duration": 40,
            "is_active": 0,
            "created_at": "2025-02-03T15:54:41.000Z",
            "is_deleted": 0,
            "envoirment_id": 7,
            "envoirment_file_name": "https://firebasestorage.googleapis.com/v0/b/caffely-90d9a.appspot.com/o/SalonMakeApp%2Fservice_covers%2Ferkek-sac-kesimi.webp?alt=media&token=19d2a4a4-440e-4117-9af3-6785bbdb5aa4",
            "add_services": [
                {
                    "id": 1,
                    "services_id": 2,
                    "name": "Saç Yıkama",
                    "price": 30,
                    "is_deleted": 0
                },
                {
                    "id": 2,
                    "services_id": 2,
                    "name": "Saç Bakım",
                    "price": 70,
                    "is_deleted": 0
                },
                {
                    "id": 3,
                    "services_id": 2,
                    "name": "Sakal Kesimi",
                    "price": 60,
                    "is_deleted": 0
                }
            ]
        }
    ]
}
```

# Stylists EndPoint

View Salon and Service Dependent Stylists
```js
TYPE: GET
URL: {{base_url}}stylist
Header:
  {
    "Authorization": "Bearer {{token}}",
    "salonId": 1,
    "servicesId": 1
  }
Response:
[
    {
        "id": 1,
        "salon_id": 1,
        "name": "Bekir Demir",
        "phone": "5435435454",
        "email": "bekirdemir@gmail.com",
        "is_top_rated": 0,
        "created_at": "2025-02-20T16:36:15.000Z",
        "is_deleted": 0,
        "envoirment_file_name": "https://firebasestorage.googleapis.com/v0/b/caffely-90d9a.appspot.com/o/SalonMakeApp%2Fstylist%2Fstylis_pp.jpeg?alt=media&token=f35877f5-3d22-485e-90ed-5619e178ad0f"
    }
]
```

View Additional Services Provided by the Stylist
```js
TYPE: GET
URL: {{base_url}}stylist-add-services
Header:
  {
    "Authorization": "Bearer {{token}}",
    "stylistId": 1
  }
Response:
[
    {
        "id": 1,
        "services_id": 2,
        "name": "Saç Yıkama",
        "price": 30,
        "created_at": "2025-02-03T16:03:04.000Z",
        "is_deleted": 0
    },
    {
        "id": 3,
        "services_id": 2,
        "name": "Sakal Kesimi",
        "price": 60,
        "created_at": "2025-02-24T12:29:08.000Z",
        "is_deleted": 0
    }
]
```

