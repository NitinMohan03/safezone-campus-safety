import os
import json
import django

# 設定 Django 環境
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from api.models import (
    User, Zone, Report, Vote, AlertSubscription,
    FollowUpRequest, MailchimpEvent
)

DB_JSON_PATH = "../frontend/db.json"

def load_json():
    with open(DB_JSON_PATH, "r") as f:
        return json.load(f)

def seed_users(data):
    for u in data["users"]:
        User.objects.update_or_create(
            id=u["id"],
            defaults={
                "role": u.get("role", "user"),
                "name_given": u["name"]["given"],
                "name_family": u["name"]["family"],
            },
        )

def seed_zones(data):
    for z in data["zones"]:
        Zone.objects.update_or_create(
            id=z["id"],
            defaults={
                "name": z["name"],
                "polygon_geojson": z["polygonGeoJSON"],
                "version": z.get("version", 1),
                "published_at": z["publishedAt"],
            },
        )

def seed_reports(data):
    for r in data["reports"]:
        Report.objects.update_or_create(
            id=r["id"],
            defaults={
                "title": r["title"],
                "category": r["category"],
                "description": r["description"],
                "severity": r["severity"],
                "status": r.get("status", "pending"),
                "tags": r.get("tags", []),
                "location": r.get("location"),
                "reporter": r.get("reporter", ""),
                "reporter_first_name": None,
                "reporter_last_name": None,
                "reporter_email": r.get("reporterEmail"),
                "is_anonymous": False,
                "attachments": r.get("attachments", []),
                "created_at": r["createdAt"],
                "updated_at": r.get("updatedAt"),
                "published_at": r.get("publishedAt"),
                "admin_feedback": r.get("adminFeedback", ""),
                "zone_id": r.get("zoneId"),
                "user_id": r.get("userId"),
                "upvotes": r.get("upvotes", 0),
            },
        )

def seed_alert_subscriptions(data):
    for a in data["alertSubscriptions"]:
        AlertSubscription.objects.update_or_create(
            id=a["id"],
            defaults={
                "reporter": a.get("reporter") or a.get("name", ""),
                "email": a["email"],
                "location": a.get("location"),
            },
        )

def seed_followups(data):
    for f in data["followUpRequests"]:
        FollowUpRequest.objects.update_or_create(
            id=f["id"],
            defaults={
                "report_id": f.get("reportId"),
                "reporter_id": f.get("reporterId", ""),
                "reporter": f.get("reporter", ""),
                "status": f.get("status", "pending"),
                "feedback": f.get("feedback", ""),
                "requested_at": f["requestedAt"],
                "reviewer": f.get("reviewer", ""),
                "review_link": f.get("reviewLink", ""),
                "responded_at": f.get("respondedAt"),
            },
        )

def seed_mailchimp(data):
    for m in data["mailchimpEvents"]:
        MailchimpEvent.objects.update_or_create(
            id=m["id"],
            defaults={
                "created_at": m["createdAt"],
                "mode": m.get("mode", ""),
                "type": m.get("type", ""),
                "subject": m.get("subject", ""),
                "html": m.get("html", ""),
                "report_id": m.get("reportId"),
                "recipients": m.get("recipients", []),
                "reviewer": m.get("reviewer", ""),
            },
        )

def run():
    data = load_json()

    print("Seeding users...")
    seed_users(data)

    print("Seeding zones...")
    seed_zones(data)

    print("Seeding reports...")
    seed_reports(data)

    print("Seeding alertSubscriptions...")
    seed_alert_subscriptions(data)

    print("Seeding followUpRequests...")
    seed_followups(data)

    print("Seeding mailchimpEvents...")
    seed_mailchimp(data)

    print("Done!")

if __name__ == "__main__":
    run()
