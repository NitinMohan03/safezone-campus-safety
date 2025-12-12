from rest_framework import viewsets
from .models import Report, Vote, AlertSubscription, FollowUpRequest, MailchimpEvent
from .serializers import (
    ReportSerializer,
    VoteSerializer,
    AlertSubscriptionSerializer,
    FollowUpSerializer,
    MailchimpEventSerializer,
)


# Full CRUD viewsets so React can create/read/update/delete resources.
class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all().order_by("-created_at")
    serializer_class = ReportSerializer


class VoteViewSet(viewsets.ModelViewSet):
    queryset = Vote.objects.all()
    serializer_class = VoteSerializer


class AlertSubscriptionViewSet(viewsets.ModelViewSet):
    queryset = AlertSubscription.objects.all()
    serializer_class = AlertSubscriptionSerializer


class FollowUpViewSet(viewsets.ModelViewSet):
    queryset = FollowUpRequest.objects.all()
    serializer_class = FollowUpSerializer


class MailchimpEventViewSet(viewsets.ModelViewSet):
    queryset = MailchimpEvent.objects.all()
    serializer_class = MailchimpEventSerializer
