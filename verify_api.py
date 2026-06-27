import requests
import json
import time

BASE_URL = "http://localhost:8080"

def test_workflow():
    print("=== STARTING END-TO-END WORKFLOW VERIFICATION ===")
    
    # 1. Register Mentor and Mentee
    print("\n1. Registering Mentor and Mentee...")
    
    mentor_data = {
        "name": "Jane Mentor",
        "email": "jane@mentx.com",
        "password": "password123",
        "role": "MENTOR"
    }
    res = requests.post(f"{BASE_URL}/api/auth/register", json=mentor_data)
    print("Register Mentor Response:", res.status_code, res.json())
    mentor_id = res.json()["id"]
    
    mentee_data = {
        "name": "John Mentee",
        "email": "john@mentx.com",
        "password": "password123",
        "role": "MENTEE"
    }
    res = requests.post(f"{BASE_URL}/api/auth/register", json=mentee_data)
    print("Register Mentee Response:", res.status_code, res.json())
    mentee_id = res.json()["id"]

    # 2. Login as Admin to Approve them
    print("\n2. Admin login & approving user accounts...")
    admin_login = {
        "email": "admin@mentx.com",
        "password": "Ash@adminMent-X"
    }
    res = requests.post(f"{BASE_URL}/api/auth/login", json=admin_login)
    print("Admin Login:", res.status_code)
    admin_token = res.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Approve Mentor
    res = requests.post(f"{BASE_URL}/api/admin/verify/{mentor_id}", headers=admin_headers)
    print("Verify Mentor:", res.status_code, res.json())
    
    # Approve Mentee
    res = requests.post(f"{BASE_URL}/api/admin/verify/{mentee_id}", headers=admin_headers)
    print("Verify Mentee:", res.status_code, res.json())

    # 3. Login as Mentor
    print("\n3. Mentor login...")
    mentor_login = {
        "email": "jane@mentx.com",
        "password": "password123"
    }
    res = requests.post(f"{BASE_URL}/api/auth/login", json=mentor_login)
    print("Mentor Login:", res.status_code)
    mentor_token = res.json()["token"]
    mentor_headers = {"Authorization": f"Bearer {mentor_token}"}

    # 4. Mentor Create Group
    print("\n4. Mentor creating group...")
    group_data = {
        "groupName": "Java Beginners",
        "description": "Weekly Java training batch"
    }
    res = requests.post(f"{BASE_URL}/api/groups", json=group_data, headers=mentor_headers)
    print("Create Group:", res.status_code, res.json())
    group_id = res.json()["id"]

    # 5. Mentor Add Mentee to Group
    print("\n5. Mentor adding mentee to group...")
    res = requests.post(f"{BASE_URL}/api/groups/{group_id}/members/{mentee_id}", headers=mentor_headers)
    print("Add Member to Group:", res.status_code, res.json())

    # 6. Mentor Create and Assign Task
    print("\n6. Mentor assigning weekly task...")
    task_data = {
        "title": "Week 1: Build Spring Boot REST APIs",
        "description": "Create a fully functional task manager backend.",
        "deadline": "2026-06-30T23:59:59",
        "weekNumber": 1,
        "priority": "HIGH",
        "groupId": group_id
    }
    res = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=mentor_headers)
    print("Assign Task:", res.status_code)
    
    # 7. Login as Mentee
    print("\n7. Mentee login...")
    mentee_login = {
        "email": "john@mentx.com",
        "password": "password123"
    }
    res = requests.post(f"{BASE_URL}/api/auth/login", json=mentee_login)
    print("Mentee Login:", res.status_code)
    mentee_token = res.json()["token"]
    mentee_headers = {"Authorization": f"Bearer {mentee_token}"}

    # 8. Mentee View Tasks
    print("\n8. Mentee viewing assigned tasks...")
    res = requests.get(f"{BASE_URL}/api/tasks/mentee", headers=mentee_headers)
    print("Mentee Task list status code:", res.status_code)
    assignment = res.json()[0]
    assignment_id = assignment["id"]
    print("Assignment ID:", assignment_id, "Status:", assignment["status"], "Read status:", assignment["readStatus"])

    # 9. Mentee Mark Read and Start Work
    print("\n9. Mentee marking task as Read and Starting task...")
    res = requests.patch(f"{BASE_URL}/api/tasks/assignments/{assignment_id}/read", headers=mentee_headers)
    print("Mark Read Response:", res.status_code, "Status:", res.json()["status"], "Read:", res.json()["readStatus"])
    
    res = requests.patch(f"{BASE_URL}/api/tasks/assignments/{assignment_id}/start", headers=mentee_headers)
    print("Start Task Response:", res.status_code, "Status:", res.json()["status"])

    # 10. Mentee Submit Weekly Update (bypass-sunday-restriction is active)
    print("\n10. Mentee submitting weekly progress update...")
    update_data = {
        "summary": "Completed CRUD endpoints and implemented JWT filter.",
        "challenges": "Faced minor issues configuring CORS headers, resolved by adding config mapping.",
        "completionPercentage": 100
      }
    res = requests.post(f"{BASE_URL}/api/updates/assignments/{assignment_id}", json=update_data, headers=mentee_headers)
    print("Submit Update Response:", res.status_code, res.json())
    update_id = res.json()["id"]

    # 11. Mentor Review Submission and Give Grade
    print("\n11. Mentor reviewing submission...")
    review_data = {
        "remark": "Excellent code structure and clean implementation of filters!",
        "reviewStatus": "APPROVED",
        "score": 9
    }
    res = requests.post(f"{BASE_URL}/api/reviews/updates/{update_id}", json=review_data, headers=mentor_headers)
    print("Review Submission Response:", res.status_code, res.json())

    # 12. Check Leaderboard
    print("\n12. Checking Leaderboard...")
    res = requests.get(f"{BASE_URL}/api/leaderboard", headers=mentee_headers)
    print("Leaderboard Response:", res.status_code)
    leaderboard = res.json()
    for row in leaderboard:
        print(f"Rank: {row['rank']} | Name: {row['name']} | Weekly Score: {row['weeklyScore']} | Total Score: {row['totalScore']} | Completed: {row['completedTasks']} | Consistency: {row['consistencyBadge']} | Top Performer: {row['topPerformer']}")

    print("\n=== WORKFLOW VERIFICATION COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    test_workflow()
