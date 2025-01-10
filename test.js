

const currentDate = new Date();
const dateObj = new Date(currentDate.setDate(currentDate.getDate() + 30));
// Creating Date
const month = (dateObj.getUTCMonth() + 1) < 10 ? String(dateObj.getUTCMonth() + 1).padStart(2, '0') : dateObj.getUTCMonth() + 1 // months from 1-12
const day = dateObj.getUTCDate() < 10 ? String(dateObj.getUTCDate()).padStart(2, '0') : dateObj.getUTCDate()
const year = dateObj.getUTCFullYear();
const endDate = year + "-" + month + "-" + day;


console.log("after ", endDate);

{
    "country": "India",
        "state": "Jharkhand",
            "city": "Dhanbad",
                "location": "Chirkunda, Ganja-Gali",
                    "salary": "25000-5000",
                        "role": "Developer",
                            "workType": "WFH",
                                "benefits": ["Free Wifi", "Free Water", "Free Air"],
                                    "keyResponsibilities": ["Develop Code", "Work on DSA"],
                                        "description": "This Api Is For Testing Job Creation With Backed",
                                            "companyOverview": "Testing Api For Developemnt",
                                                "experience": "5+",
                                                    "employmentType": "Full Time",
                                                        "education": "MCA",
                                                            "lastApplyDate": "2025-01-04"
}

