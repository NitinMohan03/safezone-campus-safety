from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReportViewSet,
    VoteViewSet,
    AlertSubscriptionViewSet,
    FollowUpViewSet,
    MailchimpEventViewSet,
)

router = DefaultRouter()
router.register(r"reports", ReportViewSet, basename="report")
router.register(r"votes", VoteViewSet, basename="vote")
router.register(r"alertSubscriptions", AlertSubscriptionViewSet, basename="alert-sub")
router.register(r"followUpRequests", FollowUpViewSet, basename="followup")
router.register(r"mailchimpEvents", MailchimpEventViewSet, basename="mailchimp")

urlpatterns = [
    # All API routes live at /api/
    path("", include(router.urls)),
]
