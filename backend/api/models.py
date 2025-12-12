from django.db import models
import uuid


class User(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=32, default="user")
    name_given = models.CharField(max_length=100)
    name_family = models.CharField(max_length=100)


class Zone(models.Model):
    id = models.CharField(primary_key=True, max_length=20)
    name = models.CharField(max_length=120)
    polygon_geojson = models.TextField()
    version = models.IntegerField(default=1)
    published_at = models.DateTimeField()


class Report(models.Model):
    id = models.CharField(primary_key=True, max_length=40)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=120)
    description = models.TextField()
    severity = models.CharField(max_length=20)
    status = models.CharField(max_length=40, default="pending")
    tags = models.JSONField(default=list)
    location = models.JSONField(null=True, blank=True)
    reporter = models.CharField(max_length=120, blank=True, default="")
    reporter_first_name = models.CharField(max_length=120, null=True, blank=True)
    reporter_last_name = models.CharField(max_length=120, null=True, blank=True)
    reporter_email = models.EmailField(null=True, blank=True)
    is_anonymous = models.BooleanField(default=False)
    attachments = models.JSONField(default=list)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    admin_feedback = models.TextField(blank=True, default="")
    zone_id = models.CharField(max_length=20, null=True, blank=True)
    user_id = models.CharField(max_length=120, blank=True, default="")
    upvotes = models.IntegerField(default=0)


class Vote(models.Model):
    id = models.CharField(primary_key=True, max_length=60)
    report = models.ForeignKey(Report, on_delete=models.CASCADE)
    user_id = models.CharField(max_length=120)
    created_at = models.DateTimeField()


class AlertSubscription(models.Model):
    id = models.CharField(primary_key=True, max_length=40)
    reporter = models.CharField(max_length=120, blank=True, default="")
    email = models.EmailField()
    location = models.JSONField(null=True, blank=True)


class FollowUpRequest(models.Model):
    id = models.CharField(primary_key=True, max_length=60)
    report = models.ForeignKey(Report, null=True, blank=True, on_delete=models.SET_NULL)
    reporter_id = models.CharField(max_length=120, blank=True, default="")
    reporter = models.CharField(max_length=120, blank=True, default="")
    status = models.CharField(max_length=40, default="pending")
    feedback = models.TextField(blank=True, default="")
    requested_at = models.DateTimeField()
    reviewer = models.CharField(max_length=120, blank=True, default="")
    review_link = models.CharField(max_length=200, blank=True, default="")
    responded_at = models.DateTimeField(null=True, blank=True)


class MailchimpEvent(models.Model):
    id = models.CharField(primary_key=True, max_length=80)
    created_at = models.DateTimeField()
    mode = models.CharField(max_length=40)
    type = models.CharField(max_length=60)
    subject = models.CharField(max_length=200)
    html = models.TextField()
    report = models.ForeignKey(Report, null=True, blank=True, on_delete=models.SET_NULL)
    recipients = models.JSONField(default=list)
    reviewer = models.CharField(max_length=120, blank=True, default="")
