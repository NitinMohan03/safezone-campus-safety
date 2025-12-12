from rest_framework import serializers
from .models import Report, Vote, AlertSubscription, FollowUpRequest, MailchimpEvent


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = "__all__"


class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = "__all__"


class AlertSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertSubscription
        fields = "__all__"


class FollowUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUpRequest
        fields = "__all__"


class MailchimpEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = MailchimpEvent
        fields = "__all__"
